import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import '@fontsource/inter';

// Pages
import Home from './pages/landing/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Clients from './pages/Clients';
import Products from './pages/Products';
import Quotes from './pages/Quotes';
import QuoteForm from './pages/QuoteForm';
import Invoices from './pages/Invoices';
import InvoiceForm from './pages/InvoiceForm';
import Settings from './pages/Settings';
import AdminUsers from './pages/AdminUsers';

// Simple placeholders for missing pages
const Unpaid = () => <div className="p-20 text-center font-bold">Suivi Impayés (Soon)</div>;

function App() {
  const { initializeAuth, loading, initialized } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (loading && !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
          <p className="text-sm font-medium text-slate-500">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Protected Dashboard Routes */}
        <Route element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/products" element={<Products />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/quotes/new" element={<QuoteForm />} />
          <Route path="/quotes/:id/edit" element={<QuoteForm />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<InvoiceForm />} />
          <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
          <Route path="/unpaid" element={<Unpaid />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
