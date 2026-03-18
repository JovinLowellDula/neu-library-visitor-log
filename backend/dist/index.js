"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 4000;
const ADMIN_EMAIL = 'jcesperanza@neu.edu.ph';
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express_1.default.json());
app.use((0, express_session_1.default)({ secret: process.env.JWT_SECRET, resave: false, saveUninitialized: false }));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails?.[0].value;
    if (!email?.endsWith('@neu.edu.ph'))
        return done(null, false);
    const role = email === ADMIN_EMAIL ? 'ADMIN' : 'USER';
    let user = await prisma.user.findUnique({ where: { googleId: profile.id } });
    if (!user) {
        user = await prisma.user.create({
            data: { email, name: profile.displayName, googleId: profile.id, picture: profile.photos?.[0].value, role }
        });
    }
    done(null, user);
}));
passport_1.default.serializeUser((user, done) => done(null, user.id));
passport_1.default.deserializeUser(async (id, done) => {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
});
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN')
        return res.status(403).json({ error: 'Forbidden' });
    next();
};
// Auth Routes
app.get('/api/auth/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/api/auth/google/callback', passport_1.default.authenticate('google', { failureRedirect: '/login-failed' }), (req, res) => {
    const user = req.user;
    const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});
app.get('/api/auth/me', requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { id: true, email: true, name: true, role: true, picture: true } });
    res.json(user);
});
// Visit Routes
app.post('/api/visits/checkin', requireAuth, async (req, res) => {
    const visit = await prisma.visit.create({ data: { ...req.body, userId: req.user.userId } });
    res.json({ success: true, visit });
});
app.post('/api/visits/checkout', requireAuth, async (req, res) => {
    const visit = await prisma.visit.findFirst({ where: { userId: req.user.userId, checkOutTime: null }, orderBy: { checkInTime: 'desc' } });
    if (!visit)
        return res.status(400).json({ error: 'No active visit' });
    const updated = await prisma.visit.update({ where: { id: visit.id }, data: { checkOutTime: new Date() } });
    res.json({ success: true, visit: updated });
});
app.get('/api/visits/active', requireAuth, async (req, res) => {
    const active = await prisma.visit.findFirst({ where: { userId: req.user.userId, checkOutTime: null } });
    res.json({ active: !!active, visit: active });
});
// Stats Routes
app.get('/api/stats/visitor-stats', requireAuth, requireAdmin, async (req, res) => {
    const { period = 'day', startDate, endDate, college, reason, isEmployee } = req.query;
    let dateFilter = {};
    const now = new Date();
    if (period === 'day')
        dateFilter = { checkInTime: { gte: (0, date_fns_1.startOfDay)(now), lte: (0, date_fns_1.endOfDay)(now) } };
    else if (period === 'week')
        dateFilter = { checkInTime: { gte: (0, date_fns_1.startOfWeek)(now, { weekStartsOn: 1 }), lte: (0, date_fns_1.endOfWeek)(now, { weekStartsOn: 1 }) } };
    else if (period === 'custom' && startDate && endDate) {
        dateFilter = { checkInTime: { gte: (0, date_fns_1.startOfDay)(new Date(startDate)), lte: (0, date_fns_1.endOfDay)(new Date(endDate)) } };
    }
    const whereClause = { ...dateFilter };
    if (college && college !== 'all')
        whereClause.college = college;
    if (reason && reason !== 'all')
        whereClause.reason = reason;
    if (isEmployee !== 'all')
        whereClause.isEmployee = isEmployee === 'true';
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
            byReason: byReason.map((r) => ({ label: r.reason.replace(/_/g, ' '), count: r._count.id, percentage: ((r._count.id / totalVisits) * 100).toFixed(1) })),
            byCollege: byCollege.map((c) => ({ college: c.college, count: c._count.id, percentage: ((c._count.id / totalVisits) * 100).toFixed(1) })),
            byEmployment: {
                students: byEmployment.find((e) => !e.isEmployee)?._count.id || 0,
                teachers: byEmployment.find((e) => e.isEmployee && e.employeeType === 'TEACHER')?._count.id || 0,
                staff: byEmployment.find((e) => e.isEmployee && e.employeeType === 'STAFF')?._count.id || 0
            }
        },
        filters: { availableColleges: colleges.map((c) => c.college), availableReasons: ['STUDY', 'RESEARCH', 'BORROW_BOOKS', 'RETURN_BOOKS', 'COMPUTER_USE', 'MEETING', 'OTHER'] }
    });
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
