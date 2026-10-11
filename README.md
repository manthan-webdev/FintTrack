# FinTrack — Personal Finance, Simplified.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-3ecf8e.svg)](https://supabase.com/)

FinTrack is an international-grade full-stack personal finance SaaS built with React, Vite, Node.js, Express, and Supabase PostgreSQL with strict Row Level Security (RLS).

---

## 1. Product Overview

FinTrack gives individuals and professionals complete control over their money through an uncluttered, high-contrast obsidian interface.

### Key Capabilities
- **Authentication & Multi-Tenant Isolation**: Secure user sign up, session persistence, password reset, and database-level isolation.
- **Real-Time Financial Ledger**: Record income and expense entries with descriptions, payment methods (Card, UPI, Bank Transfer, Cash), and notes.
- **Categorization Engine**: Customize expense and income categories with color badges and icons, protected from accidental deletion of referenced records.
- **Monthly Budget Targets**: Define monthly spending limits per category, complete with automatic threshold warnings (80%) and exceeded states (>100%).
- **Interactive Analytics**: Inflow vs. outflow trends, multi-month net savings trajectories, and category spending allocations across customizable timeframes (7D, 30D, 3M, 6M, 1Y).
- **Multi-Currency Support**: Native currency formatting with INR (`₹`), USD (`$`), EUR (`€`), GBP (`£`), CAD (`CA$`), and AUD (`AU$`).
- **Data Sovereignty**: Instant CSV export of transactions for offline backups and financial record keeping.
- **Responsive Viewport Support**: Optimized for 1440px desktop workstations down to 360px mobile viewports with a dedicated mobile drawer and bottom navigation bar.

---

## 2. Tech Stack & Architecture

```
┌────────────────────────────────────────────────────────┐
│              React 19 Frontend (Vite)                  │
│   Tailwind CSS · Recharts · Lucide · React Router      │
└──────────────────────────┬─────────────────────────────┘
                           │  HTTP / REST (Bearer JWT)
                           ▼
┌────────────────────────────────────────────────────────┐
│             Node.js + Express REST API                 │
│   Helmet · CORS · Zod Validators · Error Middleware    │
└──────────────────────────┬─────────────────────────────┘
                           │  PostgreSQL Connection
                           ▼
┌────────────────────────────────────────────────────────┐
│            Supabase Database & Auth                    │
│   auth.users · Row Level Security (RLS) Policies       │
│   public.profiles · public.transactions · budgets      │
└────────────────────────────────────────────────────────┘
```

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, React Router v7.
- **Backend**: Node.js, Express 4.x, TypeScript, Zod Schema Validation, Helmet, CORS.
- **Database & Auth**: PostgreSQL on Supabase with Row Level Security (RLS) policies.
- **Security**: IDOR prevention (user identity strictly bound to verified auth token; `user_id` from client payloads is never trusted).

---

## 3. Project Folder Structure

```
fintrack/
│
├── frontend/ (or root src/ for Vite SPA)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Button, Input, Select, Modal, Card, StatCard, etc.
│   │   │   ├── layout/         # Sidebar, Navbar, MobileNav
│   │   │   ├── transactions/   # TransactionModal, TransactionCard, TransactionFilters
│   │   │   ├── categories/     # CategoryModal
│   │   │   └── budgets/        # BudgetModal
│   │   ├── context/            # AuthContext, ToastContext
│   │   ├── layouts/            # AppLayout (authenticated), PublicLayout
│   │   ├── pages/              # Landing, Login, Signup, Dashboard, Transactions, etc.
│   │   ├── services/           # api.ts (REST client), supabase.ts (auth client)
│   │   ├── utils/              # currency.ts, date.ts
│   │   ├── App.tsx             # Route configuration & route guards
│   │   └── main.tsx            # Application entry point
│   ├── index.html
│   ├── .env.example
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/             # supabase.ts (admin client initialization)
│   │   ├── controllers/        # transaction, category, budget, analytics, profile
│   │   ├── middleware/         # authMiddleware (JWT verify), errorMiddleware
│   │   ├── routes/             # REST route declarations
│   │   ├── services/           # Database query execution & memory fallback
│   │   ├── validators/         # Zod schemas (transactions, categories, budgets)
│   │   ├── utils/              # responseHelper.ts
│   │   ├── app.ts              # Express application configuration
│   │   └── server.ts           # Standalone backend server entry
│   ├── .env.example
│   └── package.json
│
├── database/
│   ├── schema.sql              # Table schemas, indexes, foreign keys & triggers
│   ├── policies.sql            # PostgreSQL Row Level Security (RLS) policies
│   └── seed.sql                # Sample demo datasets for local staging
│
├── server.ts                   # Full-stack runner mounting Express + Vite middleware
├── README.md
└── .gitignore
```

