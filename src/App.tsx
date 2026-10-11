import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { LanguageProvider } from './context/LanguageContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { AppLayout } from './layouts/AppLayout.js';

// Pages
import { Landing } from './pages/Landing.js';
import { Login } from './pages/Login.js';
import { Signup } from './pages/Signup.js';
import { ForgotPassword } from './pages/ForgotPassword.js';
import { ResetPassword } from './pages/ResetPassword.js';
import { Onboarding } from './pages/Onboarding.js';
import { Dashboard } from './pages/Dashboard.js';
import { Transactions } from './pages/Transactions.js';
import { Categories } from './pages/Categories.js';
import { Budgets } from './pages/Budgets.js';
import { Analytics } from './pages/Analytics.js';
import { Profile } from './pages/Profile.js';
import { Settings } from './pages/Settings.js';
import { NotFound } from './pages/NotFound.js';

/**
 * ProtectedRoute: Enforces authentication and onboarding completion.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090B] flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-[#C9B58A] flex items-center justify-center font-bold text-[#08090B] text-sm animate-pulse mb-3">
          FT
        </div>
        <span className="text-xs font-mono text-[#9297A1]">Loading financial session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user hasn't completed onboarding, redirect to /onboarding
  if (user.onboarding_completed === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

/**
 * OnboardingRoute: Allows authenticated users who have NOT completed onboarding.
 */
const OnboardingRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090B] flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-[#C9B58A] flex items-center justify-center font-bold text-[#08090B] text-sm animate-pulse mb-3">
          FT
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.onboarding_completed === true) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Onboarding />;
};

/**
 * PublicAuthRoute: Redirects logged-in users away from /login & /signup.
 */
const PublicAuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    if (user.onboarding_completed === false) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              {/* Public Landing */}
              <Route path="/" element={<Landing />} />

              {/* Public Authentication Pages */}
              <Route
                path="/login"
                element={
                  <PublicAuthRoute>
                    <Login />
                  </PublicAuthRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicAuthRoute>
                    <Signup />
                  </PublicAuthRoute>
                }
              />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* First-Time Onboarding Wizard */}
              <Route path="/onboarding" element={<OnboardingRoute />} />

              {/* Authenticated Dashboard & Ledger Operations */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* 404 Not Found Catch-All */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;
