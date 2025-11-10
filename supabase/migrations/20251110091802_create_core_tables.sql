-- Employee Management & Payroll System Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'hr', 'employee')),
  name text NOT NULL,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  employee_code text UNIQUE NOT NULL,
  department text NOT NULL,
  designation text NOT NULL,
  date_of_joining date NOT NULL,
  date_of_birth date,
  bank_account text,
  tax_id text,
  documents jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  basic_salary numeric(10, 2) NOT NULL DEFAULT 0,
  hra numeric(10, 2) DEFAULT 0,
  allowances jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  clock_in_time timestamptz,
  clock_out_time timestamptz,
  total_hours numeric(5, 2),
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'leave', 'halfday')),
  note text,
  location text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Leaves table
CREATE TABLE IF NOT EXISTS leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  leave_type text NOT NULL CHECK (leave_type IN ('paid', 'unpaid', 'sick', 'casual')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approver_id uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Payroll table
CREATE TABLE IF NOT EXISTS payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  month text NOT NULL,
  gross_salary numeric(10, 2) NOT NULL,
  allowances jsonb DEFAULT '{}'::jsonb,
  deductions jsonb DEFAULT '{}'::jsonb,
  tax_amount numeric(10, 2) DEFAULT 0,
  net_salary numeric(10, 2) NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'processed', 'paid')),
  payslip_url text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  UNIQUE(employee_id, month)
);

-- Performance reviews table
CREATE TABLE IF NOT EXISTS performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  score numeric(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
  comments text,
  created_at timestamptz DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_leaves_employee_status ON leaves(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_month ON payroll(employee_id, month DESC);
CREATE INDEX IF NOT EXISTS idx_performance_employee ON performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin and HR can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Admin can manage users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for employees table
CREATE POLICY "Employees can view own record"
  ON employees FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Admin and HR can manage employees"
  ON employees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'hr')
    )
  );

-- RLS Policies for attendance table
CREATE POLICY "Employees can view own attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = attendance.employee_id
      AND employees.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Employees can clock in/out"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = attendance.employee_id
      AND employees.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin and HR can manage attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'hr')
    )
  );

-- RLS Policies for leaves table
CREATE POLICY "Employees can view own leaves"
  ON leaves FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = leaves.employee_id
      AND employees.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Employees can create leave requests"
  ON leaves FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = leaves.employee_id
      AND employees.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin and HR can manage leaves"
  ON leaves FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'hr')
    )
  );

-- RLS Policies for payroll table
CREATE POLICY "Employees can view own payroll"
  ON payroll FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = payroll.employee_id
      AND employees.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Admin and HR can manage payroll"
  ON payroll FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'hr')
    )
  );

-- RLS Policies for performance_reviews table
CREATE POLICY "Employees can view own reviews"
  ON performance_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = performance_reviews.employee_id
      AND employees.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Admin and HR can manage reviews"
  ON performance_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'hr')
    )
  );

-- RLS Policies for audit_logs table
CREATE POLICY "Admin can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();