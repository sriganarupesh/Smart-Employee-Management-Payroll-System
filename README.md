# Employee Management & Payroll System

A full-stack HR management application for managing employees, attendance, leaves, payroll, and performance reviews.

## Features

- **Employee Management**: Add, edit, and manage employee records with detailed information
- **Attendance Tracking**: Clock in/out system with automatic work hours calculation
- **Leave Management**: Submit and approve leave requests with multiple leave types
- **Payroll Processing**: Automated salary calculation with tax and deductions
- **Performance Reviews**: Track and evaluate employee performance
- **Role-Based Access**: Admin, HR, and Employee roles with appropriate permissions
- **Analytics Dashboard**: Visual insights with charts for key metrics

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Build Tool**: Vite

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the database migration from `supabase/migrations/` in your Supabase project

4. Start development server:
```bash
npm run dev
```

## Database Tables

- `users` - Authentication and user profiles
- `employees` - Employee master data
- `attendance` - Daily attendance records
- `leaves` - Leave requests and approvals
- `payroll` - Monthly payroll records
- `performance_reviews` - Performance evaluations
- `audit_logs` - System activity tracking

## User Roles

- **Admin**: Full system access and management
- **HR**: Employee and HR operations management
- **Employee**: Personal data access and self-service features

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run typecheck  # TypeScript type checking
```
