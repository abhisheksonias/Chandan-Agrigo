import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

const AppContext = createContext(undefined);

const initialProducts = [
  { id: 'prod_1', name: 'Organic Fertilizer A', sku: 'SKU-FER-A-001', unit: 'Bag (50kg)', stock: 150, image: 'https://images.unsplash.com/photo-1597049090753-524431009bBC?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=60', stockHistory: [{ date: new Date().toISOString(), quantity: 150, type: 'initial' }] },
  { id: 'prod_2', name: 'Pesticide B', sku: 'SKU-PES-B-002', unit: 'Bottle (1L)', stock: 300, image: 'https://images.unsplash.com/photo-1620003042996-56c75a099e88?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=60', stockHistory: [{ date: new Date().toISOString(), quantity: 300, type: 'initial' }] },
  { id: 'prod_3', name: 'High-Yield Seeds C', sku: 'SKU-SEE-C-003', unit: 'Packet (1kg)', stock: 500, image: 'https://images.unsplash.com/photo-1586701541420-c00500c782ac?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=60', stockHistory: [{ date: new Date().toISOString(), quantity: 500, type: 'initial' }] },
];

const initialCustomers = [
  { id: 'cust_1', name: 'Green Valley Farms', city: 'Springfield', phone: '555-0101' },
  { id: 'cust_2', name: 'Sunrise Agriculture', city: 'Rivertown', phone: '555-0202' },
  { id: 'cust_3', name: 'Golden Harvest Co.', city: 'Meadowbrook', phone: '555-0303' },
];

const initialTransports = [
  { id: 'trans_1', name: 'AgriHaul Logistics', address: '123 Farm Road, Springfield' },
  { id: 'trans_2', name: 'CropMovers Inc.', address: '456 Harvest Lane, Rivertown' },
];

const initialOrders = [
  { 
    id: 'ord_1', 
    customerId: 'cust_1', 
    customerName: 'Green Valley Farms',
    city: 'Springfield',
    phoneNumber: '555-0101',
    deliveryLocation: 'Farm Plot A, Springfield', 
    addedBy: 'Admin', 
    status: 'Unconfirmed', 
    items: [{ productId: 'prod_1', productName: 'Organic Fertilizer A', quantity: 10, unit: 'Bag (50kg)' }],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    dispatchedItems: []
  },
  { 
    id: 'ord_2', 
    customerId: 'cust_2', 
    customerName: 'Sunrise Agriculture',
    city: 'Rivertown',
    phoneNumber: '555-0202',
    deliveryLocation: 'Warehouse 3, Rivertown', 
    addedBy: 'Admin', 
    status: 'Confirmed', 
    items: [{ productId: 'prod_2', productName: 'Pesticide B', quantity: 5, unit: 'Bottle (1L)' }, { productId: 'prod_3', productName: 'High-Yield Seeds C', quantity: 20, unit: 'Packet (1kg)' }],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    dispatchedItems: []
  },
];


