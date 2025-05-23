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
    items: [{ productId: '', quantity: 1 }],
  });

  // Initialize form data when order prop changes
  useEffect(() => {
    if (order) {
      setFormData({
        customerName: order.customer_name || '',
        city: order.city || '',
        phoneNumber: order.phone_number || '',
        deliveryLocation: order.delivery_location || '',
        items: order.items && order.items.length > 0 
          ? JSON.parse(JSON.stringify(order.items)) 
          : [{ productId: '', quantity: 1 }],
      });
    }
  }, [order]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    
    if (field === 'quantity') {
      newItems[index][field] = parseInt(value, 10) || 1;
    } else if (field === 'productId') {
      const product = products.find(p => p.id === value);
      newItems[index] = {
        ...newItems[index],
        productId: value,
        unit: product ? product.unit : '',
        productName: product ? product.name : ''
      };
    } else {
      newItems[index][field] = value;
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  const validateForm = () => {
    if (!formData.customerName.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Customer name is required.', 
        variant: 'destructive' 
      });
      return false;
    }

    if (!formData.city.trim()) {
      toast({ 
        title: 'Error', 
        description: 'City is required.', 
        variant: 'destructive' 
      });
      return false;
    }

    if (!formData.phoneNumber.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Phone number is required.', 
        variant: 'destructive' 
      });
      return false;
    }

    if (!formData.deliveryLocation.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Delivery location is required.', 
        variant: 'destructive' 
      });
      return false;
    }

    if (formData.items.some(item => !item.productId || item.quantity <= 0)) {
      toast({ 
        title: 'Error', 
        description: 'Please ensure all order items have valid products and quantities.', 
        variant: 'destructive' 
      });
      return false;
    }

    // Check stock availability for new items or increased quantities
    for (const item of formData.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        // Get original item quantity for comparison
        const originalItem = order?.items?.find(origItem => origItem.productId === item.productId);
        const originalQuantity = originalItem ? originalItem.quantity : 0;
        const dispatchedQuantity = originalItem ? (originalItem.dispatchedQuantity || 0) : 0;
        
        // Calculate the difference in quantity needed
        const quantityDifference = item.quantity - originalQuantity;
        
        // Only check stock if we're increasing the quantity
        if (quantityDifference > 0 && product.stock < quantityDifference) {
          toast({ 
            title: 'Error', 
            description: `Insufficient stock for ${product.name}. Available: ${product.stock}, Additional needed: ${quantityDifference}`, 
            variant: 'destructive' 
          });
          return false;
        }

        // Ensure we don't reduce quantity below already dispatched amount
        if (item.quantity < dispatchedQuantity) {
          toast({ 
            title: 'Error', 
            description: `Cannot reduce quantity for ${product.name} below dispatched amount (${dispatchedQuantity})`, 
            variant: 'destructive' 
          });
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Prepare the data in the same format as expected by updateOrderDetails
    const updatedDetails = {
      customerName: formData.customerName,
      city: formData.city,
      phoneNumber: formData.phoneNumber,
      deliveryLocation: formData.deliveryLocation,
      items: formData.items.map(item => ({
        productId: item.productId,
        productName: products.find(p => p.id === item.productId)?.name,
        quantity: item.quantity,
        unit: products.find(p => p.id === item.productId)?.unit,
        dispatchedQuantity: item.dispatchedQuantity || 0
      })),
    };

    onSubmit(updatedDetails);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* Customer Information Section */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customerName">Customer Name *</Label>
            <Input 
              id="customerName" 
              name="customerName" 
              value={formData.customerName} 
              onChange={handleChange} 
              required 
              placeholder="Enter customer name"
            />
          </div>
          <div>
            <Label htmlFor="city">City *</Label>
            <Input 
              id="city" 
              name="city" 
              value={formData.city} 
              onChange={handleChange} 
              required 
              placeholder="Enter city"
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input 
              id="phoneNumber" 
              name="phoneNumber" 
              type="tel" 
              value={formData.phoneNumber} 
              onChange={handleChange} 
              required 
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <Label htmlFor="deliveryLocation">Delivery Location *</Label>
            <Textarea 
              id="deliveryLocation" 
              name="deliveryLocation" 
              value={formData.deliveryLocation} 
              onChange={handleChange} 
              required 
              placeholder="Enter delivery location"
            />
          </div>
        </div>
      </div>

      {/* Order Items Section */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">Order Items</h3>
        {formData.items.map((item, index) => {
          const originalItem = order?.items?.find(origItem => origItem.productId === item.productId);
          const dispatchedQuantity = originalItem ? (originalItem.dispatchedQuantity || 0) : 0;
          
          return (
            <div key={index} className="flex flex-col md:flex-row gap-4 items-end p-3 border rounded-md bg-muted/50">
              <div className="flex-grow">
                <Label htmlFor={`product-${index}`}>Product *</Label>
                <Select value={item.productId} onValueChange={(value) => handleItemChange(index, 'productId', value)}>
                  <SelectTrigger id={`product-${index}`}>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem 
                        key={product.id} 
                        value={product.id} 
                        disabled={product.stock <= 0 && product.id !== item.productId}
                      >
                        {product.name} ({product.unit}) - Stock: {product.stock}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-1/4">
                <Label htmlFor={`quantity-${index}`}>
                  Quantity * {dispatchedQuantity > 0 && `(Min: ${dispatchedQuantity})`}
                </Label>
                <Input
                  id={`quantity-${index}`}
                  type="number"
                  min={dispatchedQuantity || 1}
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  required
                  placeholder="1"
                />
                {dispatchedQuantity > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Dispatched: {dispatchedQuantity}
                  </p>
                )}
              </div>
              {formData.items.length > 1 && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="icon" 
                  onClick={() => removeItem(index)}
                  disabled={dispatchedQuantity > 0} // Prevent removal of dispatched items
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
        <Button type="button" variant="outline" onClick={addItem} className="mt-2">
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-background py-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="min-w-[120px]">
          Update Order
        </Button>
      </div>
    </form>
  );
};

export default OrderDetailsForm;