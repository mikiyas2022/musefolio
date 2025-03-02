import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/landing/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Onboarding from './pages/onboarding/Onboarding';
import Dashboard from './pages/dashboard/Dashboard';
import PortfolioEditor from './pages/editor/PortfolioEditor';
import PortfolioPreview from './pages/preview/PortfolioPreview';
import ProjectEditor from './pages/editor/ProjectEditor';
import { isAuthenticated } from './services/auth'; // Import our auth service

// Protected Route component
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  // Use our auth service's isAuthenticated function instead of just checking localStorage
  const authenticated = isAuthenticated();
  console.log('🔒 ProtectedRoute: Authentication check result:', authenticated);
  return authenticated ? element : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '1.5rem',
        color: '#666'
      }}>
        Loading...
      </div>
    }>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/showcase" element={<PortfolioPreview />} />
        <Route path="/:username" element={<PortfolioPreview />} />
        
        {/* Protected Routes */}
        <Route path="/onboarding" element={<ProtectedRoute element={<Onboarding />} />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/editor" element={<ProtectedRoute element={<PortfolioEditor />} />} />
        <Route path="/editor/:id" element={<ProtectedRoute element={<PortfolioEditor />} />} />
        <Route path="/dashboard/projects/new" element={<ProtectedRoute element={<ProjectEditor />} />} />
        <Route path="/dashboard/projects/:id/edit" element={<ProtectedRoute element={<ProjectEditor />} />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes; 