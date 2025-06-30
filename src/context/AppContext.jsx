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
      const product = products?.find(p => p.id === item.productId);
      const availableStock = product ? (product.stock || 0) : 0;
      return availableStock >= (item.quantity || 0);
    });
  };

  // Helper function to get products with low stock (below a threshold)
  const getLowStockProducts = (threshold = 10) => {
    if (!products || !Array.isArray(products)) return [];
    
    return products.filter(product => {
      const stock = product.stock || 0;
      return stock > 0 && stock <= threshold;
    });
  };

  // Helper function to get products that are out of stock
  const getOutOfStockProducts = () => {
    if (!products || !Array.isArray(products)) return [];
    
    return products.filter(product => {
      const stock = product.stock || 0;
      return stock <= 0;
    });
  };

  // Reverse dispatch function
  const reverseDispatch = async (order) => {
    if (!session) {
      toast({ 
        title: 'Error', 
        description: 'You must be logged in to reverse dispatch.', 
        variant: 'destructive' 
      });
      return false;
    }

    try {
      // 1. Validate that the order can be reversed
      if (!order || (order.status !== "Full Dispatch" && order.status !== "Partial Dispatch")) {
        throw new Error("Order cannot be reversed - invalid status");
      }

      // 2. Prepare the inventory updates with stock history
      const inventoryUpdates = [];
      
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          if (item.dispatchedQuantity && item.dispatchedQuantity > 0) {
            // Find the product to update its stock
            const product = products.find(p => p.id === item.productId);
            if (product) {
              const currentStock = product.stock || 0;
              const quantityToRestore = item.dispatchedQuantity;
              const newStock = currentStock + quantityToRestore;

              // Create new stock history entry for the reversal
              const historyEntry = {
                date: new Date().toISOString(),
                quantity: newStock,
                type: 'dispatch reversal',
                previous_stock: currentStock,
                change: quantityToRestore,
                order_id: order.id,
                // reason: `Dispatch reversed for order #${order.id}`
              };

              // Update stock history
              const updatedStockHistory = [...(product.stock_history || []), historyEntry];

              inventoryUpdates.push({
                productId: item.productId,
                quantityToRestore: quantityToRestore,
                currentStock: currentStock,
                newStock: newStock,
                updatedStockHistory: updatedStockHistory
              });
            }
          }
        }
      }

      // 3. Update the order in the database
      const { data: updatedOrder, error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'Confirmed',
          dispatched_items: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .select()
        .single();

      if (orderError) {
        throw new Error(`Failed to update order: ${orderError.message}`);
      }

      // 4. Update inventory (restore stock) with stock history
      for (const update of inventoryUpdates) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ 
            stock: update.newStock,
            stock_history: update.updatedStockHistory,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.productId);

        if (stockError) {
          throw new Error(`Failed to update inventory for product ${update.productId}: ${stockError.message}`);
        }
      }

      // 5. Reset dispatched quantities in order items
      const resetItems = order.items.map(item => ({
        ...item,
        dispatchedQuantity: 0
      }));

      const { error: itemsError } = await supabase
        .from('orders')
        .update({
          items: resetItems
        })
        .eq('id', order.id);

      if (itemsError) {
        throw new Error(`Failed to reset order items: ${itemsError.message}`);
      }

      // 6. Update local state
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === order.id 
            ? {
                ...o,
                status: 'Confirmed',
                dispatched_items: null,
                items: resetItems,
                updated_at: new Date().toISOString()
              }
            : o
        )
      );

      // 7. Update products state to reflect new stock levels and history
      setProducts(prevProducts =>
        prevProducts.map(product => {
          const update = inventoryUpdates.find(u => u.productId === product.id);
          if (update) {
            return {
              ...product,
              stock: update.newStock,
              stock_history: update.updatedStockHistory,
              updated_at: new Date().toISOString()
            };
          }
          return product;
        })
      );

      // 8. Show success message
      toast({
        title: "Dispatch Reversed Successfully",
        description: `Order #${order.id} has been reversed. Inventory and stock history have been updated.`,
        variant: "default",
      });

      return true;

    } catch (error) {
      console.error('Error reversing dispatch:', error);
      
      toast({
        title: "Error Reversing Dispatch",
        description: error.message || "Failed to reverse dispatch. Please try again.",
        variant: "destructive",
      });

      return false;
    }
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
    reverseDispatch, // <-- Expose reverseDispatch in context value
    
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