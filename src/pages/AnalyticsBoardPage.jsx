import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, CheckCircle, Clock, Truck, PackageCheck, PackageX, Edit, Send } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import OrderDetailsForm from '@/components/forms/OrderDetailsForm'; 
import DispatchForm from '@/components/forms/DispatchForm';

const AnalyticsBoardPage = () => {
  const { orders, updateOrderStatus, updateOrderDetails } = useAppContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('total_orders');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [isDispatchDialogOpen, setIsDispatchDialogOpen] = useState(false);
  const [dispatchType, setDispatchType] = useState(''); // 'full' or 'partial'

  const getOrdersByStatus = (status) => orders.filter(order => order.status === status);
  const getDispatchedOrders = () => orders.filter(order => order.status === 'Full Dispatch' || order.status === 'Partial Dispatch');

  const handleConfirmOrder = (orderId) => {
    updateOrderStatus(orderId, 'Confirmed');
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

  const handleDispatch = (dispatchData) => {
    if (dispatchType === 'full') {
      updateOrderStatus(selectedOrder.id, 'Full Dispatch');
    } else if (dispatchType === 'partial') {
      updateOrderStatus(selectedOrder.id, 'Partial Dispatch', { dispatchedItems: dispatchData.dispatchedItems });
    }
    setIsDispatchDialogOpen(false);
    setSelectedOrder(null);
  };

  const renderOrderCard = (order, actions) => (
    <motion.div
      key={order.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      layout
    >
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Order ID: {order.id.substring(0, 8)}...</CardTitle>
              <CardDescription>Customer: {order.customerName} ({order.city})</CardDescription>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              order.status === 'Unconfirmed' ? 'bg-yellow-100 text-yellow-700' :
              order.status === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
              order.status === 'Partial Dispatch' ? 'bg-orange-100 text-orange-700' :
              order.status === 'Full Dispatch' ? 'bg-green-100 text-green-700' : ''
            }`}>
              {order.status}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm"><strong>Delivery Location:</strong> {order.deliveryLocation}</p>
          <p className="text-sm"><strong>Added By:</strong> {order.added_by}</p>
          <p className="text-sm"><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
          <div className="mt-2">
            <h4 className="text-sm font-semibold">Items:</h4>
            <ul className="list-disc list-inside text-sm">
              {order.items.map((item, index) => (
                <li key={index}>
                  {item.productName}: {item.quantity} {item.unit}
                  {order.status === 'Partial Dispatch' && item.dispatchedQuantity > 0 && 
                    <span className="text-orange-600 ml-2">(Dispatched: {item.dispatchedQuantity})</span>
                  }
                </li>
              ))}
            </ul>
          </div>
          {actions && <div className="mt-4 flex space-x-2">{actions(order)}</div>}
        </CardContent>
      </Card>
    </motion.div>
  );

  const tabsConfig = [
    { value: 'total_orders', label: 'Total Orders', icon: BarChart3, data: orders },
    { 
      value: 'unconfirmed_orders', 
      label: 'Unconfirmed Orders', 
      icon: Clock, 
      data: getOrdersByStatus('Unconfirmed'),
      actions: (order) => (
        <>
          <Button size="sm" onClick={() => handleConfirmOrder(order.id)}>
            <CheckCircle className="mr-2 h-4 w-4" /> Confirm Order
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleOpenEditOrderDialog(order)}>
            <Edit className="mr-2 h-4 w-4" /> Edit Details
          </Button>
        </>
      )
    },
    { 
      value: 'confirmed_orders', 
      label: 'Confirmed Orders', 
      icon: CheckCircle, 
      data: getOrdersByStatus('Confirmed'),
      actions: (order) => (
        <>
          <Button size="sm" onClick={() => handleOpenDispatchDialog(order, 'full')}>
            <PackageCheck className="mr-2 h-4 w-4" /> Full Dispatch
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleOpenDispatchDialog(order, 'partial')}>
            <PackageX className="mr-2 h-4 w-4" /> Partial Dispatch
          </Button>
        </>
      )
    },
    { value: 'full_dispatch', label: 'Full Dispatch', icon: Truck, data: getOrdersByStatus('Full Dispatch') },
    { 
      value: 'partial_dispatch', 
      label: 'Partial Dispatch', 
      icon: Send, 
      data: getOrdersByStatus('Partial Dispatch'),
      actions: (order) => (
        <Button size="sm" onClick={() => handleOpenDispatchDialog(order, 'partial')}>
          <PackageX className="mr-2 h-4 w-4" /> Update Dispatch
        </Button>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Board</h1>
          <p className="text-muted-foreground">Track and manage your orders through different stages.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          {tabsConfig.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" /> {tab.label} ({tab.data.length})
            </TabsTrigger>
          ))}
        </TabsList>
        
        {tabsConfig.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><tab.icon className="h-5 w-5" /> {tab.label}</CardTitle>
                <CardDescription>Showing {tab.data.length} orders.</CardDescription>
              </CardHeader>
              <CardContent>
                {tab.data.length > 0 ? (
                  <AnimatePresence>
                    {tab.data.map(order => renderOrderCard(order, tab.actions))}
                  </AnimatePresence>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No orders in this category.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isEditOrderDialogOpen} onOpenChange={setIsEditOrderDialogOpen}>
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

      <Dialog open={isDispatchDialogOpen} onOpenChange={setIsDispatchDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{dispatchType === 'full' ? 'Confirm Full Dispatch' : 'Manage Partial Dispatch'}</DialogTitle>
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