import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Package, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ProductForm from '@/components/forms/ProductForm';
import StockAdjustmentForm from '@/components/forms/StockAdjustmentForm';

const ProductsPage = () => {
  const { products, addProduct, updateProduct, deleteProduct, updateProductStock, isLoadingData } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStockUpdateDialogOpen, setIsStockUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [productToUpdateStock, setProductToUpdateStock] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [expandedProductId, setExpandedProductId] = useState(null);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.unit && product.unit.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleFormSubmit = async (productData) => {
    if (productToEdit) {
      await updateProduct(productToEdit.id, productData);
    } else {
      await addProduct(productData);
    }
    setIsFormOpen(false);
    setProductToEdit(null);
  };

  const openEditForm = (product) => {
    setProductToEdit(product);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete.id);
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleOpenStockUpdate = (product) => {
    setProductToUpdateStock(product);
    setIsStockUpdateDialogOpen(true);
  };

  // Enhanced stock adjustment handler
  const handleStockAdjustment = async (quantityChange, reason) => {
    if (productToUpdateStock) {
      try {
        // Calculate new stock level
        const newStock = productToUpdateStock.stock + quantityChange;
        
        // Determine the update type based on quantity change
        const updateType = quantityChange > 0 ? 'add' : 'remove';
        
        // Update the stock using your existing context method
        // Assuming updateProductStock expects (productId, newStock, updateType, quantityChanged, reason)
        await updateProductStock(
          productToUpdateStock.id, 
          newStock, 
          updateType, 
          Math.abs(quantityChange),
          reason
        );
        
        // Close dialog and reset state
        setIsStockUpdateDialogOpen(false);
        setProductToUpdateStock(null);
        
        // Optional: Show success message
        console.log(`Stock updated successfully: ${quantityChange > 0 ? 'Added' : 'Removed'} ${Math.abs(quantityChange)} units`);
        
      } catch (error) {
        console.error('Error updating stock:', error);
        // Handle error (you might want to show a toast notification)
      }
    }
  };
  
  const toggleProductDetails = (productId) => {
    setExpandedProductId(expandedProductId === productId ? null : productId);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Delete stock history for a product
  const handleDeleteStockHistory = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if (!window.confirm('Are you sure you want to delete the entire stock history for this product? This action cannot be undone.')) return;
    // Remove stock_history from the product and update
    updateProduct(productId, { ...product, stock_history: [] });
  };

  if (isLoadingData) {
    return <div className="text-center py-10">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory and stock.</p>
        </div>
        <Button onClick={() => { setProductToEdit(null); setIsFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
        setIsFormOpen(isOpen);
        if (!isOpen) setProductToEdit(null);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{productToEdit ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <ProductForm 
            product={productToEdit} 
            onSubmit={handleFormSubmit} 
            onCancel={() => { setIsFormOpen(false); setProductToEdit(null); }} 
          />
        </DialogContent>
      </Dialog>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products by name, SKU, or unit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredProducts.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {filteredProducts.map(product => (
              <motion.div key={product.id} variants={itemVariants} layout>
                <Card className="overflow-hidden h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{product.name}</CardTitle>
                        <CardDescription>SKU: {product.sku} | Unit: {product.unit}</CardDescription>
                      </div>
                      <div className="p-2 rounded-full bg-primary/10">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    {product.image ? (
                      <div className="mt-4 h-40 w-full rounded-md overflow-hidden bg-muted">
                        <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
                      </div>
                    ) : (
                       <div className="mt-4 h-40 w-full rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        <Package className="h-16 w-16 text-muted-foreground" />
                       </div>
                    )}
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-2xl font-bold">Stock: {product.stock}</p>
                  </CardContent>
                  <CardFooter className="flex-col items-start space-y-2 border-t pt-4">
                    <div className="flex justify-between w-full items-center">
                       <Button variant="outline" size="sm" onClick={() => handleOpenStockUpdate(product)}>
                        <Edit className="mr-2 h-4 w-4" /> Adjust Stock
                      </Button>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditForm(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog(product)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => toggleProductDetails(product.id)}>
                          {expandedProductId === product.id ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
                          Stock History
                      </Button>
                      {expandedProductId === product.id && product.stock_history && (
                        <Button
                          variant="destructive"
                          size="xs"
                          className="ml-2"
                          onClick={() => handleDeleteStockHistory(product.id)}
                        >
                          Clear History
                        </Button>
                      )}
                    </div>
                    <AnimatePresence>
                      {expandedProductId === product.id && product.stock_history && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="w-full pt-2"
                        >
                          <div className="p-2 border rounded-md max-h-40 overflow-y-auto bg-muted/50">
                            <h4 className="text-sm font-semibold mb-1">Stock History:</h4>
                            {product.stock_history.length > 0 ? (
                              <ul className="space-y-1 text-xs">
                                {product.stock_history.slice().reverse().map((entry, index) => (
                                  <li key={index} className="flex justify-between">
                                    <span>{new Date(entry.date).toLocaleDateString()}</span>
                                    <span>Qty: {entry.quantity}</span>
                                    <span className="capitalize">{entry.type}</span>
                                    {entry.reason && <span className="text-muted-foreground">({entry.reason})</span>}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-muted-foreground">No stock history.</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="text-center py-10">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">No products found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm ? "Try adjusting your search." : "Get started by adding a new product."}
          </p>
        </div>
      )}

      {/* Enhanced Stock Adjustment Dialog */}
      <Dialog open={isStockUpdateDialogOpen} onOpenChange={setIsStockUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>
          {productToUpdateStock && (
            <StockAdjustmentForm 
              product={{
                ...productToUpdateStock,
                quantity: productToUpdateStock.stock // Map stock to quantity for form compatibility
              }}
              onSubmit={handleStockAdjustment}
              onCancel={() => {
                setIsStockUpdateDialogOpen(false);
                setProductToUpdateStock(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product "{productToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductsPage;