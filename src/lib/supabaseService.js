// src/lib/supabaseService.js
import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Authentication functions
export const authService = {
  // Register a new user
  async register(userData) {
    try {
      const { name, email, password } = userData;
      
      // First, create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // Then, add user details to our custom users table
      if (authData.user) {
        const { data, error } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              name,
              email,
              password: password, // In production, you should hash this
            }
          ])
          .select();

        if (error) throw error;
        return { success: true, data: authData.user };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  },

  // Login user
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get additional user data from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError) throw userError;

      return { 
        success: true, 
        data: data.user,
        userData: userData 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  },

  // Logout user
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get additional user data from our users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        return { success: true, user, userData };
      }
      
      return { success: false, error: 'No user found' };
    } catch (error) {
      console.error('Get current user error:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if user exists
  async checkUserExists(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { exists: !!data };
    } catch (error) {
      console.error('Check user exists error:', error);
      return { exists: false, error: error.message };
    }
  }
};

// Database functions for users
export const userService = {
  // Get user by ID
  async getUserById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Get user by ID error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update user profile
  async updateUser(id, updates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', id)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: error.message };
    }
  }
};