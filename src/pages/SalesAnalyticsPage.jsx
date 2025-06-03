import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { 
  MonthlyRevenueChart, 
  TopProductsChart, 
  RevenueTrendChart, 
  ProductCategoryDistributionChart,
  CustomerLocationChart
} from '@/components/charts/SalesAnalyticsChart';
import { ProductsByCategoryChart } from '@/components/charts/ProductsByCategoryChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DownloadCloud, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/ui/use-toast';

const SalesAnalyticsPage = () => {
  const { orders, products } = useAppContext();
  const { toast } = useToast();
  
  // Filter states
  const [timeRange, setTimeRange] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Process data for charts
  const processedData = useMemo(() => {
    // Filter for fully dispatched orders
    let filteredOrders = orders.filter(order => order.status === "Full Dispatch");
    
    // Apply time range filter
    if (timeRange !== 'all') {
      const now = new Date();
      const pastDate = new Date();
      
      switch (timeRange) {
        case 'last30':
          pastDate.setDate(now.getDate() - 30);
          break;
        case 'last90':
          pastDate.setDate(now.getDate() - 90);
          break;
        case 'last180':
          pastDate.setDate(now.getDate() - 180);
          break;
        case 'lastYear':
          pastDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }
      
      filteredOrders = filteredOrders.filter(order => new Date(order.created_at) >= pastDate);
    }
    
    // Monthly revenue data
    const monthlyData = {};
    filteredOrders.forEach(order => {
      const date = new Date(order.created_at);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { 
          month: date.getMonth(),
          year: date.getFullYear(),
          revenue: 0,
          orderCount: 0
        };
      }
      
      // Calculate order revenue
      let orderRevenue = 0;
      if (typeof order.totalPrice === 'number') {
        orderRevenue = order.totalPrice;
      } else if (order.items && Array.isArray(order.items)) {
        orderRevenue = order.items.reduce((sum, item) => {
          return sum + (Number(item.quantity) || 0) * (Number(item.price) || 0);
        }, 0);
      }
      
      monthlyData[monthYear].revenue += orderRevenue;
      monthlyData[monthYear].orderCount += 1;
    });
    
    // Convert to array and sort chronologically
    const monthlyRevenueData = Object.entries(monthlyData).map(([label, data]) => ({
      label,
      ...data
    })).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
    // Extract product categories and calculate sales by category and product
    const productSales = {};
    const categories = {};
    const locationData = {};
    
    filteredOrders.forEach(order => {
      if (!order.items || !Array.isArray(order.items)) return;
      
      // Process location data
      const location = order.delivery_location || order.city || 'Unknown';
      if (!locationData[location]) {
        locationData[location] = {
          orderCount: 0,
          revenue: 0
        };
      }
      
      // Calculate order revenue for location data
      let orderRevenue = 0;
      if (typeof order.totalPrice === 'number') {
        orderRevenue = order.totalPrice;
      } else if (order.items && Array.isArray(order.items)) {
        orderRevenue = order.items.reduce((sum, item) => {
          return sum + (Number(item.quantity) || 0) * (Number(item.price) || 0);
        }, 0);
      }
      
      locationData[location].orderCount += 1;
      locationData[location].revenue += orderRevenue;
      
      // Process product data
      order.items.forEach(item => {
        const productName = item.productName || item.product_name || 'Unknown';
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        
        // Derive category from product (customizable based on your data)
        // Here we're using the first word or '-' separated part as category
        let category = 'Other';
        if (productName) {
          if (productName.includes('-')) {
            category = productName.split('-')[0].trim();
          } else if (productName.includes(' ')) {
            category = productName.split(' ')[0].trim();
          } else {
            category = productName;
          }
        }
        
        // Filter by category if selected
        if (selectedCategory !== 'all' && category !== selectedCategory) {
          return;
        }
        
        // Track product sales
        if (!productSales[productName]) {
          productSales[productName] = {
            name: productName,
            quantity: 0,
            revenue: 0,
            category: category
          };
        }
        
        productSales[productName].quantity += quantity;
        productSales[productName].revenue += quantity * price;
          // Track category sales
        if (!categories[category]) {
          categories[category] = {
            name: category,
            revenue: 0,
            quantity: 0,
            orderCount: 0,
            products: [] // Add array to store individual products in this category
          };
        }
        
        categories[category].revenue += quantity * price;
        categories[category].quantity += quantity;
        
        // Track individual product in this category for detailed display
        const existingProduct = categories[category].products?.find(p => p.name === productName);
        
        if (existingProduct) {
          existingProduct.quantity += quantity;
          existingProduct.revenue += quantity * price;
        } else {
          categories[category].products = categories[category].products || [];
          categories[category].products.push({
            name: productName,
            quantity: quantity,
            revenue: quantity * price
          });
        }
      });
    });
    
    // Sort locations by order count
    const sortedLocationData = Object.fromEntries(
      Object.entries(locationData)
        .sort(([, a], [, b]) => b.orderCount - a.orderCount)
        .slice(0, 10) // Top 10 locations
    );
      // Format products for charts
    // Get all products
    const allProducts = Object.values(productSales);
    
    // Create different sorted versions
    const topProductsByQuantity = [...allProducts].sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    const topProductsByRevenue = [...allProducts].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    
    // Combine top products from both sorts (revenue gets priority)
    const topProducts = [...topProductsByRevenue];
    for (const product of topProductsByQuantity) {
      if (!topProducts.find(p => p.name === product.name) && topProducts.length < 10) {
        topProducts.push(product);
      }
    }
    
    // Final sort by revenue for display
    topProducts.sort((a, b) => b.revenue - a.revenue);
    
    // Format categories for charts
    const topCategories = Object.values(categories)
      .sort((a, b) => b.revenue - a.revenue);
    
    // Get all available categories for filtering
    const allCategories = [...new Set(Object.values(productSales).map(product => product.category))];
    
    return {
      monthlyRevenueData,
      topProducts,
      topCategories,
      locationData: sortedLocationData,
      allCategories
    };
  }, [orders, timeRange, selectedCategory]);
  
  // Calculate summary metrics
  const metrics = useMemo(() => {
    // Filter for fully dispatched orders
    let filteredOrders = orders.filter(order => order.status === "Full Dispatch");
    
    // Apply time range filter
    if (timeRange !== 'all') {
      const now = new Date();
      const pastDate = new Date();
      
      switch (timeRange) {
        case 'last30':
          pastDate.setDate(now.getDate() - 30);
          break;
        case 'last90':
          pastDate.setDate(now.getDate() - 90);
          break;
        case 'last180':
          pastDate.setDate(now.getDate() - 180);
          break;
        case 'lastYear':
          pastDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }
      
      filteredOrders = filteredOrders.filter(order => new Date(order.created_at) >= pastDate);
    }
    
    // Calculate total revenue
    const totalRevenue = filteredOrders.reduce((sum, order) => {
      if (typeof order.totalPrice === 'number') {
        return sum + order.totalPrice;
      }
      
      if (order.items && Array.isArray(order.items)) {
        const orderTotal = order.items.reduce((itemSum, item) => {
          return itemSum + (Number(item.quantity) || 0) * (Number(item.price) || 0);
        }, 0);
        return sum + orderTotal;
      }
      
      return sum;
    }, 0);
    
    // Calculate total units sold
    const totalUnitsSold = filteredOrders.reduce((sum, order) => {
      if (!order.items || !Array.isArray(order.items)) return sum;
      
      return sum + order.items.reduce((itemSum, item) => {
        return itemSum + (Number(item.quantity) || 0);
      }, 0);
    }, 0);
    
    // Calculate average order value
    const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
    
    return {
      totalRevenue,
      totalUnitsSold,
      ordersCompleted: filteredOrders.length,
      avgOrderValue
    };
  }, [orders, timeRange]);
  
  // Export data to Excel
  const exportToExcel = () => {
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Add Monthly Revenue sheet
      const monthlyRevenueSheet = processedData.monthlyRevenueData.map(item => ({
        'Month': item.label,
        'Revenue (₹)': item.revenue.toFixed(2),
        'Order Count': item.orderCount
      }));
      const wsMonthly = XLSX.utils.json_to_sheet(monthlyRevenueSheet);
      XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly Revenue');
      
      // Add Top Products sheet
      const topProductsSheet = processedData.topProducts.map(product => ({
        'Product Name': product.name,
        'Category': product.category,
        'Units Sold': product.quantity,
        'Revenue (₹)': product.revenue.toFixed(2),
        'Average Price (₹)': (product.revenue / product.quantity).toFixed(2)
      }));
      const wsProducts = XLSX.utils.json_to_sheet(topProductsSheet);
      XLSX.utils.book_append_sheet(wb, wsProducts, 'Top Products');
        // Add Categories sheet
      const categoriesSheet = processedData.topCategories.map(category => ({
        'Category': category.name,
        'Revenue (₹)': category.revenue.toFixed(2),
        'Units Sold': category.quantity,
        'Products Count': category.products?.length || 0
      }));
      const wsCategories = XLSX.utils.json_to_sheet(categoriesSheet);
      XLSX.utils.book_append_sheet(wb, wsCategories, 'Categories');
      
      // Add Products by Category sheet with detailed product breakdown
      const productsByCategoryData = [];
      processedData.topCategories.forEach(category => {
        if (category.products && category.products.length > 0) {
          // Add category header row
          productsByCategoryData.push({
            'Category': category.name,
            'Product': `--- ${category.products.length} Products ---`,
            'Units Sold': category.quantity,
            'Revenue (₹)': category.revenue.toFixed(2),
            '% of Category': '100%'
          });
          
          // Sort products by revenue and add each product row
          const sortedProducts = [...category.products].sort((a, b) => b.revenue - a.revenue);
          sortedProducts.forEach(product => {
            const percentOfCategory = (product.revenue / category.revenue * 100).toFixed(1);
            productsByCategoryData.push({
              'Category': '',
              'Product': product.name,
              'Units Sold': product.quantity,
              'Revenue (₹)': product.revenue.toFixed(2),
              '% of Category': `${percentOfCategory}%`
            });
          });
          
          // Add empty row for better readability
          productsByCategoryData.push({
            'Category': '',
            'Product': '',
            'Units Sold': '',
            'Revenue (₹)': '',
            '% of Category': ''
          });
        }
      });
      
      const wsProductsByCategory = XLSX.utils.json_to_sheet(productsByCategoryData);
      XLSX.utils.book_append_sheet(wb, wsProductsByCategory, 'Products by Category');
      
      // Add Location Data sheet
      const locationSheet = Object.entries(processedData.locationData).map(([location, data]) => ({
        'Location': location,
        'Order Count': data.orderCount,
        'Revenue (₹)': data.revenue.toFixed(2),
        'Average Order Value (₹)': (data.revenue / data.orderCount).toFixed(2)
      }));
      const wsLocations = XLSX.utils.json_to_sheet(locationSheet);
      XLSX.utils.book_append_sheet(wb, wsLocations, 'Locations');
      
      // Generate Excel file with current date
      const date = new Date().toISOString().split('T')[0];
      const fileName = `Chandan_Agrico_Sales_Analysis_${date}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Export Successful",
        description: "Sales analytics data has been exported to Excel.",
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting to Excel.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sales Analytics</h1>
          <p className="text-muted-foreground">Visualize your sales performance and trends</p>
        </div>
        
        <Button
          onClick={exportToExcel}
          className="flex items-center justify-center gap-1.5"
          variant="outline"
          size="sm"
        >
          <DownloadCloud className="h-4 w-4 flex-shrink-0" />
          <span>Export to Excel</span>
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Time Range:</span>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="last30">Last 30 Days</SelectItem>
              <SelectItem value="last90">Last 90 Days</SelectItem>
              <SelectItem value="last180">Last 6 Months</SelectItem>
              <SelectItem value="lastYear">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Category:</span>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {processedData.allCategories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Key metrics summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{metrics.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Units Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUnitsSold}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orders Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.ordersCompleted}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{metrics.avgOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts section with tabs for different views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products Analysis</TabsTrigger>
          <TabsTrigger value="locations">Location Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Revenue breakdown by month</CardDescription>
              </CardHeader>
              <CardContent>
                {processedData.monthlyRevenueData.length > 0 ? (
                  <MonthlyRevenueChart data={processedData.monthlyRevenueData} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>Distribution of sales across product categories</CardDescription>
              </CardHeader>
              <CardContent>
                {processedData.topCategories.length > 0 ? (
                  <ProductCategoryDistributionChart categories={processedData.topCategories} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Revenue progression over time</CardDescription>
            </CardHeader>
            <CardContent>
              {processedData.monthlyRevenueData.length > 0 ? (
                <RevenueTrendChart data={processedData.monthlyRevenueData} />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Products with highest units sold</CardDescription>
            </CardHeader>
            <CardContent>
              {processedData.topProducts.length > 0 ? (
                <TopProductsChart products={processedData.topProducts} />
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
            <Card>
            <CardHeader>
              <CardTitle>Products by Category</CardTitle>
              <CardDescription>Visual breakdown of products in each category</CardDescription>
            </CardHeader>
            <CardContent>
              {processedData.topCategories.length > 0 ? (
                <ProductsByCategoryChart categories={processedData.topCategories} />
              ) : (
                <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Revenue</CardTitle>
              <CardDescription>Products generating the most revenue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {processedData.topProducts.length > 0 ? (
                processedData.topProducts
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 10)
                  .map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-6 text-muted-foreground">{index + 1}.</div>
                        <div className="font-medium">{product.name}</div>
                      </div>
                      <div className="font-bold text-green-600">₹{product.revenue.toFixed(2)}</div>
                    </div>
                  ))
              ) : (
                <div className="h-12 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Performance metrics by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Category</th>
                      <th className="text-right py-3 px-4">Revenue (₹)</th>
                      <th className="text-right py-3 px-4">Units Sold</th>
                      <th className="text-right py-3 px-4">% of Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedData.topCategories.length > 0 ? (
                      processedData.topCategories.map((category, index) => {
                        const totalRevenue = processedData.topCategories.reduce(
                          (sum, cat) => sum + cat.revenue, 0
                        );
                        const percentage = (category.revenue / totalRevenue * 100).toFixed(1);
                        
                        return (
                          <tr key={index} className="border-b last:border-0">
                            <td className="py-3 px-4">{category.name}</td>
                            <td className="text-right py-3 px-4">₹{category.revenue.toFixed(2)}</td>
                            <td className="text-right py-3 px-4">{category.quantity}</td>
                            <td className="text-right py-3 px-4">{percentage}%</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orders by Location</CardTitle>
              <CardDescription>Distribution of orders and revenue by location</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(processedData.locationData).length > 0 ? (
                <CustomerLocationChart locationData={processedData.locationData} />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
              <CardDescription>Detailed metrics by location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Location</th>
                      <th className="text-right py-3 px-4">Orders</th>
                      <th className="text-right py-3 px-4">Revenue (₹)</th>
                      <th className="text-right py-3 px-4">Avg. Order Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(processedData.locationData).length > 0 ? (
                      Object.entries(processedData.locationData).map(([location, data], index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3 px-4">{location}</td>
                          <td className="text-right py-3 px-4">{data.orderCount}</td>
                          <td className="text-right py-3 px-4">₹{data.revenue.toFixed(2)}</td>
                          <td className="text-right py-3 px-4">
                            ₹{(data.revenue / data.orderCount).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesAnalyticsPage;
