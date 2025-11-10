import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'hr' | 'employee';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  user_id?: string;
  employee_code: string;
  department: string;
  designation: string;
  date_of_joining: string;
  date_of_birth?: string;
  bank_account?: string;
  tax_id?: string;
  documents: any[];
  status: 'active' | 'inactive';
  basic_salary: number;
  hra: number;
  allowances: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  clock_in_time?: string;
  clock_out_time?: string;
  total_hours?: number;
  status: 'present' | 'absent' | 'leave' | 'halfday';
  note?: string;
  location?: string;
  created_at: string;
}

export interface Leave {
  id: string;
  employee_id: string;
  leave_type: 'paid' | 'unpaid' | 'sick' | 'casual';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approver_id?: string;
  approved_at?: string;
  created_at: string;
}

export interface Payroll {
  id: string;
  employee_id: string;
  month: string;
  gross_salary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  tax_amount: number;
  net_salary: number;
  status: 'draft' | 'processed' | 'paid';
  payslip_url?: string;
  created_at: string;
  processed_at?: string;
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string;
  period_start: string;
  period_end: string;
  score: number;
  comments?: string;
  created_at: string;
}
