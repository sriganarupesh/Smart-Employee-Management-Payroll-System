import { supabase, Employee } from '../lib/supabase';

export const employeeService = {
  async getAllEmployees() {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getEmployeeById(id: string) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getEmployeeByUserId(userId: string) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createEmployee(employee: Partial<Employee>) {
    const { data, error } = await supabase
      .from('employees')
      .insert([employee])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateEmployee(id: string, updates: Partial<Employee>) {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEmployee(id: string) {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async searchEmployees(query: string) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .or(`employee_code.ilike.%${query}%,department.ilike.%${query}%,designation.ilike.%${query}%`);

    if (error) throw error;
    return data;
  },
};
