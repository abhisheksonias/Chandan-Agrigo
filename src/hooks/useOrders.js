import { useState, useEffect } from 'react';

const useOrders = (supabase, toast, session, products) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all orders (removed user-specific filtering)
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({ 
          title: 'Error Fetching Orders', 
          description: error.message, 
          variant: 'destructive' 
        });
        return;
      }

      setOrders(data || []);
    } catch (err) {
      toast({ 
        title: 'Error', 
        description: 'Failed to fetch orders', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Load orders when hook initializes (removed session dependency)
  useEffect(() => {
    fetchOrders();
  }, []);

  const addOrder = async (orderData) => {
    const newOrder = {
      id: `ord_${crypto.randomUUID()}`,
      customer_id: orderData.customerId || null,
      customer_name: orderData.customerName,
      city: orderData.city,
      phone_number: orderData.phoneNumber,
      delivery_location: orderData.deliveryLocation,
      status: 'Unconfirmed',
      items: orderData.items,
      dispatched_items: [],
      delivered_by: [],
      added_by: orderData.added_by,
      user_id: session?.user?.id || null // Made optional
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(newOrder)
      .select();

    if (error) {
      toast({ 
        title: 'Error Adding Order', 
        description: error.message, 
        variant: 'destructive' 
      });
      return null;
    }

    if (data && data[0]) {
      setOrders(prev => [data[0], ...prev]);
      toast({ 
        title: 'Order Added', 
        description: `New order for ${data[0].customer_name} created.` 
      });
      return data[0];
    }
    
    return null;
  };

  const updateOrderStatus = async (orderId, newStatus, details = null) => {
    const orderToUpdate = orders.find(order => order.id === orderId);
    if (!orderToUpdate) return;

    let updatePayload = { status: newStatus };
    let toastMessage = '';

    if (newStatus === 'Confirmed') {
      toastMessage = `Order ${orderId} confirmed.`;
    } else if (newStatus === 'Partial Dispatch' && details) {
      // Update the items with new dispatched quantities
      const updatedItems = orderToUpdate.items.map(item => {
        const dispatchInfo = details.dispatchedItems.find(d => d.productId === item.productId);
        if (dispatchInfo) {
          return { 
            ...item, 
            dispatchedQuantity: (item.dispatchedQuantity || 0) + dispatchInfo.quantity 
          };
        }
        return item;
      });
      
      // Add the new dispatched items to the existing dispatched_items array
      const existingDispatchedItems = orderToUpdate.dispatched_items || [];
      const newDispatchedItems = [...existingDispatchedItems, ...details.dispatchedItems];

      // Update delivered_by array with transport name
      let deliveredByData = orderToUpdate.delivered_by || [];
      if (details.transportName && !deliveredByData.includes(details.transportName)) {
        deliveredByData = [...deliveredByData, details.transportName];
      }

      updatePayload = {
        ...updatePayload,
        items: updatedItems,
        dispatched_items: newDispatchedItems,
        delivered_by: deliveredByData,
        updated_at: new Date().toISOString()
      };
      toastMessage = `Order ${orderId} partially dispatched.`;
    } else if (newStatus === 'Full Dispatch') {
      // For full dispatch, mark all items as fully dispatched
      const fullyDispatchedItems = orderToUpdate.items.map(item => ({ 
        ...item, 
        dispatchedQuantity: item.quantity 
      }));

      // Add remaining items to dispatched_items if details provided
      let newDispatchedItems = orderToUpdate.dispatched_items || [];
      if (details && details.dispatchedItems) {
        newDispatchedItems = [...newDispatchedItems, ...details.dispatchedItems];
      }

      // Update delivered_by array with transport name
      let deliveredByData = orderToUpdate.delivered_by || [];
      if (details && details.transportName && !deliveredByData.includes(details.transportName)) {
        deliveredByData = [...deliveredByData, details.transportName];
      }

      updatePayload = { 
        ...updatePayload, 
        items: fullyDispatchedItems,
        dispatched_items: newDispatchedItems,
        delivered_by: deliveredByData,
        updated_at: new Date().toISOString()
      };
      toastMessage = `Order ${orderId} fully dispatched.`;
    } else if (newStatus === 'Delivered') {
      updatePayload.updated_at = new Date().toISOString();
      toastMessage = `Order ${orderId} marked as delivered.`;
    } else if (newStatus === 'Cancelled') {
      updatePayload.updated_at = new Date().toISOString();
      toastMessage = `Order ${orderId} cancelled.`;
    }

    // Update the order in database
    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select();

    if (error) {
      toast({ 
        title: 'Error Updating Order Status', 
        description: error.message, 
        variant: 'destructive' 
      });
      return;
    }

    if (data && data[0]) {
      setOrders(prevOrders => 
        prevOrders.map(order => (order.id === orderId ? data[0] : order))
      );
      toast({ 
        title: 'Order Status Updated', 
        description: toastMessage 
      });
    }
  };

  const updateOrderDetails = async (orderId, updatedDetails) => {
    const updateData = {
      customer_name: updatedDetails.customerName,
      city: updatedDetails.city,
      phone_number: updatedDetails.phoneNumber,
      delivery_location: updatedDetails.deliveryLocation,
      items: updatedDetails.items,
      updated_at: new Date().toISOString()
    };

    // Removed user restriction - any admin can update any order
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select();

    if (error) {
      toast({ 
        title: 'Error Updating Order Details', 
        description: error.message, 
        variant: 'destructive' 
      });
      return;
    }

    if (data && data[0]) {
      setOrders(prevOrders => 
        prevOrders.map(order => (order.id === orderId ? data[0] : order))
      );
      toast({ 
        title: 'Order Updated', 
        description: `Order ${orderId} details have been updated.` 
      });
    }
  };

  const deleteOrder = async (orderId) => {
    // Removed user restriction - any admin can delete any order
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      toast({ 
        title: 'Error Deleting Order', 
        description: error.message, 
        variant: 'destructive' 
      });
      return;
    }

    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    toast({ 
      title: 'Order Deleted', 
      description: `Order ${orderId} has been deleted.` 
    });
  };

  return { 
    orders, 
    setOrders, 
    loading,
    fetchOrders,
    addOrder, 
    updateOrderStatus, 
    updateOrderDetails,
    deleteOrder
  };
};

export default useOrders;