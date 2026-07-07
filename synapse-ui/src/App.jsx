import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SynapseProvider } from './context/SynapseContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Toast from './components/Toast/Toast';
import LandingPage from './views/LandingPage';
import LoginPage from './views/LoginPage';
import RegisterPage from './views/RegisterPage';
import OrchestrationEditor from './views/OrchestrationEditor';
import MultiModalInbox from './views/MultiModalInbox';
import CommandCenter from './views/CommandCenter';
import SettingsPage from './views/SettingsPage'; // We will create this next

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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route path="/app" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Navigate to="/app/orchestration" replace />} />
        <Route path="orchestration" element={<OrchestrationEditor />} />
        <Route path="inbox" element={<MultiModalInbox />} />
        <Route path="command-center" element={<CommandCenter />} />
        <Route path="settings" element={<SettingsPage />} />
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
