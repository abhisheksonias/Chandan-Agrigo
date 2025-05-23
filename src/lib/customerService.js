import { supabase } from './supabaseService';

class CustomerService {
  constructor() {
    this.tableName = 'customers';
  }

  // Get all customers
  async getAllCustomers() {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching customers:', error);
      return { data: null, error };
    }
  }

  // Get customer by ID
  async getCustomerById(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching customer:', error);
      return { data: null, error };
    }
  }

  // Create new customer
  async createCustomer(customerData) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([{
          name: customerData.name,
          city: customerData.city,
          phone: customerData.phone
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating customer:', error);
      return { data: null, error };
    }
  }

  // Update customer
  async updateCustomer(id, customerData) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          name: customerData.name,
          city: customerData.city,
          phone: customerData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating customer:', error);
      return { data: null, error };
    }
  }

  // Delete customer
  async deleteCustomer(id) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting customer:', error);
      return { error };
    }
  }

  // Search customers
  async searchCustomers(searchTerm) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,phone.like.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error searching customers:', error);
      return { data: null, error };
    }
  }
}

export const customerService = new CustomerService();