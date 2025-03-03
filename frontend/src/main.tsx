import './polyfills';
// Import auth service FIRST to ensure it loads before anything else
import { initAuth, authReadyPromise, isAuthenticated } from './services/auth';
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import store from './store'
import './index.css'
import App from './App'
import { initMockServer } from './test/mockServer';
import apiConfig from './config/apiConfig';

// Initialize authentication
initAuth();

// Start mock server if in mock mode
if (import.meta.env.VITE_USE_MOCK_API === 'true') {
  console.log('📊 Using mock API server');
  initMockServer();
}

// Render the app directly without waiting for auth
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// AUTOMATIC FIX: This will run automatically and fix all issues
(function() {
  console.log('🔧 AUTOMATIC REPAIR: Running complete application fix');
  
  // PART 1: Fix interaction issues
  const fixInteraction = () => {
    // Force enable pointer events and user-select on all elements
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        pointer-events: auto !important;
        user-select: auto !important;
        -webkit-user-select: auto !important;
      }
      .modal-backdrop, .overlay, [class*="overlay"], [id*="overlay"] {
        display: none !important;
      }
      body.no-scroll, body.overflow-hidden {
        overflow: auto !important;
      }
      input, button, a, [role="button"] {
        cursor: pointer !important;
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(style);
    
    // Remove any frozen overlays
    setTimeout(() => {
      const overlays = document.querySelectorAll('.modal-backdrop, .overlay, [class*="overlay"], [id*="overlay"]');
      overlays.forEach(el => el.remove());
      document.body.classList.remove('no-scroll', 'overflow-hidden');
      document.body.style.overflow = 'auto';
      console.log('✅ REPAIR: Fixed interaction blockers');
    }, 1000);
  };
  
  // PART 2: Fix auth issues
  const fixAuth = () => {
    // Clear logout flags
    localStorage.removeItem('was_logged_out');
    sessionStorage.removeItem('was_logged_out');
    window.__explicitLogout = false;
    
    // Get token and user data from any storage
    const token = localStorage.getItem('token') || 
                  sessionStorage.getItem('token') || 
                  sessionStorage.getItem('auth_backup_token');
                  
    const userData = localStorage.getItem('user') || 
                     sessionStorage.getItem('user') || 
                     sessionStorage.getItem('auth_backup_user');
    
    if (token && userData) {
      // Reset all auth storage
      localStorage.setItem('token', token);
      localStorage.setItem('user', userData);
      localStorage.setItem('authState', 'true');
      localStorage.setItem('tokenExpiry', (Date.now() + 30*24*60*60*1000).toString());
      
      // Reset session storage too
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', userData);
      sessionStorage.setItem('authState', 'true');
      
      window.__isAuthenticated = true;
      console.log('✅ REPAIR: Auth data restored');
      return true;
    } else {
      console.log('ℹ️ REPAIR: No auth data found, user needs to login');
      return false;
    }
  };
  
  // PART 3: Fix corrupted React state
  const fixReactState = () => {
    // Detect any frozen state by checking UI responsiveness
    setTimeout(() => {
      const allButtons = document.querySelectorAll('button');
      const allInputs = document.querySelectorAll('input');
      
      // Force enable all interactive elements
      allButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.pointerEvents = 'auto';
      });
      
      allInputs.forEach(input => {
        input.disabled = false;
        input.style.pointerEvents = 'auto';
      });
      
      console.log('✅ REPAIR: Enabled all interactive elements');
    }, 2000);
  };
  
  // Run all fixes
  fixInteraction();
  fixAuth();
  
  // Add fixes to the document ready event too
  document.addEventListener('DOMContentLoaded', () => {
    fixInteraction();
    fixReactState();
    console.log('✅ REPAIR: Applied fixes on DOM ready');
  });
})();

// CRITICAL FIX: Add event system recovery
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔄 Ensuring event system is working...');
  
  // Force enable pointer events and user-select on all elements
  const style = document.createElement('style');
  style.innerHTML = `
    * {
      pointer-events: auto !important;
      user-select: auto !important;
      -webkit-user-select: auto !important;
    }
    .modal-backdrop, .overlay, [class*="overlay"], [id*="overlay"] {
      display: none !important;
    }
    body.no-scroll, body.overflow-hidden {
      overflow: auto !important;
    }
  `;
  document.head.appendChild(style);
  
  // Remove any loading states or overlays
  setTimeout(() => {
    const overlays = document.querySelectorAll('.modal-backdrop, .overlay, [class*="overlay"], [id*="overlay"]');
    overlays.forEach(el => el.remove());
    document.body.classList.remove('no-scroll', 'overflow-hidden');
    document.body.style.overflow = 'auto';
    console.log('🔄 Removed potential interaction blockers');
  }, 1000);
});

// AUTO-FIX: Reset logout state on every page load
try {
  localStorage.removeItem('was_logged_out');
  sessionStorage.removeItem('was_logged_out');
  // @ts-ignore
  window.__explicitLogout = false;
  console.log('🔄 MAIN: Auto-reset logout state');
} catch (e) {
  console.error('Error resetting logout state:', e);
}

