import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { performanceService } from '../services/performanceService';
import { employeeService } from '../services/employeeService';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { Plus, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Performance() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employee, setEmployee] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [averageScore, setAverageScore] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    employee_id: '',
    period_start: '',
    period_end: '',
    score: '',
    comments: '',
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
          const [reviewData, trendsData, avgScore] = await Promise.all([
            performanceService.getReviewsByEmployee(emp.id),
            performanceService.getPerformanceTrends(emp.id),
            performanceService.getAverageScoreByEmployee(emp.id),
          ]);

          setReviews(reviewData || []);
          setTrends(
            trendsData?.map((t: any) => ({
              date: new Date(t.period_end).toLocaleDateString(),
              score: t.score,
            })) || []
          );
          setAverageScore(avgScore || 0);
        }
      } else {
        const [allReviews, allEmployees] = await Promise.all([
          performanceService.getAllReviews(),
          employeeService.getAllEmployees(),
        ]);

        setReviews(allReviews || []);
        setEmployees(allEmployees?.filter(e => e.status === 'active') || []);
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await performanceService.createReview({
        employee_id: formData.employee_id,
        reviewer_id: user?.id,
        period_start: formData.period_start,
        period_end: formData.period_end,
        score: parseFloat(formData.score),
        comments: formData.comments,
      });

      await loadData();
      setIsModalOpen(false);
      setFormData({
        employee_id: '',
        period_start: '',
        period_end: '',
        score: '',
        comments: '',
      });
    } catch (error: any) {
      alert(error.message || 'Failed to create review');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Performance Management</h1>
        {(user?.role === 'admin' || user?.role === 'hr') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={20} className="mr-2" />
            Add Review
          </Button>
        )}
      </div>

      {user?.role === 'employee' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="text-center">
              <TrendingUp className="mx-auto text-blue-600 mb-4" size={48} />
              <h3 className="text-lg font-semibold mb-2">Average Performance Score</h3>
              <p className="text-5xl font-bold text-blue-600">{averageScore}</p>
              <p className="text-sm text-gray-600 mt-2">Out of 100</p>
            </div>
          </Card>

          {trends.length > 0 && (
            <Card title="Performance Trends">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      <Card title="Performance Reviews">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {(user?.role === 'admin' || user?.role === 'hr') && (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Employee</th>
                )}
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Period</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Score</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Comments</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  {(user?.role === 'admin' || user?.role === 'hr') && (
                    <td className="px-4 py-3 text-sm">
                      {review.employees?.employee_code || '-'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm">
                    {new Date(review.period_start).toLocaleDateString()} -{' '}
                    {new Date(review.period_end).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-3 py-1 rounded-full font-semibold ${
                      review.score >= 80 ? 'bg-green-100 text-green-800' :
                      review.score >= 60 ? 'bg-blue-100 text-blue-800' :
                      review.score >= 40 ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {review.score}/100
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">
                    {review.comments || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(review.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {reviews.length === 0 && (
            <p className="text-center text-gray-500 py-8">No performance reviews found</p>
          )}
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Performance Review"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Employee"
            value={formData.employee_id}
            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
            options={[
              { value: '', label: 'Select Employee' },
              ...employees.map(emp => ({
                value: emp.id,
                label: `${emp.employee_code} - ${emp.designation}`,
              })),
            ]}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Period Start"
              type="date"
              value={formData.period_start}
              onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
              required
            />

            <Input
              label="Period End"
              type="date"
              value={formData.period_end}
              onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
              required
            />
          </div>

          <Input
            label="Score (0-100)"
            type="number"
            min="0"
            max="100"
            value={formData.score}
            onChange={(e) => setFormData({ ...formData, score: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comments
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit Review</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
