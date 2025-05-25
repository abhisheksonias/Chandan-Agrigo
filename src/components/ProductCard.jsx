
// import React from 'react';
// import { motion } from 'framer-motion';
// import { Edit, Trash2, Plus, Minus } from 'lucide-react';
// import { Card, CardContent, CardFooter } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// const ProductCard = ({ product, onEdit, onDelete, onAdjustStock }) => {
//   const getStockStatusClass = () => {
//     if (product.quantity <= 0) return 'low-stock';
//     if (product.quantity <= product.reorderLevel) return 'medium-stock';
//     return 'good-stock';
//   };

//   const getStockStatusText = () => {
//     if (product.quantity <= 0) return 'Out of Stock';
//     if (product.quantity <= product.reorderLevel) return 'Low Stock';
//     return 'In Stock';
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       exit={{ opacity: 0, y: -20 }}
//       transition={{ duration: 0.3 }}
//       whileHover={{ y: -5 }}
//       className="h-full"
//     >
//       <Card className="h-full flex flex-col overflow-hidden border-t-4 hover:shadow-lg transition-all duration-300" style={{ borderTopColor: product.quantity <= product.reorderLevel ? '#f87171' : '#60a5fa' }}>
//         <div className="relative p-6 pb-0">
//           <div className="flex justify-between items-start">
//             <div className="flex items-center space-x-4">
//               <Avatar className="h-12 w-12 rounded-md">
//                 <AvatarImage src={product.image} alt={product.name} />
//                 <AvatarFallback className="rounded-md bg-primary/10 text-primary">
//                   {product.name.substring(0, 2).toUpperCase()}
//                 </AvatarFallback>
//               </Avatar>
//               <div>
//                 <h3 className="font-semibold text-lg">{product.name}</h3>
//                 <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
//               </div>
//             </div>
//             <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusClass()}`}>
//               {getStockStatusText()}
//             </div>
//           </div>
//         </div>
        
//         <CardContent className="flex-grow p-6">
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <div>
//               <p className="text-sm text-muted-foreground">Price</p>
//               <p className="font-medium">${product.price.toFixed(2)}</p>
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Cost</p>
//               <p className="font-medium">${product.cost.toFixed(2)}</p>
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Quantity</p>
//               <p className="font-medium">{product.quantity}</p>
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Category</p>
//               <p className="font-medium">{product.category}</p>
//             </div>
//           </div>
          
//           <div className="text-sm line-clamp-2 text-muted-foreground">
//             {product.description || 'No description available'}
//           </div>
//         </CardContent>
        
//         <CardFooter className="border-t p-4 bg-muted/30">
//           <div className="flex justify-between w-full">
//             <div className="flex space-x-1">
//               <Button 
//                 variant="outline" 
//                 size="icon" 
//                 onClick={() => onAdjustStock(product)}
//                 title="Adjust Stock"
//               >
//                 <Plus className="h-4 w-4" />
//               </Button>
//               <Button 
//                 variant="outline" 
//                 size="icon" 
//                 onClick={() => onEdit(product)}
//                 title="Edit Product"
//               >
//                 <Edit className="h-4 w-4" />
//               </Button>
//             </div>
//             <Button 
//               variant="destructive" 
//               size="icon" 
//               onClick={() => onDelete(product)}
//               title="Delete Product"
//             >
//               <Trash2 className="h-4 w-4" />
//             </Button>
//           </div>
//         </CardFooter>
//       </Card>
//     </motion.div>
//   );
// };

// export default ProductCard;
