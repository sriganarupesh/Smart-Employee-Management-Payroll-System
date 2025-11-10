import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { leaveService } from '../services/leaveService';
import { employeeService } from '../services/employeeService';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { Plus, Check, X } from 'lucide-react';

export function Leaves() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [employee, setEmployee] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    leave_type: 'paid',
    start_date: '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      if (user?.role === 'employee') {
        const emp = await employeeService.getEmployeeByUserId(user.id);
        if (emp) {
          setEmployee(emp);
          const data = await leaveService.getLeavesByEmployee(emp.id);
          setLeaves(data || []);
        }
      } else {
        const data = await leaveService.getAllLeaves();
        setLeaves(data || []);
      }
    } catch (error) {
      console.error('Error loading leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employee) return;

    try {
      await leaveService.createLeaveRequest({
        employee_id: employee.id,
        ...formData,
      });

      await loadData();
      setIsModalOpen(false);
      setFormData({
        leave_type: 'paid',
        start_date: '',
        end_date: '',
        reason: '',
      });
    } catch (error: any) {
      alert(error.message || 'Failed to submit leave request');
    }
  };

  const handleApprove = async (leaveId: string) => {
    try {
      await leaveService.approveLeave(leaveId, user?.id || '');
      await loadData();
    } catch (error) {
      console.error('Error approving leave:', error);
      alert('Failed to approve leave');
    }
  };

  const handleReject = async (leaveId: string) => {
    try {
      await leaveService.rejectLeave(leaveId, user?.id || '');
      await loadData();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      alert('Failed to reject leave');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const approvedLeaves = leaves.filter(l => l.status === 'approved');
  const rejectedLeaves = leaves.filter(l => l.status === 'rejected');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leave Management</h1>
        {user?.role === 'employee' && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={20} className="mr-2" />
            Request Leave
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-3xl font-bold text-orange-600">{pendingLeaves.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-3xl font-bold text-green-600">{approvedLeaves.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Rejected</p>
            <p className="text-3xl font-bold text-red-600">{rejectedLeaves.length}</p>
          </div>
        </Card>
      </div>

      <Card title="Leave Requests">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {(user?.role === 'admin' || user?.role === 'hr') && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Employee</th>
                )}
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Start Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">End Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Reason</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                {(user?.role === 'admin' || user?.role === 'hr') && (
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {leaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50">
                  {(user?.role === 'admin' || user?.role === 'hr') && (
                    <td className="px-4 py-3 text-sm">
                      {leave.employees?.employee_code || '-'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm capitalize">{leave.leave_type}</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(leave.start_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(leave.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">{leave.reason}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  {(user?.role === 'admin' || user?.role === 'hr') && (
                    <td className="px-4 py-3 text-sm text-right space-x-2">
                      {leave.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(leave.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Approve"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => handleReject(leave.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Reject"
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {leaves.length === 0 && (
            <p className="text-center text-gray-500 py-8">No leave requests found</p>
          )}
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Leave"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Leave Type"
            value={formData.leave_type}
            onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
            options={[
              { value: 'paid', label: 'Paid Leave' },
              { value: 'unpaid', label: 'Unpaid Leave' },
              { value: 'sick', label: 'Sick Leave' },
              { value: 'casual', label: 'Casual Leave' },
            ]}
          />

          <Input
            label="Start Date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />

          <Input
            label="End Date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
