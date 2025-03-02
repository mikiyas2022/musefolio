import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Landing from './pages/landing/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Onboarding from './pages/onboarding/Onboarding';
import Dashboard from './pages/dashboard/Dashboard';
import PortfolioEditor from './pages/editor/PortfolioEditor';
import PortfolioPreview from './pages/preview/PortfolioPreview';
import ProjectEditor from './pages/editor/ProjectEditor';
import { useAuth } from './contexts/AuthContext';

// Protected Route component
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated, isLoading, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  
  useEffect(() => {
    // Check authentication status directly with the server
    const verifyAuth = async () => {
      try {
        // Refresh user data to ensure we have the latest authentication state
        await refreshUserData();
        setChecking(false);
      } catch (error) {
        console.error('Authentication verification failed:', error);
        // If verification fails, consider not authenticated
        setChecking(false);
      }
    };
    
    verifyAuth();
  }, [refreshUserData]);
  
  // Show a loading state while authentication is being checked
  if (isLoading || checking) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '1.5rem',
        color: '#666',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div>Checking authentication...</div>
        <div style={{ width: '50px', height: '50px', border: '5px solid #f3f3f3', borderTop: '5px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }
  
  // Once loading is done, check if authenticated
  return isAuthenticated ? element : <Navigate to="/login" state={{ from: window.location.pathname }} />;
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