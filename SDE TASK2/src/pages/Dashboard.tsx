import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { employeeService } from '../services/employeeService';
import { attendanceService } from '../services/attendanceService';
import { leaveService } from '../services/leaveService';
import { payrollService } from '../services/payrollService';
import { performanceService } from '../services/performanceService';
import { Users, Clock, Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    todayAttendance: 0,
  });
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      if (user?.role === 'admin' || user?.role === 'hr') {
        const [employees, leaves, attendance, perfData] = await Promise.all([
          employeeService.getAllEmployees(),
          leaveService.getPendingLeaves(),
          attendanceService.getAllAttendance(
            new Date().toISOString().split('T')[0],
            new Date().toISOString().split('T')[0]
          ),
          performanceService.getDepartmentAverages(),
        ]);

        setStats({
          totalEmployees: employees?.length || 0,
          activeEmployees: employees?.filter(e => e.status === 'active').length || 0,
          pendingLeaves: leaves?.length || 0,
          todayAttendance: attendance?.length || 0,
        });

        const deptCounts = employees?.reduce((acc: any, emp) => {
          acc[emp.department] = (acc[emp.department] || 0) + 1;
          return acc;
        }, {});

        setDepartmentData(
          Object.entries(deptCounts || {}).map(([name, value]) => ({
            name,
            value,
          }))
        );

        setPerformanceData(perfData || []);
      } else {
        const employee = await employeeService.getEmployeeByUserId(user?.id || '');
        if (employee) {
          const [attendance, reviews] = await Promise.all([
            attendanceService.getTodayAttendance(employee.id),
            performanceService.getReviewsByEmployee(employee.id),
          ]);

          setStats({
            totalEmployees: 0,
            activeEmployees: 0,
            pendingLeaves: 0,
            todayAttendance: attendance ? 1 : 0,
          });
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
      </div>

      {(user?.role === 'admin' || user?.role === 'hr') && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Employees</p>
                  <p className="text-3xl font-bold mt-2">{stats.totalEmployees}</p>
                </div>
                <Users className="text-blue-600" size={40} />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Employees</p>
                  <p className="text-3xl font-bold mt-2">{stats.activeEmployees}</p>
                </div>
                <TrendingUp className="text-green-600" size={40} />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Attendance</p>
                  <p className="text-3xl font-bold mt-2">{stats.todayAttendance}</p>
                </div>
                <Clock className="text-orange-600" size={40} />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Leaves</p>
                  <p className="text-3xl font-bold mt-2">{stats.pendingLeaves}</p>
                </div>
                <AlertCircle className="text-red-600" size={40} />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Employee Distribution by Department">
              {departmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </Card>

            <Card title="Department Performance Averages">
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="average" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No performance data available</p>
              )}
            </Card>
          </div>
        </>
      )}

      {user?.role === 'employee' && (
        <Card>
          <div className="text-center py-8">
            <Clock className="mx-auto text-blue-600 mb-4" size={48} />
            <h3 className="text-xl font-semibold mb-2">Welcome to Your Dashboard</h3>
            <p className="text-gray-600">
              Use the navigation menu to clock in/out, request leaves, and view your payroll information.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
