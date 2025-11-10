import { supabase, Leave } from '../lib/supabase';

export const leaveService = {
  async createLeaveRequest(leave: Partial<Leave>) {
    const { data, error } = await supabase
      .from('leaves')
      .insert([leave])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getLeavesByEmployee(employeeId: string) {
    const { data, error } = await supabase
      .from('leaves')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getAllLeaves(status?: string) {
    let query = supabase
      .from('leaves')
      .select('*, employees(employee_code, department, designation)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async approveLeave(leaveId: string, approverId: string) {
    const { data, error } = await supabase
      .from('leaves')
      .update({
        status: 'approved',
        approver_id: approverId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', leaveId)
      .select()
      .single();

    if (error) throw error;

    const leave = data;
    const startDate = new Date(leave.start_date);
    const endDate = new Date(leave.end_date);

    for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      await supabase
        .from('attendance')
        .upsert([
          {
            employee_id: leave.employee_id,
            date: dateStr,
            status: 'leave',
            note: `${leave.leave_type} leave`,
          },
        ], {
          onConflict: 'employee_id,date'
        });
    }

    return data;
  },

  async rejectLeave(leaveId: string, approverId: string) {
    const { data, error } = await supabase
      .from('leaves')
      .update({
        status: 'rejected',
        approver_id: approverId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', leaveId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPendingLeaves() {
    const { data, error } = await supabase
      .from('leaves')
      .select('*, employees(employee_code, department, designation)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};
