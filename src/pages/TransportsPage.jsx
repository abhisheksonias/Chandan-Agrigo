import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Truck, Edit, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import TransportForm from '@/components/forms/TransportForm';
import { useToast } from '@/components/ui/use-toast';
import { transportService } from '@/lib/transportService';

// Animation variants - moved outside component to prevent recreation
const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  },
  expandedContent: {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto' },
    exit: { opacity: 0, height: 0 }
  }
};

// Constants
const SEARCH_DEBOUNCE_DELAY = 300;
const EMPTY_STATE_MESSAGES = {
  noResults: "Try adjusting your search.",
  noTransports: "Get started by adding a new transport company."
};

const TransportsPage = () => {
  const { toast } = useToast();
  
  // State management - grouped for better organization
  const [transports, setTransports] = useState([]);
  const [transportOrders, setTransportOrders] = useState(new Map());
  const [loadingStates, setLoadingStates] = useState({
    main: false,
    orders: new Set()
  });
  
  // Search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Dialog states - consolidated
  const [dialogs, setDialogs] = useState({
    add: false,
    edit: false,
    delete: false
  });
  
  // Selected transport and expanded state
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [expandedTransportId, setExpandedTransportId] = useState(null);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, SEARCH_DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Memoized filtered transports
  const filteredTransports = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return transports;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return transports.filter(transport =>
      transport.name.toLowerCase().includes(searchLower) ||
      transport.address.toLowerCase().includes(searchLower)
    );
  }, [transports, debouncedSearchTerm]);

  // Load transports on mount
  useEffect(() => {
    loadTransports();
  }, []);

  // Utility functions for loading states
  const setMainLoading = useCallback((loading) => {
    setLoadingStates(prev => ({ ...prev, main: loading }));
  }, []);

  const setOrderLoading = useCallback((transportId, loading) => {
    setLoadingStates(prev => ({
      ...prev,
      orders: loading 
        ? new Set(prev.orders).add(transportId)
        : new Set([...prev.orders].filter(id => id !== transportId))
    }));
  }, []);

  // Dialog management utilities
  const openDialog = useCallback((type, transport = null) => {
    setSelectedTransport(transport);
    setDialogs(prev => ({ ...prev, [type]: true }));
  }, []);

  const closeDialog = useCallback((type) => {
    setDialogs(prev => ({ ...prev, [type]: false }));
    if (type !== 'add') setSelectedTransport(null);
  }, []);

  // Error handling utility
  const handleError = useCallback((error, defaultMessage) => {
    const message = error?.message || defaultMessage;
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive'
    });
    console.error(error);
  }, [toast]);

  // Success message utility
  const showSuccess = useCallback((message) => {
    toast({
      title: 'Success',
      description: message
    });
  }, [toast]);

  // Load transports with optimized error handling
  const loadTransports = useCallback(async () => {
    setMainLoading(true);
    try {
      const { data, error } = await transportService.getAllTransports();
      
      if (error) {
        handleError(error, 'Failed to load transport companies');
        return;
      }
      
      setTransports(data || []);
    } catch (err) {
      handleError(err, 'An unexpected error occurred while loading transports');
    } finally {
      setMainLoading(false);
    }
  }, [handleError, setMainLoading]);

  // Load orders for specific transport with caching
  const loadTransportOrders = useCallback(async (transportId) => {
    // Return cached data if available
    if (transportOrders.has(transportId)) {
      return transportOrders.get(transportId);
    }

    setOrderLoading(transportId, true);
    try {
      const { data, error } = await transportService.getTransportOrders(transportId);
      
      if (error) {
        console.error('Error loading transport orders:', error);
        return [];
      }
      
      const orders = data || [];
      // Cache the results
      setTransportOrders(prev => new Map(prev).set(transportId, orders));
      return orders;
    } catch (err) {
      console.error('Unexpected error loading orders:', err);
      return [];
    } finally {
      setOrderLoading(transportId, false);
    }
  }, [transportOrders, setOrderLoading]);

  // CRUD operations with optimized error handling
  const handleAddTransport = useCallback(async (transportData) => {
    try {
      const { data, error } = await transportService.createTransport(transportData);
      
      if (error) {
        handleError(error, 'Failed to add transport company');
        return false;
      }

      showSuccess('Transport company added successfully');
      closeDialog('add');
      await loadTransports();
      return true;
    } catch (err) {
      handleError(err, 'An unexpected error occurred while adding transport');
      return false;
    }
  }, [handleError, showSuccess, closeDialog, loadTransports]);

  const handleEditTransport = useCallback(async (transportData) => {
    if (!selectedTransport) return false;

    try {
      const { data, error } = await transportService.updateTransport(
        selectedTransport.id, 
        transportData
      );
      
      if (error) {
        handleError(error, 'Failed to update transport company');
        return false;
      }

      showSuccess('Transport company updated successfully');
      closeDialog('edit');
      await loadTransports();
      return true;
    } catch (err) {
      handleError(err, 'An unexpected error occurred while updating transport');
      return false;
    }
  }, [selectedTransport, handleError, showSuccess, closeDialog, loadTransports]);

  const handleDeleteTransport = useCallback(async () => {
    if (!selectedTransport) return;

    try {
      const { error } = await transportService.deleteTransport(selectedTransport.id);
      
      if (error) {
        handleError(error, 'Failed to delete transport company');
        return;
      }

      showSuccess('Transport company deleted successfully');
      closeDialog('delete');
      
      // Clean up cached orders
      setTransportOrders(prev => {
        const newMap = new Map(prev);
        newMap.delete(selectedTransport.id);
        return newMap;
      });
      
      await loadTransports();
    } catch (err) {
      handleError(err, 'An unexpected error occurred while deleting transport');
    }
  }, [selectedTransport, handleError, showSuccess, closeDialog, loadTransports]);

  // Toggle transport details with improved state management
  const toggleTransportDetails = useCallback(async (transportId) => {
    if (expandedTransportId === transportId) {
      setExpandedTransportId(null);
      return;
    }

    setExpandedTransportId(transportId);
    await loadTransportOrders(transportId);
  }, [expandedTransportId, loadTransportOrders]);

  // Get orders for specific transport (memoized)
  const getTransportOrders = useCallback((transportId) => {
    return transportOrders.get(transportId) || [];
  }, [transportOrders]);

  // Render methods for better organization
  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
      <p className="text-muted-foreground">Loading transport companies...</p>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-10">
      <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-2 text-sm font-medium text-foreground">
        No transport companies found
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {searchTerm ? EMPTY_STATE_MESSAGES.noResults : EMPTY_STATE_MESSAGES.noTransports}
      </p>
      {!searchTerm && (
        <Button 
          className="mt-4" 
          variant="outline"
          onClick={() => openDialog('add')}
          disabled={loadingStates.main}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Your First Transport
        </Button>
      )}
    </div>
  );

  const renderTransportCard = (transport) => (
    <motion.div key={transport.id} variants={ANIMATION_VARIANTS.item} layout>
      <Card className="overflow-hidden">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleTransportDetails(transport.id)}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{transport.name}</p>
              <p className="text-sm text-muted-foreground">{transport.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => {
                e.stopPropagation();
                openDialog('edit', transport);
              }}
              disabled={loadingStates.main}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                openDialog('delete', transport);
              }}
              disabled={loadingStates.main}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              {expandedTransportId === transport.id ? 
                <ChevronUp className="h-5 w-5" /> : 
                <ChevronDown className="h-5 w-5" />
              }
            </Button>
          </div>
        </div>
        
        <AnimatePresence>
          {expandedTransportId === transport.id && (
            <motion.div
              variants={ANIMATION_VARIANTS.expandedContent}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-t"
            >
              <CardContent className="p-4">
                <h3 className="text-md font-semibold mb-2">Delivery History</h3>
                {loadingStates.orders.has(transport.id) ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading orders...</span>
                  </div>
                ) : getTransportOrders(transport.id).length > 0 ? (
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {getTransportOrders(transport.id).map(order => (
                      <li key={order.id} className="p-2 border rounded-md text-sm">
                        <div className="flex justify-between">
                          <span>Order ID: {order.id.substring(0,8)}...</span>
                          <span>To: {order.customer_name || 'N/A'}</span>
                        </div>
                        <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
                        <p>Status: <span className="capitalize">{order.status}</span></p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No delivery history found for this transport company.
                  </p>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transport Companies</h1>
          <p className="text-muted-foreground">Manage your transport company details.</p>
        </div>
        
        <Dialog open={dialogs.add} onOpenChange={(open) => open ? openDialog('add') : closeDialog('add')}>
          <DialogTrigger asChild>
            <Button disabled={loadingStates.main}>
              <Plus className="mr-2 h-4 w-4" /> Add Transport
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Transport Company</DialogTitle>
            </DialogHeader>
            <TransportForm 
              onSubmit={handleAddTransport} 
              onCancel={() => closeDialog('add')} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Section */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search transport by name or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
          disabled={loadingStates.main}
        />
      </div>

      {/* Dialogs */}
      <Dialog open={dialogs.edit} onOpenChange={(open) => open ? null : closeDialog('edit')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transport Company</DialogTitle>
          </DialogHeader>
          <TransportForm 
            transport={selectedTransport} 
            onSubmit={handleEditTransport} 
            onCancel={() => closeDialog('edit')} 
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={dialogs.delete} onOpenChange={(open) => open ? null : closeDialog('delete')}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the transport company
              {selectedTransport && <strong> "{selectedTransport.name}"</strong>}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => closeDialog('delete')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTransport} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Content Section */}
      {loadingStates.main ? (
        renderLoadingState()
      ) : filteredTransports.length > 0 ? (
        <motion.div 
          className="space-y-4"
          variants={ANIMATION_VARIANTS.container}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {filteredTransports.map(renderTransportCard)}
          </AnimatePresence>
        </motion.div>
      ) : (
        renderEmptyState()
      )}
    </div>
  );
};

export default TransportsPage;