import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Search, UserPlus } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import CustomerForm from '@/components/forms/CustomerForm';

const AddOrderPage = () => {
  const { customers, products, addOrder, addCustomer } = useAppContext();
  const { toast } = useToast();

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerDetails, setCustomerDetails] = useState({ name: '', city: '', phoneNumber: '', deliveryLocation: '' });
  const [orderItems, setOrderItems] = useState([{ productId: '', quantity: 1 }]);
  const [addedBy, setAddedBy] = useState('Admin'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        setCustomerDetails({
          name: customer.name,
          city: customer.city,
          phoneNumber: customer.phone,
          deliveryLocation: customer.deliveryLocation || '' 
        });
      }
    } else {
      setCustomerDetails({ name: '', city: '', phoneNumber: '', deliveryLocation: '' });
    }
  }, [selectedCustomerId, customers]);

  const handleCustomerDetailChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      newItems[index].unit = product ? product.unit : '';
      newItems[index].productName = product ? product.name : '';
    }
    setOrderItems(newItems);
  };

  const addItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: 1 }]);
  };

  const removeItem = (index) => {
    const newItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(newItems);
  };

  const handleAddNewCustomer = (newCustomerData) => {
    const newCustomer = addCustomer(newCustomerData);
    setSelectedCustomerId(newCustomer.id);
    setIsNewCustomerDialogOpen(false);
    toast({ title: 'Customer Added', description: `${newCustomer.name} added and selected for the order.` });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCustomerId && !customerDetails.name) {
      toast({ title: 'Error', description: 'Please select or add a customer.', variant: 'destructive' });
      return;
    }
    if (orderItems.some(item => !item.productId || item.quantity <= 0)) {
      toast({ title: 'Error', description: 'Please ensure all order items are valid.', variant: 'destructive' });
      return;
    }

    const orderData = {
      customerId: selectedCustomerId,
      customerName: customerDetails.name,
      city: customerDetails.city,
      phoneNumber: customerDetails.phoneNumber,
      deliveryLocation: customerDetails.deliveryLocation,
      addedBy,
      items: orderItems.map(item => ({
        productId: item.productId,
        productName: products.find(p => p.id === item.productId)?.name,
        quantity: parseInt(item.quantity, 10),
        unit: products.find(p => p.id === item.productId)?.unit,
      })),
    };
    addOrder(orderData);
    // Reset form
    setSelectedCustomerId('');
    setCustomerDetails({ name: '', city: '', phoneNumber: '', deliveryLocation: '' });
    setOrderItems([{ productId: '', quantity: 1 }]);
    setSearchTerm('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Order</CardTitle>
          <CardDescription>Fill in the details to create a new order.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-4 p-4 border rounded-lg">
              <h2 className="text-lg font-semibold">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-search">Select Existing Customer</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger id="customer-search">
                      <SelectValue placeholder="Search or select a customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <Input 
                          placeholder="Search customers..." 
                          value={searchTerm} 
                          onChange={(e) => setSearchTerm(e.target.value)} 
                          className="mb-2"
                        />
                      </div>
                      {filteredCustomers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.city})
                        </SelectItem>
                      ))}
                      {filteredCustomers.length === 0 && <p className="p-2 text-sm text-muted-foreground">No customers found.</p>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Dialog open={isNewCustomerDialogOpen} onOpenChange={setIsNewCustomerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" className="w-full md:w-auto">
                        <UserPlus className="mr-2 h-4 w-4" /> Add New Customer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                      </DialogHeader>
                      <CustomerForm onSubmit={handleAddNewCustomer} onCancel={() => setIsNewCustomerDialogOpen(false)} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input id="customerName" name="name" value={customerDetails.name} onChange={handleCustomerDetailChange} required disabled={!!selectedCustomerId} />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" value={customerDetails.city} onChange={handleCustomerDetailChange} required disabled={!!selectedCustomerId} />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input id="phoneNumber" name="phoneNumber" type="tel" value={customerDetails.phoneNumber} onChange={handleCustomerDetailChange} required disabled={!!selectedCustomerId} />
                </div>
                <div>
                  <Label htmlFor="deliveryLocation">Delivery Location</Label>
                  <Input id="deliveryLocation" name="deliveryLocation" value={customerDetails.deliveryLocation} onChange={handleCustomerDetailChange} required />
                </div>
              </div>
            </section>

            <section className="space-y-4 p-4 border rounded-lg">
              <h2 className="text-lg font-semibold">Order Items</h2>
              {orderItems.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-4 items-end p-3 border rounded-md bg-muted/50">
                  <div className="flex-grow">
                    <Label htmlFor={`product-${index}`}>Product</Label>
                    <Select value={item.productId} onValueChange={(value) => handleItemChange(index, 'productId', value)}>
                      <SelectTrigger id={`product-${index}`}>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id} disabled={product.stock <= 0}>
                            {product.name} ({product.unit}) - Stock: {product.stock}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      required
                    />
                  </div>
                  {orderItems.length > 1 && (
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeItem(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </section>

            <section className="space-y-4 p-4 border rounded-lg">
              <h2 className="text-lg font-semibold">Order Summary</h2>
              <div>
                <Label htmlFor="addedBy">Added By</Label>
                <Input id="addedBy" value={addedBy} onChange={(e) => setAddedBy(e.target.value)} readOnly disabled />
              </div>
            </section>

            <div className="flex justify-end">
              <Button type="submit" size="lg">Create Order</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AddOrderPage;