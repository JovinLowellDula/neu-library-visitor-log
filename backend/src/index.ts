import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

dotenv.config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;
const ADMIN_EMAILS = ['jcesperanza@neu.edu.ph', 'jovinlowell.dula@neu.edu.ph'];

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(session({ secret: process.env.JWT_SECRET!, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
const CALLBACK_URL = process.env.NODE_ENV === 'production' 
  ? 'https://neu-library-visitor-log-production.up.railway.app/api/auth/google/callback'
  : 'http://localhost:4000/api/auth/google/callback';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: CALLBACK_URL  // ← Changed from '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails?.[0].value;
  if (!email?.endsWith('@neu.edu.ph')) return done(null, false);
  
  const role = ADMIN_EMAILS.includes(email) ? 'ADMIN' : 'USER';
  let user = await prisma.user.findUnique({ where: { googleId: profile.id } });
  
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: profile.displayName, googleId: profile.id, picture: profile.photos?.[0].value, role }
    });
  }
  done(null, user);
}));

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  const user = await prisma.user.findUnique({ where: { id } });
  done(null, user);
});

const requireAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  next();
};

// Auth Routes
app.get('/api/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login-failed' }), 
  (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login-failed`);
      }
      const user = req.user as any;
      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '24h' });
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login-failed`);
    }
  }
);

app.get('/api/auth/me', requireAuth, async (req: any, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { id: true, email: true, name: true, role: true, picture: true } });
  res.json(user);
});

// Visit Routes
app.post('/api/visits/checkin', requireAuth, async (req: any, res) => {
  const visit = await prisma.visit.create({ data: { ...req.body, userId: req.user.userId } });
  res.json({ success: true, visit });
});

app.post('/api/visits/checkout', requireAuth, async (req: any, res) => {
  const visit = await prisma.visit.findFirst({ where: { userId: req.user.userId, checkOutTime: null }, orderBy: { checkInTime: 'desc' } });
  if (!visit) return res.status(400).json({ error: 'No active visit' });
  const updated = await prisma.visit.update({ where: { id: visit.id }, data: { checkOutTime: new Date() } });
  res.json({ success: true, visit: updated });
});

app.get('/api/visits/active', requireAuth, async (req: any, res) => {
  const active = await prisma.visit.findFirst({ where: { userId: req.user.userId, checkOutTime: null } });
  res.json({ active: !!active, visit: active });
});

// Stats Routes
app.get('/api/stats/visitor-stats', requireAuth, requireAdmin, async (req, res) => {
  const { period = 'day', startDate, endDate, college, reason, isEmployee } = req.query;
  let dateFilter: any = {};
  const now = new Date();
  
  if (period === 'day') dateFilter = { checkInTime: { gte: startOfDay(now), lte: endOfDay(now) } };
  else if (period === 'week') dateFilter = { checkInTime: { gte: startOfWeek(now, { weekStartsOn: 1 }), lte: endOfWeek(now, { weekStartsOn: 1 }) } };
  else if (period === 'custom' && startDate && endDate) {
    dateFilter = { checkInTime: { gte: startOfDay(new Date(startDate as string)), lte: endOfDay(new Date(endDate as string)) } };
  }

  const whereClause: any = { ...dateFilter };
  if (college && college !== 'all') whereClause.college = college;
  if (reason && reason !== 'all') whereClause.reason = reason;
  if (isEmployee !== 'all') whereClause.isEmployee = isEmployee === 'true';

  const [totalVisits, byReason, byCollege, byEmployment] = await Promise.all([
    prisma.visit.count({ where: whereClause }),
    prisma.visit.groupBy({ by: ['reason'], where: whereClause, _count: { id: true } }),
    prisma.visit.groupBy({ by: ['college'], where: whereClause, _count: { id: true } }),
    prisma.visit.groupBy({ by: ['isEmployee', 'employeeType'], where: whereClause, _count: { id: true } })
  ]);

  const colleges = await prisma.visit.groupBy({ by: ['college'] });
  
  res.json({
    summary: { totalVisits, uniqueVisitors: totalVisits, activeNow: 0, peakHour: '14:00 - 15:00', averageDuration: '2h 30m' },
    breakdown: {
      byReason: byReason.map((r: any) => ({ label: r.reason.replace(/_/g, ' '), count: r._count.id, percentage: ((r._count.id / totalVisits) * 100).toFixed(1) })),
      byCollege: byCollege.map((c: any) => ({ college: c.college, count: c._count.id, percentage: ((c._count.id / totalVisits) * 100).toFixed(1) })),
      byEmployment: {
        students: byEmployment.find((e: any) => !e.isEmployee)?._count.id || 0,
        teachers: byEmployment.find((e: any) => e.isEmployee && e.employeeType === 'TEACHER')?._count.id || 0,
        staff: byEmployment.find((e: any) => e.isEmployee && e.employeeType === 'STAFF')?._count.id || 0
      }
    },
    filters: { availableColleges: colleges.map((c: any) => c.college), availableReasons: ['STUDY', 'RESEARCH', 'BORROW_BOOKS', 'RETURN_BOOKS', 'COMPUTER_USE', 'MEETING', 'OTHER'] }
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});