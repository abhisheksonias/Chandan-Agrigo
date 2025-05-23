import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Truck, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import TransportForm from '@/components/forms/TransportForm';

const TransportsPage = () => {
  const { transports, orders, addTransport, updateTransport, deleteTransport, isLoadingData } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transportToEdit, setTransportToEdit] = useState(null);
  const [transportToDelete, setTransportToDelete] = useState(null);
  const [expandedTransportId, setExpandedTransportId] = useState(null);

  const filteredTransports = transports.filter(transport =>
    transport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transport.address && transport.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleFormSubmit = async (transportData) => {
    if (transportToEdit) {
      await updateTransport(transportToEdit.id, transportData);
    } else {
      await addTransport(transportData);
    }
    setIsFormOpen(false);
    setTransportToEdit(null);
  };

  const openEditForm = (transport) => {
    setTransportToEdit(transport);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (transport) => {
    setTransportToDelete(transport);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (transportToDelete) {
      await deleteTransport(transportToDelete.id);
      setIsDeleteDialogOpen(false);
      setTransportToDelete(null);
    }
  };
  
  const toggleTransportDetails = (transportId) => {
    setExpandedTransportId(expandedTransportId === transportId ? null : transportId);
  };

  const getTransportOrders = (transportId) => {
    return orders.filter(order => order.transport_id === transportId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

   if (isLoadingData) {
    return <div className="text-center py-10">Loading transport providers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transport Providers</h1>
          <p className="text-muted-foreground">Manage your transport company details.</p>
        </div>
         <Button onClick={() => { setTransportToEdit(null); setIsFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Transport
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
        setIsFormOpen(isOpen);
        if (!isOpen) setTransportToEdit(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{transportToEdit ? 'Edit Transport Provider' : 'Add New Transport Provider'}</DialogTitle>
          </DialogHeader>
          <TransportForm 
            transport={transportToEdit} 
            onSubmit={handleFormSubmit} 
            onCancel={() => { setIsFormOpen(false); setTransportToEdit(null); }} 
          />
        </DialogContent>
      </Dialog>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search transport by name or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredTransports.length > 0 ? (
        <motion.div 
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {filteredTransports.map(transport => (
              <motion.div key={transport.id} variants={itemVariants} layout>
                <Card className="overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-4 hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-3 flex-grow cursor-pointer" onClick={() => toggleTransportDetails(transport.id)}>
                      <div className="p-2 rounded-full bg-primary/10">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{transport.name}</p>
                        <p className="text-sm text-muted-foreground">{transport.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                       <Button variant="ghost" size="icon" onClick={() => openEditForm(transport)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog(transport)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                       <Button variant="ghost" size="icon" onClick={() => toggleTransportDetails(transport.id)}>
                        {expandedTransportId === transport.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedTransportId === transport.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="border-t"
                      >
                        <CardContent className="p-4">
                          <h3 className="text-md font-semibold mb-2">Delivery History</h3>
                          {getTransportOrders(transport.id).length > 0 ? (
                            <ul className="space-y-2 max-h-60 overflow-y-auto">
                              {getTransportOrders(transport.id).map(order => (
                                <li key={order.id} className="p-2 border rounded-md text-sm bg-background">
                                  <div className="flex justify-between">
                                    <span>Order ID: {order.id.substring(0,8)}...</span>
                                    <span>To: {order.customer_name}</span>
                                  </div>
                                  <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
                                  <p>Status: {order.status}</p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">No delivery history found for this transport provider.</p>
                          )}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="text-center py-10">
          <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">No transport providers found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm ? "Try adjusting your search." : "Get started by adding a new transport provider."}
          </p>
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the transport provider "{transportToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTransportToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TransportsPage;