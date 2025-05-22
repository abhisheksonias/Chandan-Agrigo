import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAppContext } from '@/context/AppContext';

const DispatchForm = ({ order, dispatchType, onSubmit, onCancel }) => {
  const { products: allProducts } = useAppContext();
  const { toast } = useToast();
  const [dispatchedItems, setDispatchedItems] = useState([]);

  useEffect(() => {
    if (order && order.items) {
      setDispatchedItems(
        order.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          orderedQuantity: item.quantity,
          previouslyDispatched: item.dispatchedQuantity || 0,
          currentDispatchQuantity: dispatchType === 'full' ? (item.quantity - (item.dispatchedQuantity || 0)) : 0,
          unit: item.unit,
        }))
      );
    }
  }, [order, dispatchType]);

  const handleQuantityChange = (productId, value) => {
    const newQuantity = parseInt(value, 10);
    setDispatchedItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId
          ? { ...item, currentDispatchQuantity: isNaN(newQuantity) ? 0 : newQuantity }
          : item
      )
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let isValid = true;
    const itemsToSubmit = dispatchedItems
      .filter(item => item.currentDispatchQuantity > 0)
      .map(item => {
        const product = allProducts.find(p => p.id === item.productId);
        const availableToDispatch = item.orderedQuantity - item.previouslyDispatched;
        if (item.currentDispatchQuantity > availableToDispatch) {
          toast({ title: 'Error', description: `Cannot dispatch more than remaining for ${item.productName}. Max: ${availableToDispatch}`, variant: 'destructive' });
          isValid = false;
        }
        if (product && item.currentDispatchQuantity > product.stock) {
            toast({ title: 'Error', description: `Not enough stock for ${item.productName}. Available: ${product.stock}`, variant: 'destructive' });
            isValid = false;
        }
        return { productId: item.productId, quantity: item.currentDispatchQuantity };
      });

    if (!isValid) return;

    if (dispatchType === 'partial' && itemsToSubmit.length === 0) {
      toast({ title: 'No items to dispatch', description: 'Please enter quantities for items to dispatch.', variant: 'destructive' });
      return;
    }
    
    onSubmit({ dispatchedItems: itemsToSubmit });
  };

  if (!order) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {dispatchedItems.map(item => (
        <div key={item.productId} className="p-3 border rounded-md space-y-2">
          <p className="font-semibold">{item.productName} ({item.unit})</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <p>Ordered: {item.orderedQuantity}</p>
            <p>Dispatched: {item.previouslyDispatched}</p>
            <p>Remaining: {item.orderedQuantity - item.previouslyDispatched}</p>
          </div>
          {dispatchType === 'partial' && (item.orderedQuantity - item.previouslyDispatched > 0) && (
            <div>
              <Label htmlFor={`dispatch-${item.productId}`}>Dispatch Quantity</Label>
              <Input
                id={`dispatch-${item.productId}`}
                type="number"
                min="0"
                max={item.orderedQuantity - item.previouslyDispatched}
                value={item.currentDispatchQuantity}
                onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
              />
            </div>
          )}
          {dispatchType === 'full' && (
            <p className="text-sm">To Dispatch: {item.currentDispatchQuantity}</p>
          )}
           {(item.orderedQuantity - item.previouslyDispatched === 0) && dispatchType === 'partial' && (
            <p className="text-sm text-green-600">Fully dispatched for this item.</p>
          )}
        </div>
      ))}
      
      <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-background py-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">
          {dispatchType === 'full' ? 'Confirm Full Dispatch' : 'Dispatch Selected'}
        </Button>
      </div>
    </form>
  );
};

export default DispatchForm;