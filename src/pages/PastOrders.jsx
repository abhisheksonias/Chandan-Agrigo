import React, { useState, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import OrderCard from "@/components/OrderCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadCloud } from "lucide-react";
import { generateDispatchPDF } from "@/hooks/pdfGenerator";
import * as XLSX from "xlsx";
import { useToast } from "@/components/ui/use-toast";

const PastOrders = () => {
  const { orders, products } = useAppContext();
  const { toast } = useToast();
  const [expandedOrderIds, setExpandedOrderIds] = useState(new Set());
  const [expandedMonths, setExpandedMonths] = useState({}); // Track expanded/collapsed months

  // Only show orders that are fully dispatched (past orders)
  const pastOrders = useMemo(() => orders.filter(order => order.status === "Full Dispatch"), [orders]);

  // Group orders by month-year
  const ordersByMonth = useMemo(() => {
    const groups = {};
    pastOrders.forEach(order => {
      const date = new Date(order.created_at);
      const month = date.toLocaleString("en-US", { month: "long" });
      const year = date.getFullYear();
      const key = `${month} ${year}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(order);
    });
    // Sort months descending (latest first)
    return Object.entries(groups).sort((a, b) => {
      const [monthA, yearA] = a[0].split(" ");
      const [monthB, yearB] = b[0].split(" ");
      const dateA = new Date(`${monthA} 1, ${yearA}`);
      const dateB = new Date(`${monthB} 1, ${yearB}`);
      return dateB - dateA;
    });
  }, [pastOrders]);

  // Helper to toggle expanded state for months
  const toggleMonthExpand = (monthKey) => {
    setExpandedMonths(prev => ({ ...prev, [monthKey]: !prev[monthKey] }));
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
    let totalPrice = "0.00";
    if (typeof order.totalPrice === "number") {
      totalPrice = order.totalPrice.toFixed(2);
    } else if (order.items && order.items.length > 0) {
      totalPrice = order.items
        .reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0)
        .toFixed(2);
    }
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

  // Utility functions needed by OrderCard
  const getTransportNames = (deliveredBy) => {
    if (!deliveredBy || !Array.isArray(deliveredBy)) return [];
    return deliveredBy
      .map((delivery) => {
        if (typeof delivery === "string") return delivery;
        if (typeof delivery === "object" && delivery.transportName) return delivery.transportName;
        return null;
      })
      .filter((name) => name && name.trim() !== "")
      .filter((name, index, arr) => arr.indexOf(name) === index);
  };
  const getProductStock = (productId) => {
    const product = products?.find((p) => p.id === productId);
    return product ? product.stock || 0 : 0;
  };  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  // Function to export monthly orders data to Excel
  const exportMonthToExcel = (monthKey, monthOrders) => {
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Format orders data for export - each product will be a separate row
      const formattedOrdersData = [];

      // Sort orders by creation time in descending order (latest first)
      const sortedOrders = [...monthOrders].sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });

      // Process each order
      sortedOrders.forEach((order) => {
        // Create a basic order info object with common fields
        const baseOrderInfo = {
          "Order ID": order.id,
          "Customer Name": order.customer_name || "N/A",
          "Phone": order.phone_number || "N/A",
          "City": order.city || "N/A",
          "Delivery Location": order.delivery_location || "N/A",
          "Status": order.status || "Unknown",
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

        // Calculate order total price
        let totalOrderPrice = 0;
        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
          totalOrderPrice = order.items.reduce((sum, item) => {
            const quantity = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            return sum + quantity * price;
          }, 0);
        }
          // If order has no items, add a single row with the order info
        if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
          formattedOrdersData.push({
            ...baseOrderInfo,
            "Product Name": "No items",
            "Quantity": "",
            "Unit": "",
            "Price Per Unit": "",
            "Product Total": "",
            "Order Total": totalOrderPrice.toFixed(2),
          });
          
          // Add a blank row after this order for better readability
          formattedOrdersData.push({
            "Order ID": "",
            "Customer Name": "",
            "Phone": "",
            "City": "",
            "Delivery Location": "",
            "Status": "",
            "Order Date": "",
            "Added By": "",
            "Transport": "",
            "Product Name": "",
            "Quantity": "",
            "Unit": "",
            "Price Per Unit": "",
            "Product Total": "",
            "Order Total": "",
          });
        } else {// Add each product as a separate row
          order.items.forEach((item, index) => {
            const productName = item.productName || item.product_name || "Unknown Product";
            const quantity = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            const productTotal = quantity * price;
            const unit = item.unit || "units";
            
            // For first product row, include all order details
            // For subsequent rows, leave order details blank to avoid repetition
            const rowData = index === 0 
              ? {
                  ...baseOrderInfo,
                  "Product Name": productName,
                  "Quantity": quantity,
                  "Unit": unit,
                  "Price Per Unit": price.toFixed(2),
                  "Product Total": productTotal.toFixed(2),
                  "Order Total": totalOrderPrice.toFixed(2),
                }
              : {
                  "Order ID": order.id, // Keep Order ID on all rows for reference
                  "Customer Name": "",
                  "Phone": "",
                  "City": "",
                  "Delivery Location": "",
                  "Status": "",
                  "Order Date": "",
                  "Added By": "",
                  "Transport": "",
                  "Product Name": productName,
                  "Quantity": quantity,
                  "Unit": unit,
                  "Price Per Unit": price.toFixed(2),
                  "Product Total": productTotal.toFixed(2),
                  "Order Total": "",
                };
            
            formattedOrdersData.push(rowData);
          });
            // Add a summary row for the order if there are multiple products
          if (order.items.length > 1) {
            formattedOrdersData.push({
              "Order ID": order.id,
              "Customer Name": "",
              "Phone": "",
              "City": "",
              "Delivery Location": "",
              "Status": "",
              "Order Date": "",
              "Added By": "",
              "Transport": "",
              "Product Name": `--- Order Summary (${order.items.length} items) ---`,
              "Quantity": order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
              "Unit": "total",
              "Price Per Unit": "",
              "Product Total": "",
              "Order Total": totalOrderPrice.toFixed(2),
            });
            
            // Add a blank row after each order for better readability
            formattedOrdersData.push({
              "Order ID": "",
              "Customer Name": "",
              "Phone": "",
              "City": "",
              "Delivery Location": "",
              "Status": "",
              "Order Date": "",
              "Added By": "",
              "Transport": "",
              "Product Name": "",
              "Quantity": "",
              "Unit": "",
              "Price Per Unit": "",
              "Product Total": "",
              "Order Total": "",
            });
          } else {
            // Add a blank row after single product orders too
            formattedOrdersData.push({
              "Order ID": "",
              "Customer Name": "",
              "Phone": "",
              "City": "",
              "Delivery Location": "",
              "Status": "",
              "Order Date": "",
              "Added By": "",
              "Transport": "",
              "Product Name": "",
              "Quantity": "",
              "Unit": "",
              "Price Per Unit": "",
              "Product Total": "",
              "Order Total": "",
            });
          }
        }
      });
      
      // Create worksheet from data
      const ws = XLSX.utils.json_to_sheet(formattedOrdersData);
      
      // Add headers styling (make them bold)
      const headerStyle = {
        font: { bold: true },
        alignment: { horizontal: 'center' }
      };
      
      // Get the headers range (A1:Q1)
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = headerStyle;
      }
      
      // Auto-size columns (optional enhancement)
      const colWidths = {};
      formattedOrdersData.forEach(row => {
        Object.keys(row).forEach(key => {
          const value = String(row[key] || "");
          colWidths[key] = Math.max(colWidths[key] || 0, value.length);
        });
      });
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, monthKey);

      // Generate Excel file
      const fileName = `Chandan_Agrico_Orders_${monthKey.replace(" ", "_")}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      // Show success toast
      toast({
        title: "Export Successful",
        description: `${monthOrders.length} orders from ${monthKey} exported to Excel.`,
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Past Orders</h1>
      {ordersByMonth.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Fully Dispatched Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">No past orders found.</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ordersByMonth.map(([monthKey, orders]) => {
            // Calculate total sales for the month
            const monthTotal = orders.reduce((sum, order) => {
              if (typeof order.totalPrice === "number") return sum + order.totalPrice;
              if (order.items && order.items.length > 0) {
                return sum + order.items.reduce((s, item) => s + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
              }
              return sum;
            }, 0);
            return (              <Card key={monthKey}>
                <CardHeader
                  className="flex flex-row items-center justify-between"
                >
                  <div 
                    className="flex-grow cursor-pointer flex items-center"
                    onClick={() => toggleMonthExpand(monthKey)}
                  >
                    <CardTitle className="flex items-center gap-2">
                      {monthKey}
                      <span className="ml-2 text-xs text-muted-foreground">({orders.length} order{orders.length !== 1 ? 's' : ''})</span>
                      <span className="ml-4 text-sm font-semibold text-green-700">₹{monthTotal.toFixed(2)}</span>
                    </CardTitle>
                    <span className="text-lg ml-3">{expandedMonths[monthKey] ? '▼' : '▶'}</span>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      exportMonthToExcel(monthKey, orders);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center gap-1.5 text-xs"
                  >
                    <DownloadCloud className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Export to Excel</span>
                  </Button>
                </CardHeader>
                {expandedMonths[monthKey] && (
                  <CardContent>
                    <div className="space-y-2">
                      {[...orders]
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .map((order) => {
                          const { totalPrice, productSummary } = getOrderCardData(order);
                          return (
                            <OrderCard
                              key={order.id}
                              order={order}
                              isExpanded={expandedOrderIds.has(order.id)}
                              onToggleExpand={toggleOrderExpand}
                              totalPrice={totalPrice}
                              productSummary={productSummary}
                              getTransportNames={getTransportNames}
                              getProductStock={getProductStock}
                              formatDate={formatDate}
                              generateDispatchPDF={generateDispatchPDF}
                            />
                          );
                        })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PastOrders;
