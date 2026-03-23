import * as React from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';

import BottomNav from '@/components/BottomNav';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import PageLoader from '@/components/ui/PageLoader';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
import ScrollToTop from '@/components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/context/AuthContext';
import { ModeProvider } from '@/context/ModeContext';

const Home = React.lazy(() => import('@/pages/Home'));
const AuthPage = React.lazy(() => import('@/pages/AuthPage'));
const SendParcel = React.lazy(() => import('@/pages/SendParcel'));
const FindTrip = React.lazy(() => import('@/pages/FindTrip'));
const FindTraveler = React.lazy(() => import('@/pages/FindTraveler'));
const TrustCenter = React.lazy(() => import('@/pages/TrustCenter'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const VerificationHub = React.lazy(() => import('@/pages/VerificationHub'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

function AppRoutes() {
  const location = useLocation();

  return (
    <RouteErrorBoundary resetKey={location.pathname}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/send" element={<SendParcel />} />
          <Route path="/find" element={<FindTrip />} />
          <Route path="/find-traveler" element={<FindTraveler />} />
          <Route path="/trust" element={<TrustCenter />} />
          <Route path="/how-it-works" element={<TrustCenter />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verification-hub"
            element={
              <ProtectedRoute>
                <VerificationHub />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </RouteErrorBoundary>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ModeProvider>
        <BrowserRouter>
          <ScrollToTop />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-slate-900"
          >
            Skip to content
          </a>
          <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
            <Header />
            <main id="main-content" className="flex-1">
              <React.Suspense fallback={<PageLoader label="Loading experience" fullScreen />}>
                <AppRoutes />
              </React.Suspense>
            </main>
            <Footer />
            <BottomNav />
          </div>
        </BrowserRouter>
      </ModeProvider>
    </AuthProvider>
  );
}
