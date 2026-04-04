import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import Toast from './components/shared/Toast';

// Layouts - Keeping these static so the "Shell" loads instantly
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';
import Layout from './components/layout/Layout';

// Lazy Load Pages (Code Splitting)
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const UserApp = lazy(() => import('./pages/UserApp'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ContractorApp = lazy(() => import('./pages/ContractorApp'));

// Reusable Loading Spinner Component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-brand-bg">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent"></div>
  </div>
);

function App() {
  const [initialLoad, setInitialLoad] = useState(true);

  // Simulating initial app check
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoad(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const getUser = () => JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = () => !!localStorage.getItem('user');
  const getRole = () => getUser().role || 'user';

  // Protected Route Wrapper
  const ProtectedRoute = ({ allowedRoles }) => {
    if (!isLoggedIn()) return <Navigate to="/login" replace />;
    
    const userRole = getRole();
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      if (userRole === 'admin') return <Navigate to="/admin" replace />;
      if (userRole === 'contractor') return <Navigate to="/contractor" replace />;
      return <Navigate to="/user" replace />;
    }

    return <Outlet />;
  };

  // Show spinner only on the very first mount of the application
  if (initialLoad) {
    return <LoadingSpinner />;
  }

  return (
    <ToastProvider>
      <Toast />
      <Router>
        {/* Suspense handles the loading state when switching pages (Lazy Loading) */}
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route element={<Layout />}>
              <Route path="/login" element={isLoggedIn() ? <Navigate to="/" /> : <Login />} />
              <Route path="/register" element={isLoggedIn() ? <Navigate to="/" /> : <Register />} />
            </Route>

            {/* ROOT REDIRECT */}
            <Route path="/" element={
              isLoggedIn() 
                ? <Navigate to={getRole() === 'admin' ? '/admin' : getRole() === 'contractor' ? '/contractor' : '/user'} replace /> 
                : <Navigate to="/login" replace />
            } />

            {/* USER ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={['user']} />}>
              <Route element={<UserLayout />}>
                <Route path="/user" element={<UserApp />} />
              </Route>
            </Route>

            {/* ADMIN ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Route>

            {/* CONTRACTOR ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={['contractor', 'admin']} />}>
              <Route element={<UserLayout />}>
                <Route path="/contractor" element={<ContractorApp />} />
              </Route>
            </Route>

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ToastProvider>
  );
}

export default App;