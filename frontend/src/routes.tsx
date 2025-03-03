import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Landing from './pages/landing/Landing';
import PortfolioEditor from './pages/editor/PortfolioEditor';
import PortfolioPreview from './pages/preview/PortfolioPreview';
import ProjectEditor from './pages/editor/ProjectEditor';
import About from './pages/about/About';
import CV from './pages/cv/CV';
import Onboarding from './pages/onboarding/Onboarding';

// Simple ProtectedRoute component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/showcase" element={<PortfolioPreview />} />
      <Route path="/:username" element={<PortfolioPreview />} />
      
      {/* Protected routes */}
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/editor" element={<ProtectedRoute><PortfolioEditor /></ProtectedRoute>} />
      <Route path="/editor/:id" element={<ProtectedRoute><PortfolioEditor /></ProtectedRoute>} />
      <Route path="/dashboard/projects/new" element={<ProtectedRoute><ProjectEditor /></ProtectedRoute>} />
      <Route path="/dashboard/projects/:id/edit" element={<ProtectedRoute><ProjectEditor /></ProtectedRoute>} />
      <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
      <Route path="/cv" element={<ProtectedRoute><CV /></ProtectedRoute>} />
    </Routes>
  );
};

export default AppRoutes; 