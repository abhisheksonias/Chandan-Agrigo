import React, { useState, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import OrderCard from "@/components/OrderCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { generateDispatchPDF } from "@/hooks/pdfGenerator";

const PastOrders = () => {
  const { orders, products } = useAppContext();
  const [expandedOrderIds, setExpandedOrderIds] = useState(new Set());

  // Only show orders that are fully dispatched (past orders)
  const pastOrders = useMemo(() => orders.filter(order => order.status === "Full Dispatch"), [orders]);

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
      <Card>
        <CardHeader>
          <CardTitle>All Fully Dispatched Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {pastOrders.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No past orders found.</div>
          ) : (
            <div className="space-y-2">
              {pastOrders.map((order) => {
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PastOrders;
