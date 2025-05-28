import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import CustomerForm from "@/components/forms/CustomerForm";
import { userService } from "@/lib/supabaseService";

const AddOrderPage = () => {
  const { customers, products, addOrder, addCustomer, session } =
    useAppContext();
  const { transports } = useAppContext(); // Get transports from context
  const { toast } = useToast();

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    city: "",
    phoneNumber: "",
    deliveryLocation: "",
  });
  const [orderItems, setOrderItems] = useState([
    { productId: "", quantity: 1, price: 0 },
  ]);
  const [addedBy, setAddedBy] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState(""); // New state for transport

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find((c) => c.id === selectedCustomerId);
      if (customer) {
        setCustomerDetails({
          name: customer.name,
          city: customer.city,
          phoneNumber: customer.phone,
          deliveryLocation: customer.deliveryLocation || "",
        });
      }
    } else {
      setCustomerDetails({
        name: "",
        city: "",
        phoneNumber: "",
        deliveryLocation: "",
      });
    }
  }, [selectedCustomerId, customers]);

  useEffect(() => {
    // Enhanced logic: always show full name if possible
    async function resolveAddedBy() {
      if (
        session?.user?.user_metadata?.name &&
        session.user.user_metadata.name.trim() !== ""
      ) {
        setAddedBy(session.user.user_metadata.name);
      } else if (session?.user?.id) {
        // Try to fetch from users table
        try {
          const { success, data } = await userService.getUserById(
            session.user.id
          );
          if (success && data?.name && data.name.trim() !== "") {
            setAddedBy(data.name);
            return;
          }
        } catch (e) {
          // Ignore error, fallback to email
        }
        // Fallback to email if name not found
        if (session.user.email) {
          setAddedBy(session.user.email);
        } else {
          setAddedBy("");
        }
      } else if (session?.user?.email) {
        setAddedBy(session.user.email);
      } else {
        setAddedBy("");
      }
    }
    resolveAddedBy();
  }, [session]);

  const handleCustomerDetailChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];

    if (field === "quantity") {
      // Allow empty value to be entered (so user can delete and start typing new value)
      if (value === "") {
        newItems[index][field] = "";
      } else {
        // Convert to number when there's a value, default to 1 only if the input is invalid
        const numValue = parseInt(value, 10);
        newItems[index][field] = isNaN(numValue) ? 1 : numValue;
      }
    } else if (field === "price") {
      // Allow empty value to be entered
      if (value === "") {
        newItems[index][field] = "";
      } else {
        // Convert to number when there's a value, default to 0 if invalid
        const numValue = parseFloat(value);
        newItems[index][field] = isNaN(numValue) ? 0 : numValue;
      }
    } else if (field === "productId") {
      const product = products.find((p) => p.id === value);
      newItems[index] = {
        ...newItems[index],
        productId: value,
        unit: product ? product.unit : "",
        productName: product ? product.name : "",
      };
    } else {
      newItems[index][field] = value;
    }

    setOrderItems(newItems);
  };

  const addItem = () => {
    setOrderItems([...orderItems, { productId: "", quantity: 1, price: 0 }]);
  };

  const removeItem = (index) => {
    if (orderItems.length > 1) {
      const newItems = orderItems.filter((_, i) => i !== index);
      setOrderItems(newItems);
    }
  };

  const handleAddNewCustomer = (newCustomerData) => {
    const newCustomer = addCustomer(newCustomerData);
    setSelectedCustomerId(newCustomer.id);
    setIsNewCustomerDialogOpen(false);
    toast({
      title: "Customer Added",
      description: `${newCustomer.name} added and selected for the order.`,
    });
  };

  const validateForm = () => {
    if (!selectedCustomerId && !customerDetails.name.trim()) {
      toast({
        title: "Error",
        description: "Please select or add a customer.",
        variant: "destructive",
      });
      return false;
    }

    if (!customerDetails.city.trim()) {
      toast({
        title: "Error",
        description: "City is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!customerDetails.phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Phone number is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!customerDetails.deliveryLocation.trim()) {
      toast({
        title: "Error",
        description: "Delivery location is required.",
        variant: "destructive",
      });
      return false;
    }

    if (
      orderItems.some(
        (item) =>
          !item.productId ||
          item.quantity === "" ||
          item.quantity <= 0 ||
          item.price === "" ||
          item.price < 0
      )
    ) {
      toast({
        title: "Error",
        description:
          "Please ensure all order items have valid products, quantities, and prices.",
        variant: "destructive",
      });
      return false;
    }

    // Stock availability check removed - orders can be created regardless of current stock levels
    // Stock validation will be handled during the dispatch process

    return true;
  };

  // Calculate total price from orderItems
  const totalPrice = orderItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return sum + qty * price;
  }, 0);

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const orderData = {
      customerId: selectedCustomerId || null,
      customerName: customerDetails.name,
      city: customerDetails.city,
      phoneNumber: customerDetails.phoneNumber,
      deliveryLocation: customerDetails.deliveryLocation,
      added_by: addedBy,
      transportName: selectedTransport, // <-- Store selected transport name
      items: orderItems.map((item) => ({
        productId: item.productId,
        productName: products.find((p) => p.id === item.productId)?.name,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.quantity * item.price,
        unit: products.find((p) => p.id === item.productId)?.unit,
        dispatchedQuantity: 0,
      })), // <-- Store total price in order object
    };
    const result = await addOrder(orderData);

    if (result) {
      // Reset form (but keep addedBy - user should persist across orders)
      setSelectedCustomerId("");
      setCustomerDetails({
        name: "",
        city: "",
        phoneNumber: "",
        deliveryLocation: "",
      });
      setOrderItems([{ productId: "", quantity: 1, price: 0 }]);
      setSearchTerm("");
      setSelectedTransport(""); // Reset transport selection
      // Don't reset addedBy - user name should persist
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Order</CardTitle>
          <CardDescription>
            Fill in the details to create a new order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <section className="space-y-4 p-4 border rounded-lg">
              <h2 className="text-lg font-semibold">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-search">
                    Select Existing Customer
                  </Label>
                  <Select
                    value={selectedCustomerId}
                    onValueChange={setSelectedCustomerId}
                  >
                    <SelectTrigger id="customer-search">
                      <SelectValue placeholder="Search or select a customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <Input
                          placeholder="Search customers..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="mb-2"
                        />
                      </div>
                      {filteredCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.city})
                        </SelectItem>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <p className="p-2 text-sm text-muted-foreground">
                          No customers found.
                        </p>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Dialog
                    open={isNewCustomerDialogOpen}
                    onOpenChange={setIsNewCustomerDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full md:w-auto"
                      >
                        <UserPlus className="mr-2 h-4 w-4" /> Add New Customer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                      </DialogHeader>
                      <CustomerForm
                        onSubmit={handleAddNewCustomer}
                        onCancel={() => setIsNewCustomerDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    name="name"
                    value={customerDetails.name}
                    onChange={handleCustomerDetailChange}
                    required
                    disabled={!!selectedCustomerId}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={customerDetails.city}
                    onChange={handleCustomerDetailChange}
                    required
                    disabled={!!selectedCustomerId}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={customerDetails.phoneNumber}
                    onChange={handleCustomerDetailChange}
                    required
                    disabled={!!selectedCustomerId}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryLocation">Delivery Location *</Label>
                  <Input
                    id="deliveryLocation"
                    name="deliveryLocation"
                    value={customerDetails.deliveryLocation}
                    onChange={handleCustomerDetailChange}
                    required
                    placeholder="Enter delivery location"
                  />
                </div>
              </div>
            </section>

            {/* Transport Selection Section */}
            <section className="space-y-4 p-4 border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Transport Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="w-full">
                  <Label
                    htmlFor="transport-select"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Select Transport Service
                  </Label>
                  <select
                    id="transport-select"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 
                   bg-white dark:bg-gray-700 
                   text-gray-900 dark:text-gray-100
                   focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                   focus:border-blue-500 dark:focus:border-blue-400 
                   transition-colors duration-200
                   hover:border-gray-400 dark:hover:border-gray-500"
                    value={selectedTransport}
                    onChange={(e) => setSelectedTransport(e.target.value)}
                  >
                    <option
                      value=""
                      className="text-gray-500 dark:text-gray-400"
                    >
                      Choose a transport service...
                    </option>
                    {transports &&
                      transports.length > 0 &&
                      transports.map((t) => (
                        <option
                          key={t.id}
                          value={t.name}
                          className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                        >
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </section>
            <section className="space-y-6 p-6 border rounded-xl shadow-sm bg-gradient-to-br from-background to-muted/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <div className="w-2 h-6 bg-primary rounded-full"></div>
                  Order Items
                </h2>
                <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                  {orderItems.length}{" "}
                  {orderItems.length === 1 ? "item" : "items"}
                </div>
              </div>

              <div className="space-y-4">
                {orderItems.map((item, index) => (
                  <div
                    key={index}
                    className="group relative p-5 border-2 border-dashed border-muted-foreground/20 rounded-xl bg-card hover:border-muted-foreground/40 hover:shadow-md transition-all duration-200"
                  >
                    <div className="absolute -top-3 left-4 bg-background px-2 py-1 text-xs font-medium text-muted-foreground rounded-md border">
                      Item #{index + 1}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-6">
                        <Label
                          htmlFor={`product-${index}`}
                          className="text-sm font-medium mb-2 block"
                        >
                          Product <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={item.productId}
                          onValueChange={(value) =>
                            handleItemChange(index, "productId", value)
                          }
                        >
                          <SelectTrigger
                            id={`product-${index}`}
                            className="h-11 border-2 focus:border-primary hover:border-muted-foreground/50 transition-colors"
                          >
                            <SelectValue placeholder="Choose a product..." />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem
                                key={product.id}
                                value={product.id}
                                className="py-3"
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span className="font-medium">
                                    {product.name}
                                  </span>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-4">
                                    <span className="bg-muted px-2 py-1 rounded">
                                      {product.unit}
                                    </span>
                                    <span
                                      className={`px-2 py-1 rounded ${
                                        product.stock > 0
                                          ? "bg-green-100 text-green-700"
                                          : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      Stock: {product.stock}
                                    </span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-2">
                        <Label
                          htmlFor={`quantity-${index}`}
                          className="text-sm font-medium mb-2 block"
                        >
                          Quantity <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", e.target.value)
                          }
                          required
                          placeholder="Enter qty"
                          className="h-11 border-2 focus:border-primary hover:border-muted-foreground/50 transition-colors text-center font-medium"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <Label
                          htmlFor={`price-${index}`}
                          className="text-sm font-medium mb-2 block"
                        >
                          Price <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`price-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(index, "price", e.target.value)
                          }
                          required
                          placeholder="0.00"
                          className="h-11 border-2 focus:border-primary hover:border-muted-foreground/50 transition-colors text-center font-medium"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-sm font-medium mb-2 block">
                          Total
                        </Label>
                        <div className="h-11 border-2 border-muted bg-muted/50 rounded-md flex items-center justify-center font-medium text-lg">
                          {(
                            (parseFloat(item.quantity) || 0) *
                            (parseFloat(item.price) || 0)
                          ).toFixed(2)}
                        </div>
                      </div>

                      {orderItems.length > 1 && (
                        <div className="md:col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="h-11 w-11 rounded-lg opacity-70 group-hover:opacity-100 transition-opacity hover:scale-105 transform"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addItem}
                  className="h-12 px-6 border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                >
                  <Plus className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Add Another Item</span>
                </Button>
              </div>

              <div className="flex justify-between items-center pt-4">
                <div className="font-semibold text-lg">Total Price:</div>
                <div className="text-xl font-bold text-primary">
                  ₹ {totalPrice.toFixed(2)}
                </div>
              </div>
            </section>
            <section className="space-y-4 p-4 border rounded-lg">
              <h2 className="text-lg font-semibold">Order Summary</h2>
              <div>
                <Label htmlFor="addedBy">Added By</Label>
                <Input
                  id="addedBy"
                  value={addedBy}
                  readOnly
                  // placeholder="Enter your name (optional)"
                />
              </div>
            </section>

            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                size="lg"
                className="min-w-[150px]"
              >
                Create Order
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AddOrderPage;
