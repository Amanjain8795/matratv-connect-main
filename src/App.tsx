import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "./components/layout/Header";
import { AuthProvider } from "./context/NewAuthContext";
import { CartProvider } from "./context/CartContext";
import { RootErrorBoundary } from "./components/error-boundaries/RootErrorBoundary";
import { RequireAuth, RequireGuest, RequireAdmin } from "./components/auth/ProtectedRoute";
import SystemStatus from "./components/system/SystemStatus";
import GlobalSubscriptionGuard from "./components/subscription/GlobalSubscriptionGuard";
import "./i18n/config";

// Lazy load components for better performance
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Products = lazy(() => import("./pages/Products"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/NewCheckout"));
const Admin = lazy(() => import("./pages/Admin"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Subscription = lazy(() => import("./pages/Subscription"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry for auth errors
        if (error?.message?.includes('auth') || error?.status === 401) {
          return false;
        }
        // Don't retry for client errors (4xx except 401)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 401) {
          return false;
        }
        // Retry up to 3 times for network/server errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations for client errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry once for network errors
        return failureCount < 1;
      },
    },
  },
});

// Loading component for suspense fallback
const LoadingPage = () => (
  <div className="container py-8">
    <div className="space-y-6">
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Component to conditionally render header based on route
const ConditionalHeader = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Don't render header for admin routes
  if (isAdminRoute) {
    return null;
  }

  return <Header />;
};

// Main app content wrapper
const AppContent = () => (
  <RootErrorBoundary>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SystemStatus />
          <ConditionalHeader />
          <main className="min-h-screen">
            <GlobalSubscriptionGuard>
              <Suspense fallback={<LoadingPage />}>
                <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/rewards" element={<Rewards />} />

                {/* Guest-only routes (redirect to home if authenticated) */}
                <Route path="/login" element={
                  <RequireGuest>
                    <Login />
                  </RequireGuest>
                } />
                <Route path="/register" element={
                  <RequireGuest>
                    <Register />
                  </RequireGuest>
                } />
                <Route path="/forgot-password" element={
                  <RequireGuest>
                    <ForgotPassword />
                  </RequireGuest>
                } />
                <Route path="/reset-password" element={
                  <RequireGuest>
                    <ResetPassword />
                  </RequireGuest>
                } />
                <Route path="/verify-email" element={<VerifyEmail />} />

                {/* Subscription route (requires authentication but not active subscription) */}
                <Route path="/subscription" element={
                  <RequireAuth>
                    <Subscription />
                  </RequireAuth>
                } />

                {/* Protected routes (require authentication) */}
                <Route path="/cart" element={
                  <RequireAuth>
                    <Cart />
                  </RequireAuth>
                } />
                <Route path="/checkout" element={
                  <RequireAuth>
                    <Checkout />
                  </RequireAuth>
                } />
                <Route path="/profile" element={
                  <RequireAuth>
                    <Profile />
                  </RequireAuth>
                } />

                {/* Admin-only routes */}
                <Route path="/admin" element={
                  <RequireAdmin>
                    <Admin />
                  </RequireAdmin>
                } />

                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </GlobalSubscriptionGuard>
          </main>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </RootErrorBoundary>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
