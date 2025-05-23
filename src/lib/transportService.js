import { supabase } from './supabaseService';

class TransportService {
  constructor() {
    this.tableName = 'transport_companies';
  }

  // Get all transport companies
  async getAllTransports() {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching transport companies:', error);
      return { data: null, error };
    }
  }

  // Get transport company by ID
  async getTransportById(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching transport company:', error);
      return { data: null, error };
    }
  }

  // Create new transport company
  async createTransport(transportData) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([{
          name: transportData.name,
          address: transportData.address
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating transport company:', error);
      return { data: null, error };
    }
  }

  // Update transport company
  async updateTransport(id, transportData) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          name: transportData.name,
          address: transportData.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating transport company:', error);
      return { data: null, error };
    }
  }

  // Delete transport company
  async deleteTransport(id) {
    try {
      // Check if transport has associated orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('transport_id', id)
        .limit(1);

      if (ordersError) {
        console.error('Error checking transport orders:', ordersError);
        throw new Error('Failed to verify transport dependencies');
      }

      if (orders && orders.length > 0) {
        throw new Error('Cannot delete transport company with existing orders. Please reassign or remove orders first.');
      }

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting transport company:', error);
      return { error };
    }
  }

  // Search transport companies
  async searchTransports(searchTerm) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error searching transport companies:', error);
      return { data: null, error };
    }
  }

  // Get orders associated with a transport company
  async getTransportOrders(transportId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('transport_id', transportId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching transport orders:', error);
      return { data: null, error };
    }
  }

  // Get transport statistics
  async getTransportStats(transportId = null) {
    try {
      let query = supabase.from('orders').select('status, created_at');
      
      if (transportId) {
        query = query.eq('transport_id', transportId);
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      const stats = {
        totalOrders: orders?.length || 0,
        deliveredOrders: orders?.filter(order => order.status === 'delivered').length || 0,
        pendingOrders: orders?.filter(order => order.status === 'pending').length || 0,
        inTransitOrders: orders?.filter(order => order.status === 'in_transit').length || 0,
      };

      stats.deliveryRate = stats.totalOrders > 0 
        ? Math.round((stats.deliveredOrders / stats.totalOrders) * 100) 
        : 0;

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching transport stats:', error);
      return { data: null, error };
    }
  }

  // Check if transport name is unique (excluding current transport if updating)
  async checkTransportNameUnique(name, excludeId = null) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('id')
        .ilike('name', name.trim())
        .limit(1);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { isUnique: !data || data.length === 0, error: null };
    } catch (error) {
      console.error('Error checking transport name uniqueness:', error);
      return { isUnique: false, error };
    }
  }
}

export const transportService = new TransportService();