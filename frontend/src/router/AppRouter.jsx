import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import ArchivalPageLoader from '../components/layout/ArchivalPageLoader/ArchivalPageLoader';

// Public Landing Page (Immediate or lightweight lazy)
const LandingPage = lazy(() => import('../pages/public/Landing'));
const PortalsPage = lazy(() => import('../pages/public/Portals'));
const UserLogin = lazy(() => import('../pages/public/Login/UserLogin'));
const AdminLogin = lazy(() => import('../pages/public/Login/AdminLogin'));
const VendorLogin = lazy(() => import('../pages/public/Login/VendorLogin'));
const PasswordRecovery = lazy(() => import('../pages/public/Login/PasswordRecovery'));
const UserRegister = lazy(() => import('../pages/public/Register/UserRegister'));
const VendorRegister = lazy(() => import('../pages/public/Register/VendorRegister'));
const NotFoundPage = lazy(() => import('../pages/public/NotFound'));

// User Portal Pages (Lazy Loaded)
const UserDashboard = lazy(() => import('../pages/user/Dashboard'));
const AssessmentPage = lazy(() => import('../pages/user/Assessment'));
const RecyclingPage = lazy(() => import('../pages/user/Recycling'));
const RewardsPage = lazy(() => import('../pages/user/Rewards'));
const BookingsPage = lazy(() => import('../pages/user/Bookings'));
const UserAnalyticsPage = lazy(() => import('../pages/user/Analytics'));

// Vendor Portal Pages (Lazy Loaded)
const VendorDashboard = lazy(() => import('../pages/vendor/Dashboard'));
const VendorAnalyticsPage = lazy(() => import('../pages/vendor/Analytics'));

// Admin Portal Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminUsersPage = lazy(() => import('../pages/admin/Users'));
const AdminVendorsPage = lazy(() => import('../pages/admin/Vendors'));
const AdminRepairsPage = lazy(() => import('../pages/admin/Repairs'));
const AdminRecyclingPage = lazy(() => import('../pages/admin/Recycling'));
const AdminRewardsPage = lazy(() => import('../pages/admin/Rewards'));
const AdminPaymentsPage = lazy(() => import('../pages/admin/Payments'));
const AdminAnalyticsPage = lazy(() => import('../pages/admin/Analytics'));
const AdminPerformancePage = lazy(() => import('../pages/admin/Performance'));
const AdminAuditPage = lazy(() => import('../pages/admin/Audit'));

export function AppRouter() {
  return (
    <Suspense fallback={<ArchivalPageLoader />}>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/portals" element={<PortalsPage />} />
        <Route path="/login" element={<Navigate to="/login/user" replace />} />
        <Route path="/register" element={<Navigate to="/register/user" replace />} />
        <Route path="/login/user" element={<UserLogin />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/login/vendor" element={<VendorLogin />} />
        <Route path="/forgot-password" element={<PasswordRecovery />} />
        <Route path="/reset-password" element={<PasswordRecovery />} />
        <Route path="/register/user" element={<UserRegister />} />
        <Route path="/register/vendor" element={<VendorRegister />} />

        {/* User Portal Pages (Protected: USER, ADMIN) */}
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/assessment"
          element={
            <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
              <AssessmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/recycling"
          element={
            <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
              <RecyclingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/rewards"
          element={
            <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
              <RewardsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/bookings"
          element={
            <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
              <BookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/analytics"
          element={
            <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
              <UserAnalyticsPage />
            </ProtectedRoute>
          }
        />

        {/* Vendor Portal Pages (Protected: VENDOR, ADMIN) */}
        <Route
          path="/vendor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['VENDOR', 'ADMIN']}>
              <VendorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/analytics"
          element={
            <ProtectedRoute allowedRoles={['VENDOR', 'ADMIN']}>
              <VendorAnalyticsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Governance Portal Pages (Protected: ADMIN Only) */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/vendors"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminVendorsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/repairs"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminRepairsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/recycling"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminRecyclingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rewards"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminRewardsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminPaymentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminAnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/performance"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminPerformancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminAuditPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default AppRouter;
