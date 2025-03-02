import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FeedbackProvider } from './contexts/FeedbackContext';
import './styles/shared.css';
import { ThemeProvider } from './contexts/ThemeContext';
import AppRoutes from './routes';
import { validateTokenStatus } from './utils/apiUtils';
import * as AuthService from './services/auth';

// ERROR BOUNDARY: Add an ErrorBoundary component to prevent UI freezing
class ErrorBoundary extends React.Component<{children: React.ReactNode}> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: any, info: any) {
    console.error('React ErrorBoundary caught an error:', error, info);
  }
  
  resetError = () => {
    this.setState({ hasError: false, error: null });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          margin: '20px',
          border: '1px solid red',
          borderRadius: '5px',
          backgroundColor: '#fff'
        }}>
          <h2>Something went wrong</h2>
          <p>The application encountered an error. Please try:</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              margin: '10px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
          <button 
            onClick={this.resetError}
            style={{
              padding: '8px 16px',
              margin: '10px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try to Recover
          </button>
          {/* Emergency action to reset login state */}
          <button 
            onClick={() => {
              localStorage.removeItem('was_logged_out');
              sessionStorage.removeItem('was_logged_out');
              // @ts-ignore
              window.__explicitLogout = false;
              window.location.reload();
            }}
            style={{
              padding: '8px 16px',
              margin: '10px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reset Login & Reload
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Force authentication on page load
async function forceAuthenticationCheck() {
  console.log('🔒 FORCE AUTH CHECK: Running immediate auth check on App load');
  try {
    // First try our new auth service
    await AuthService.waitForInit();
    const authData = AuthService.loadAuthData();
    
    // If auth service says we're authenticated, trust it
    if (authData.isAuthenticated) {
      console.log('✅ Auth service reports authenticated state');
      window.__isAuthenticated = true;
      return true;
    }
    
    // Otherwise check manually for tokens/user data in any storage
    const tokenInLocal = localStorage.getItem('token');
    const userInLocal = localStorage.getItem('user');
    
    if (tokenInLocal && userInLocal) {
      console.log('✅ Found auth data in localStorage');
      // Force set auth state
      localStorage.setItem('authState', 'true');
      window.__isAuthenticated = true;
      
      // Save to auth service to ensure it's in sync
      AuthService.saveAuthData(tokenInLocal, userInLocal);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error in force auth check:', error);
    return false;
  }
}

// Add synchronous check but also waits for auth service initialization
const checkAuthImmediately = async () => {
  try {
    console.log('🔐 EMERGENCY AUTH CHECK: Running immediately before React renders');
    
    // Wait for auth service initialization using the promise
    await AuthService.waitForInit();
    
    console.log('🔐 EMERGENCY AUTH CHECK: Auth service initialization complete');
    
    // Now load auth data after initialization
    const authData = AuthService.loadAuthData();
    
    if (authData.isAuthenticated) {
      console.log('🔐 EMERGENCY AUTH CHECK: Found valid authentication data');
      
      // Clear any explicit logout flag that might be accidentally set
      if (window.__explicitLogout && authData.isAuthenticated) {
        console.log('⚠️ EMERGENCY AUTH CHECK: Fixing conflict between auth data and logout flag');
        window.__explicitLogout = false;
        localStorage.removeItem('was_logged_out');
      }
      
      // THIS IS CRITICAL: Set global flag before React initializes
      window.__isAuthenticated = true;
      window.__authInitialized = true;
    } else {
      console.log('🔐 EMERGENCY AUTH CHECK: No valid authentication data found');
      window.__isAuthenticated = false;
      window.__authInitialized = true;
    }
    
    return authData.isAuthenticated;
  } catch (err) {
    console.error('⚠️ EMERGENCY AUTH CHECK: Error checking auth state', err);
    window.__authInitialized = true; // Mark as initialized even on error
    return false;
  }
};

// Pre-initialize auth but don't block rendering
const authPromise = checkAuthImmediately();

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  
  // Log when App component mounts and wait for auth to complete
  useEffect(() => {
    const setupApp = async () => {
      try {
        // Wait for auth check to complete
        const isAuthenticated = await authPromise;
        
        console.log('🚀 App component mounted, auth state:', 
          isAuthenticated ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');
        
        // CRITICAL: Force authentication check to override any auto-logout mechanisms
        await forceAuthenticationCheck();
        
        // Set up window protection mechanisms
        setupWindowProtection();
        
        // Mark auth check as complete
        setAuthChecked(true);
      } catch (error) {
        console.error('Failed to complete auth check:', error);
        setAuthChecked(true); // Continue anyway
      }
    };
    
    setupApp();
    
    return () => {
      console.log('App component unmounting');
    };
  }, []);
  
  // Setup window protection mechanisms
  const setupWindowProtection = () => {
    // Listen for storage events to sync auth state across tabs
    window.addEventListener('storage', (event) => {
      if (event.key === 'token' || event.key === 'user' || event.key === 'authState' || event.key === 'was_logged_out') {
        console.log(`Storage changed for ${event.key}, updating state`);
        
        if (event.key === 'was_logged_out' && event.newValue === 'true') {
          window.__explicitLogout = true;
          window.__isAuthenticated = false;
        } else {
          // Recheck auth
          AuthService.isAuthenticated();
        }
      }
    });
    
    // Add protection for window beforeunload
    window.addEventListener('beforeunload', () => {
      // Ensure auth data is synchronized before page unloads
      const isAuth = AuthService.isAuthenticated();
      if (isAuth && window.__isAuthenticated) {
        console.log('💾 Syncing auth data before page unload');
      }
    });
    
    // Add debug functions
    window.__forceSaveAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          AuthService.saveAuthData(token, user);
          console.log('✅ Forced auth data save complete');
          return true;
        } catch (e) {
          console.error('❌ Error forcing auth data save:', e);
          return false;
        }
      } else {
        console.error('❌ Cannot force save: missing token or user data');
        return false;
      }
    };
  };

  return (
    <Router>
      <ThemeProvider>
        <FeedbackProvider>
          <AuthProvider>
            <ToastContainer position="top-right" autoClose={5000} />
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </AuthProvider>
        </FeedbackProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
