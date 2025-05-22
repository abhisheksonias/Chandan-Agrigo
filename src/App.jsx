import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import AddOrderPage from '@/pages/AddOrderPage';
import CustomersPage from '@/pages/CustomersPage';
import ProductsPage from '@/pages/ProductsPage';
import TransportsPage from '@/pages/TransportsPage';
import AnalyticsBoardPage from '@/pages/AnalyticsBoardPage';
import { AppProvider } from '@/context/AppContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <AppProvider>
      {isAuthenticated ? (
        <Layout onLogout={() => setIsAuthenticated(false)}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-order" element={<AddOrderPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/transports" element={<TransportsPage />} />
            <Route path="/analytics" element={<AnalyticsBoardPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      ) : (
        <Routes>
          <Route path="/login" element={<LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
      <Toaster />
    </AppProvider>
  );
}

export default App;