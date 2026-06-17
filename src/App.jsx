import React, { Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SupabaseProvider } from '@/contexts/SupabaseContext';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { checkBucketAccess } from '@/lib/mediaStorageSetup';
import LoginPage from '@/pages/LoginPage';

// Create a client for React Query
const queryClient = new QueryClient();

// Component to redirect to external URL
function ExternalRedirect({ url }) {
  useEffect(() => {
    window.location.href = url;
  }, [url]);

  return null;
}

// Route guard component to validate access key for login page
function ProtectedLoginPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const key = params.get('key');

  // Only allow access if the correct key is provided
  const VALID_KEY = 'Po0FZEpzq9d2osj3X2';

  if (key !== VALID_KEY) {
    // Redirect to main site if key is missing or incorrect
    return <ExternalRedirect url="https://neomart.space" />;
  }

  // Render the login page (outer Suspense will handle loading)
  return <LoginPage />;
}

// Lazy load pages for admin dashboard only
const InventoryPage = React.lazy(() => import('@/pages/InventoryPage'));
const StoreAnalyticsPage = React.lazy(() => import('@/pages/StoreAnalyticsPage'));
const CouponManagementPage = React.lazy(() => import('@/pages/CouponManagementPage'));
const EarningsAccountsPage = React.lazy(() => import('@/pages/EarningsAccountsPage'));
const AdminPopupPage = React.lazy(() => import('@/pages/AdminPopupPage'));
const OrderStatusManagementPage = React.lazy(() => import('@/pages/OrderStatusManagementPage'));
const MaintenanceManagementPage = React.lazy(() => import('@/pages/MaintenanceManagementPage'));
const NewsUpdatesPage = React.lazy(() => import('@/pages/NewsUpdatesPage'));

// Loading fallback component
const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="text-center">
      <div className="inline-block w-12 h-12 rounded-full border-3 border-gray-700 border-t-blue-500 animate-spin mb-4"></div>
      <p className="text-gray-300 font-medium">جاري تحميل...</p>
    </div>
  </div>
);

function App() {
  useEffect(() => {
    // Check if storage bucket is accessible on app load
    checkBucketAccess().catch(err => {
      console.warn('Storage bucket access check failed:', err);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        <AuthProvider>
          <ThemeProvider>
            <Router>
              <div className="min-h-screen">
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    {/* Redirect home to main site */}
                    <Route path="/" element={<ExternalRedirect url="https://neomart.space" />} />

                    {/* Hidden admin login page with key protection */}
                    <Route
                      path="/ahmedloginwith3non"
                      element={<ProtectedLoginPage />}
                    />

                    {/* Block access to old login path */}
                    <Route path="/login" element={<ExternalRedirect url="https://neomart.space" />} />

                    {/* Protected admin pages */}
                    <Route
                      path="/inventory"
                      element={
                        <ProtectedRoute>
                          <InventoryPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/analytics"
                      element={
                        <ProtectedRoute>
                          <StoreAnalyticsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/coupons"
                      element={
                        <ProtectedRoute>
                          <CouponManagementPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/earnings"
                      element={
                        <ProtectedRoute>
                          <EarningsAccountsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/order-status-management"
                      element={
                        <ProtectedRoute>
                          <OrderStatusManagementPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/popups"
                      element={
                        <ProtectedRoute>
                          <AdminPopupPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/maintenance-management"
                      element={
                        <ProtectedRoute>
                          <MaintenanceManagementPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/news-updates"
                      element={
                        <ProtectedRoute>
                          <NewsUpdatesPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Catch-all: redirect unknown routes to main site */}
                    <Route path="*" element={<ExternalRedirect url="https://neomart.space" />} />
                  </Routes>
                </Suspense>
                <Toaster />
              </div>
            </Router>
          </ThemeProvider>
        </AuthProvider>
      </SupabaseProvider>
    </QueryClientProvider>
  );
}

export default App;
