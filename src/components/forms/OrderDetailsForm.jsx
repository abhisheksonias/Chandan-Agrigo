import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const OrderDetailsForm = ({ order, onSubmit, onCancel }) => {
  const { products } = useAppContext();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customerName: '',
    city: '',
    phoneNumber: '',
    deliveryLocation: '',
    items: [],
  });

  useEffect(() => {
    if (order) {
      setFormData({
        customerName: order.customerName || '',
        city: order.city || '',
        phoneNumber: order.phoneNumber || '',
        deliveryLocation: order.deliveryLocation || '',
        items: order.items ? JSON.parse(JSON.stringify(order.items)) : [], // Deep copy
      });
    }
  }, [order]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      newItems[index].unit = product ? product.unit : '';
      newItems[index].productName = product ? product.name : '';
    } else if (field === 'quantity') {
        newItems[index][field] = parseInt(value, 10) || 0;
    }
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', productName: '', quantity: 1, unit: '' }]
    }));
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.items.some(item => !item.productId || item.quantity <= 0)) {
      toast({ title: 'Error', description: 'Please ensure all order items are valid.', variant: 'destructive' });
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <Label htmlFor="customerName">Customer Name</Label>
        <Input id="customerName" name="customerName" value={formData.customerName} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="city">City</Label>
        <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="deliveryLocation">Delivery Location</Label>
        <Textarea id="deliveryLocation" name="deliveryLocation" value={formData.deliveryLocation} onChange={handleChange} required />
      </div>

      <div className="space-y-2 pt-2">
        <h3 className="text-md font-semibold">Order Items</h3>
        {formData.items.map((item, index) => (
          <div key={index} className="flex flex-col md:flex-row gap-2 items-end p-2 border rounded-md">
            <div className="flex-grow">
              <Label htmlFor={`product-${index}`}>Product</Label>
              <Select value={item.productId} onValueChange={(value) => handleItemChange(index, 'productId', value)}>
                <SelectTrigger id={`product-${index}`}>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id} disabled={product.stock <=0 && product.id !== item.productId}>
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
            {formData.items.length > 1 && (
              <Button type="button" variant="destructive" size="icon" onClick={() => removeItem(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addItem} className="mt-2">
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-background py-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Update Order</Button>
      </div>
    </form>
  );
};

export default OrderDetailsForm;