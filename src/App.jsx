import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
// import { supabase } from '@/lib/supabaseClient';

function MainApp() {
  const { session, isLoadingSession, signOut } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoadingSession && !session) {
      navigate('/login');
    }
  }, [session, isLoadingSession, navigate]);

  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-white text-xl">Loading Application...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Layout onLogout={signOut}>
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