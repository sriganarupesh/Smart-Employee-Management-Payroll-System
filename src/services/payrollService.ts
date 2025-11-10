import { supabase, Payroll } from '../lib/supabase';

interface PayrollCalculation {
  basicSalary: number;
  hra: number;
  allowances: Record<string, number>;
  grossSalary: number;
  deductions: Record<string, number>;
  taxAmount: number;
  netSalary: number;
}

export const payrollService = {
  calculatePayroll(
    basicSalary: number,
    hra: number,
    allowances: Record<string, number> = {},
    customDeductions: Record<string, number> = {}
  ): PayrollCalculation {
    const grossSalary = basicSalary + hra + Object.values(allowances).reduce((a, b) => a + b, 0);

    const providentFund = Math.round(basicSalary * 0.12 * 100) / 100;
    const professionalTax = 200;

    const deductions = {
      provident_fund: providentFund,
      professional_tax: professionalTax,
      ...customDeductions,
    };

    const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);

    let taxAmount = 0;
    if (grossSalary * 12 > 250000) {
      const annualIncome = grossSalary * 12;
      if (annualIncome <= 500000) {
        taxAmount = Math.round(((annualIncome - 250000) * 0.05) / 12 * 100) / 100;
      } else if (annualIncome <= 1000000) {
        taxAmount = Math.round(((250000 * 0.05 + (annualIncome - 500000) * 0.2) / 12) * 100) / 100;
      } else {
        taxAmount = Math.round(((250000 * 0.05 + 500000 * 0.2 + (annualIncome - 1000000) * 0.3) / 12) * 100) / 100;
      }
    }

    const netSalary = Math.round((grossSalary - totalDeductions - taxAmount) * 100) / 100;

    return {
      basicSalary,
      hra,
      allowances,
      grossSalary,
      deductions,
      taxAmount,
      netSalary,
    };
  },

  async generatePayrollForMonth(month: string) {
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .eq('status', 'active');

    if (employeesError) throw employeesError;

    const payrollRecords = [];

    for (const employee of employees || []) {
      const { data: existing } = await supabase
        .from('payroll')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('month', month)
        .maybeSingle();

      if (existing) continue;

      const calculation = this.calculatePayroll(
        employee.basic_salary,
        employee.hra,
        employee.allowances
      );

      const { data, error } = await supabase
        .from('payroll')
        .insert([
          {
            employee_id: employee.id,
            month,
            gross_salary: calculation.grossSalary,
            allowances: calculation.allowances,
            deductions: calculation.deductions,
            tax_amount: calculation.taxAmount,
            net_salary: calculation.netSalary,
            status: 'draft',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      payrollRecords.push(data);
    }

    return payrollRecords;
  },

  async getPayrollByMonth(month: string) {
    const { data, error } = await supabase
      .from('payroll')
      .select('*, employees(employee_code, department, designation)')
      .eq('month', month)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getPayrollByEmployee(employeeId: string) {
    const { data, error } = await supabase
      .from('payroll')
      .select('*')
      .eq('employee_id', employeeId)
      .order('month', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updatePayrollStatus(payrollId: string, status: 'draft' | 'processed' | 'paid') {
    const updates: any = { status };
    if (status === 'paid') {
      updates.processed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('payroll')
      .update(updates)
      .eq('id', payrollId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async generatePayslipData(payrollId: string) {
    const { data: payroll, error } = await supabase
      .from('payroll')
      .select('*, employees(*)')
      .eq('id', payrollId)
      .maybeSingle();

    if (error) throw error;
    return payroll;
  },
};
