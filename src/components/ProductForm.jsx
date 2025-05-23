
// import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { useInventory } from '@/context/InventoryContext';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { 
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { useToast } from '@/components/ui/use-toast';

// const ProductForm = ({ product, onSubmit, onCancel }) => {
//   const { categories } = useInventory();
//   const { toast } = useToast();
//   const isEditing = !!product;

//   const [formData, setFormData] = useState({
//     name: '',
//     sku: '',
//     category: '',
//     price: '',
//     cost: '',
//     quantity: '',
//     reorderLevel: '',
//     description: '',
//     image: '',
//   });

//   const [errors, setErrors] = useState({});

//   useEffect(() => {
//     if (product) {
//       setFormData({
//         name: product.name || '',
//         sku: product.sku || '',
//         category: product.category || '',
//         price: product.price ? product.price.toString() : '',
//         cost: product.cost ? product.cost.toString() : '',
//         quantity: product.quantity ? product.quantity.toString() : '',
//         reorderLevel: product.reorderLevel ? product.reorderLevel.toString() : '',
//         description: product.description || '',
//         image: product.image || '',
//       });
//     }
//   }, [product]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
    
//     // Clear error when field is edited
//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: undefined }));
//     }
//   };

//   const handleSelectChange = (name, value) => {
//     setFormData(prev => ({ ...prev, [name]: value }));
    
//     // Clear error when field is edited
//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: undefined }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};
    
//     if (!formData.name.trim()) newErrors.name = 'Name is required';
//     if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
//     if (!formData.category) newErrors.category = 'Category is required';
    
//     if (!formData.price.trim()) {
//       newErrors.price = 'Price is required';
//     } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
//       newErrors.price = 'Price must be a positive number';
//     }
    
//     if (!formData.cost.trim()) {
//       newErrors.cost = 'Cost is required';
//     } else if (isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) < 0) {
//       newErrors.cost = 'Cost must be a positive number';
//     }
    
//     if (!formData.quantity.trim()) {
//       newErrors.quantity = 'Quantity is required';
//     } else if (isNaN(parseInt(formData.quantity)) || parseInt(formData.quantity) < 0) {
//       newErrors.quantity = 'Quantity must be a positive number';
//     }
    
//     if (!formData.reorderLevel.trim()) {
//       newErrors.reorderLevel = 'Reorder level is required';
//     } else if (isNaN(parseInt(formData.reorderLevel)) || parseInt(formData.reorderLevel) < 0) {
//       newErrors.reorderLevel = 'Reorder level must be a positive number';
//     }
    
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     if (!validateForm()) {
//       toast({
//         title: 'Validation Error',
//         description: 'Please fix the errors in the form',
//         variant: 'destructive',
//       });
//       return;
//     }
    
//     const processedData = {
//       ...formData,
//       price: parseFloat(formData.price),
//       cost: parseFloat(formData.cost),
//       quantity: parseInt(formData.quantity),
//       reorderLevel: parseInt(formData.reorderLevel),
//     };
    
//     onSubmit(processedData);
//   };

//   return (
//     <motion.form 
//       onSubmit={handleSubmit}
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.3 }}
//       className="space-y-6"
//     >
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div className="space-y-2">
//           <Label htmlFor="name">Product Name</Label>
//           <Input
//             id="name"
//             name="name"
//             value={formData.name}
//             onChange={handleChange}
//             className={errors.name ? 'border-red-500' : ''}
//           />
//           {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
//         </div>
        
//         <div className="space-y-2">
//           <Label htmlFor="sku">SKU</Label>
//           <Input
//             id="sku"
//             name="sku"
//             value={formData.sku}
//             onChange={handleChange}
//             className={errors.sku ? 'border-red-500' : ''}
//           />
//           {errors.sku && <p className="text-sm text-red-500">{errors.sku}</p>}
//         </div>
        
//         <div className="space-y-2">
//           <Label htmlFor="category">Category</Label>
//           <Select
//             value={formData.category}
//             onValueChange={(value) => handleSelectChange('category', value)}
//           >
//             <SelectTrigger id="category" className={errors.category ? 'border-red-500' : ''}>
//               <SelectValue placeholder="Select a category" />
//             </SelectTrigger>
//             <SelectContent>
//               {categories.map((category) => (
//                 <SelectItem key={category.id} value={category.name}>
//                   {category.name}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//           {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
//         </div>
        
//         <div className="space-y-2">
//           <Label htmlFor="price">Price ($)</Label>
//           <Input
//             id="price"
//             name="price"
//             type="number"
//             step="0.01"
//             min="0"
//             value={formData.price}
//             onChange={handleChange}
//             className={errors.price ? 'border-red-500' : ''}
//           />
//           {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
//         </div>
        
//         <div className="space-y-2">
//           <Label htmlFor="cost">Cost ($)</Label>
//           <Input
//             id="cost"
//             name="cost"
//             type="number"
//             step="0.01"
//             min="0"
//             value={formData.cost}
//             onChange={handleChange}
//             className={errors.cost ? 'border-red-500' : ''}
//           />
//           {errors.cost && <p className="text-sm text-red-500">{errors.cost}</p>}
//         </div>
        
//         <div className="space-y-2">
//           <Label htmlFor="quantity">Quantity</Label>
//           <Input
//             id="quantity"
//             name="quantity"
//             type="number"
//             min="0"
//             value={formData.quantity}
//             onChange={handleChange}
//             className={errors.quantity ? 'border-red-500' : ''}
//           />
//           {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
//         </div>
        
//         <div className="space-y-2">
//           <Label htmlFor="reorderLevel">Reorder Level</Label>
//           <Input
//             id="reorderLevel"
//             name="reorderLevel"
//             type="number"
//             min="0"
//             value={formData.reorderLevel}
//             onChange={handleChange}
//             className={errors.reorderLevel ? 'border-red-500' : ''}
//           />
//           {errors.reorderLevel && <p className="text-sm text-red-500">{errors.reorderLevel}</p>}
//         </div>
        
//         <div className="space-y-2 md:col-span-2">
//           <Label htmlFor="image">Image URL</Label>
//           <Input
//             id="image"
//             name="image"
//             value={formData.image}
//             onChange={handleChange}
//             placeholder="https://example.com/image.jpg"
//           />
//         </div>
        
//         <div className="space-y-2 md:col-span-2">
//           <Label htmlFor="description">Description</Label>
//           <textarea
//             id="description"
//             name="description"
//             value={formData.description}
//             onChange={handleChange}
//             rows={4}
//             className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
//           />
//         </div>
//       </div>
      
//       <div className="flex justify-end space-x-2">
//         <Button type="button" variant="outline" onClick={onCancel}>
//           Cancel
//         </Button>
//         <Button type="submit">
//           {isEditing ? 'Update Product' : 'Add Product'}
//         </Button>
//       </div>
//     </motion.form>
//   );
// };

// export default ProductForm;