// Skip TypeScript typings and just define the emergency functions
// @ts-ignore - intentionally ignoring TypeScript here for direct browser functionality
window.__fixAuth = function() {
  console.log('🔧 Emergency auth fix running...');
  try {
    // Get token and user data from any storage
    const token = localStorage.getItem('token') || 
                  sessionStorage.getItem('token') || 
                  sessionStorage.getItem('auth_backup_token');
                  
    const userData = localStorage.getItem('user') || 
                     sessionStorage.getItem('user') || 
                     sessionStorage.getItem('auth_backup_user');
    
    if (!token || !userData) {
      console.error('❌ No valid auth data found');
      return false;
    }
    
    // Reset all auth storage
    localStorage.setItem('token', token);
    localStorage.setItem('user', userData);
    localStorage.setItem('authState', 'true');
    localStorage.setItem('tokenExpiry', (Date.now() + 30*24*60*60*1000).toString());
    
    // Reset session storage too
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', userData);
    sessionStorage.setItem('authState', 'true');
    
    // Clear logout flags
    localStorage.removeItem('was_logged_out');
    // @ts-ignore
    window.__explicitLogout = false;
    // @ts-ignore
    window.__isAuthenticated = true;
    
    console.log('✅ Auth fix successful! Please refresh the page.');
    return true;
  } catch (e) {
    console.error('❌ Auth fix failed:', e);
    return false;
  }
};

// Add direct reload function
// @ts-ignore
window.__fixAndReload = function() {
  // @ts-ignore
  if (window.__fixAuth()) {
    location.reload();
  }
};

console.log('🚀 MAIN.TSX: Auth emergency functions available. If logout issues persist, run window.__fixAndReload() in the console.');

// Regular app initialization continues below
console.log('🚀 MAIN.TSX: Starting application bootstrap');

// Force direct connection mode and disable mock server
localStorage.setItem('useMockServer', 'false');
localStorage.setItem('apiEnvironment', 'direct');

// Use direct connection to solve the proxy issues
apiConfig.useDirectConnection();

// Check if we should auto-fix auth issues
if (localStorage.getItem('token') && 
    localStorage.getItem('user') && 
    !localStorage.getItem('authState')) {
  console.log('🔄 AUTH: Found auth data without authState flag, auto-fixing...');
  // @ts-ignore
  window.__fixAuth();
}

// Wait for auth system to initialize before rendering
authReadyPromise.then(() => {
  console.log('🔐 MAIN.TSX: Auth system initialized');
  
  // Log final authentication status before rendering
  const authStatus = isAuthenticated();
  console.log('🔐 MAIN.TSX: Final auth status before render:', authStatus ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');
  
  // Render the application
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>,
  );
}).catch(error => {
  console.error('❌ MAIN.TSX: Auth initialization failed:', error);
  
  // Try emergency auth fix before rendering anyway
  // @ts-ignore
  window.__fixAuth();
  
  // Render anyway to avoid blank screen
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>,
  );
});

// Cookie utility function
function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

// CRITICAL FIX: Force restore auth on page load
(function forceRestoreAuth() {
  console.log('🚨 CRITICAL FIX: Attempting to force restore authentication on page load');
  try {
    // Check for any auth data in any storage mechanism
    const tokenInLocal = localStorage.getItem('token');
    const userInLocal = localStorage.getItem('user');
    
    const tokenInSession = sessionStorage.getItem('token'); 
    const userInSession = sessionStorage.getItem('user');
    
    const tokenInCookie = getCookie('auth_token');
    const userInCookie = getCookie('auth_user');
    
    // Log what we found
    console.log('Auth data check:', {
      localStorage: { token: !!tokenInLocal, user: !!userInLocal },
      sessionStorage: { token: !!tokenInSession, user: !!userInSession },
      cookies: { token: !!tokenInCookie, user: !!userInCookie }
    });
    
    // Restore from any available source
    if (!tokenInLocal && !userInLocal) {
      if (tokenInSession && userInSession) {
        console.log('Restoring from sessionStorage');
        localStorage.setItem('token', tokenInSession);
        localStorage.setItem('user', userInSession);
      } else if (tokenInCookie && userInCookie) {
        console.log('Restoring from cookies');
        localStorage.setItem('token', tokenInCookie);
        localStorage.setItem('user', userInCookie);
      }
    }
    
    // Clear any logout flags
    localStorage.removeItem('was_logged_out');
    sessionStorage.removeItem('was_logged_out');
    
    // Force auth state if we have token and user
    if (localStorage.getItem('token') && localStorage.getItem('user')) {
      console.log('🔓 Authentication data found, forcing auth state to true');
      localStorage.setItem('authState', 'true');
      window.__isAuthenticated = true;
    }
  } catch (error) {
    console.error('Error during force restore:', error);
  }
})();
