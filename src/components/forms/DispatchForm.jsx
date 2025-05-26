import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAppContext } from '@/context/AppContext';
import { generateDispatchPDF } from '@/hooks/pdfGenerator'; // Import the PDF generator

const DispatchForm = ({ order, dispatchType, onSubmit, onCancel }) => {
  const { products: allProducts, transports, customers } = useAppContext();
  const { toast } = useToast();
  const [dispatchedItems, setDispatchedItems] = useState([]);
  const [selectedTransport, setSelectedTransport] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (order && order.items) {
      setDispatchedItems(
        order.items.map(item => {
          const previouslyDispatched = item.dispatchedQuantity || 0;
          const remainingQuantity = (item.quantity || 0) - previouslyDispatched;
          
          return {
            productId: item.productId,
            productName: item.productName || item.product_name,
            orderedQuantity: item.quantity || 0,
            previouslyDispatched: previouslyDispatched,
            remainingQuantity: remainingQuantity,
            currentDispatchQuantity: dispatchType === 'full' ? remainingQuantity : 0,
            unit: item.unit || 'units',
          };
        })
      );
    }
  }, [order, dispatchType]);

  const handleQuantityChange = (productId, value) => {
    const newQuantity = parseInt(value, 10);
    setDispatchedItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId
          ? { ...item, currentDispatchQuantity: isNaN(newQuantity) ? 0 : Math.max(0, newQuantity) }
          : item
      )
    );
  };

  const handleTransportChange = (value) => {
    setSelectedTransport(value);
  };

  const getAvailableStock = (productId) => {
    const product = allProducts?.find(p => p.id === productId);
    return product ? (product.stock || 0) : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate transport selection
    if (!selectedTransport) {
      toast({ 
        title: 'Transport Required', 
        description: 'Please select a transport service for dispatch.', 
        variant: 'destructive' 
      });
      return;
    }

    let isValid = true;
    const itemsToSubmit = dispatchedItems
      .filter(item => item.currentDispatchQuantity > 0)
      .map(item => {
        const availableStock = getAvailableStock(item.productId);
        
        // Check if trying to dispatch more than remaining
        if (item.currentDispatchQuantity > item.remainingQuantity) {
          toast({ 
            title: 'Error', 
            description: `Cannot dispatch more than remaining for ${item.productName}. Remaining: ${item.remainingQuantity}`, 
            variant: 'destructive' 
          });
          isValid = false;
        }
        
        // Check if trying to dispatch more than available stock
        if (item.currentDispatchQuantity > availableStock) {
          toast({ 
            title: 'Error', 
            description: `Not enough stock for ${item.productName}. Available: ${availableStock}`, 
            variant: 'destructive' 
          });
          isValid = false;
        }
        
        return { 
          productId: item.productId,
          productName: item.productName,
          quantity: item.currentDispatchQuantity,
          dispatchedAt: new Date().toISOString()
        };
      });

    if (!isValid) return;

    if (dispatchType === 'partial' && itemsToSubmit.length === 0) {
      toast({ 
        title: 'No items to dispatch', 
        description: 'Please enter quantities for items to dispatch.', 
        variant: 'destructive' 
      });
      return;
    }
    
    const selectedTransportData = transports?.find(t => t.id === selectedTransport);
    
    // Structure the data to match your database format and expected structure
    const dispatchData = {
      dispatchedItems: itemsToSubmit,
      transportId: selectedTransport,
      transportName: selectedTransportData?.name || '',
      dispatchType: dispatchType,
      dispatchDate: new Date().toISOString()
    };

    try {
      // Set loading state for PDF generation
      setIsGeneratingPDF(true);

      // Generate PDF before submitting the dispatch
      const customerData = customers?.find(c => c.id === order.customer_id) || {
        name: order.customer_name,
        city: order.city,
        phone: order.phone_number
      };

      const pdfResult = await generateDispatchPDF(
        order,
        dispatchData,
        customerData,
        selectedTransportData
      );

      if (pdfResult.success) {
        toast({
          title: 'PDF Generated Successfully',
          description: `${pdfResult.message}`,
          variant: 'default'
        });
      } else {
        // Still proceed with dispatch even if PDF fails, but show warning
        toast({
          title: 'PDF Generation Failed',
          description: `${pdfResult.message} Dispatch will continue.`,
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast({
        title: 'PDF Generation Error',
        description: 'Failed to generate PDF, but dispatch will continue.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingPDF(false);
    }
    
    // Pass the dispatch data to the parent component
    onSubmit(dispatchData);
  };

  if (!order) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Transport Selection Section */}
      <div className="p-3 border rounded-md bg-blue-50 dark:bg-blue-950/20">
        <h3 className="font-semibold mb-3 text-blue-800 dark:text-blue-200">Transport Information</h3>
        <div className="space-y-2">
          <Label htmlFor="transport-select">Select Transport Service *</Label>
          <Select value={selectedTransport} onValueChange={handleTransportChange}>
            <SelectTrigger id="transport-select">
              <SelectValue placeholder="Choose a transport service..." />
            </SelectTrigger>
            <SelectContent>
              {transports && transports.length > 0 ? (
                transports.map(transport => (
                  <SelectItem key={transport.id} value={transport.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{transport.name}</span>
                      {transport.address && (
                        <span className="text-xs text-muted-foreground">{transport.address}</span>
                      )}
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-transports" disabled>
                  No transport services available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {selectedTransport && (
            <div className="text-sm text-muted-foreground">
              Selected: {transports?.find(t => t.id === selectedTransport)?.name}
            </div>
          )}
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-3">
        <h3 className="font-semibold">Items to Dispatch</h3>
        {dispatchedItems.map(item => {
          const availableStock = getAvailableStock(item.productId);
          const hasStock = availableStock > 0;
          const canDispatch = item.remainingQuantity > 0 && hasStock;
          const maxDispatchable = Math.min(item.remainingQuantity, availableStock);
          
          return (
            <div key={item.productId} className={`p-3 border rounded-md space-y-2 ${
              !canDispatch ? 'bg-gray-50 opacity-75' : ''
            }`}>
              <div className="flex justify-between items-start">
                <p className="font-semibold">{item.productName} ({item.unit})</p>
                <div className="text-right text-sm">
                  <p className={`px-2 py-1 rounded text-xs ${
                    hasStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    Stock: {availableStock}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Ordered:</p>
                  <p className="font-medium">{item.orderedQuantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dispatched:</p>
                  <p className="font-medium text-blue-600">{item.previouslyDispatched}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Remaining:</p>
                  <p className={`font-medium ${
                    item.remainingQuantity > 0 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {item.remainingQuantity}
                  </p>
                </div>
              </div>

              {item.remainingQuantity === 0 && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  ✅ This item has been fully dispatched
                </div>
              )}

              {item.remainingQuantity > 0 && !hasStock && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  ⚠️ No stock available for dispatch
                </div>
              )}

              {canDispatch && dispatchType === 'partial' && (
                <div className="space-y-1">
                  <Label htmlFor={`dispatch-${item.productId}`}>
                    Dispatch Quantity (Max: {maxDispatchable})
                  </Label>
                  <Input
                    id={`dispatch-${item.productId}`}
                    type="number"
                    min="0"
                    max={maxDispatchable}
                    value={item.currentDispatchQuantity}
                    onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                    placeholder={`Enter quantity (0-${maxDispatchable})`}
                  />
                </div>
              )}
              
              {canDispatch && dispatchType === 'full' && (
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-sm font-medium text-blue-800">
                    Will dispatch: {item.currentDispatchQuantity} {item.unit}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Section */}
      <div className="border-t pt-4">
        <div className="bg-gray-50 p-3 rounded">
          <h4 className="font-medium mb-2">Dispatch Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Items to dispatch:</p>
              <p className="font-medium">
                {dispatchedItems.filter(item => item.currentDispatchQuantity > 0).length} items
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total quantity:</p>
              <p className="font-medium">
                {dispatchedItems.reduce((sum, item) => sum + item.currentDispatchQuantity, 0)} units
              </p>
            </div>
          </div>
          
          {/* Preview of what will happen */}
          <div className="mt-3 p-2 bg-blue-50 rounded">
            <p className="text-sm font-medium text-blue-800 mb-1">
              After dispatch, this order will be moved to:
            </p>
            <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
              {dispatchType === 'full' ? 'Full Dispatch' : 'Partial Dispatch'}
            </span>
          </div>

          {/* PDF Generation Notice */}
          {isGeneratingPDF && (
            <div className="mt-3 p-2 bg-yellow-50 rounded flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
              <p className="text-sm text-yellow-800">Generating purchase order PDF...</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-background py-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isGeneratingPDF}>
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={
            dispatchedItems.filter(item => item.currentDispatchQuantity > 0).length === 0 || 
            isGeneratingPDF
          }
          className={dispatchType === 'partial' ? 'bg-orange-600 hover:bg-orange-700' : ''}
        >
          {isGeneratingPDF ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating PDF...
            </>
          ) : (
            dispatchType === 'full' ? 'Confirm Full Dispatch' : 'Process Partial Dispatch'
          )}
        </Button>
      </div>
    </form>
  );
};

export default DispatchForm;