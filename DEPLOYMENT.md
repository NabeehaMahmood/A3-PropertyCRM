# Property CRM - Deployment Guide

## Quick Deploy to Vercel

### Prerequisites
- Node.js 18+ installed
- Vercel account (free at vercel.com)
- MongoDB database (MongoDB Atlas free tier)

### Step 1: Prepare Your Code

1. **Clone/Create Repository:**
   ```bash
   git clone <your-repo-url>
   cd property-crm
   ```

2. **Create .env file** (copy from .env.example):
   ```bash
   cp .env.example .env
   ```

3. **Update .env with your values:**
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Generate with `openssl rand -base64 32`
   - `EMAIL_USER`: Your Gmail for notifications
   - `EMAIL_PASS`: Generate App Password from Google Account

### Step 2: Deploy to Vercel

**Option A: From Command Line**
```bash
npm i -g vercel
vercel login
vercel
```
Follow prompts - select your team, project name, and confirm settings.

**Option B: From Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import from GitHub (authorize your repo)
4. In "Environment Variables", add all variables from .env
5. Click "Deploy"

### Step 3: Configure MongoDB Atlas

1. Go to [atlas.mongodb.com](https://atlas.mongodb.com)
2. Create free cluster → Create Database User
3. Click "Connect" → "Connect your application"
4. Copy connection string
5. Add to Vercel env: `MONGODB_URI=mongodb+srv://user:pass@cluster.xxx.mongodb.net/property-crm`

### Step 4: Test Your Deployment

1. Open your Vercel project URL
2. Register first user → becomes Admin
3. Log in as Admin to see dashboard
4. Create agent accounts from admin panel

## Project Structure

```
property-crm/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   ├── dashboard/   # Admin dashboard
│   │   ├── leads/       # Lead management
│   │   └── activities/  # Activity log
│   ├── components/       # React components
│   ├── lib/              # Utilities (db, auth, etc.)
│   ├── models/          # Mongoose models
│   └── styles/          # CSS styles
├── .env.example          # Environment template
├── package.json
└── README.md
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `JWT_SECRET` | Secret for JWT token signing | Yes |
| `EMAIL_USER` | Gmail for sending notifications | Yes |
| `EMAIL_PASS` | Gmail App Password | Yes |

## Troubleshooting

### Build Errors
- Ensure Node.js 18+ is selected in Vercel settings
- Run `npm run build` locally first to catch issues

### MongoDB Connection
- Check IP whitelist in MongoDB Atlas (allow all: 0.0.0.0/0)
- Verify connection string format

### Email Not Sending
- Use App Password, not regular password
- Enable 2-factor authentication on Google account

## Features Included

✅ Lead CRUD (Create, Read, Update, Delete)
✅ Role-based access (Admin/Agent)
✅ Lead scoring (High/Medium/Low by budget)
✅ Follow-up system with history
✅ Activity timeline/audit log
✅ WhatsApp integration
✅ Email notifications
✅ Analytics dashboard
✅ Real-time updates
✅ AI follow-up suggestions
✅ Excel export

---

**Note**: First user registered becomes Admin. All subsequent users become Agents automatically.