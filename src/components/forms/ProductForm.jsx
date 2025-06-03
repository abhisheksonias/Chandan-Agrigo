import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabaseClient'; 
import { UploadCloud } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const ProductForm = ({ product, onSubmit, onCancel }) => {
  const { toast } = useToast();
  const { generateSku } = useAppContext();
  const isEditing = !!product;
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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
      if (product.image) {
        setImagePreview(product.image);
      }
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(isEditing && product ? product.image : '');
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return formData.image;
    setIsUploading(true);
    try {
      // Compress the image before upload
      const compressedFile = await imageCompression(imageFile, {
        maxSizeMB: 0.3, // Target max size in MB (adjust as needed)
        maxWidthOrHeight: 800, // Resize to max 800px (adjust as needed)
        useWebWorker: true,
      });
      const fileName = `${crypto.randomUUID()}-${imageFile.name}`;
      const { data, error } = await supabase.storage
        .from('productimages')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });
      setIsUploading(false);

      if (error) {
        toast({ title: 'Image Upload Error', description: error.message, variant: 'destructive' });
        return null;
      }

      const { data: { publicUrl } } = supabase.storage.from('productimages').getPublicUrl(data.path);
      return publicUrl;
    } catch (err) {
      setIsUploading(false);
      toast({ title: 'Image Compression Error', description: err.message, variant: 'destructive' });
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.unit) {
      toast({ title: 'Error', description: 'Product Name and Unit are required.', variant: 'destructive' });
      return;
    }
    if (isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
        toast({ title: 'Error', description: 'Stock must be a non-negative number.', variant: 'destructive' });
        return;
    }
    
    let imageUrl = formData.image;
    if (imageFile) {
      const uploadedUrl = await uploadImage();
      if (!uploadedUrl) return; 
      imageUrl = uploadedUrl;
    }
    
    const submissionData = {
      ...formData,
      stock: parseInt(formData.stock, 10),
      image: imageUrl,
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
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isUploading} />
      </div>
      <div>
        <Label htmlFor="unit">Unit (e.g., Bag, Bottle, kg)</Label>
        <Input id="unit" name="unit" value={formData.unit} onChange={handleChange} required disabled={isUploading} />
      </div>
      <div>
        <Label htmlFor="stock">Initial Stock</Label>
        <Input id="stock" name="stock" type="number" min="0" value={formData.stock} onChange={handleChange} required disabled={isUploading} />
      </div>
      <div>
        <Label htmlFor="image-upload">Product Image</Label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            {imagePreview ? (
              <img src={imagePreview} alt="Product Preview" className="mx-auto h-24 w-24 object-cover rounded-md" />
            ) : (
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            )}
            <div className="flex text-sm">
              <label
                htmlFor="image-upload-input"
                className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
              >
                <span>Upload a file</span>
                <input id="image-upload-input" name="image-upload-input" type="file" className="sr-only" accept="image/*" onChange={handleImageFileChange} disabled={isUploading} />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>Cancel</Button>
        <Button type="submit" disabled={isUploading || (isEditing && !imageFile && !formData.name)}>
          {isUploading ? 'Uploading...' : (isEditing ? 'Update Product' : 'Add Product')}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;