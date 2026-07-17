import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SynapseProvider } from './context/SynapseContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import Toast from './components/common/Toast';
import LoginPage from './views/LoginPage';
import RegisterPage from './views/RegisterPage';
import Observatory from './views/Observatory';

import CommandCenter from './views/CommandCenter';
import SettingsPage from './views/SettingsPage'; 
import ImportPage from './views/ImportPage';
import NeuralCorePage from './views/NeuralCorePage';
import SupportPage from './views/SupportPage';
import './framer-styles.css';

// Native Landing Pages
import LandingPage from './views/Landing/LandingPage';
import PricingPage from './views/Landing/PricingPage';
import AboutPage from './views/Landing/pages/AboutPage';
import AcceptableUsePage from './views/Landing/pages/AcceptableUsePage';
import CareersPage from './views/Landing/pages/CareersPage';
import CaseStudiesPage from './views/Landing/pages/CaseStudiesPage';
import ContactPage from './views/Landing/pages/ContactPage';
import PrivacyPolicyPage from './views/Landing/pages/PrivacyPolicyPage';
import TermsAndConditionsPage from './views/Landing/pages/TermsAndConditionsPage';
// A wrapper for authenticated routes
function RequireAuth({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/acceptable-use" element={<AcceptableUsePage />} />
      <Route path="/careers" element={<CareersPage />} />
      <Route path="/case-studies" element={<CaseStudiesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
      
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route path="/app" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Navigate to="/app/observatory" replace />} />
        <Route path="observatory" element={<Observatory />} />

        <Route path="command-center" element={<CommandCenter />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="ai-builder" element={<NeuralCorePage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="import" element={<ImportPage />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <SynapseProvider>
        <BrowserRouter>
          <Toast />
          <AppContent />
        </BrowserRouter>
      </SynapseProvider>
    </AuthProvider>
  );
}

export default App;
