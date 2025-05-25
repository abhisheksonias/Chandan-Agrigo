import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, CheckCircle, Clock, Truck, PackageCheck, PackageX, Edit, Send, MapPin, User, Phone, Calendar, Search, Filter, X } from 'lucide-react';
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
  
  // Search and Filter States
  const [searchFilters, setSearchFilters] = useState({
    customerName: '',
    deliveryLocation: '',
    dateFrom: '',
    dateTo: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filtered orders based on search criteria
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesCustomerName = !searchFilters.customerName || 
        (order.customer_name || '').toLowerCase().includes(searchFilters.customerName.toLowerCase());
      
      const matchesDeliveryLocation = !searchFilters.deliveryLocation || 
        (order.delivery_location || '').toLowerCase().includes(searchFilters.deliveryLocation.toLowerCase());
      
      const orderDate = new Date(order.created_at);
      const matchesDateFrom = !searchFilters.dateFrom || 
        orderDate >= new Date(searchFilters.dateFrom);
      
      const matchesDateTo = !searchFilters.dateTo || 
        orderDate <= new Date(searchFilters.dateTo + 'T23:59:59');
      
      return matchesCustomerName && matchesDeliveryLocation && matchesDateFrom && matchesDateTo;
    });
  }, [orders, searchFilters]);

  const getOrdersByStatus = (status) => filteredOrders.filter(order => order.status === status);
  const getDispatchedOrders = () => filteredOrders.filter(order => order.status === 'Full Dispatch' || order.status === 'Partial Dispatch');

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

  // Search and Filter Functions
  const handleFilterChange = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setSearchFilters({
      customerName: '',
      deliveryLocation: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const hasActiveFilters = Object.values(searchFilters).some(value => value !== '');

  const getFilterCount = () => {
    return Object.values(searchFilters).filter(value => value !== '').length;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOrderCard = (order, actions) => (
    <motion.div
      key={order.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      layout
    >
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg">Order ID: {order.id?.substring(0, 8)}...</CardTitle>
              <CardDescription className="mt-1">
                <div className="flex items-center gap-1 mb-1">
                  <User className="h-3 w-3" />
                  <span>{order.customer_name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <MapPin className="h-3 w-3" />
                  <span>{order.city || 'N/A'}</span>
                </div>
                {order.phone_number && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{order.phone_number}</span>
                  </div>
                )}
              </CardDescription>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
              order.status === 'Unconfirmed' ? 'bg-yellow-100 text-yellow-700' :
              order.status === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
              order.status === 'Partial Dispatch' ? 'bg-orange-100 text-orange-700' :
              order.status === 'Full Dispatch' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {order.status || 'Unknown'}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Delivery Location:</p>
                  <p className="text-sm text-muted-foreground">{order.delivery_location || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Order Date:</p>
                  <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Added By:</p>
                <p className="text-sm text-muted-foreground">{order.added_by || 'N/A'}</p>
              </div>
              
              {order.updated_at && order.updated_at !== order.created_at && (
                <div>
                  <p className="text-sm font-medium">Last Updated:</p>
                  <p className="text-sm text-muted-foreground">{formatDate(order.updated_at)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <PackageCheck className="h-4 w-4" />
              Order Items:
            </h4>
            
            {order.items && order.items.length > 0 ? (
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.productName || item.product_name || 'Unknown Product'}</p>
                      <p className="text-xs text-muted-foreground">
                        Quantity: {item.quantity || 0} {item.unit || 'units'}
                      </p>
                    </div>
                    {order.status === 'Partial Dispatch' && item.dispatchedQuantity > 0 && (
                      <div className="text-right">
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          Dispatched: {item.dispatchedQuantity}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No items listed</p>
            )}
          </div>

          {actions && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-2">{actions(order)}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const tabsConfig = [
    { value: 'total_orders', label: 'Total Orders', icon: BarChart3, data: filteredOrders },
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
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-search" className="text-sm font-medium">
                      Customer Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="customer-search"
                        placeholder="Search by customer name..."
                        value={searchFilters.customerName}
                        onChange={(e) => handleFilterChange('customerName', e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location-search" className="text-sm font-medium">
                      Delivery Location
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location-search"
                        placeholder="Search by location..."
                        value={searchFilters.deliveryLocation}
                        onChange={(e) => handleFilterChange('deliveryLocation', e.target.value)}
                        className="pl-9"
                      />
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
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
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
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
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
                        {searchFilters.dateFrom && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                            From: {new Date(searchFilters.dateFrom).toLocaleDateString()}
                          </span>
                        )}
                        {searchFilters.dateTo && (
                          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">
                            To: {new Date(searchFilters.dateTo).toLocaleDateString()}
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          {tabsConfig.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" /> 
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              ({tab.data.length})
            </TabsTrigger>
          ))}
        </TabsList>
        
        {tabsConfig.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <tab.icon className="h-5 w-5" /> {tab.label}
                </CardTitle>
                <CardDescription>
                  Showing {tab.data.length} orders
                  {hasActiveFilters && filteredOrders.length !== orders.length && (
                    <span className="text-primary ml-1">
                      (filtered from {orders.filter(order => 
                        tab.value === 'total_orders' ? true : order.status === tab.label.replace(' Orders', '').replace(' Dispatch', ' Dispatch')
                      ).length} total)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tab.data.length > 0 ? (
                  <AnimatePresence>
                    {tab.data.map(order => renderOrderCard(order, tab.actions))}
                  </AnimatePresence>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4">
                      <tab.icon className="h-full w-full" />
                    </div>
                    <p className="text-muted-foreground mb-2">
                      {hasActiveFilters ? 'No orders match your search criteria.' : 'No orders in this category.'}
                    </p>
                    {hasActiveFilters && (
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-1" />
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