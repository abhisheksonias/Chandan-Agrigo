
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  X,
  Package
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ProductCard from '@/components/ProductCard';
import ProductForm from '@/components/ProductForm';
import StockAdjustmentForm from '@/components/StockAdjustmentForm';

const Products = () => {
  const { 
    products, 
    categories, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    adjustStock,
    isLoading 
  } = useInventory();
  
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Filter and sort products
  useEffect(() => {
    let result = [...products];
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        product => 
          product.name.toLowerCase().includes(lowerSearchTerm) ||
          product.sku.toLowerCase().includes(lowerSearchTerm) ||
          product.description?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      result = result.filter(product => product.category === categoryFilter);
    }
    
    // Apply stock filter
    if (stockFilter === 'low') {
      result = result.filter(product => product.quantity <= product.reorderLevel);
    } else if (stockFilter === 'out') {
      result = result.filter(product => product.quantity <= 0);
    } else if (stockFilter === 'in') {
      result = result.filter(product => product.quantity > product.reorderLevel);
    }
    
    // Apply sorting
    const [sortField, sortDirection] = sortBy.split('-');
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'price') {
        comparison = a.price - b.price;
      } else if (sortField === 'quantity') {
        comparison = a.quantity - b.quantity;
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
    
    setFilteredProducts(result);
  }, [products, searchTerm, categoryFilter, stockFilter, sortBy]);
  
  const handleAddProduct = (productData) => {
    addProduct(productData);
    setIsAddDialogOpen(false);
  };
  
  const handleEditProduct = (productData) => {
    updateProduct(selectedProduct.id, productData);
    setIsEditDialogOpen(false);
    setSelectedProduct(null);
  };
  
  const handleDeleteProduct = () => {
    deleteProduct(selectedProduct.id);
    setIsDeleteDialogOpen(false);
    setSelectedProduct(null);
  };
  
  const handleAdjustStock = (quantity, reason) => {
    adjustStock(selectedProduct.id, quantity, reason);
    setIsStockDialogOpen(false);
    setSelectedProduct(null);
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStockFilter('');
    setSortBy('name-asc');
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your inventory products
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span>{categoryFilter || 'All Categories'}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <Package className="mr-2 h-4 w-4" />
                <span>
                  {stockFilter === 'low' 
                    ? 'Low Stock' 
                    : stockFilter === 'out' 
                      ? 'Out of Stock' 
                      : stockFilter === 'in' 
                        ? 'In Stock' 
                        : 'All Stock Levels'}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Stock Levels</SelectItem>
              <SelectItem value="in">In Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <span>Sort By</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="price-asc">Price (Low to High)</SelectItem>
              <SelectItem value="price-desc">Price (High to Low)</SelectItem>
              <SelectItem value="quantity-asc">Quantity (Low to High)</SelectItem>
              <SelectItem value="quantity-desc">Quantity (High to Low)</SelectItem>
              <SelectItem value="category-asc">Category (A-Z)</SelectItem>
            </SelectContent>
          </Select>
          
          {(searchTerm || categoryFilter || stockFilter || sortBy !== 'name-asc') && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredProducts.length > 0 ? (
        <motion.div 
          className="inventory-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={(product) => {
                  setSelectedProduct(product);
                  setIsEditDialogOpen(true);
                }}
                onDelete={(product) => {
                  setSelectedProduct(product);
                  setIsDeleteDialogOpen(true);
                }}
                onAdjustStock={(product) => {
                  setSelectedProduct(product);
                  setIsStockDialogOpen(true);
                }}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No products found</h3>
          <p className="text-muted-foreground mt-1">
            {searchTerm || categoryFilter || stockFilter
              ? "Try adjusting your filters or search term"
              : "Get started by adding your first product"}
          </p>
          {!(searchTerm || categoryFilter || stockFilter) && (
            <Button 
              className="mt-4" 
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          )}
        </div>
      )}
      
      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <ProductForm 
            onSubmit={handleAddProduct}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductForm 
              product={selectedProduct}
              onSubmit={handleEditProduct}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product 
              {selectedProduct ? ` "${selectedProduct.name}"` : ''} 
              from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Stock Adjustment Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <StockAdjustmentForm 
              product={selectedProduct}
              onSubmit={handleAdjustStock}
              onCancel={() => setIsStockDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
