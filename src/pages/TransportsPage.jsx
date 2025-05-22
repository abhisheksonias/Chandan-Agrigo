import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Truck, Eye, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import TransportForm from '@/components/forms/TransportForm';
import { useToast } from '@/components/ui/use-toast';

const TransportsPage = () => {
  const { transports, orders, addTransport } = useAppContext();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [expandedTransportId, setExpandedTransportId] = useState(null);

  const filteredTransports = transports.filter(transport =>
    transport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transport.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTransport = (transportData) => {
    addTransport(transportData);
    setIsAddDialogOpen(false);
  };
  
  const toggleTransportDetails = (transportId) => {
    setExpandedTransportId(expandedTransportId === transportId ? null : transportId);
  };

  const getTransportOrders = (transportId) => {
    // This assumes orders will have a transportId field.
    // For now, as it's not in the order model, this will return empty.
    // This needs to be updated when orders can be linked to transports.
    return orders.filter(order => order.transportId === transportId).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
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
          <h1 className="text-3xl font-bold tracking-tight">Transport Providers</h1>
          <p className="text-muted-foreground">Manage your transport company details.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Transport
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Transport Provider</DialogTitle>
            </DialogHeader>
            <TransportForm onSubmit={handleAddTransport} onCancel={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

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
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
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
                     <Button variant="ghost" size="icon">
                      {expandedTransportId === transport.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
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
                                <li key={order.id} className="p-2 border rounded-md text-sm">
                                  <div className="flex justify-between">
                                    <span>Order ID: {order.id.substring(0,8)}...</span>
                                    <span>To: {order.customerName}</span>
                                  </div>
                                  <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
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
    </div>
  );
};

export default TransportsPage;