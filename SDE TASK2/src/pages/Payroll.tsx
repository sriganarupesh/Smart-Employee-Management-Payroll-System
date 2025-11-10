import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { payrollService } from '../services/payrollService';
import { employeeService } from '../services/employeeService';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { DollarSign, Download } from 'lucide-react';

export function Payroll() {
  const { user } = useAuth();
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [employee, setEmployee] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user, selectedMonth]);

  const loadData = async () => {
    try {
      if (user?.role === 'employee') {
        const emp = await employeeService.getEmployeeByUserId(user.id);
        if (emp) {
          setEmployee(emp);
          const data = await payrollService.getPayrollByEmployee(emp.id);
          setPayrollRecords(data || []);
        }
      } else {
        const data = await payrollService.getPayrollByMonth(selectedMonth);
        setPayrollRecords(data || []);
      }
    } catch (error) {
      console.error('Error loading payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      setLoading(true);
      await payrollService.generatePayrollForMonth(selectedMonth);
      await loadData();
      alert('Payroll generated successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to generate payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (payrollId: string, status: 'processed' | 'paid') => {
    try {
      await payrollService.updatePayrollStatus(payrollId, status);
      await loadData();
    } catch (error) {
      alert('Failed to update payroll status');
    }
  };

  const handleDownloadPayslip = async (payrollId: string) => {
    try {
      const payslipData = await payrollService.generatePayslipData(payrollId);

      const content = `
PAYSLIP
========================================

Employee: ${payslipData.employees.employee_code}
Department: ${payslipData.employees.department}
Designation: ${payslipData.employees.designation}
Month: ${payslipData.month}

EARNINGS
--------
Basic Salary: $${payslipData.employees.basic_salary.toFixed(2)}
HRA: $${payslipData.employees.hra.toFixed(2)}
Gross Salary: $${payslipData.gross_salary.toFixed(2)}

DEDUCTIONS
----------
Provident Fund: $${(payslipData.deductions.provident_fund || 0).toFixed(2)}
Professional Tax: $${(payslipData.deductions.professional_tax || 0).toFixed(2)}
Tax: $${payslipData.tax_amount.toFixed(2)}

NET SALARY: $${payslipData.net_salary.toFixed(2)}
========================================
`;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip_${payslipData.month}_${payslipData.employees.employee_code}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download payslip');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payroll Management</h1>
        {(user?.role === 'admin' || user?.role === 'hr') && (
          <div className="flex items-center space-x-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={handleGeneratePayroll}>
              <DollarSign size={20} className="mr-2" />
              Generate Payroll
            </Button>
          </div>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {(user?.role === 'admin' || user?.role === 'hr') && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Employee</th>
                )}
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Month</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Gross Salary</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Deductions</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Tax</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Net Salary</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payrollRecords.map((record) => {
                const totalDeductions = Object.values(record.deductions).reduce(
                  (acc: number, val: any) => acc + val,
                  0
                );

                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    {(user?.role === 'admin' || user?.role === 'hr') && (
                      <td className="px-4 py-3 text-sm">
                        {record.employees?.employee_code || '-'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm">{record.month}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      ${record.gross_salary.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">
                      -${totalDeductions.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">
                      -${record.tax_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                      ${record.net_salary.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        record.status === 'paid' ? 'bg-green-100 text-green-800' :
                        record.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <button
                          onClick={() => handleDownloadPayslip(record.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Download Payslip"
                        >
                          <Download size={18} />
                        </button>
                        {(user?.role === 'admin' || user?.role === 'hr') && (
                          <>
                            {record.status === 'draft' && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(record.id, 'processed')}
                              >
                                Process
                              </Button>
                            )}
                            {record.status === 'processed' && (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleUpdateStatus(record.id, 'paid')}
                              >
                                Mark Paid
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {payrollRecords.length === 0 && (
            <p className="text-center text-gray-500 py-8">No payroll records found</p>
          )}
        </div>
      </Card>
    </div>
  );
}
