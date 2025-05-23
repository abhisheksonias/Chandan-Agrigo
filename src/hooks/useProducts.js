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
      const fileName = productToDelete.image.split('/').pop();
      try {
        await supabase.storage.from('productimages').remove([fileName]);
      } catch (storageError) {
        toast({ title: 'Storage Error', description: `Could not delete image: ${storageError.message}`, variant: 'warning' });
      }
    }
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      toast({ title: 'Error Deleting Product', description: error.message, variant: 'destructive' });
      return false;
    }
    setProducts(prev => prev.filter(p => p.id !== productId));
    toast({ title: 'Product Deleted', description: `Product has been deleted.` });
    return true;
  };

  const updateProductStock = async (productId, newStock, type = 'manual update') => {
    if (!session) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const updatedStockHistory = [...(product.stock_history || []), { date: new Date().toISOString(), quantity: newStock, type }];
    const { data, error } = await supabase
      .from('products')
      .update({ stock: newStock, stock_history: updatedStockHistory })
      .eq('id', productId)
      .select();

    if (error) {
      toast({ title: 'Error Updating Stock', description: error.message, variant: 'destructive' });
      return;
    }
    if (data) {
      setProducts(prevProducts => prevProducts.map(p => (p.id === productId ? data[0] : p)));
      toast({ title: 'Stock Updated', description: `Stock for ${data[0].name} updated to ${newStock}.` });
    }
  };

  return { products, setProducts, addProduct, updateProduct, deleteProduct, updateProductStock, generateSku };
};

export default useProducts;