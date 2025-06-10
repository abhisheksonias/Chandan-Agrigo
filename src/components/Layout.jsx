import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  ShoppingCart,
  Users,
  Package,
  Truck,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  History,
  LineChart, // Add History icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";
import { userService } from "@/lib/supabaseService";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: ShoppingCart, label: "Add Order", path: "/add-order" },
  { icon: ClipboardList, label: "Current Orders", path: "/analytics" },
  { icon: Users, label: "Customers", path: "/customers" },
  { icon: Package, label: "Products", path: "/products" },
  { icon: Truck, label: "Transport", path: "/transports" },
  { icon: History, label: "Past Orders", path: "/past-orders" }, // Use History icon for Past Orders
  { icon: LineChart, label: "Sales Analytics", path: "/sales-analytics" }, // Use History icon for Past Orders
];

const Layout = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userData, setUserData] = useState({ name: "", email: "" });
  const [userInitials, setUserInitials] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAppContext() || {};

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.id) {
        const { success, data } = await userService.getUserById(
          session.user.id
        );
        if (success && data) {
          setUserData(data);

          // Extract initials from name
          const nameWords = data.name?.split(" ") || [];
          const initials = nameWords
            .map((word) => word[0]?.toUpperCase() || "")
            .join("")
            .slice(0, 2);
          setUserInitials(initials || "U");
        }
      }
    };

    fetchUserData();
  }, [session]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate("/login");
  };

  return (
    <div className={cn("min-h-screen flex flex-col", darkMode ? "dark" : "")}>
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Chandan Agrico</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {darkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar - Always visible on desktop, toggleable on mobile */}
        <aside
          className={cn(
            "w-64 bg-white dark:bg-gray-900 border-r shadow-lg transition-all duration-300",
            // Desktop: fixed position with full height
            "hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:translate-x-0",
            // Mobile: fixed overlay that slides in/out
            "lg:shadow-none",
            sidebarOpen &&
              "fixed inset-y-0 left-0 z-50 flex flex-col translate-x-0",
            !sidebarOpen && "lg:flex"
          )}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between">
              {" "}
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-md  flex items-center justify-center overflow-hidden">
                  <img
                    src="/CAPL_Logo.png"
                    alt="AgriPro Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xl font-bold">Chandan Agrico</span>
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
                    "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors relative",
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
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-medium">
                      {userInitials}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {userData.name || "User"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {userData.email || "Loading..."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleDarkMode}
                    className="hidden lg:flex"
                  >
                    {darkMode ? (
                      <Sun className="h-4 w-4 mr-2" />
                    ) : (
                      <Moon className="h-4 w-4 mr-2" />
                    )}
                    {darkMode ? "Light" : "Dark"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="ml-auto"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 lg:ml-64 overflow-auto bg-muted/30 dark:bg-gray-800">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
