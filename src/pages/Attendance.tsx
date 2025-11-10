import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { attendanceService } from '../services/attendanceService';
import { employeeService } from '../services/employeeService';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Clock, LogIn, LogOut, Calendar } from 'lucide-react';

export function Attendance() {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      if (user?.role === 'employee') {
        const emp = await employeeService.getEmployeeByUserId(user.id);
        if (emp) {
          setEmployee(emp);
          const today = await attendanceService.getTodayAttendance(emp.id);
          setTodayAttendance(today);

          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const recent = await attendanceService.getAttendanceByDateRange(emp.id, startDate, endDate);
          setRecentAttendance(recent || []);
        }
      } else {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const all = await attendanceService.getAllAttendance(startDate, endDate);
        setRecentAttendance(all || []);
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    if (!employee) return;

    try {
      await attendanceService.clockIn(employee.id);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    if (!employee) return;

    try {
      await attendanceService.clockOut(employee.id);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to clock out');
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Attendance</h1>

      {user?.role === 'employee' && (
        <Card>
          <div className="text-center">
            <Clock className="mx-auto text-blue-600 mb-4" size={48} />
            <h2 className="text-2xl font-semibold mb-4">Today's Attendance</h2>

            {todayAttendance ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Clock In</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatTime(todayAttendance.clock_in_time)}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Clock Out</p>
                    <p className="text-xl font-bold text-orange-600">
                      {formatTime(todayAttendance.clock_out_time)}
                    </p>
                  </div>
                </div>

                {todayAttendance.total_hours && (
                  <p className="text-lg">
                    Total Hours: <span className="font-bold">{todayAttendance.total_hours}h</span>
                  </p>
                )}

                {!todayAttendance.clock_out_time && (
                  <Button onClick={handleClockOut} variant="danger">
                    <LogOut size={20} className="mr-2" />
                    Clock Out
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">You haven't clocked in today</p>
                <Button onClick={handleClockIn}>
                  <LogIn size={20} className="mr-2" />
                  Clock In
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card title="Attendance History">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {(user?.role === 'admin' || user?.role === 'hr') && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Employee</th>
                )}
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Clock In</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Clock Out</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Total Hours</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentAttendance.map((record: any) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  {(user?.role === 'admin' || user?.role === 'hr') && (
                    <td className="px-4 py-3 text-sm">
                      {record.employees?.employee_code || '-'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">{formatTime(record.clock_in_time)}</td>
                  <td className="px-4 py-3 text-sm">{formatTime(record.clock_out_time)}</td>
                  <td className="px-4 py-3 text-sm">{record.total_hours || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      record.status === 'present' ? 'bg-green-100 text-green-800' :
                      record.status === 'leave' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {recentAttendance.length === 0 && (
            <p className="text-center text-gray-500 py-8">No attendance records found</p>
          )}
        </div>
      </Card>
    </div>
  );
}