export const AppProvider = ({ children }) => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transports, setTransports] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        const storedProducts = localStorage.getItem('agripro-products');
        const storedCustomers = localStorage.getItem('agripro-customers');
        const storedTransports = localStorage.getItem('agripro-transports');
        const storedOrders = localStorage.getItem('agripro-orders');
        
        setProducts(storedProducts ? JSON.parse(storedProducts) : initialProducts);
        setCustomers(storedCustomers ? JSON.parse(storedCustomers) : initialCustomers);
        setTransports(storedTransports ? JSON.parse(storedTransports) : initialTransports);
        setOrders(storedOrders ? JSON.parse(storedOrders) : initialOrders);
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
        toast({ title: 'Error', description: 'Failed to load app data', variant: 'destructive' });
        setProducts(initialProducts);
        setCustomers(initialCustomers);
        setTransports(initialTransports);
        setOrders(initialOrders);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [toast]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('agripro-products', JSON.stringify(products));
      localStorage.setItem('agripro-customers', JSON.stringify(customers));
      localStorage.setItem('agripro-transports', JSON.stringify(transports));
      localStorage.setItem('agripro-orders', JSON.stringify(orders));
    }
  }, [products, customers, transports, orders, isLoading]);

  const generateSku = (productName) => {
    const prefix = productName.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `SKU-${prefix}-${randomNum}`;
  };

  const addProduct = (productData) => {
    const newProduct = { 
      ...productData, 
      id: `prod_${crypto.randomUUID()}`, 
      sku: generateSku(productData.name),
      stock: parseInt(productData.stock, 10) || 0,
      stockHistory: [{ date: new Date().toISOString(), quantity: parseInt(productData.stock, 10) || 0, type: 'initial' }]
    };
    setProducts(prev => [...prev, newProduct]);
    toast({ title: 'Product Added', description: `${newProduct.name} has been added.` });
    return newProduct;
  };

  const updateProductStock = (productId, newStock, type = 'manual update') => {
    setProducts(prevProducts => 
      prevProducts.map(p => 
        p.id === productId 
        ? { 
            ...p, 
            stock: newStock, 
            stockHistory: [...(p.stockHistory || []), { date: new Date().toISOString(), quantity: newStock, type }] 
          } 
        : p
      )
    );
    const product = products.find(p => p.id === productId);
    toast({ title: 'Stock Updated', description: `Stock for ${product?.name} updated to ${newStock}.` });
  };
  
  const addCustomer = (customerData) => {
    const newCustomer = { ...customerData, id: `cust_${crypto.randomUUID()}` };
    setCustomers(prev => [...prev, newCustomer]);
    toast({ title: 'Customer Added', description: `${newCustomer.name} has been added.` });
    return newCustomer;
  };

  const addTransport = (transportData) => {
    const newTransport = { ...transportData, id: `trans_${crypto.randomUUID()}` };
    setTransports(prev => [...prev, newTransport]);
    toast({ title: 'Transport Added', description: `${newTransport.name} has been added.` });
    return newTransport;
  };

  const addOrder = (orderData) => {
    const newOrder = { 
      ...orderData, 
      id: `ord_${crypto.randomUUID()}`, 
      status: 'Unconfirmed', 
      createdAt: new Date().toISOString(),
      dispatchedItems: [] 
    };
    setOrders(prev => [...prev, newOrder]);
    toast({ title: 'Order Added', description: `New order for ${orderData.customerName} created.` });
    return newOrder;
  };

  const updateOrderStatus = (orderId, newStatus, details) => {
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id === orderId) {
          let updatedOrder = { ...order, status: newStatus };
          if (newStatus === 'Confirmed') {
            toast({ title: 'Order Confirmed', description: `Order ${orderId} confirmed.` });
          } else if (newStatus === 'Partial Dispatch' && details) {
            const updatedItems = order.items.map(item => {
              const dispatchInfo = details.dispatchedItems.find(d => d.productId === item.productId);
              if (dispatchInfo) {
                return { ...item, dispatchedQuantity: (item.dispatchedQuantity || 0) + dispatchInfo.quantity };
              }
              return item;
            });
            updatedOrder = { ...updatedOrder, items: updatedItems, dispatchedItems: [...order.dispatchedItems, ...details.dispatchedItems] };
            toast({ title: 'Order Partially Dispatched', description: `Order ${orderId} partially dispatched.` });
          } else if (newStatus === 'Full Dispatch') {
             const fullyDispatchedItems = order.items.map(item => ({ ...item, dispatchedQuantity: item.quantity }));
             updatedOrder = { ...updatedOrder, items: fullyDispatchedItems };
            toast({ title: 'Order Fully Dispatched', description: `Order ${orderId} fully dispatched.` });
          }
          return updatedOrder;
        }
        return order;
      })
    );
  };
  
  const updateOrderDetails = (orderId, updatedDetails) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, ...updatedDetails, updatedAt: new Date().toISOString() } : order
      )
    );
    toast({ title: 'Order Updated', description: `Order ${orderId} details have been updated.` });
  };


  const value = {
    products, customers, transports, orders, isLoading,
    addProduct, updateProductStock,
    addCustomer,
    addTransport,
    addOrder, updateOrderStatus, updateOrderDetails,
    generateSku
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};