import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAppContext } from '@/context/AppContext';

const ProductForm = ({ product, onSubmit, onCancel }) => {
  const { toast } = useToast();
  const { generateSku } = useAppContext();
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    stock: '0',
    image: '', 
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        unit: product.unit || '',
        stock: product.stock ? product.stock.toString() : '0',
        image: product.image || '',
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.unit) {
      toast({ title: 'Error', description: 'Product Name and Unit are required.', variant: 'destructive' });
      return;
    }
    if (isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
        toast({ title: 'Error', description: 'Stock must be a non-negative number.', variant: 'destructive' });
        return;
    }
    
    const submissionData = {
      ...formData,
      stock: parseInt(formData.stock, 10),
    };

    if (!isEditing) {
      submissionData.sku = generateSku(formData.name);
    }
    
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Product Name</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="unit">Unit (e.g., Bag, Bottle, kg)</Label>
        <Input id="unit" name="unit" value={formData.unit} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="stock">Initial Stock</Label>
        <Input id="stock" name="stock" type="number" min="0" value={formData.stock} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="image">Product Image</Label>
        <Input id="image" name="image" type="file" accept="image/*" onChange={handleImageUpload} />
        {formData.image && (
          <div className="mt-2">
            <img-replace src={formData.image} alt="Product Preview" className="h-20 w-20 object-cover rounded-md" />
          </div>
        )}
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{isEditing ? 'Update Product' : 'Add Product'}</Button>
      </div>
    </form>
  );
};

export default ProductForm;