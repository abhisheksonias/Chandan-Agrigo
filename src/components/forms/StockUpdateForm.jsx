import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const StockUpdateForm = ({ product, onSubmit, onCancel }) => {
  const { toast } = useToast();
  const [newStock, setNewStock] = useState(product.stock.toString());
  const [updateType, setUpdateType] = useState('manual update');

  const handleSubmit = (e) => {
    e.preventDefault();
    const stockValue = parseInt(newStock, 10);
    if (isNaN(stockValue) || stockValue < 0) {
      toast({ title: 'Error', description: 'Stock must be a non-negative number.', variant: 'destructive' });
      return;
    }
    onSubmit(product.id, stockValue, updateType);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="currentStock">Current Stock</Label>
        <Input id="currentStock" value={product.stock} readOnly disabled />
      </div>
      <div>
        <Label htmlFor="newStock">New Stock Quantity</Label>
        <Input 
          id="newStock" 
          type="number" 
          min="0" 
          value={newStock} 
          onChange={(e) => setNewStock(e.target.value)} 
          required 
        />
      </div>
      <div>
        <Label htmlFor="updateType">Update Type</Label>
        <Select value={updateType} onValueChange={setUpdateType}>
          <SelectTrigger id="updateType">
            <SelectValue placeholder="Select update type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual update">Manual Update</SelectItem>
            <SelectItem value="received shipment">Received Shipment</SelectItem>
            <SelectItem value="stocktake adjustment">Stocktake Adjustment</SelectItem>
            <SelectItem value="damaged goods">Damaged Goods</SelectItem>
            <SelectItem value="returned goods">Returned Goods</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Update Stock</Button>
      </div>
    </form>
  );
};

export default StockUpdateForm;