import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { ShieldOff } from 'lucide-react';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import UploadResumePage from './pages/UploadResumePage';
import ProfilePage from './pages/ProfilePage';
import RecommendationsPage from './pages/RecommendationsPage';
import JobDetailsPage from './pages/JobDetailsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import CreateJobPage from './pages/CreateJobPage';
import ManageJobsPage from './pages/ManageJobsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// ─────────────────────────────────────────────
// Guard: authentication required
// ─────────────────────────────────────────────
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// ─────────────────────────────────────────────
// Guard: specific roles can access this route.
// Admin always bypasses so they can visit candidate/recruiter pages too.
// ─────────────────────────────────────────────
const RoleRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { role, loading } = useAuth();
  if (loading) return null;
  // Admin can access all non-admin-exclusive routes as well
  if (role === 'admin' || (role && allowedRoles.includes(role))) {
    return <>{children}</>;
  }
  return <Navigate to="/dashboard" replace />;
};

// ─────────────────────────────────────────────
// Guard: STRICTLY admin-only — candidates and
// recruiters are shown an "Access Denied" page,
// NOT silently redirected, so it's explicit.
// ─────────────────────────────────────────────
const AdminOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, loading } = useAuth();
  if (loading) return null;

  if (role === 'admin') {
    return <>{children}</>;
  }

  // Show a clear "Access Denied" screen — not just a redirect
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <ShieldOff size={32} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-dark-50">Access Denied</h1>
        <p className="text-dark-400 text-sm max-w-xs">
          You do not have permission to access the Admin Panel.
          Only administrators can view this page.
        </p>
        <a
          href="/dashboard"
          className="mt-4 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-all"
        >
          Go to My Dashboard
        </a>
      </div>
    </Layout>
  );
};

export const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth routes — redirect to dashboard if already logged in */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
        
        {/* General Protected Dashboard Router (role-specific content rendered inside) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } 
        />

        {/* ── Candidate-only Routes ───────────────────────────────── */}
        <Route 
          path="/upload-resume" 
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['candidate']}>
                <Layout><UploadResumePage /></Layout>
              </RoleRoute>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['candidate']}>
                <Layout><ProfilePage /></Layout>
              </RoleRoute>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/recommendations" 
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['candidate']}>
                <Layout><RecommendationsPage /></Layout>
              </RoleRoute>
            </ProtectedRoute>
          } 
        />

        {/* ── Recruiter-only Routes ───────────────────────────────── */}
        <Route 
          path="/create-job" 
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['recruiter']}>
                <Layout><CreateJobPage /></Layout>
              </RoleRoute>
            </ProtectedRoute>
          } 
        />

        {/* ── Shared Recruiter + Admin Routes ────────────────────── */}
        <Route 
          path="/manage-jobs" 
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['recruiter', 'admin']}>
                <Layout><ManageJobsPage /></Layout>
              </RoleRoute>
            </ProtectedRoute>
          } 
        />

        {/* ── Shared Candidate + Recruiter Routes ─────────────────── */}
        <Route 
          path="/applications" 
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['candidate', 'recruiter']}>
                <Layout><ApplicationsPage /></Layout>
              </RoleRoute>
            </ProtectedRoute>
          } 
        />

        {/* Public Job Details (sidebar shown only when logged in) */}
        <Route 
          path="/jobs/:id" 
          element={
            <Layout showSidebar={isAuthenticated}><JobDetailsPage /></Layout>
          } 
        />

        {/* ── ADMIN-ONLY Routes ────────────────────────────────────
            Uses AdminOnlyRoute — candidates/recruiters see Access Denied.
            No bypass from admin-bypass logic here.              */}
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <Layout><AdminUsersPage /></Layout>
              </AdminOnlyRoute>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/analytics" 
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <Layout><AdminAnalyticsPage /></Layout>
              </AdminOnlyRoute>
            </ProtectedRoute>
          } 
        />


        {/* Settings (all authenticated roles) */}
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Layout><SettingsPage /></Layout>
            </ProtectedRoute>
          } 
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
