import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { LanguageProvider } from '@/context/LanguageContext';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DatabaseProvider, useDatabase } from '@/context/DatabaseContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast';
import { PremiumEffects } from '@/components/PremiumEffects';
import { BackToTop } from '@/components/ui/BackToTop';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartSidebar } from '@/components/CartSidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Hero } from '@/sections/Hero';
import { FeaturedProducts } from '@/sections/FeaturedProducts';
import { TrustFeatures } from '@/sections/TrustFeatures';
import { LandingPage } from '@/pages/LandingPage';
import { Search, Home } from 'lucide-react';

// Lazy load route components for bundle optimization
const Login = lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('@/pages/Register').then(m => ({ default: m.Register })));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Products = lazy(() => import('@/pages/Products').then(m => ({ default: m.Products })));
const ProductDetails = lazy(() => import('@/pages/ProductDetails').then(m => ({ default: m.ProductDetails })));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('@/pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const CheckoutPage = lazy(() => import('@/pages/Checkout').then(m => ({ default: m.CheckoutPage })));
const About = lazy(() => import('@/pages/About').then(m => ({ default: m.About })));
const Contact = lazy(() => import('@/pages/Contact').then(m => ({ default: m.Contact })));
const Research = lazy(() => import('@/pages/Research').then(m => ({ default: m.Research })));
const FAQ = lazy(() => import('@/pages/FAQ').then(m => ({ default: m.FAQ })));
const Terms = lazy(() => import('@/pages/Terms').then(m => ({ default: m.Terms })));
const Privacy = lazy(() => import('@/pages/Privacy').then(m => ({ default: m.Privacy })));
const Shipping = lazy(() => import('@/pages/Shipping').then(m => ({ default: m.Shipping })));
const UserDashboard = lazy(() => import('@/pages/dashboard/UserDashboard').then(m => ({ default: m.UserDashboard })));
const PartnerDashboard = lazy(() => import('@/pages/partner/PartnerDashboard').then(m => ({ default: m.PartnerDashboard })));

// Stylish minimalist loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-12 h-12 border-[1px] border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
  </div>
);

// Protected Route component
function ProtectedRoute({ children, requireAdmin = false, requirePartner = false }: {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requirePartner?: boolean;
}) {
  const { isAuthenticated, isAdmin, isPartner } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requirePartner && !isPartner) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <FeaturedProducts />
      <TrustFeatures />
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-12">
      <div className="w-20 h-20 bg-elevated rounded-2xl flex items-center justify-center mb-6 border border-[#D4AF37]/10">
        <Search className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-5xl font-bold text-foreground mb-3">404</h1>
      <p className="text-muted-foreground text-lg mb-8">The page you're looking for doesn't exist.</p>
      <div className="flex items-center space-x-3">
        <Link
          to="/"
          className="flex items-center space-x-2 px-6 py-3 bg-[#111] dark:bg-gold-500 text-white dark:text-slate-900 hover:bg-black dark:hover:bg-gold-400 transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>Return Home</span>
        </Link>
        <Link
          to="/products"
          className="px-6 py-3 border border-[#D4AF37]/20 text-foreground hover:bg-[#D4AF37]/5 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isPartner } = useAuth();
  const { dbError } = useDatabase();

  // Check if we're in a password recovery flow (from Supabase magic link)
  // Supabase redirects to root (/) with recovery token in hash, or /reset-password
  const isRecoveryFlow = typeof window !== 'undefined' &&
    (window.location.hash.includes('type=recovery') ||
      window.location.hash.includes('access_token=') ||
      window.location.pathname === '/reset-password');

  return (
    <Router>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          {dbError && (
            <div className="bg-red-600 text-white text-center py-3 px-4 shadow-md sticky top-0 z-[100] text-sm font-medium tracking-wide relative">
              <span className="absolute inset-0 bg-black/10 mix-blend-multiply" />
              <span className="relative">System Notice: {dbError}. Some features may be unavailable.</span>
            </div>
          )}
          <Routes>
            {/* Auth pages — always accessible */}
            <Route path="/login" element={isAuthenticated && !isRecoveryFlow ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={isAuthenticated && !isRecoveryFlow ? <Navigate to="/" replace /> : <Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Everything else — requires auth or shows landing page */}
            <Route
              path="/*"
              element={
                isRecoveryFlow ? (
                  // Show reset password page during recovery flow, even if authenticated
                  <ResetPassword />
                ) : !isAuthenticated ? (
                  // Visitors see ONLY the landing page
                  <Routes>
                    <Route path="*" element={<LandingPage />} />
                  </Routes>
                ) : (
                  // Authenticated users see the full site
                  <div className="min-h-screen bg-background text-foreground font-sans selection:bg-amber-200 flex flex-col relative overflow-hidden">
                    <PremiumEffects />
                    {/* Dynamic Background Elements */}
                    <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50/50 via-white to-white pointer-events-none -z-10" />

                    <Header />
                    {isPartner && <CartSidebar />}
                    <main className="flex-1 relative z-10">
                      <ErrorBoundary>
                        <Routes>
                          {/* Admin Routes */}
                          <Route
                            path="/admin/*"
                            element={
                              <ProtectedRoute requireAdmin={true}>
                                <AdminDashboard />
                              </ProtectedRoute>
                            }
                          />

                          {/* Partner Routes */}
                          <Route
                            path="/partner/*"
                            element={
                              <ProtectedRoute requirePartner={true}>
                                <PartnerDashboard />
                              </ProtectedRoute>
                            }
                          />

                          {/* User Dashboard Routes */}
                          <Route
                            path="/dashboard/*"
                            element={
                              <ProtectedRoute>
                                <UserDashboard />
                              </ProtectedRoute>
                            }
                          />

                          {/* Authenticated user routes */}
                          <Route path="/" element={<HomePage />} />
                          <Route path="/products" element={<Products />} />
                          <Route path="/product/:sku" element={<ProductDetails />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/faq" element={<FAQ />} />
                          <Route path="/research" element={<Research />} />
                          <Route path="/terms" element={<Terms />} />
                          <Route path="/privacy" element={<Privacy />} />
                          <Route path="/shipping" element={<Shipping />} />
                          <Route
                            path="/checkout"
                            element={
                              <ProtectedRoute requirePartner={true}>
                                <CheckoutPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                      </ErrorBoundary>
                    </main>
                    <Footer />
                    <BackToTop />
                  </div>
                )
              }
            />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <DatabaseProvider>
        <AuthProvider>
          <LanguageProvider>
            <CartProvider>
              <ToastProvider>
                <AppContent />
              </ToastProvider>
            </CartProvider>
          </LanguageProvider>
        </AuthProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}

export default App;
