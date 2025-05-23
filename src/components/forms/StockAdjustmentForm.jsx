import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const StockAdjustmentForm = ({ product, onSubmit, onCancel }) => {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!quantity) {
      setError('Please enter a quantity');
      return;
    }
    
    const parsedQuantity = parseInt(quantity);
    
    if (isNaN(parsedQuantity)) {
      setError('Quantity must be a number');
      return;
    }
    
    if (parsedQuantity === 0) {
      setError('Quantity cannot be zero');
      return;
    }
    
    if (parsedQuantity < 0 && Math.abs(parsedQuantity) > product.quantity) {
      setError(`Cannot remove more than current stock (${product.quantity})`);
      return;
    }
    
    onSubmit(parsedQuantity, reason);
  };

  return (
    <motion.form 
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Adjust Stock for {product.name}</h3>
          <p className="text-sm text-muted-foreground">Current stock: {product.quantity} units</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity Change</Label>
          <div className="flex items-center space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setQuantity(prev => {
                const current = parseInt(prev) || 0;
                return (current - 1).toString();
              })}
            >
              -
            </Button>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError('');
              }}
              className={error ? 'border-red-500' : ''}
              placeholder="Enter quantity (negative to remove)"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setQuantity(prev => {
                const current = parseInt(prev) || 0;
                return (current + 1).toString();
              })}
            >
              +
            </Button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <p className="text-xs text-muted-foreground">
            Use positive numbers to add stock, negative to remove
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="reason">Reason (Optional)</Label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., New shipment, Damaged goods, etc."
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Adjust Stock
        </Button>
      </div>
    </motion.form>
  );
};

export default StockAdjustmentForm;
