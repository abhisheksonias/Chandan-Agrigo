import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Package, Edit, Trash2, Eye, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ProductForm from '@/components/forms/ProductForm';
import StockUpdateForm from '@/components/forms/StockUpdateForm';
import { useToast } from '@/components/ui/use-toast';

const ProductsPage = () => {
  const { products, addProduct, updateProductStock } = useAppContext();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isStockUpdateDialogOpen, setIsStockUpdateDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expandedProductId, setExpandedProductId] = useState(null);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = (productData) => {
    addProduct(productData);
    setIsAddDialogOpen(false);
  };

  const handleOpenStockUpdate = (product) => {
    setSelectedProduct(product);
    setIsStockUpdateDialogOpen(true);
  };

  const handleUpdateStock = (productId, newStock, type) => {
    updateProductStock(productId, newStock, type);
    setIsStockUpdateDialogOpen(false);
    setSelectedProduct(null);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory and stock.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <ProductForm onSubmit={handleAddProduct} onCancel={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

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
                    {product.image && (
                      <div className="mt-4 h-40 w-full rounded-md overflow-hidden">
                        <img-replace src={product.image} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-2xl font-bold">Stock: {product.stock}</p>
                  </CardContent>
                  <CardFooter className="flex-col items-start space-y-2 border-t pt-4">
                    <div className="flex justify-between w-full">
                       <Button variant="outline" size="sm" onClick={() => handleOpenStockUpdate(product)}>
                        <Edit className="mr-2 h-4 w-4" /> Update Stock
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleProductDetails(product.id)}>
                        {expandedProductId === product.id ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
                        Stock History
                      </Button>
                    </div>
                    <AnimatePresence>
                      {expandedProductId === product.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="w-full pt-2"
                        >
                          <div className="p-2 border rounded-md max-h-40 overflow-y-auto">
                            <h4 className="text-sm font-semibold mb-1">Stock History:</h4>
                            {product.stockHistory && product.stockHistory.length > 0 ? (
                              <ul className="space-y-1 text-xs">
                                {product.stockHistory.slice().reverse().map((entry, index) => (
                                  <li key={index} className="flex justify-between">
                                    <span>{new Date(entry.date).toLocaleDateString()}</span>
                                    <span>Qty: {entry.quantity}</span>
                                    <span className="capitalize">{entry.type}</span>
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

      <Dialog open={isStockUpdateDialogOpen} onOpenChange={setIsStockUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock for {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <StockUpdateForm 
              product={selectedProduct} 
              onSubmit={handleUpdateStock} 
              onCancel={() => setIsStockUpdateDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsPage;