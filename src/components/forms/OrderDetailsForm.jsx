import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const OrderDetailsForm = ({ order, onSubmit, onCancel }) => {
  const { products } = useAppContext();
  const { transports } = useAppContext(); // Get transports from context
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customerName: "",
    city: "",
    phoneNumber: "",
    deliveryLocation: "",
    deliveryTime: "",
    items: [{ productId: "", quantity: 1, price: 0 }],
  });
  const [selectedTransport, setSelectedTransport] = useState(
    order?.transportName || ""
  );

  // Add new state for transport search and dropdown
  const [transportSearchTerm, setTransportSearchTerm] = useState("");
  const [transportDropdownOpen, setTransportDropdownOpen] = useState(false);
  const transportInputRef = useRef(null);
  const transportComboboxRef = useRef(null);

  // Add new state for product search and dropdown
  const [productSearchTerms, setProductSearchTerms] = useState([]);
  const [productDropdownOpen, setProductDropdownOpen] = useState([]);
  const productInputRefs = useRef([]);
  const productComboboxRefs = useRef([]);

  // Filter transports based on search term
  const filteredTransports =
    transports?.filter((transport) =>
      transport.name
        .toLowerCase()
        .includes(transportSearchTerm.toLowerCase())
    ) || [];

  // Function to filter products based on search term
  const getFilteredProducts = (searchTerm) => {
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.unit &&
          product.unit.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Initialize form data when order prop changes
  useEffect(() => {
    if (order) {
      setFormData({
        customerName: order.customer_name || "",
        city: order.city || "",
        phoneNumber: order.phone_number || "",
        deliveryLocation: order.delivery_location || "",
        deliveryTime: order.delivery_time || "", // This will fetch from database
        items:
          order.items && order.items.length > 0
            ? JSON.parse(JSON.stringify(order.items)).map((item) => ({
                ...item,
                price: item.price || 0,
              }))
            : [{ productId: "", quantity: 1, price: 0 }],
      });
      setSelectedTransport(order.transportName || "");
      // Initialize transport search term
      setTransportSearchTerm("");
    }
  }, [order]);

  // Update product search arrays when items change
  useEffect(() => {
    const itemsLength = formData.items.length;

    // Update product search terms array
    setProductSearchTerms((prev) => {
      const newTerms = [...prev];
      while (newTerms.length < itemsLength) {
        newTerms.push("");
      }
      return newTerms.slice(0, itemsLength);
    });

    // Update product dropdown state array
    setProductDropdownOpen((prev) => {
      const newDropdowns = [...prev];
      while (newDropdowns.length < itemsLength) {
        newDropdowns.push(false);
      }
      return newDropdowns.slice(0, itemsLength);
    });

    // Update refs for products
    productInputRefs.current = productInputRefs.current.slice(0, itemsLength);
    productComboboxRefs.current = productComboboxRefs.current.slice(0, itemsLength);
  }, [formData.items.length]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];

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

    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  // Function to handle product selection from dropdown
  const handleProductSelect = (index, productId) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      handleItemChange(index, "productId", productId);
      
      // Clear search term and close dropdown
      const newSearchTerms = [...productSearchTerms];
      newSearchTerms[index] = "";
      setProductSearchTerms(newSearchTerms);
      
      const newDropdownOpen = [...productDropdownOpen];
      newDropdownOpen[index] = false;
      setProductDropdownOpen(newDropdownOpen);
    }
  };

  // Function to toggle product dropdown
  const toggleProductDropdown = (index, value) => {
    const newDropdownOpen = [...productDropdownOpen];
    newDropdownOpen[index] = value;
    setProductDropdownOpen(newDropdownOpen);
    
    if (value && productInputRefs.current[index]) {
      productInputRefs.current[index].focus();
    }
  };

  // Function to update product search term
  const updateProductSearchTerm = (index, value) => {
    const newSearchTerms = [...productSearchTerms];
    newSearchTerms[index] = value;
    setProductSearchTerms(newSearchTerms);
    
    // Clear product selection when searching
    const newItems = [...formData.items];
    if (newItems[index].productId) {
      newItems[index].productId = "";
      setFormData((prev) => ({ ...prev, items: newItems }));
    }
    
    // Open dropdown when searching
    const newDropdownOpen = [...productDropdownOpen];
    newDropdownOpen[index] = true;
    setProductDropdownOpen(newDropdownOpen);
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { productId: "", quantity: 1, price: 0 }],
    }));
    
    // Add new empty search term and closed dropdown state
    setProductSearchTerms([...productSearchTerms, ""]);
    setProductDropdownOpen([...productDropdownOpen, false]);
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, items: newItems }));
      
      // Remove corresponding search term and dropdown state
      const newSearchTerms = productSearchTerms.filter((_, i) => i !== index);
      setProductSearchTerms(newSearchTerms);
      
      const newDropdownOpen = productDropdownOpen.filter((_, i) => i !== index);
      setProductDropdownOpen(newDropdownOpen);
    }
  };

  const validateForm = () => {
    if (!formData.customerName.trim()) {
      toast({
        title: "Error",
        description: "Customer name is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.city.trim()) {
      toast({
        title: "Error",
        description: "City is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Phone number is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.deliveryLocation.trim()) {
      toast({
        title: "Error",
        description: "Delivery location is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.deliveryTime.trim()) {
      toast({
        title: "Error",
        description: "Delivery time is required (e.g., Morning, 2-3 PM, etc.).",
        variant: "destructive",
      });
      return false;
    }

    if (
      formData.items.some(
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

    // Check stock availability for new items or increased quantities
    for (const item of formData.items) {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        // Get original item quantity for comparison
        const originalItem = order?.items?.find(
          (origItem) => origItem.productId === item.productId
        );
        const originalQuantity = originalItem ? originalItem.quantity : 0;
        const dispatchedQuantity = originalItem
          ? originalItem.dispatchedQuantity || 0
          : 0;

        // Calculate the difference in quantity needed
        const quantityDifference = item.quantity - originalQuantity;

        // Only check stock if we're increasing the quantity
        if (quantityDifference > 0 && product.stock < quantityDifference) {
          toast({
            title: "Error",
            description: `Insufficient stock for ${product.name}. Available: ${product.stock}, Additional needed: ${quantityDifference}`,
            variant: "destructive",
          });
          return false;
        }

        // Ensure we don't reduce quantity below already dispatched amount
        if (item.quantity < dispatchedQuantity) {
          toast({
            title: "Error",
            description: `Cannot reduce quantity for ${product.name} below dispatched amount (${dispatchedQuantity})`,
            variant: "destructive",
          });
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    // Prepare the data in the same format as expected by updateOrderDetails
    const updatedDetails = {
      customerName: formData.customerName,
      city: formData.city,
      phoneNumber: formData.phoneNumber,
      deliveryLocation: formData.deliveryLocation,
      deliveryTime: formData.deliveryTime,
      items: formData.items.map((item) => ({
        productId: item.productId,
        productName: products.find((p) => p.id === item.productId)?.name,
        quantity: item.quantity,
        price: item.price,
        unit: products.find((p) => p.id === item.productId)?.unit,
        dispatchedQuantity: item.dispatchedQuantity || 0,
        totalPrice: item.quantity * item.price,
      })),
      transportName: selectedTransport,
    };
    onSubmit(updatedDetails);
  };

  // Calculate total price
  const totalPrice = formData.items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return sum + qty * price;
  }, 0);

  // Close transport dropdown on outside click
  useEffect(() => {
    if (!transportDropdownOpen) return;
    
    function handleClickOutside(event) {
      if (
        transportComboboxRef.current &&
        !transportComboboxRef.current.contains(event.target)
      ) {
        setTransportDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [transportDropdownOpen]);
  
  // Close product dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      productComboboxRefs.current.forEach((ref, index) => {
        if (productDropdownOpen[index] && ref && !ref.contains(event.target)) {
          const newDropdownOpen = [...productDropdownOpen];
          newDropdownOpen[index] = false;
          setProductDropdownOpen(newDropdownOpen);
        }
      });
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [productDropdownOpen]);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-h-[70vh] overflow-y-auto pr-2"
    >
      {/* Customer Information Section */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customerName">Customer Name *</Label>
            <Input
              id="customerName"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
              placeholder="Enter customer name"
            />
          </div>
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              placeholder="Enter city"
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <Label htmlFor="deliveryTime">Delivery Time *</Label>
            <Input
              id="deliveryTime"
              name="deliveryTime"
              type="text"
              value={formData.deliveryTime}
              onChange={handleChange}
              required
              placeholder="Enter delivery time (e.g., 2-3 PM, Morning, Evening)"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="deliveryLocation">Delivery Location *</Label>
            <Textarea
              id="deliveryLocation"
              name="deliveryLocation"
              value={formData.deliveryLocation}
              onChange={handleChange}
              required
              placeholder="Enter delivery location"
            />
          </div>
        </div>
      </div>      {/* Transport Selection Section */}
      <div className="space-y-4 p-4 border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Transport Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="transport-select"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Select Transport Service
            </Label>
            <div className="relative" ref={transportComboboxRef}>
              <Input
                id="transport-select"
                ref={transportInputRef}
                placeholder="Search or select a transport..."
                value={selectedTransport || transportSearchTerm}
                onChange={(e) => {
                  setTransportSearchTerm(e.target.value);
                  setSelectedTransport("");
                  setTransportDropdownOpen(true);
                }}
                autoComplete="off"
                onFocus={() => setTransportDropdownOpen(true)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 
                bg-white dark:bg-gray-700 
                text-gray-900 dark:text-gray-100
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                focus:border-blue-500 dark:focus:border-blue-400 
                transition-colors duration-200
                hover:border-gray-400 dark:hover:border-gray-500 pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-primary"
                onClick={(e) => {
                  e.preventDefault();
                  setTransportDropdownOpen((open) => !open);
                  transportInputRef.current && transportInputRef.current.focus();
                }}
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              {transportDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg max-h-60 overflow-y-auto">
                  {filteredTransports.length > 0 ? (
                    filteredTransports
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((transport) => (
                        <div
                          key={transport.id}
                          className={`px-4 py-2 cursor-pointer hover:bg-primary/10 ${selectedTransport === transport.name ? "bg-primary/20" : ""}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedTransport(transport.name);
                            setTransportSearchTerm("");
                            setTransportDropdownOpen(false);
                          }}
                        >
                          {transport.name}
                        </div>
                      ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      No transport services found.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Items Section */}
      <div className="space-y-6 p-6 border rounded-xl shadow-sm bg-gradient-to-br from-background to-muted/10">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <div className="w-2 h-6 bg-primary rounded-full"></div>
            Order Items
          </h3>
          <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
            {formData.items.length}{" "}
            {formData.items.length === 1 ? "item" : "items"}
          </div>
        </div>

        <div className="space-y-4">
          {formData.items.map((item, index) => {
            const originalItem = order?.items?.find(
              (origItem) => origItem.productId === item.productId
            );
            const dispatchedQuantity = originalItem
              ? originalItem.dispatchedQuantity || 0
              : 0;
            const isDispatched = dispatchedQuantity > 0;

            return (
              <div
                key={index}
                className={`group relative p-5 border-2 rounded-xl bg-card transition-all duration-200 ${isDispatched
                    ? "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
                    : "border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 hover:shadow-md"
                  }`}
              >
                <div className="absolute -top-3 left-4 bg-background px-2 py-1 text-xs font-medium rounded-md border flex items-center gap-2">
                  <span className="text-muted-foreground">
                    Item #{index + 1}
                  </span>
                  {isDispatched && (
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-medium dark:bg-amber-900 dark:text-amber-200">
                      Dispatched
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">                  <div className="md:col-span-8">
                    <Label
                      htmlFor={`product-${index}`}
                      className="text-sm font-medium mb-2 block"
                    >
                      Product <span className="text-destructive">*</span>
                    </Label>
                    <div 
                      className="relative" 
                      ref={el => productComboboxRefs.current[index] = el}
                    >
                      <div className="relative">
                        <Input
                          id={`product-${index}`}
                          ref={el => productInputRefs.current[index] = el}
                          placeholder="Search or select a product..."
                          value={item.productId ? (products.find(p => p.id === item.productId)?.name || "") : productSearchTerms[index]}
                          onChange={e => updateProductSearchTerm(index, e.target.value)}
                          autoComplete="off"
                          onFocus={() => toggleProductDropdown(index, true)}
                          className="h-11 border-2 pr-10 focus:border-primary hover:border-muted-foreground/50 transition-colors"
                          disabled={dispatchedQuantity > 0}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-primary"
                          onClick={e => {
                            e.preventDefault();
                            if (!dispatchedQuantity) {
                              toggleProductDropdown(index, !productDropdownOpen[index]);
                              productInputRefs.current[index] && productInputRefs.current[index].focus();
                            }
                          }}
                        >
                          <ChevronDown className="w-5 h-5" />
                        </button>
                        {productDropdownOpen[index] && (
                          <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg max-h-60 overflow-y-auto">
                            {getFilteredProducts(productSearchTerms[index]).length > 0 ? (
                              getFilteredProducts(productSearchTerms[index])
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((product) => (
                                  <div
                                    key={product.id}
                                    className={`px-4 py-2 cursor-pointer hover:bg-primary/10 
                                      ${item.productId === product.id ? "bg-primary/20" : ""}
                                      ${(product.stock <= 0 && product.id !== item.productId) ? 
                                        "opacity-50 cursor-not-allowed" : ""}`}
                                    onMouseDown={e => {
                                      e.preventDefault();
                                      if (product.stock > 0 || product.id === item.productId) {
                                        handleProductSelect(index, product.id);
                                      }
                                    }}
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
                                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                                              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                                          }`}
                                        >
                                          Stock: {product.stock}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))
                            ) : (
                              <div className="px-4 py-2 text-sm text-muted-foreground">No products found.</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <Label
                      htmlFor={`quantity-${index}`}
                      className="text-sm font-medium mb-2 block"
                    >
                      Quantity <span className="text-destructive">*</span>
                      {dispatchedQuantity > 0 && (
                        <span className="text-amber-600 font-medium ml-1">
                          (Min: {dispatchedQuantity})
                        </span>
                      )}
                    </Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min={dispatchedQuantity || 1}
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", e.target.value)
                      }
                      required
                      placeholder="Enter qty"
                      className="h-11 border-2 focus:border-primary hover:border-muted-foreground/50 transition-colors text-center font-medium"
                    />
                    {dispatchedQuantity > 0 && (
                      <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800">
                        <p className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                          Dispatched: {dispatchedQuantity}
                        </p>
                      </div>
                    )}
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

                  {formData.items.length > 1 && (
                    <div className="md:col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={dispatchedQuantity > 0}
                        className={`h-11 w-11 rounded-lg transition-all transform ${dispatchedQuantity > 0
                            ? "opacity-40 cursor-not-allowed"
                            : "opacity-70 group-hover:opacity-100 hover:scale-105"
                          }`}
                        title={
                          dispatchedQuantity > 0
                            ? "Cannot remove dispatched items"
                            : "Remove item"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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

        <div className="flex justify-end pt-4">
          <div className="text-lg font-bold text-right">
            Total Price:{" "}
            <span className="text-primary">
              ₹{" "}
              {totalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-background py-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="min-w-[120px]">
          Update Order
        </Button>
      </div>
    </form>
  );
};

export default OrderDetailsForm;