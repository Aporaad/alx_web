import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PortalAuthProvider, usePortalAuth } from './context/PortalAuthContext';
import { PortalThemeProvider } from './context/PortalThemeContext';

// ─── Lazy-loaded pages for code splitting ─────────────────────────────────────
const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const PendingApprovalPage = lazy(() => import('./pages/auth/PendingApprovalPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));

const CustomerLayout = lazy(() => import('./layouts/CustomerLayout'));
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard'));
const MyOrdersPage = lazy(() => import('./pages/customer/MyOrdersPage'));
const CustomerLedgerPage = lazy(() => import('./pages/customer/CustomerLedgerPage'));

const CourierLayout = lazy(() => import('./layouts/CourierLayout'));
const CourierDashboard = lazy(() => import('./pages/courier/CourierDashboard'));
const CourierTasksPage = lazy(() => import('./pages/courier/CourierTasksPage'));
const CourierLedgerPage = lazy(() => import('./pages/courier/CourierLedgerPage'));

const SupplierLayout = lazy(() => import('./layouts/SupplierLayout'));
const SupplierDashboard = lazy(() => import('./pages/supplier/SupplierDashboard'));
const SupplierOrdersPage = lazy(() => import('./pages/supplier/SupplierOrdersPage'));
const SupplierLedgerPage = lazy(() => import('./pages/supplier/SupplierLedgerPage'));

const ProfilePage = lazy(() => import('./pages/shared/ProfilePage'));
const AnnouncementsPage = lazy(() => import('./pages/shared/AnnouncementsPage'));
const SupportTicketsPage = lazy(() => import('./pages/shared/SupportTicketsPage'));

// ─── Loading Fallback ─────────────────────────────────────────────────────────
function PageLoading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#050505',
      gap: '1rem'
    }}>
      <div style={{
        width: '2.5rem', height: '2.5rem',
        border: '3px solid rgba(212,175,55,0.2)',
        borderTopColor: '#d4af37',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#d4af37', fontSize: '0.8rem', fontFamily: 'Cairo, sans-serif' }}>
        جاري التحميل...
      </p>
    </div>
  );
}

// ─── Route Guards ─────────────────────────────────────────────────────────────
function RequireAuth({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, initialized, loading } = usePortalAuth();

  if (!initialized || loading) return <PageLoading />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (user.approvalStatus === 'pending_approval') return <Navigate to="/auth/pending" replace />;
  if (user.approvalStatus === 'rejected') return <Navigate to="/auth/login" replace />;
  if (role && user.portalRole !== role) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const { user, initialized } = usePortalAuth();
  if (!initialized) return <PageLoading />;
  if (user && user.approvalStatus === 'approved') {
    const dest = user.portalRole === 'customer' ? '/portal/customer'
      : user.portalRole === 'courier' ? '/portal/courier'
        : '/portal/supplier';
    return <Navigate to={dest} replace />;
  }
  return <>{children}</>;
}

function HomeRedirect() {
  const { user } = usePortalAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.approvalStatus !== 'approved') return <Navigate to="/auth/pending" replace />;
  const dest = user.portalRole === 'customer' ? '/portal/customer'
    : user.portalRole === 'courier' ? '/portal/courier'
      : '/portal/supplier';
  return <Navigate to={dest} replace />;
}

// ─── App Router ───────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {/* Public Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Routes */}
        <Route path="/auth/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
        <Route path="/auth/register" element={<RequireGuest><RegisterPage /></RequireGuest>} />
        <Route path="/auth/pending" element={<PendingApprovalPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

        {/* Portal redirect */}
        <Route path="/portal" element={<RequireAuth><HomeRedirect /></RequireAuth>} />

        {/* ── Customer Portal ────────────────────────────────────────── */}
        <Route path="/portal/customer" element={
          <RequireAuth role="customer"><CustomerLayout /></RequireAuth>
        }>
          <Route index element={<CustomerDashboard />} />
          <Route path="new-order" element={<MyOrdersPage />} />
          <Route path="orders" element={<MyOrdersPage />} />
          <Route path="ledger" element={<CustomerLedgerPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="tickets" element={<SupportTicketsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* ── Courier Portal ─────────────────────────────────────────── */}
        <Route path="/portal/courier" element={
          <RequireAuth role="courier"><CourierLayout /></RequireAuth>
        }>
          <Route index element={<CourierDashboard />} />
          <Route path="tasks" element={<CourierTasksPage />} />
          <Route path="ledger" element={<CourierLedgerPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="tickets" element={<SupportTicketsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* ── Supplier Portal ────────────────────────────────────────── */}
        <Route path="/portal/supplier" element={
          <RequireAuth role="supplier"><SupplierLayout /></RequireAuth>
        }>
          <Route index element={<SupplierDashboard />} />
          <Route path="orders" element={<SupplierOrdersPage />} />
          <Route path="ledger" element={<SupplierLedgerPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="tickets" element={<SupportTicketsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <PortalThemeProvider>
      <PortalAuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0d0d0f',
                color: '#e2e8f0',
                border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: '0.75rem',
                fontSize: '0.82rem',
                fontFamily: 'Cairo, Inter, sans-serif',
              },
              success: { iconTheme: { primary: '#d4af37', secondary: '#0d0d0f' } },
              error: { iconTheme: { primary: '#f87171', secondary: '#0d0d0f' } },
            }}
          />
        </BrowserRouter>
      </PortalAuthProvider>
    </PortalThemeProvider>
  );
}
