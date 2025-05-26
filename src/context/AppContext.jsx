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
    updateMultipleProductsStock,
    checkStockAvailability,
    calculateStockUpdatesForOrder,
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
    deleteOrder, // <-- Expose deleteOrder
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

  // Enhanced order confirmation function that handles stock deduction
  const confirmOrderWithStockUpdate = async (orderId) => {
    if (!session) {
      toast({ title: 'Error', description: 'You must be logged in to confirm orders.', variant: 'destructive' });
      return false;
    }

    try {
      // Find the order to confirm
      const orderToConfirm = orders.find(order => order.id === orderId);
      
      if (!orderToConfirm || !orderToConfirm.items || !Array.isArray(orderToConfirm.items)) {
        toast({
          title: "Error",
          description: "Order not found or has no items",
          variant: "destructive",
        });
        return false;
      }

      // Check stock availability before proceeding
      const stockCheck = checkStockAvailability(orderToConfirm.items);
      
      if (!stockCheck.available) {
        toast({
          title: "Insufficient Stock",
          description: stockCheck.errors.join('\n'),
          variant: "destructive",
        });
        return false;
      }

      // Calculate stock updates needed
      const stockUpdates = calculateStockUpdatesForOrder(orderToConfirm.items);
      
      if (stockUpdates.length === 0) {
        toast({
          title: "Error",
          description: "No valid products found for stock update",
          variant: "destructive",
        });
        return false;
      }

      // Perform batch stock update
      const stockUpdateSuccess = await updateMultipleProductsStock(
        stockUpdates.map(update => ({
          productId: update.productId,
          newStock: update.newStock
        })),
        'order confirmation',
        orderId
      );

      if (!stockUpdateSuccess) {
        toast({
          title: "Error",
          description: "Failed to update product stocks. Order not confirmed.",
          variant: "destructive",
        });
        return false;
      }

      // Update order status to confirmed
      const orderUpdateSuccess = await updateOrderStatus(orderId, 'Confirmed');

      if (orderUpdateSuccess) {
        toast({
          title: "Order Confirmed",
          description: `Order confirmed successfully. Stock updated for ${stockUpdates.length} product(s).`,
          variant: "default",
        });
        return true;
      } else {
        // If order status update fails, we should ideally rollback stock changes
        // For now, we'll just show an error
        toast({
          title: "Warning",
          description: "Stock was updated but order status update failed. Please check order status manually.",
          variant: "warning",
        });
        return false;
      }

    } catch (error) {
      console.error('Error confirming order with stock update:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while confirming the order. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Helper function to get current stock for a product
  const getProductStock = (productId) => {
    const product = products?.find(p => p.id === productId);
    return product ? (product.stock || 0) : 0;
  };

  // Helper function to check if order has sufficient stock
  const orderHasSufficientStock = (order) => {
    if (!order || !order.items || !Array.isArray(order.items)) return false;
    
    return order.items.every(item => {
      const currentStock = getProductStock(item.productId);
      const requestedQuantity = parseInt(item.quantity, 10) || 0;
      return currentStock >= requestedQuantity;
    });
  };

  // Get low stock products (products with stock below a threshold)
  const getLowStockProducts = (threshold = 10) => {
    return products.filter(product => (product.stock || 0) <= threshold);
  };

  // Get out of stock products
  const getOutOfStockProducts = () => {
    return products.filter(product => (product.stock || 0) === 0);
  };

  const value = {
    // Authentication
    session, 
    isLoadingSession, 
    signIn, 
    signOut,
    
    // Products
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    updateProductStock,
    updateMultipleProductsStock,
    checkStockAvailability,
    calculateStockUpdatesForOrder,
    generateSku,
    getProductStock,
    getLowStockProducts,
    getOutOfStockProducts,
    
    // Customers
    customers, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer,
    
    // Transports
    transports, 
    addTransport, 
    updateTransport, 
    deleteTransport,
    
    // Orders
    orders, 
    addOrder, 
    updateOrderStatus, 
    updateOrderDetails,
    deleteOrder, // <-- Expose deleteOrder in context value
    confirmOrderWithStockUpdate,
    orderHasSufficientStock,
    
    // Loading states
    isLoadingData,
    
    // Toast utility
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