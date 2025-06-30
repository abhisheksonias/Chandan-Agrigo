// Add this function to your AppContext.jsx or the appropriate service file

const reverseDispatch = async (order) => {
  try {
    // 1. Validate that the order can be reversed
    if (!order || (order.status !== "Full Dispatch" && order.status !== "Partial Dispatch")) {
      throw new Error("Order cannot be reversed - invalid status");
    }

    // 2. Prepare the inventory updates
    const inventoryUpdates = [];
    
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item.dispatchedQuantity && item.dispatchedQuantity > 0) {
          // Find the product to update its stock
          const productIndex = products.findIndex(p => p.id === item.productId);
          if (productIndex !== -1) {
            inventoryUpdates.push({
              productId: item.productId,
              quantityToRestore: item.dispatchedQuantity,
              currentStock: products[productIndex].stock
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
        // dispatch_date: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)
      .select()
      .single();

    if (orderError) {
      throw new Error(`Failed to update order: ${orderError.message}`);
    }

    // 4. Update inventory (restore stock)
    for (const update of inventoryUpdates) {
      const newStock = update.currentStock + update.quantityToRestore;
      
      const { error: stockError } = await supabase
        .from('products')
        .update({ 
          stock: newStock,
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

    // 6. Create an audit log entry (optional but recommended)
    // const { error: auditError } = await supabase
    //   .from('audit_logs')
    //   .insert({
    //     action: 'REVERSE_DISPATCH',
    //     order_id: order.id,
    //     details: {
    //       previous_status: order.status,
    //       restored_items: inventoryUpdates,
    //       reversed_by: session?.user?.email || 'system',
    //       reason: 'Manual reverse dispatch'
    //     },
    //     created_at: new Date().toISOString()
    //   });

    // // Don't throw error for audit log failure, just log it
    // if (auditError) {
    //   console.warn('Failed to create audit log:', auditError);
    // }

    // 7. Update local state
    setOrders(prevOrders => 
      prevOrders.map(o => 
        o.id === order.id 
          ? {
              ...o,
              status: 'Confirmed',
              dispatched_items: null,
            //   dispatch_date: null,
              items: resetItems,
              updated_at: new Date().toISOString()
            }
          : o
      )
    );

    // 8. Update products state to reflect new stock levels
    setProducts(prevProducts =>
      prevProducts.map(product => {
        const update = inventoryUpdates.find(u => u.productId === product.id);
        if (update) {
          return {
            ...product,
            stock: update.currentStock + update.quantityToRestore
          };
        }
        return product;
      })
    );

    // 9. Show success message
    toast({
      title: "Dispatch Reversed Successfully",
      description: `Order #${order.id} has been reversed. Inventory has been restored.`,
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

    throw error;
  }
};

// Add this to your context exports
export { reverseDispatch };
