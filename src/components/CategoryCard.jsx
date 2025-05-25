
// import React from 'react';
// import { motion } from 'framer-motion';
// import { Edit, Trash2, Tag } from 'lucide-react';
// import { Card, CardContent, CardFooter } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';

// const CategoryCard = ({ category, onEdit, onDelete }) => {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       exit={{ opacity: 0, y: -20 }}
//       transition={{ duration: 0.3 }}
//       whileHover={{ y: -5 }}
//     >
//       <Card className="overflow-hidden border-t-4 hover:shadow-lg transition-all duration-300" style={{ borderTopColor: '#60a5fa' }}>
//         <div className="p-6">
//           <div className="flex justify-between items-start">
//             <div className="flex items-center space-x-3">
//               <div className="p-2 rounded-full bg-primary/10">
//                 <Tag className="h-5 w-5 text-primary" />
//               </div>
//               <h3 className="font-semibold text-lg">{category.name}</h3>
//             </div>
//             <div className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
//               {category.count} Products
//             </div>
//           </div>
          
//           <CardContent className="p-0 pt-4">
//             <p className="text-sm text-muted-foreground">
//               {category.description || 'No description available'}
//             </p>
//           </CardContent>
//         </div>
        
//         <CardFooter className="border-t p-4 bg-muted/30">
//           <div className="flex justify-between w-full">
//             <Button 
//               variant="outline" 
//               size="sm" 
//               onClick={() => onEdit(category)}
//             >
//               <Edit className="h-4 w-4 mr-2" />
//               Edit
//             </Button>
//             <Button 
//               variant="destructive" 
//               size="sm" 
//               onClick={() => onDelete(category)}
//             >
//               <Trash2 className="h-4 w-4 mr-2" />
//               Delete
//             </Button>
//           </div>
//         </CardFooter>
//       </Card>
//     </motion.div>
//   );
// };

// export default CategoryCard;
