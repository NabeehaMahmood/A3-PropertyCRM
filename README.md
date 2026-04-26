# Property CRM - Real Estate Lead Management System

A comprehensive property CRM built with Next.js, MongoDB, and real-time features.

## Features

### Core Functionality
- **Lead Management** - Full CRUD operations for property leads
- **Role-Based Access** - Admin and Agent roles with proper permissions
- **Lead Scoring** - Automatic priority assignment based on budget
- **Lead Assignment** - Admin can assign/reassign leads to agents

### Follow-up System
- Schedule follow-up dates for leads
- Track follow-up history with outcomes (Completed/No Show/Rescheduled)
- Detect overdue and stale leads

### Analytics Dashboard
- Total leads overview
- Status distribution (New, Contacted, Qualified, Negotiation, Closed)
- Priority distribution (High, Medium, Low)
- Agent performance with win rates and top performer stars
- Real-time filtering

### Communication
- **WhatsApp Integration** - One-click chat with leads
- **Email Notifications** - Alerts for new leads and assignments

### Additional Features
- AI-powered follow-up suggestions
- Excel export functionality
- Activity timeline/audit log
- Real-time updates

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your MongoDB URI and other config to .env

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First User Registration
- First user automatically becomes **Admin**
- All subsequent users become **Agents**

## Tech Stack

- **Frontend**: Next.js 14, React, CSS Modules
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Real-time**: Polling (SSE ready)

## Project Structure

```
src/
├── app/              # App Router pages
│   ├── api/          # API endpoints
│   ├── dashboard/    # Admin dashboard
│   ├── leads/        # Lead management
│   └── activities/   # Activity log
├── components/       # Reusable components
├── lib/              # Utilities
├── models/           # Mongoose models
└── styles/          # CSS
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions to Vercel.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `EMAIL_USER` | Gmail for notifications |
| `EMAIL_PASS` | Gmail App Password |

## License

MIT