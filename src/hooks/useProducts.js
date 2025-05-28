import { useState } from 'react';

const useProducts = (supabase, toast, session) => {
  const [products, setProducts] = useState([]);

  const generateSku = (productName) => {
    const prefix = productName.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `SKU-${prefix}-${randomNum}`;
  };

  const addProduct = async (productData) => {
    if (!session) return null;
    const newProduct = {
      ...productData,
      id: `prod_${crypto.randomUUID()}`,
      sku: productData.sku || generateSku(productData.name),
      stock: parseInt(productData.stock, 10) || 0,
      stock_history: [{ date: new Date().toISOString(), quantity: parseInt(productData.stock, 10) || 0, type: 'initial' }]
    };
    const { data, error } = await supabase.from('products').insert(newProduct).select();
    if (error) {
      toast({ title: 'Error Adding Product', description: error.message, variant: 'destructive' });
      return null;
    }
    if (data) {
      setProducts(prev => [...prev, data[0]]);
      toast({ title: 'Product Added', description: `${data[0].name} has been added.` });
      return data[0];
    }
    return null;
  };

  const updateProduct = async (productId, productData) => {
    if (!session) return null;
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId)
      .select();
    if (error) {
      toast({ title: 'Error Updating Product', description: error.message, variant: 'destructive' });
      return null;
    }
    if (data) {
      setProducts(prev => prev.map(p => (p.id === productId ? data[0] : p)));
      toast({ title: 'Product Updated', description: `${data[0].name} has been updated.` });
      return data[0];
    }
    return null;
  };

  const deleteProduct = async (productId) => {
    if (!session) return false;
    const productToDelete = products.find(p => p.id === productId);
    if (productToDelete && productToDelete.image) {
      // Extract the file name from the image URL (handles various Supabase URL formats)
      let fileName = '';
      if (productToDelete.image.includes('/productimages/')) {
        // For URLs like: .../productimages/filename.jpg
        fileName = productToDelete.image.split('/productimages/')[1];
      } else if (productToDelete.image.includes('/storage/v1/object/public/productimages/')) {
        // For URLs like: .../storage/v1/object/public/productimages/filename.jpg
        fileName = productToDelete.image.split('/storage/v1/object/public/productimages/')[1];
      } else {
        // Fallback: last segment after '/'
        fileName = productToDelete.image.split('/').pop();
      }
      if (fileName && fileName.trim() !== '') {
        try {
          await supabase.storage.from('productimages').remove([fileName]);
        } catch (storageError) {
          toast({ title: 'Storage Error', description: `Could not delete image: ${storageError.message}`, variant: 'warning' });
        }
      }
    }
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      toast({ title: 'Error Deleting Product', description: error.message, variant: 'destructive' });
      return false;
    }
    setProducts(prev => prev.filter(p => p.id !== productId));
    toast({ title: 'Product Deleted', description: `Product and its image have been deleted.` });
    return true;
  };

  const updateProductStock = async (productId, newStock, type = 'manual update', orderId = null, showToast = true) => {
    if (!session) return false;
    
    try {
      const product = products.find(p => p.id === productId);
      if (!product) {
        if (showToast) {
          toast({ title: 'Error', description: 'Product not found.', variant: 'destructive' });
        }
        return false;
      }

      // Ensure newStock is a number and not negative
      const stockValue = Math.max(0, parseInt(newStock, 10) || 0);
      
      // Create stock history entry with additional context
      const historyEntry = {
        date: new Date().toISOString(),
        quantity: stockValue,
        type: type,
        previous_stock: product.stock || 0,
        change: stockValue - (product.stock || 0)
      };

      // Add order reference if provided
      if (orderId) {
        historyEntry.order_id = orderId;
      }

      const updatedStockHistory = [...(product.stock_history || []), historyEntry];
      
      const { data, error } = await supabase
        .from('products')
        .update({ 
          stock: stockValue, 
          stock_history: updatedStockHistory,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select();

      if (error) {
        console.error('Stock update error:', error);
        if (showToast) {
          toast({ title: 'Error Updating Stock', description: error.message, variant: 'destructive' });
        }
        return false;
      }

      if (data && data[0]) {
        // Update local state immediately
        setProducts(prevProducts => prevProducts.map(p => (p.id === productId ? data[0] : p)));
        
        if (showToast) {
          const changeText = historyEntry.change > 0 ? `increased by ${historyEntry.change}` : 
                            historyEntry.change < 0 ? `decreased by ${Math.abs(historyEntry.change)}` : 'updated';
          toast({ 
            title: 'Stock Updated', 
            description: `Stock for ${data[0].name} ${changeText}. New stock: ${stockValue}.` 
          });
        }
        
        return true;
      }
    } catch (error) {
      console.error('Stock update error:', error);
      if (showToast) {
        toast({ title: 'Error', description: 'Failed to update stock. Please try again.', variant: 'destructive' });
      }
      return false;
    }
    
    return false;
  };

  // Batch stock update function for multiple products (useful for order confirmation)
  const updateMultipleProductsStock = async (stockUpdates, type = 'order confirmation', orderId = null) => {
    if (!session || !Array.isArray(stockUpdates) || stockUpdates.length === 0) return false;

    try {
      const updatePromises = stockUpdates.map(async ({ productId, newStock }) => {
        return updateProductStock(productId, newStock, type, orderId, false); // Don't show individual toasts
      });

      const results = await Promise.all(updatePromises);
      const successCount = results.filter(result => result === true).length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        toast({ 
          title: 'Stock Updated', 
          description: `Successfully updated stock for ${successCount} product${successCount !== 1 ? 's' : ''}${failureCount > 0 ? `. ${failureCount} failed.` : '.'}`,
          variant: failureCount > 0 ? 'warning' : 'default'
        });
      }

      if (failureCount > 0 && successCount === 0) {
        toast({ 
          title: 'Stock Update Failed', 
          description: `Failed to update stock for ${failureCount} product${failureCount !== 1 ? 's' : ''}.`,
          variant: 'destructive'
        });
      }

      return failureCount === 0; // Return true only if all updates succeeded
    } catch (error) {
      console.error('Batch stock update error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update product stocks. Please try again.',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Helper function to check stock availability for multiple products
  const checkStockAvailability = (itemsToCheck) => {
    if (!Array.isArray(itemsToCheck)) return { available: false, errors: ['Invalid items provided'] };
    
    const errors = [];
    
    for (const item of itemsToCheck) {
      const product = products.find(p => p.id === item.productId);
      
      if (!product) {
        errors.push(`Product not found: ${item.productName || item.productId}`);
        continue;
      }

      const currentStock = product.stock || 0;
      const requestedQuantity = parseInt(item.quantity, 10) || 0;

      if (currentStock < requestedQuantity) {
        errors.push(`Insufficient stock for ${product.name}. Available: ${currentStock}, Requested: ${requestedQuantity}`);
      }
    }

    return {
      available: errors.length === 0,
      errors: errors
    };
  };

  // Helper function to calculate new stock values for order items
  const calculateStockUpdatesForOrder = (orderItems) => {
    if (!Array.isArray(orderItems)) return [];
    
    return orderItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return null;
      
      const currentStock = product.stock || 0;
      const quantityToDeduct = parseInt(item.quantity, 10) || 0;
      const newStock = Math.max(0, currentStock - quantityToDeduct);
      
      return {
        productId: item.productId,
        productName: product.name,
        currentStock,
        quantityToDeduct,
        newStock
      };
    }).filter(update => update !== null);
  };

  return { 
    products, 
    setProducts, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    updateProductStock, 
    updateMultipleProductsStock,
    checkStockAvailability,
    calculateStockUpdatesForOrder,
    generateSku 
  };
};

export default useProducts;