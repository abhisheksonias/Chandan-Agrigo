import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const CustomerForm = ({ customer, onSubmit, onCancel }) => {
  const { toast } = useToast();
  const isEditing = !!customer;

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    phone: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        city: customer.city || '',
        phone: customer.phone || '',
      });
    }
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.city || !formData.phone) {
      toast({ title: 'Error', description: 'All fields are required.', variant: 'destructive' });
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Customer Name</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="city">City</Label>
        <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{isEditing ? 'Update Customer' : 'Add Customer'}</Button>
      </div>
    </form>
  );
};

export default CustomerForm;