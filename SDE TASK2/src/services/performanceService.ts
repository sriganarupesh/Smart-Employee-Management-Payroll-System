import { supabase, PerformanceReview } from '../lib/supabase';

export const performanceService = {
  async createReview(review: Partial<PerformanceReview>) {
    const { data, error } = await supabase
      .from('performance_reviews')
      .insert([review])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getReviewsByEmployee(employeeId: string) {
    const { data, error } = await supabase
      .from('performance_reviews')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getAllReviews() {
    const { data, error } = await supabase
      .from('performance_reviews')
      .select('*, employees(employee_code, department, designation)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getAverageScoreByEmployee(employeeId: string) {
    const { data, error } = await supabase
      .from('performance_reviews')
      .select('score')
      .eq('employee_id', employeeId);

    if (error) throw error;

    if (!data || data.length === 0) return 0;

    const sum = data.reduce((acc, review) => acc + review.score, 0);
    return Math.round((sum / data.length) * 100) / 100;
  },

  async getPerformanceTrends(employeeId: string) {
    const { data, error } = await supabase
      .from('performance_reviews')
      .select('score, period_end')
      .eq('employee_id', employeeId)
      .order('period_end', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getDepartmentAverages() {
    const { data, error } = await supabase
      .from('performance_reviews')
      .select('score, employees(department)');

    if (error) throw error;

    const departmentScores: Record<string, number[]> = {};

    data?.forEach((review: any) => {
      const dept = review.employees?.department;
      if (dept) {
        if (!departmentScores[dept]) {
          departmentScores[dept] = [];
        }
        departmentScores[dept].push(review.score);
      }
    });

    const averages = Object.entries(departmentScores).map(([department, scores]) => ({
      department,
      average: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
      count: scores.length,
    }));

    return averages;
  },
};
