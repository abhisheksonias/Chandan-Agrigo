import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  CheckCircle,
  ChevronDown,
  Clock,
  DollarSign,
  DownloadCloud,
  Edit,
  Filter,
  MapPin,
  PackageCheck,
  PackageX,
  Phone,
  Search,
  Send,
  Truck,
  User,
  Calendar,
  X,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import OrderDetailsForm from "@/components/forms/OrderDetailsForm";
import DispatchForm from "@/components/forms/DispatchForm";
import * as XLSX from "xlsx";
import { generateDispatchPDF } from "@/hooks/pdfGenerator";

const AnalyticsBoardPage = () => {
  const {
    orders,
    products,
    updateOrderStatus,
    updateOrderDetails,
    updateProductStock,
    deleteOrder, // <-- Add deleteOrder from context
  } = useAppContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("total_orders");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [isDispatchDialogOpen, setIsDispatchDialogOpen] = useState(false);
  const [dispatchType, setDispatchType] = useState(""); // 'full' or 'partial'

  // Search and Filter States
  const [searchFilters, setSearchFilters] = useState({
    customerName: "",
    deliveryLocation: "",
    productName: "",
    dateFrom: "",
    dateTo: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Expanded order IDs state
  const [expandedOrderIds, setExpandedOrderIds] = useState(new Set());

  // Filtered orders based on search criteria
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesCustomerName =
        !searchFilters.customerName ||
        (order.customer_name || "")
          .toLowerCase()
          .includes(searchFilters.customerName.toLowerCase());

      const matchesDeliveryLocation =
        !searchFilters.deliveryLocation ||
        (order.delivery_location || "")
          .toLowerCase()
          .includes(searchFilters.deliveryLocation.toLowerCase());

      // Add product name filtering
      const matchesProductName =
        !searchFilters.productName ||
        (order.items || []).some((item) =>
          (item.productName || item.product_name || "")
            .toLowerCase()
            .includes(searchFilters.productName.toLowerCase())
        );

      const orderDate = new Date(order.created_at);
      const matchesDateFrom =
        !searchFilters.dateFrom ||
        orderDate >= new Date(searchFilters.dateFrom);

      const matchesDateTo =
        !searchFilters.dateTo ||
        orderDate <= new Date(searchFilters.dateTo + "T23:59:59");

      return (
        matchesCustomerName &&
        matchesDeliveryLocation &&
        matchesProductName && // Add this line
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [orders, searchFilters]);

  const getOrdersByStatus = (status) =>
    filteredOrders.filter((order) => order.status === status);
  const getDispatchedOrders = () =>
    filteredOrders.filter(
      (order) =>
        order.status === "Full Dispatch" || order.status === "Partial Dispatch"
    );

  // Simplified handleConfirmOrder function without stock deduction
  const handleConfirmOrder = async (orderId) => {
    try {
      // Simply update order status to confirmed
      updateOrderStatus(orderId, "Confirmed");

      // Show success message
      toast({
        title: "Order Confirmed",
        description:
          "Order has been confirmed successfully and is ready for dispatch.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error confirming order:", error);
      toast({
        title: "Error",
        description: "Failed to confirm order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpenEditOrderDialog = (order) => {
    setSelectedOrder(order);
    setIsEditOrderDialogOpen(true);
  };

  const handleUpdateOrder = (updatedData) => {
    updateOrderDetails(selectedOrder.id, updatedData);
    setIsEditOrderDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleOpenDispatchDialog = (order, type) => {
    setSelectedOrder(order);
    setDispatchType(type);
    setIsDispatchDialogOpen(true);
  };

  // Updated handleDispatch function with stock deduction logic
  const handleDispatch = async (dispatchData) => {
    try {
      if (!selectedOrder || !selectedOrder.items) {
        toast({
          title: "Error",
          description: "Order not found or has no items",
          variant: "destructive",
        });
        return;
      }

      const { dispatchedItems, transportName, dispatchType } = dispatchData;

      if (!dispatchedItems || dispatchedItems.length === 0) {
        toast({
          title: "Error",
          description: "No items selected for dispatch",
          variant: "destructive",
        });
        return;
      }

      // Check stock availability for items being dispatched
      let stockCheckResults = [];
      for (const item of dispatchedItems) {
        const product = products?.find((p) => p.id === item.productId);

        if (!product) {
          stockCheckResults.push({
            productName: item.productName,
            error: `Product not found: ${item.productName}`,
          });
          continue;
        }

        const currentStock = product.stock || 0;
        const quantityToDispatch = item.quantity || 0;

        if (currentStock < quantityToDispatch) {
          stockCheckResults.push({
            productName: item.productName,
            error: `Insufficient stock for ${item.productName}. Available: ${currentStock}, Requested: ${quantityToDispatch}`,
          });
        }
      }

      // If there are stock issues, show error and don't proceed
      if (stockCheckResults.length > 0) {
        const errorMessages = stockCheckResults
          .map((result) => result.error)
          .join("\n");
        toast({
          title: "Stock Insufficient",
          description: errorMessages,
          variant: "destructive",
        });
        return;
      }

      // All stock checks passed, proceed with stock deduction
      const stockUpdatePromises = dispatchedItems.map(async (item) => {
        const product = products.find((p) => p.id === item.productId);
        if (product && updateProductStock) {
          const quantityToDeduct = item.quantity || 0;
          const newStock = (product.stock || 0) - quantityToDeduct;
          return updateProductStock(item.productId, Math.max(0, newStock));
        }
      });

      // Execute all stock updates
      await Promise.all(stockUpdatePromises.filter(Boolean));

      // Update order items with new dispatched quantities
      const updatedItems = selectedOrder.items.map((orderItem) => {
        const dispatchedItem = dispatchedItems.find(
          (item) => item.productId === orderItem.productId
        );

        if (dispatchedItem) {
          const previouslyDispatched = orderItem.dispatchedQuantity || 0;
          const currentDispatch = dispatchedItem.quantity || 0;
          const newDispatchedQuantity = previouslyDispatched + currentDispatch;

          return {
            ...orderItem,
            dispatchedQuantity: newDispatchedQuantity,
          };
        }

        return orderItem;
      });

      // Determine if this is a full or partial dispatch
      const isFullyDispatched = updatedItems.every(
        (item) => (item.dispatchedQuantity || 0) >= (item.quantity || 0)
      );

      const newStatus = isFullyDispatched
        ? "Full Dispatch"
        : "Partial Dispatch";

      // Add the dispatched items to the existing dispatched_items array
      const existingDispatchedItems = selectedOrder.dispatched_items || [];
      const newDispatchedItems = [
        ...existingDispatchedItems,
        ...dispatchedItems,
      ];

      // Update delivered_by array (keeping it simple with transport names)
      let deliveredByData = selectedOrder.delivered_by || [];
      if (transportName && !deliveredByData.includes(transportName)) {
        deliveredByData = [...deliveredByData, transportName];
      }

      // Prepare the details object for updateOrderStatus
      const details = {
        dispatchedItems: dispatchedItems,
        transportName: transportName,
      };

      // Call updateOrderStatus with the new status and details
      updateOrderStatus(selectedOrder.id, newStatus, details);

      // Close dialog and reset state
      setIsDispatchDialogOpen(false);
      setSelectedOrder(null);

      // Show success message
      const totalQuantityDispatched = dispatchedItems.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );

      toast({
        title: `${newStatus} Successful`,
        description: `Successfully dispatched ${totalQuantityDispatched} items across ${dispatchedItems.length} product(s). Stock has been updated accordingly.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error processing dispatch:", error);
      toast({
        title: "Dispatch Error",
        description:
          "Failed to process dispatch and update stock. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Search and Filter Functions
  const handleFilterChange = (field, value) => {
    setSearchFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setSearchFilters({
      customerName: "",
      deliveryLocation: "",
      productName: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  const hasActiveFilters = Object.values(searchFilters).some(
    (value) => value !== ""
  );

  const getFilterCount = () => {
    return Object.values(searchFilters).filter((value) => value !== "").length;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to get transport names from delivered_by data
  const getTransportNames = (deliveredBy) => {
    if (!deliveredBy || !Array.isArray(deliveredBy)) return [];

    return deliveredBy
      .map((delivery) => {
        // Handle new format: direct string values
        if (typeof delivery === "string") {
          return delivery;
        }
        // Handle old format: object with transportName property
        if (typeof delivery === "object" && delivery.transportName) {
          return delivery.transportName;
        }
        return null;
      })
      .filter((name) => name && name.trim() !== "")
      .filter((name, index, arr) => arr.indexOf(name) === index); // Remove duplicates
  };

  // Helper function to get current stock for a product
  const getProductStock = (productId) => {
    const product = products?.find((p) => p.id === productId);
    return product ? product.stock || 0 : 0;
  };

  // Helper function to check if an order can be dispatched (has sufficient stock)
  const canDispatchOrder = (order, isFullDispatch = true) => {
    if (!order.items || order.items.length === 0) return false;

    return order.items.every((item) => {
      const currentStock = getProductStock(item.productId);
      const requiredQuantity = isFullDispatch ? item.quantity || 0 : 0; // For partial, we'll check in the form
      return currentStock >= requiredQuantity;
    });
  };

  // Function to export orders data to Excel
  const exportToExcel = () => {
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Format orders data for export
      const formattedOrders = filteredOrders.map((order) => {
        // Create a basic order info object
        const baseOrderInfo = {
          "Order ID": order.id,
          Customer: order.customer_name || "N/A",
          Phone: order.phone_number || "N/A",
          City: order.city || "N/A",
          "Delivery Location": order.delivery_location || "N/A",
          Status: order.status || "Unknown",
          "Order Date": formatDate(order.created_at),
          "Added By": order.added_by || "N/A",
        };

        // Handle transport info - check both transportName and delivered_by fields
        let transportName = "N/A";
        if (order.transportName) {
          transportName = order.transportName;
        } else if (
          order.delivered_by &&
          Array.isArray(order.delivered_by) &&
          order.delivered_by.length > 0
        ) {
          transportName = getTransportNames(order.delivered_by).join(", ");
        }
        baseOrderInfo["Transport"] = transportName;

        // Combine product details into a single string
        let productSummary = "No items";
        let totalPrice = 0;
        if (order.items && order.items.length > 0) {
          productSummary = order.items
            .map(
              (item) =>
                `${item.productName || item.product_name || "Unknown Product"} x${
                  item.quantity || 0
                }`
            )
            .join(", ");
          totalPrice = order.items.reduce((sum, item) => {
            const quantity = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            return sum + quantity * price;
          }, 0);
        }

        return {
          ...baseOrderInfo,
          Products: productSummary,
          "Total Price": totalPrice.toFixed(2),
        };
      });

      // Create worksheet from data
      const ws = XLSX.utils.json_to_sheet(formattedOrders);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Orders");

      // Generate Excel file
      const fileName = `Chandan_Agrico_Orders_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);

      // Show success toast
      toast({
        title: "Export Successful",
        description: `${formattedOrders.length} orders exported to Excel.`,
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting to Excel.",
        variant: "destructive",
      });
    }
  };

  // Helper to toggle expanded state
  const toggleOrderExpand = (orderId) => {
    setExpandedOrderIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Helper to compute total price and product summary for each order
  const getOrderCardData = (order) => {
    // Total price
    let totalPrice = "0.00";
    if (typeof order.totalPrice === "number") {
      totalPrice = order.totalPrice.toFixed(2);
    } else if (order.items && order.items.length > 0) {
      totalPrice = order.items
        .reduce(
          (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
          0
        )
        .toFixed(2);
    }
    // Product summary
    let productSummary = "No items";
    if (order.items && order.items.length === 1) {
      const item = order.items[0];
      const name = item.productName || item.product_name || "Unknown";
      const shortName = name.length > 20 ? name.substring(0, 18) + "..." : name;
      productSummary = `${shortName} (${item.quantity || 0} ${item.unit || "units"})`;
    } else if (order.items && order.items.length > 1) {
      const totalQty = order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      productSummary = `${order.items.length} items (${totalQty} units total)`;
    }
    return { totalPrice, productSummary };
  };

  // Pure function, no hooks inside
  const renderOrderCard = (order, actions, isExpanded, onToggleExpand, totalPrice, productSummary) => {
    const transportNames = getTransportNames(order.delivered_by);
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
              {/* Left Side - Order basics */}
              <div className="flex-1 flex items-center space-x-2">
                {/* Status indicator dot with tooltip */}
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
                
                {/* Order ID and customer name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm">
                      #{order.id || "N/A"}
                    </span>
                    <span className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {order.customer_name || "N/A"}
                    </span>
                  </div>
                  
                  {/* Compact summary row */}
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
              
              {/* Right side - Status and actions */}
              <div className="flex items-center justify-between sm:justify-end gap-2">
                {/* Status badge */}
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
                  {/* Invoice button - always visible */}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleDownloadInvoice} 
                    className="h-6 w-6 p-0 rounded-full"
                    title="Download Invoice"
                  >
                    <DownloadCloud className="h-3.5 w-3.5" />
                  </Button>
                  
                  {/* Expand/collapse indicator */}
                  <div className="h-6 w-6 flex items-center justify-center">
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>
              </div>
            </div>
              {/* Meta info row - condensed details always visible */}
            <div className="flex flex-wrap mt-1 justify-between">
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                {/* Date */}
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <Calendar className="h-2.5 w-2.5" /> 
                  {formatDate(order.created_at).split(',')[0]}
                </span>
                
                {/* Location */}
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <MapPin className="h-2.5 w-2.5" /> 
                  <span className="truncate max-w-[100px]" title={order.delivery_location || order.city || "N/A"}>
                    {order.delivery_location || order.city || "N/A"}
                  </span>
                </span>
                
                {/* Transport (if available) */}
                {(order.transportName || transportNames.length > 0) && (
                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                    <Truck className="h-2.5 w-2.5" /> 
                    <span className="truncate max-w-[80px]" title={order.transportName || transportNames.join(", ")}>
                      {order.transportName || transportNames.join(", ")}
                    </span>
                  </span>
                )}
              </div>
              
              {/* Phone (if available) - Right aligned */}
              {order.phone_number && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                  <Phone className="h-2.5 w-2.5" /> 
                  {order.phone_number}
                </span>
              )}
            </div>
          </div>

          {/* Expandable Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="border-t pt-3 pb-2">                  {/* Order Items - Detailed view */}
                  {order.items && order.items.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold">Order Items:</h4>
                      
                      {/* Items table for better use of space */}
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
                            
                            {/* Total row */}
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
                  )}                  {/* Additional details and Actions in one row */}
                  <div className="flex justify-between items-start mt-3 pt-3 border-t gap-2 flex-col sm:flex-row">
                    {/* Left side - additional details */}
                    <div className="text-xs flex flex-wrap gap-x-4 gap-y-1">
                      <div>
                        <span className="text-muted-foreground mr-1">Added By:</span>
                        <span>{order.added_by || "N/A"}</span>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground mr-1">Order Date:</span>
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                    
                    {/* Right side - action buttons */}
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
      </motion.div>
  )};

  const tabsConfig = [
    {
      value: "total_orders",
      label: "Total Orders",
      icon: BarChart3,
      data: filteredOrders,
    },
    {
      value: "unconfirmed_orders",
      label: "Unconfirmed Orders",
      icon: Clock,
      data: getOrdersByStatus("Unconfirmed"),
      actions: (order) => (
        <>
          <Button size="sm" onClick={() => handleConfirmOrder(order.id)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Confirm Order
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenEditOrderDialog(order)}
          >
            <Edit className="mr-2 h-4 w-4" /> Edit Details
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDeleteOrder(order.id)}
          >
            <X className="mr-2 h-4 w-4" /> Delete
          </Button>
        </>
      ),
    },
    {
      value: "confirmed_orders",
      label: "Confirmed Orders",
      icon: CheckCircle,
      data: getOrdersByStatus("Confirmed"),
      actions: (order) => {
        const canFullDispatch = canDispatchOrder(order, true);
        const hasAnyStock = order.items?.some(
          (item) => getProductStock(item.productId) > 0
        );

        return (
          <>
            <Button
              size="sm"
              onClick={() => handleOpenDispatchDialog(order, "full")}
              disabled={!canFullDispatch}
              className={
                !canFullDispatch ? "opacity-50 cursor-not-allowed" : ""
              }
              title={
                !canFullDispatch ? "Insufficient stock for full dispatch" : ""
              }
            >
              <PackageCheck className="mr-2 h-4 w-4" />
              {canFullDispatch ? "Full Dispatch" : "Insufficient Stock"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenDispatchDialog(order, "partial")}
              disabled={!hasAnyStock}
              title={!hasAnyStock ? "No stock available for any items" : ""}
            >
              <PackageX className="mr-2 h-4 w-4" />
              Partial Dispatch
            </Button>
          </>
        );
      },
    },
    {
      value: "full_dispatch",
      label: "Full Dispatch",
      icon: Truck,
      data: getOrdersByStatus("Full Dispatch"),
    },
    {
      value: "partial_dispatch",
      label: "Partial Dispatch",
      icon: Send,
      data: getOrdersByStatus("Partial Dispatch"),
      actions: (order) => (
        <Button
          size="sm"
          onClick={() => handleOpenDispatchDialog(order, "partial")}
        >
          <PackageX className="mr-2 h-4 w-4" /> Update Dispatch
        </Button>
      ),
    },
  ];

  // Delete order logic
  const handleDeleteOrder = async (orderId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this order? This action cannot be undone."
      )
    )
      return;
    await deleteOrder(orderId);
    toast({
      title: "Order Deleted",
      description: "Order has been deleted successfully.",
      variant: "default",
    });
  };

  // Delete all orders logic
  const handleDeleteAllOrders = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete ALL orders? This action cannot be undone and will remove all order data."
      )
    )
      return;
    for (const order of orders) {
      await deleteOrder(order.id);
    }
    toast({
      title: "All Orders Deleted",
      description: "All orders have been deleted successfully.",
      variant: "default",
    });
  };

  // Helper: Get product quantity summary for a list of orders
  const getProductQuantitySummary = (orders) => {
    const summary = {};
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const name = item.productName || item.product_name || 'Unknown Product';
          const qty = Number(item.quantity) || 0;
          if (!summary[name]) summary[name] = 0;
          summary[name] += qty;
        });
      }
    });
    return summary;
  };

  // Component: ProductQuantitySummary
  const ProductQuantitySummary = ({ orders }) => {
    const summary = getProductQuantitySummary(orders);
    const productNames = Object.keys(summary);
    if (productNames.length === 0) return null;
    return (
      <div className="mb-4 p-4 rounded bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2 text-sm">Product Quantity Summary</h3>
        <div className="flex flex-wrap gap-3">
          {productNames.map(name => {
            // Find product in products context
            const product = products?.find(
              p => (p.productName || p.product_name) === name || p.name === name
            );
            const stock = product ? product.stock ?? 0 : 0;
            const ordered = summary[name];
            const shortage = ordered > stock ? ordered - stock : 0;
            return (
              <div
                key={name}
                className={`text-xs px-3 py-1 rounded shadow-sm ${ordered > stock ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-blue-100 text-blue-900'}`}
              >
                <span className="font-medium">{name}:</span> {ordered}
                <span className="ml-2">(Stock: {stock})</span>
                {ordered > stock && (
                  <span className="ml-2 text-red-700 font-semibold">Need {shortage} more</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics Board</h1>
          <p className="text-muted-foreground text-sm">
            Track and manage your orders through different stages.
          </p>
        </div>
        <div className="w-full sm:w-auto flex flex-wrap gap-2 mt-2 sm:mt-0">
          <Button
            onClick={exportToExcel}
            className="flex items-center justify-center gap-1.5 h-8 text-xs sm:text-sm"
            variant="outline"
            size="sm"
          >
            <DownloadCloud className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Export to Excel</span>
          </Button>
          <Button
            onClick={handleDeleteAllOrders}
            className="flex items-center justify-center gap-1.5 h-8 text-xs sm:text-sm"
            variant="destructive"
            size="sm"
          >
            <X className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Delete All</span>
          </Button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              <CardTitle>Search & Filters</CardTitle>
              {hasActiveFilters && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  {getFilterCount()} active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="customer-search"
                      className="text-sm font-medium"
                    >
                      Customer Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <select
                        id="customer-search"
                        value={searchFilters.customerName}
                        onChange={(e) => handleFilterChange("customerName", e.target.value)}
                        className="pl-9 w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">All Customers</option>
                        {[...new Set(orders.map(order => order.customer_name).filter(Boolean))].map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="location-search"
                      className="text-sm font-medium"
                    >
                      Delivery Location
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location-search"
                        placeholder="Search by location..."
                        value={searchFilters.deliveryLocation}
                        onChange={(e) =>
                          handleFilterChange("deliveryLocation", e.target.value)
                        }
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Add this new product name filter */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="product-search"
                      className="text-sm font-medium"
                    >
                      Product Name
                    </Label>
                    <div className="relative">
                      <PackageCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <select
                        id="product-search"
                        value={searchFilters.productName}
                        onChange={(e) => handleFilterChange("productName", e.target.value)}
                        className="pl-9 w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">All Products</option>
                        {[...new Set(orders.flatMap(order => (order.items || []).map(item => item.productName || item.product_name)).filter(Boolean))].map((product) => (
                          <option key={product} value={product}>{product}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date-from" className="text-sm font-medium">
                      From Date
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="date-from"
                        type="date"
                        value={searchFilters.dateFrom}
                        onChange={(e) =>
                          handleFilterChange("dateFrom", e.target.value)
                        }
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date-to" className="text-sm font-medium">
                      To Date
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="date-to"
                        type="date"
                        value={searchFilters.dateTo}
                        onChange={(e) =>
                          handleFilterChange("dateTo", e.target.value)
                        }
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Active filters:</span>
                      <div className="flex flex-wrap gap-1">
                        {searchFilters.customerName && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                            Customer: {searchFilters.customerName}
                          </span>
                        )}
                        {searchFilters.deliveryLocation && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                            Location: {searchFilters.deliveryLocation}
                          </span>
                        )}
                        {/* Add this new filter tag */}
                        {searchFilters.productName && (
                          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">
                            Product: {searchFilters.productName}
                          </span>
                        )}
                        {searchFilters.dateFrom && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                            From:{" "}
                            {new Date(
                              searchFilters.dateFrom
                            ).toLocaleDateString()}
                          </span>
                        )}
                        {searchFilters.dateTo && (
                          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">
                            To:{" "}
                            {new Date(
                              searchFilters.dateTo
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">        <TabsList className="grid w-full grid-cols-5 gap-1 h-auto p-1 overflow-x-auto scrollbar-hide">
          {tabsConfig.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center justify-center gap-1 text-xs md:text-sm px-2 py-1.5 min-h-[2.25rem] whitespace-nowrap"
            >
              <tab.icon className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
              <div className="flex items-center gap-1 min-w-0">
                <span className="hidden xs:inline truncate">
                  {tab.label.split(" ")[0]}
                </span>
                <span className="text-xs opacity-75 whitespace-nowrap">
                  ({tab.data.length})
                </span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabsConfig.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="mt-2 sm:mt-4"
          >
            {(tab.value === "unconfirmed_orders" || tab.value === "confirmed_orders") && (
              <ProductQuantitySummary orders={tab.data} />
            )}            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-1.5 text-base sm:text-lg">
                    <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </CardTitle>
                  
                  <CardDescription className="m-0 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{tab.data.length}</span> orders
                      {hasActiveFilters &&
                        filteredOrders.length !== orders.length && (
                          <span className="text-primary">
                            (filtered from{" "}
                            {
                              orders.filter((order) =>
                                tab.value === "total_orders"
                                  ? true
                                  : order.status ===
                                  tab.label
                                    .replace(" Orders", "")
                                    .replace(" Dispatch", " Dispatch")
                              ).length
                            })
                          </span>
                        )}
                    </div>
                  </CardDescription>
                </div>
              </CardHeader>              <CardContent className="px-2 sm:px-4 py-2">
                {tab.data.length > 0 ? (
                  <AnimatePresence>
                    <div className="space-y-1.5">
                      {tab.data.map((order) => {
                        const { totalPrice, productSummary } = getOrderCardData(order);
                        return renderOrderCard(
                          order,
                          tab.actions,
                          expandedOrderIds.has(order.id),
                          toggleOrderExpand,
                          totalPrice,
                          productSummary
                        );
                      })}
                    </div>
                  </AnimatePresence>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mb-3 sm:mb-4">
                      <tab.icon className="h-full w-full" />
                    </div>
                    <p className="text-muted-foreground mb-2 text-sm sm:text-base px-4">
                      {hasActiveFilters
                        ? "No orders match your search criteria."
                        : "No orders in this category."}
                    </p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="text-xs sm:text-sm"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Clear filters
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog
        open={isEditOrderDialogOpen}
        onOpenChange={setIsEditOrderDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <OrderDetailsForm
              order={selectedOrder}
              onSubmit={handleUpdateOrder}
              onCancel={() => setIsEditOrderDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDispatchDialogOpen}
        onOpenChange={setIsDispatchDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {dispatchType === "full"
                ? "Confirm Full Dispatch"
                : "Manage Partial Dispatch"}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <DispatchForm
              order={selectedOrder}
              dispatchType={dispatchType}
              onSubmit={handleDispatch}
              onCancel={() => setIsDispatchDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnalyticsBoardPage;