---

## 4. Environment Variables Setup

### Backend Environment Variables (`backend/.env` or root `.env`)

```bash
# Server Port
PORT=5000

# Node Environment
NODE_ENV=development

# Allowed Frontend URL for CORS (no trailing slash)
FRONTEND_URL=http://localhost:3000

# Supabase Project URL
# Get this from: Supabase Dashboard → Project Settings → API → Project URL
SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase Anonymous Public Key
SUPABASE_ANON_KEY=your-supabase-anon-key

# Supabase Service Role Key (SERVER-ONLY SECRET)
# IMPORTANT: Never commit or expose this key in frontend code.
# Get this from: Supabase Dashboard → Project Settings → API → service_role
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Frontend Environment Variables (`frontend/.env` or root `.env`)

```bash
# Supabase Project URL
VITE_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase Anonymous Public Key (Safe for client browser use)
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Backend REST API URL
# Leave empty for same-origin relative requests (/api) when running fullstack.
# Set when frontend is deployed on a separate domain (e.g., Vercel)
VITE_API_URL=
```

---

## 5. Supabase Database & RLS Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Navigate to **SQL Editor** in the Supabase Dashboard.
3. Open `database/schema.sql`, paste the contents into the SQL Editor, and click **Run**. This provisions:
   - `profiles`
   - `categories`
   - `transactions`
   - `budgets`
   - Automatic triggers for new user initialization and `updated_at` timestamps.
4. Open `database/policies.sql`, paste into the SQL Editor, and click **Run**. This enables PostgreSQL Row Level Security (RLS) and defines ownership policies (`auth.uid() = user_id`).
5. (Optional) Run `database/seed.sql` for sample testing data.

---

## 6. Local Development Instructions

### Running Full-Stack (Unified Runner)
```bash
# Install dependencies
npm install

# Start development server on port 3000 (Express API + Vite HMR)
npm run dev
```

### Running Decoupled Backend & Frontend

#### Backend:
```bash
cd backend
npm install
npm run dev
# Server starts on http://localhost:5000
```

#### Frontend:
```bash
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

---

## 7. REST API Documentation

All protected endpoints require an `Authorization: Bearer <token>` header containing a valid Supabase JWT.

### Health Check
- `GET /api/health`
  - Auth: None
  - Response: `{ "status": "healthy", "service": "FinTrack REST API" }`

### Transactions
- `GET /api/transactions`
  - Auth: Required
  - Query Params: `search`, `type` (`income` | `expense`), `category_id`, `payment_method`, `startDate`, `endDate`, `sort`, `limit`, `offset`
  - Response: Array of transactions with joined category data.
- `GET /api/transactions/:id`
  - Auth: Required
  - Response: Single transaction record.
- `POST /api/transactions`
  - Auth: Required
  - Body:
    ```json
    {
      "type": "expense",
      "amount": 2450.00,
      "category_id": "uuid-here",
      "description": "Weekly Groceries",
      "date": "2026-10-01",
      "payment_method": "UPI",
      "notes": "Pantry items"
    }
    ```
  - Response: Created transaction (HTTP 201).
