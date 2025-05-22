import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const TransportForm = ({ transport, onSubmit, onCancel }) => {
  const { toast } = useToast();
  const isEditing = !!transport;

  const [formData, setFormData] = useState({
    name: '',
    address: '',
  });

  useEffect(() => {
    if (transport) {
      setFormData({
        name: transport.name || '',
        address: transport.address || '',
      });
    }
  }, [transport]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address) {
      toast({ title: 'Error', description: 'All fields are required.', variant: 'destructive' });
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Transport Company Name</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="address">Office Address</Label>
        <Textarea id="address" name="address" value={formData.address} onChange={handleChange} required />
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{isEditing ? 'Update Transport' : 'Add Transport'}</Button>
      </div>
    </form>
  );
};

export default TransportForm;