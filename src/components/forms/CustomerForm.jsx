import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const CustomerForm = ({ customer, onSubmit, onCancel, loading = false }) => {
  const { toast } = useToast();
  const isEditing = !!customer;

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    phone: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        city: customer.city || '',
        phone: customer.phone || '',
      });
    } else {
      setFormData({
        name: '',
        city: '',
        phone: '',
      });
    }
    setErrors({});
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({ 
        title: 'Validation Error', 
        description: 'Please fix the errors below.', 
        variant: 'destructive' 
      });
      return;
    }

    // Trim whitespace from all fields
    const cleanedData = {
      name: formData.name.trim(),
      city: formData.city.trim(),
      phone: formData.phone.trim(),
    };

    onSubmit(cleanedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Customer Name *</Label>
        <Input 
          id="name" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          placeholder="Enter customer name"
          disabled={loading}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <Label htmlFor="city">City *</Label>
        <Input 
          id="city" 
          name="city" 
          value={formData.city} 
          onChange={handleChange} 
          placeholder="Enter city"
          disabled={loading}
          className={errors.city ? 'border-red-500' : ''}
        />
        {errors.city && (
          <p className="text-sm text-red-500 mt-1">{errors.city}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Phone Number *</Label>
        <Input 
          id="phone" 
          name="phone" 
          type="tel" 
          value={formData.phone} 
          onChange={handleChange} 
          placeholder="Enter phone number"
          disabled={loading}
          className={errors.phone ? 'border-red-500' : ''}
        />
        {errors.phone && (
          <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Update Customer' : 'Add Customer'}
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;