- `PUT /api/transactions/:id`
  - Auth: Required
  - Body: Partial transaction fields.
- `DELETE /api/transactions/:id`
  - Auth: Required
  - Response: `{ "success": true, "data": { "id": "..." } }`
- `GET /api/transactions/export/csv`
  - Auth: Required
  - Response: Downloadable CSV file attachment.

### Categories
- `GET /api/categories`
  - Auth: Required
  - Response: All user and system categories.
- `POST /api/categories`
  - Auth: Required
  - Body:
    ```json
    {
      "name": "Cloud Subscriptions",
      "type": "expense",
      "icon": "Repeat",
      "color": "#9575CD"
    }
    ```
- `PUT /api/categories/:id`
  - Auth: Required
- `DELETE /api/categories/:id`
  - Auth: Required
  - Error: Returns HTTP 400 if category has active transactions.

### Budgets
- `GET /api/budgets?month=10&year=2026`
  - Auth: Required
  - Response: Budget limits with calculated `spent`, `remaining`, `percentage`, `is_warning`, `is_exceeded`.
- `POST /api/budgets`
  - Auth: Required
  - Body: `{ "category_id": "...", "amount": 15000, "month": 10, "year": 2026 }`
- `PUT /api/budgets/:id`
  - Auth: Required
  - Body: `{ "amount": 18000 }`
- `DELETE /api/budgets/:id`
  - Auth: Required

### Analytics
- `GET /api/analytics/summary?range=30d`
  - Auth: Required
  - Response: `{ "totalBalance", "totalIncome", "totalExpenses", "savings", "savingsRate" }`
- `GET /api/analytics/monthly?months=6`
  - Auth: Required
  - Response: Chronological array of monthly cash flows (`income`, `expense`, `savings`).
- `GET /api/analytics/categories?range=30d`
  - Auth: Required
  - Response: Ranked category spending breakdown with percentages.

### Profile
- `GET /api/profile`
  - Auth: Required
- `PUT /api/profile`
  - Auth: Required
  - Body: `{ "full_name": "Alex Morgan", "preferred_currency": "INR" }`

---

## 8. Deployment Guide

### Frontend Deployment (Vercel / Netlify)
1. Push repository to GitHub.
2. Link the repository to Vercel.
3. Set Build Command: `npm run build`
4. Set Output Directory: `dist`
5. Configure Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (points to your deployed backend URL)

### Backend Deployment (Render / Railway)
1. Set Root Directory to `backend/` (or repository root with `tsx server.ts`).
2. Set Start Command: `node dist/server.js` or `npm start`
3. Configure Environment Variables:
   - `PORT=5000`
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-frontend-app.vercel.app`
   - `SUPABASE_URL=https://your-project-ref.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key`

---

## 9. Security Verification Checklist

- [x] **No Secrets in Frontend**: `SUPABASE_SERVICE_ROLE_KEY` is strictly server-side.
- [x] **PostgreSQL RLS Active**: User data access is locked down at the database layer.
- [x] **IDOR Protection**: The API extracts user identity strictly from the verified JWT; never from request bodies.
- [x] **Helmet & CORS**: Strict HTTP security headers and whitelist-based cross-origin configuration.
- [x] **Input Validation**: Zod schemas validate positive numbers, date formats, string lengths, and enums.
- [x] **Safe Error Handling**: Internal stack traces and database credentials are never exposed in production responses.

---

## 10. Links & Placeholders

<!-- TODO: Replace placeholder live demo URL after deployment -->
**Live Demo:** [https://fintrack.example.com](https://fintrack.example.com)

<!-- TODO: Replace placeholder GitHub repository URL -->
**GitHub Repository:** [https://github.com/your-username/fintrack](https://github.com/your-username/fintrack)

**License:** MIT License. Built for production portfolio presentation.
