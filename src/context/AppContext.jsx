import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import useAuth from '@/hooks/useAuth';
import useProducts from '@/hooks/useProducts';
import useCustomers from '@/hooks/useCustomers';
import useTransports from '@/hooks/useTransports';
import useOrders from '@/hooks/useOrders';

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
  const { toast } = useToast();
  const [isLoadingData, setIsLoadingData] = useState(true);

  const {
    session,
    isLoadingSession,
    signIn,
    signOut,
  } = useAuth(supabase, toast);

  const {
    products,
    setProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
    generateSku,
  } = useProducts(supabase, toast, session);

  const {
    customers,
    setCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useCustomers(supabase, toast, session);

  const {
    transports,
    setTransports,
    addTransport,
    updateTransport,
    deleteTransport,
  } = useTransports(supabase, toast, session);

  const {
    orders,
    setOrders,
    addOrder,
    updateOrderStatus,
    updateOrderDetails,
  } = useOrders(supabase, toast, session, products);


  const fetchData = useCallback(async (tableName, setData, errorMessage) => {
    if (!session) return;
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw error;
      setData(data || []);
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      toast({ title: 'Error', description: errorMessage || `Failed to load ${tableName} data.`, variant: 'destructive' });
      setData([]);
    }
  }, [toast, session]);

  useEffect(() => {
    if (session) {
      const loadAllData = async () => {
        setIsLoadingData(true);
        await Promise.all([
          fetchData('products', setProducts, 'Failed to load products.'),
          fetchData('customers', setCustomers, 'Failed to load customers.'),
          fetchData('transports', setTransports, 'Failed to load transports.'),
          fetchData('orders', setOrders, 'Failed to load orders.')
        ]);
        setIsLoadingData(false);
      };
      loadAllData();
    } else {
      setProducts([]);
      setCustomers([]);
      setTransports([]);
      setOrders([]);
      setIsLoadingData(false); 
    }
  }, [session, fetchData, setProducts, setCustomers, setTransports, setOrders]);


  const value = {
    session, isLoadingSession, signIn, signOut,
    products, addProduct, updateProduct, deleteProduct, updateProductStock, generateSku,
    customers, addCustomer, updateCustomer, deleteCustomer,
    transports, addTransport, updateTransport, deleteTransport,
    orders, addOrder, updateOrderStatus, updateOrderDetails,
    isLoadingData,
    toast
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};