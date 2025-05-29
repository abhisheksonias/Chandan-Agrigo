import React, { useState, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import OrderCard from "@/components/OrderCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { generateDispatchPDF } from "@/hooks/pdfGenerator";

const PastOrders = () => {
  const { orders, products } = useAppContext();
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
            return (
              <Card key={monthKey}>
                <CardHeader
                  className="cursor-pointer flex flex-row items-center justify-between"
                  onClick={() => toggleMonthExpand(monthKey)}
                >
                  <CardTitle className="flex items-center gap-2">
                    {monthKey}
                    <span className="ml-2 text-xs text-muted-foreground">({orders.length} order{orders.length !== 1 ? 's' : ''})</span>
                    <span className="ml-4 text-sm font-semibold text-green-700">₹{monthTotal.toFixed(2)}</span>
                  </CardTitle>
                  <span className="text-lg">{expandedMonths[monthKey] ? '▼' : '▶'}</span>
                </CardHeader>
                {expandedMonths[monthKey] && (
                  <CardContent>
                    <div className="space-y-2">
                      {orders.map((order) => {
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
