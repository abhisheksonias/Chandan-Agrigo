import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import AddOrderPage from '@/pages/AddOrderPage';
import CustomersPage from '@/pages/CustomersPage';
import ProductsPage from '@/pages/ProductsPage';
import TransportsPage from '@/pages/TransportsPage';
import AnalyticsBoardPage from '@/pages/AnalyticsBoardPage';
import { AppProvider, useAppContext } from '@/context/AppContext';
import RegistrationPage from '@/pages/RegistrationPage';
import PastOrders from '@/pages/PastOrders';
// import { supabase } from '@/lib/supabaseClient';

function MainApp() {
  const { session, isLoadingSession, signOut } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  // List of public routes that don't require authentication
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  useEffect(() => {
    // Only redirect to login if:
    // 1. Not loading session
    // 2. No session exists
    // 3. Not already on a public route
    if (!isLoadingSession && !session && !isPublicRoute) {
      navigate('/login');
    }
  }, [session, isLoadingSession, navigate, isPublicRoute]);

  // Show loading screen while checking session
  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-white text-xl">Loading Application...</div>
      </div>
    );
  }

  // If no session, show public routes (login/register)
  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // If session exists, show authenticated routes
  return (
    <Layout onLogout={signOut}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add-order" element={<AddOrderPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/transports" element={<TransportsPage />} />
        <Route path="/analytics" element={<AnalyticsBoardPage />} />
        <Route path="/past-orders" element={<PastOrders />} />
        {/* Redirect authenticated users away from auth pages */}
        <Route path="/login" element={<Navigate to="/" />} />
        <Route path="/register" element={<Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <MainApp />
      <Toaster />
    </AppProvider>
  );
}

export default App;