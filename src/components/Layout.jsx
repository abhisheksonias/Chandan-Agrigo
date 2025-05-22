import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users,
  Package, 
  Truck,
  BarChart3,
  Menu, 
  X, 
  LogOut, 
  Moon, 
  Sun,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ShoppingCart, label: 'Add Order', path: '/add-order' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: Package, label: 'Products', path: '/products' },
  { icon: Truck, label: 'Transport', path: '/transports' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
];

const Layout = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  return (
    <div className={cn("min-h-screen flex flex-col", darkMode ? 'dark' : '')}>
      <header className="lg:hidden flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">AgriPro Sales</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </header>

      <div className="flex flex-1">
        <motion.aside 
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r shadow-lg lg:shadow-none transition-all lg:translate-x-0 lg:static",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
          initial={false}
          animate={{ x: sidebarOpen ? 0 : -320 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-md gradient-bg flex items-center justify-center">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">AgriPro Sales</span>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden" 
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <nav className="flex-1 p-4 space-y-1">
              {sidebarItems.map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                    location.pathname === item.path 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-secondary"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {location.pathname === item.path && (
                    <motion.div
                      className="absolute left-0 w-1 h-8 bg-primary-foreground rounded-r-full"
                      layoutId="activeIndicator"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              ))}
            </nav>
            
            <div className="p-4 border-t mt-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium">AD</span>
                  </div>
                  <div>
                    <p className="font-medium">Admin</p>
                    <p className="text-sm text-muted-foreground">System Administrator</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="hidden lg:flex">
                    {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>

        {sidebarOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-4 lg:p-8 overflow-auto bg-muted/30 dark:bg-gray-800">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;