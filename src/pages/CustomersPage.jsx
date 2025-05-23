import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, User, Eye, Edit, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import CustomerForm from '@/components/forms/CustomerForm';
import { useToast } from '@/components/ui/use-toast';
import { customerService } from '@/lib/customerService';

const CustomersPage = () => {
  const { orders } = useAppContext();
  const { toast } = useToast();
  
  // State management
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [deleteCustomerId, setDeleteCustomerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await customerService.getAllCustomers();
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load customers.',
          variant: 'destructive'
        });
      } else {
        setCustomers(data || []);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const handleAddCustomer = async (customerData) => {
    setActionLoading(true);
    try {
      const { data, error } = await customerService.createCustomer(customerData);
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to add customer.',
          variant: 'destructive'
        });
      } else {
        setCustomers(prev => [data, ...prev]);
        setIsAddDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Customer added successfully.'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditCustomer = async (customerData) => {
    if (!selectedCustomer) return;
    
    setActionLoading(true);
    try {
      const { data, error } = await customerService.updateCustomer(selectedCustomer.id, customerData);
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update customer.',
          variant: 'destructive'
        });
      } else {
        setCustomers(prev => prev.map(customer => 
          customer.id === selectedCustomer.id ? data : customer
        ));
        setIsEditDialogOpen(false);
        setSelectedCustomer(null);
        toast({
          title: 'Success',
          description: 'Customer updated successfully.'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteCustomerId) return;

    setActionLoading(true);
    try {
      const { error } = await customerService.deleteCustomer(deleteCustomerId);
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete customer.',
          variant: 'destructive'
        });
      } else {
        setCustomers(prev => prev.filter(customer => customer.id !== deleteCustomerId));
        setDeleteCustomerId(null);
        toast({
          title: 'Success',
          description: 'Customer deleted successfully.'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  const toggleCustomerDetails = (customerId) => {
    setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId);
  };

  const openEditDialog = (customer) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const getCustomerOrders = (customerId) => {
    return orders.filter(order => order.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading customers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <CustomerForm 
              onSubmit={handleAddCustomer} 
              onCancel={() => setIsAddDialogOpen(false)}
              loading={actionLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers by name, city, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredCustomers.length > 0 ? (
        <motion.div 
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {filteredCustomers.map(customer => (
              <motion.div key={customer.id} variants={itemVariants} layout>
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div 
                      className="flex items-center space-x-3 cursor-pointer flex-1"
                      onClick={() => toggleCustomerDetails(customer.id)}
                    >
                      <div className="p-2 rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.city} - {customer.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openEditDialog(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {customer.name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                setDeleteCustomerId(customer.id);
                                handleDeleteCustomer();
                              }}
                              disabled={actionLoading}
                            >
                              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => toggleCustomerDetails(customer.id)}
                      >
                        {expandedCustomerId === customer.id ? 
                          <ChevronUp className="h-5 w-5" /> : 
                          <ChevronDown className="h-5 w-5" />
                        }
                      </Button>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedCustomerId === customer.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="border-t"
                      >
                        <CardContent className="p-4">
                          <h3 className="text-md font-semibold mb-2">Order History</h3>
                          {getCustomerOrders(customer.id).length > 0 ? (
                            <ul className="space-y-2 max-h-60 overflow-y-auto">
                              {getCustomerOrders(customer.id).map(order => (
                                <li key={order.id} className="p-2 border rounded-md text-sm">
                                  <div className="flex justify-between">
                                    <span>Order ID: {order.id.substring(0,8)}...</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                                      order.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 
                                      order.status === 'Unconfirmed' ? 'bg-yellow-100 text-yellow-700' : 
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {order.status}
                                    </span>
                                  </div>
                                  <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                                  <p>Items: {order.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">No orders found for this customer.</p>
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
          <User className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">No customers found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm ? "Try adjusting your search." : "Get started by adding a new customer."}
          </p>
        </div>
      )}

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm 
            customer={selectedCustomer}
            onSubmit={handleEditCustomer} 
            onCancel={() => {
              setIsEditDialogOpen(false);
              setSelectedCustomer(null);
            }}
            loading={actionLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersPage;