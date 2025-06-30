import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DownloadCloud,
  ChevronDown,
  Calendar,
  MapPin,
  Truck,
  Phone,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const OrderCard = ({
  order,
  actions,
  isExpanded,
  onToggleExpand,
  totalPrice,
  productSummary,
  getTransportNames,
  getProductStock,
  formatDate,
  generateDispatchPDF,
  onReverseDispatch, // New prop for reverse dispatch function
}) => {
  const [showReverseDialog, setShowReverseDialog] = useState(false);
  const [isReversingDispatch, setIsReversingDispatch] = useState(false);
  
  const transportNames = getTransportNames(order.delivered_by);
  
  // Handler for reverse dispatch
  const handleReverseDispatch = async () => {
    if (!onReverseDispatch) return;
    
    setIsReversingDispatch(true);
    try {
      await onReverseDispatch(order);
      setShowReverseDialog(false);
    } catch (error) {
      console.error('Error reversing dispatch:', error);
    } finally {
      setIsReversingDispatch(false);
    }
  };

  // Check if order can be reversed (only dispatched orders)
  const canReverseDispatch = order.status === "Full Dispatch" || order.status === "Partial Dispatch";
  // Handler for invoice download
  const handleDownloadInvoice = async (e) => {
    e.stopPropagation();
    let formattedDispatchedItems = [];
    if (order.dispatched_items && order.dispatched_items.length > 0) {
      formattedDispatchedItems = order.dispatched_items.map(item => ({
        unit: item.unit || 'units',
        price: item.price || 0,
        quantity: item.quantity || item.dispatchedQuantity || 0,
        productId: item.productId,
        totalPrice: item.totalPrice || (item.dispatchedQuantity || item.quantity || 0) * (item.price || 0),
        productName: item.productName,
        dispatchedQuantity: item.dispatchedQuantity || item.quantity || 0,
        dispatchedAt: item.dispatchedAt || new Date().toISOString()
      }));
    } else if (order.items && order.items.length > 0) {
      formattedDispatchedItems = order.items.map(item => ({
        unit: item.unit || 'units',
        price: item.price || 0,
        quantity: item.quantity || 0,
        productId: item.productId,
        totalPrice: (item.quantity || 0) * (item.price || 0),
        productName: item.productName || item.product_name,
        dispatchedQuantity: item.dispatchedQuantity || item.quantity || 0,
        dispatchedAt: new Date().toISOString()
      }));
    }
    const dispatchData = {
      dispatchedItems: formattedDispatchedItems,
      transportName: order.transportName || '',
      dispatchType: order.status === "Full Dispatch" ? "full" : "partial",
      dispatchDate: order.updated_at || new Date().toISOString()
    };
    await generateDispatchPDF(order, dispatchData);
  };
  return (
    <motion.div
      key={order.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      layout
    >
      <Card className="mb-2 hover:shadow-md transition-shadow">
        {/* Card Header - Always visible */}
        <div className="px-3 py-1.5 cursor-pointer" onClick={() => onToggleExpand(order.id)}>
          <div className="flex flex-col sm:flex-row gap-1 sm:items-center">
            <div className="flex-1 flex items-center space-x-2">
              <div 
                className={`h-2.5 w-2.5 rounded-full flex-shrink-0 border ${
                  order.status === "Unconfirmed" ? "bg-yellow-500 border-yellow-600" : 
                  order.status === "Confirmed" ? "bg-blue-500 border-blue-600" : 
                  order.status === "Partial Dispatch" ? "bg-orange-500 border-orange-600" : 
                  order.status === "Full Dispatch" ? "bg-green-500 border-green-600" : 
                  "bg-gray-500 border-gray-600"
                }`}
                title={order.status}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm">
                    #{order.id || "N/A"}
                  </span>
                  <span className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {order.customer_name || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5 pr-2">
                  <span className="text-xs text-muted-foreground truncate max-w-[160px] sm:max-w-[250px]">
                    {productSummary}
                  </span>
                  <span className="font-medium text-xs text-primary whitespace-nowrap">
                    ₹{totalPrice}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                order.status === "Unconfirmed" ? "bg-yellow-100 text-yellow-700" : 
                order.status === "Confirmed" ? "bg-blue-100 text-blue-700" : 
                order.status === "Partial Dispatch" ? "bg-orange-100 text-orange-700" : 
                order.status === "Full Dispatch" ? "bg-green-100 text-green-700" : 
                "bg-gray-100 text-gray-700"
              }`}>
                {order.status || "Unknown"}
              </span>
              <div className="flex items-center">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleDownloadInvoice} 
                  className="h-6 w-6 p-0 rounded-full"
                  title="Download Invoice"
                >
                  <DownloadCloud className="h-3.5 w-3.5" />
                </Button>
                {canReverseDispatch && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReverseDialog(true);
                    }} 
                    className="h-6 w-6 p-0 rounded-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    title="Reverse Dispatch"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
                <div className="h-6 w-6 flex items-center justify-center">
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap mt-1 justify-between">
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                <Calendar className="h-2.5 w-2.5" /> 
                {formatDate(order.created_at).split(',')[0]}
              </span>
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                <MapPin className="h-2.5 w-2.5" /> 
                <span className="truncate max-w-[100px]" title={order.delivery_location || order.city || "N/A"}>
                  {order.delivery_location || order.city || "N/A"}
                </span>
              </span>
              {(order.transportName || transportNames.length > 0) && (
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <Truck className="h-2.5 w-2.5" /> 
                  <span title={order.transportName || transportNames.join(", ")}>
                    {order.transportName || transportNames.join(", ")}
                  </span>
                </span>
                
              )}
            </div>
            {order.phone_number && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                <Phone className="h-2.5 w-2.5" /> 
                {order.phone_number}
              </span>
            )}
          </div>
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="border-t pt-3 pb-2">
                {order.items && order.items.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold">Order Items:</h4>
                    <div className="overflow-x-auto -mx-3">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="text-left font-medium px-2 py-1">Product</th>
                            <th className="text-center font-medium px-2 py-1">Qty</th>
                            <th className="text-right font-medium px-2 py-1">Price</th>
                            <th className="text-right font-medium px-2 py-1">Total</th>
                            {order.status === "Confirmed" && (
                              <th className="text-center font-medium px-2 py-1">Stock</th>
                            )}
                            {order.status === "Partial Dispatch" && (
                              <th className="text-center font-medium px-2 py-1">Dispatched</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, index) => {
                            const currentStock = getProductStock(item.productId);
                            const hasLowStock = order.status === "Confirmed" && currentStock < (item.quantity || 0);
                            const itemTotal = (Number(item.quantity) || 0) * (Number(item.price) || 0);
                            return (
                              <tr key={index} className={hasLowStock ? "bg-red-50" : (index % 2 === 0 ? "" : "bg-muted/10")}> 
                                <td className="px-2 py-1">
                                  {item.productName || item.product_name || "Unknown Product"}
                                </td>
                                <td className="px-2 py-1 text-center whitespace-nowrap">
                                  {item.quantity || 0} {item.unit || "units"}
                                </td>
                                <td className="px-2 py-1 text-right whitespace-nowrap">
                                  ₹{Number(item.price || 0).toFixed(2)}
                                </td>
                                <td className="px-2 py-1 text-right font-medium whitespace-nowrap">
                                  ₹{itemTotal.toFixed(2)}
                                </td>
                                {order.status === "Confirmed" && (
                                  <td className={`px-2 py-1 text-center whitespace-nowrap ${hasLowStock ? "text-red-600 font-medium" : "text-green-600"}`}>
                                    {currentStock} {hasLowStock && "⚠️"}
                                  </td>
                                )}
                                {order.status === "Partial Dispatch" && (
                                  <td className="px-2 py-1 text-center whitespace-nowrap">
                                    {item.dispatchedQuantity > 0 ? (
                                      <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs inline-block">
                                        {item.dispatchedQuantity}
                                      </span>
                                    ) : "-"}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                          <tr className="border-t">
                            <td colSpan={order.status === "Confirmed" || order.status === "Partial Dispatch" ? 3 : 3} 
                                className="px-2 py-1.5 text-right font-medium">
                              Total:
                            </td>
                            <td className="px-2 py-1.5 text-right font-medium">
                              ₹{totalPrice}
                            </td>
                            {(order.status === "Confirmed" || order.status === "Partial Dispatch") && <td></td>}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No items listed</p>
                )}
                <div className="flex justify-between items-start mt-3 pt-3 border-t gap-2 flex-col sm:flex-row">
                  <div className="text-xs flex flex-wrap gap-x-4 gap-y-1">
                    <div>
                      <span className="text-muted-foreground mr-1">Added By:</span>
                      <span>{order.added_by || "N/A"}</span>
                    </div>
                    {/* <div>
                      <span className="text-muted-foreground mr-1">Order Date:</span>
                      <span>{formatDate(order.created_at)}</span>
                    </div> */}
                    <div>
                      <span className="text-muted-foreground mr-1">Update Date:</span>
                      <span>{formatDate(order.updated_at)}</span>
                    </div>
                  </div>
                  {actions && (
                    <div className="flex flex-wrap gap-1.5 mt-2 sm:mt-0">
                      {actions(order)}
                    </div>
                  )}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
      
      {/* Reverse Dispatch Confirmation Dialog */}
      <AlertDialog open={showReverseDialog} onOpenChange={setShowReverseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Reverse Dispatch
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to reverse the dispatch for order #{order.id}?
              </p>
              <p className="text-sm">
                This action will:
              </p>
              <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                <li>Change the order status back to "Confirmed"</li>
                <li>Restore dispatched quantities back to inventory</li>
                <li>Clear all dispatch information</li>
              </ul>
              <p className="text-orange-600 font-medium text-sm">
                ⚠️ This action cannot be undone. Use this feature only when necessary.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReversingDispatch}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReverseDispatch}
              disabled={isReversingDispatch}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isReversingDispatch ? "Reversing..." : "Reverse Dispatch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default OrderCard;
