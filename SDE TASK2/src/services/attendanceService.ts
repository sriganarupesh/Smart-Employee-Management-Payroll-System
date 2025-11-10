import { supabase, Attendance } from '../lib/supabase';

export const attendanceService = {
  async clockIn(employeeId: string, location?: string) {
    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      throw new Error('Already clocked in today');
    }

    const { data, error } = await supabase
      .from('attendance')
      .insert([
        {
          employee_id: employeeId,
          date: today,
          clock_in_time: new Date().toISOString(),
          status: 'present',
          location,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async clockOut(employeeId: string) {
    const today = new Date().toISOString().split('T')[0];

    const { data: attendance, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', today)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!attendance) throw new Error('No clock-in record found for today');
    if (attendance.clock_out_time) throw new Error('Already clocked out');

    const clockOutTime = new Date();
    const clockInTime = new Date(attendance.clock_in_time);
    const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

    const { data, error } = await supabase
      .from('attendance')
      .update({
        clock_out_time: clockOutTime.toISOString(),
        total_hours: Math.round(totalHours * 100) / 100,
      })
      .eq('id', attendance.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTodayAttendance(employeeId: string) {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', today)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getAttendanceByDateRange(employeeId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getAllAttendance(startDate?: string, endDate?: string) {
    let query = supabase
      .from('attendance')
      .select('*, employees(employee_code, department, designation)')
      .order('date', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async updateAttendance(id: string, updates: Partial<Attendance>) {
    const { data, error } = await supabase
      .from('attendance')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
