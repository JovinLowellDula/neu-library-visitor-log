# NEU Library Visitor Log

**Live Application:** https://neu-library-visitor-log-nine.vercel.app

## How to Log In
1. Go to the live URL above
2. Click "Sign in with Google"
3. Use: jcesperanza@neu.edu.ph

## Role Switching
After login, the account starts in User View showing "Welcome to NEU Library!" 
and the check-in form. Click "Switch to Admin" button in the top-right header 
to access the Admin View with statistics and filters.

## Admin Features
- View visitor statistics by Day, Week, or Custom date range
- Filter by: College, Reason for visit, Employee status (Teacher/Staff/Student)
- Statistics displayed in cards: Total Visits, Unique Visitors, Active Now, Peak Hour

## Tech Stack
- Frontend: Next.js 16, TypeScript, Tailwind CSS (Vercel)
- Backend: Node.js, Express, Prisma (Railway)
- Database: PostgreSQL (Railway)
- Auth: Google OAuth 2.0 + JWT
