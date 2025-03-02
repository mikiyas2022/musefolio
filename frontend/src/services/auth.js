// auth.js - BULLETPROOF Authentication System
// Version: 2.0 - Complete Rewrite for Ultimate Reliability

/**
 * This is a complete redesign of the authentication system with:
 * 1. Triple redundancy (localStorage, sessionStorage, cookies)
 * 2. Automatic recovery from any storage
 * 3. Protection against accidental logouts 
 * 4. Debug capabilities
 * 5. Locking mechanisms to prevent race conditions
 */

// Storage keys for all mechanisms
const STORAGE = {
  LOCAL: {
    TOKEN: 'token',
    USER: 'user',
    AUTH_STATE: 'authState',
    TOKEN_EXPIRY: 'tokenExpiry'
  },
  SESSION: {
    TOKEN: 'token',
    USER: 'user',
    AUTH_STATE: 'authState',
    TOKEN_EXPIRY: 'tokenExpiry',
    BACKUP_TOKEN: 'auth_backup_token',
    BACKUP_USER: 'auth_backup_user'
  },
  COOKIE: {
    TOKEN: 'auth_token',
    USER: 'auth_user',
    AUTH_PRESENT: 'auth_present'
  }
};

// Debug log for tracking auth operations
const MAX_LOG_ENTRIES = 100;
const authLog = [];

// System state variables
let isInitialized = false;
let initializationPromise = null;
let isRecoveryInProgress = false;
let lastOperationTime = 0;
let operationLock = false;
let refreshCount = 0;

// Critical security flags
let securityFlags = {
  allowLogout: false,
  explicitLogout: false,
  forceRestore: false
};

/**
 * Log an authentication operation with timestamp
 */
function logAuth(operation, details = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    time: timestamp,
    operation,
    details: details || {}
  };
  
  // Add to beginning of array for newest-first
  authLog.unshift(logEntry);
  
  // Keep log size manageable
  if (authLog.length > MAX_LOG_ENTRIES) {
    authLog.pop();
  }
  
  // Also output to console
  console.log(`🔐 AUTH [${timestamp}]: ${operation}`, details || '');
  
  // Make log accessible globally
  if (!window.__authLog) {
    window.__authLog = authLog;
  }
}

/**
 * Get a diagnostic auth report
 */
function getAuthReport() {
  try {
    // Get status of auth data in all storages
    const localToken = localStorage.getItem(STORAGE.LOCAL.TOKEN);
    const localUser = localStorage.getItem(STORAGE.LOCAL.USER);
    const sessionToken = sessionStorage.getItem(STORAGE.SESSION.TOKEN);
    const sessionUser = sessionStorage.getItem(STORAGE.SESSION.USER);
    
    // Check cookies
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name) acc[name] = value;
      return acc;
    }, {});
    
    const cookieToken = cookies[STORAGE.COOKIE.TOKEN];
    const cookieUser = cookies[STORAGE.COOKIE.USER];
    
    // Format the user data status
    let localUserStatus = 'missing';
    let sessionUserStatus = 'missing';
    let cookieUserStatus = 'missing';
    
    if (localUser) {
      try {
        const userData = JSON.parse(localUser);
        localUserStatus = userData && userData.id ? 'valid' : 'invalid';
      } catch (e) {
        localUserStatus = 'corrupted';
      }
    }
    
    if (sessionUser) {
      try {
        const userData = JSON.parse(sessionUser);
        sessionUserStatus = userData && userData.id ? 'valid' : 'invalid';
      } catch (e) {
        sessionUserStatus = 'corrupted';
      }
    }
    
    if (cookieUser) {
      try {
        const userData = JSON.parse(cookieUser);
        cookieUserStatus = userData && userData.id ? 'valid' : 'invalid';
      } catch (e) {
        cookieUserStatus = 'corrupted';
      }
    }
    
    // Build the report
    return {
      time: new Date().toISOString(),
      initialization: {
        complete: isInitialized,
        lastOperation: lastOperationTime ? new Date(lastOperationTime).toISOString() : null,
        refreshCount
      },
      storage: {
        localStorage: {
          token: localToken ? { exists: true, length: localToken.length } : { exists: false },
          user: { exists: !!localUser, status: localUserStatus }
        },
        sessionStorage: {
          token: sessionToken ? { exists: true, length: sessionToken.length } : { exists: false },
          user: { exists: !!sessionUser, status: sessionUserStatus }
        },
        cookies: {
          token: cookieToken ? { exists: true, length: cookieToken.length } : { exists: false },
          user: { exists: !!cookieUser, status: cookieUserStatus }
        }
      },
      flags: {
        ...securityFlags,
        global: {
          __isAuthenticated: window.__isAuthenticated,
          __authInitialized: window.__authInitialized,
          __explicitLogout: window.__explicitLogout
        }
      },
      recentLogs: authLog.slice(0, 10)
    };
  } catch (error) {
    return {
      time: new Date().toISOString(),
      error: `Error generating report: ${error.message}`
    };
  }
}

/**
 * Cookie utility functions
 */
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function setCookie(name, value, days = 30) {
  try {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    const safeCookieValue = value.replace(/[;,]/g, '');
    document.cookie = `${name}=${safeCookieValue}; ${expires}; path=/; SameSite=Lax`;
    return true;
  } catch (error) {
    logAuth('Cookie set failed', { name, error: error.message });
    return false;
  }
}

function removeCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Check if the current environment supports a storage mechanism
 */
function isStorageAvailable(type) {
  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Initialize the auth system
 * Should be called as early as possible (before React renders)
 */
export function initAuth() {
  if (isInitialized) {
    logAuth('Already initialized');
    return Promise.resolve(window.__isAuthenticated || false);
  }
  
  logAuth('Initializing authentication system');
  
  // Create a promise that resolves when initialization is complete
  initializationPromise = new Promise((resolve) => {
    try {
      // Start initialization routine
      
      // 1. Clear any explicit logout flags from previous sessions
      localStorage.removeItem('was_logged_out');
      sessionStorage.removeItem('was_logged_out');
      securityFlags.explicitLogout = false;
      window.__explicitLogout = false;
      
      // 2. Check and restore auth data from any available source
      // Try localStorage first, then sessionStorage, then cookies
      let authRestored = false;
      
      if (isStorageAvailable('localStorage')) {
        authRestored = checkAndRestoreFromLocalStorage();
      }
      
      if (!authRestored && isStorageAvailable('sessionStorage')) {
        authRestored = checkAndRestoreFromSessionStorage();
      }
      
      if (!authRestored) {
        authRestored = checkAndRestoreFromCookies();
      }
      
      // 3. Set up monitoring and protection mechanisms
      if (isStorageAvailable('localStorage')) {
        // Setup storage event listener
        setupStorageEventListener();
      }
      
      // Setup page visibility listener to check auth on tab focus
      setupPageVisibilityListener();
      
      // Set up token expiration check
      setupTokenExpirationCheck();
      
      // 4. Set global auth flags
      window.__authInitialized = true;
      window.__isAuthenticated = authRestored;
      
      // 5. Make auth helpers globally available
      exposeGlobalAuthHelpers();
      
      // 6. Enforce storage protection to prevent accidental clearing
      enforceStorageProtection();
      
      // Complete initialization
      isInitialized = true;
      lastOperationTime = Date.now();
      logAuth('Initialization complete', { authenticated: authRestored });
      
      resolve(authRestored);
    } catch (error) {
      logAuth('Initialization error', { error: error.message, stack: error.stack });
      isInitialized = true; // Mark as initialized to avoid endless retry loops
      window.__isAuthenticated = false;
      resolve(false);
    }
  });
  
  return initializationPromise;
}

/**
 * Check and restore auth data from localStorage
 */
function checkAndRestoreFromLocalStorage() {
  try {
    const token = localStorage.getItem(STORAGE.LOCAL.TOKEN);
    const user = localStorage.getItem(STORAGE.LOCAL.USER);
    const expiry = localStorage.getItem(STORAGE.LOCAL.TOKEN_EXPIRY);
    
    if (!token || !user) {
      return false;
    }
    
    // Check for token expiration
    if (expiry && Number(expiry) < Date.now()) {
      logAuth('Token expired in localStorage', { expiry });
      // Don't clear anything automatically on expiration
      // Modern APIs will reject expired tokens so it's safer to keep them
      // and let the API handle rejection
    }
    
    // Validate user data
    try {
      const userData = JSON.parse(user);
      if (!userData || !userData.id) {
        logAuth('Invalid user data in localStorage', { userData });
        return false;
      }
    } catch (e) {
      logAuth('Failed to parse user data from localStorage', { error: e.message });
      return false;
    }
    
    // Sync to other storages for redundancy
    syncToAllStorages(token, user, expiry);
    
    // Set global authentication state
    window.__isAuthenticated = true;
    
    logAuth('Auth restored from localStorage');
    return true;
  } catch (error) {
    logAuth('Error checking localStorage', { error: error.message });
    return false;
  }
}

/**
 * Check and restore auth data from sessionStorage
 */
function checkAndRestoreFromSessionStorage() {
  try {
    const token = sessionStorage.getItem(STORAGE.SESSION.TOKEN);
    const user = sessionStorage.getItem(STORAGE.SESSION.USER);
    const expiry = sessionStorage.getItem(STORAGE.SESSION.TOKEN_EXPIRY);
    
    if (!token || !user) {
      // Try backup keys
      const backupToken = sessionStorage.getItem(STORAGE.SESSION.BACKUP_TOKEN);
      const backupUser = sessionStorage.getItem(STORAGE.SESSION.BACKUP_USER);
      
      if (backupToken && backupUser) {
        logAuth('Restoring from session backup');
        syncToAllStorages(backupToken, backupUser);
        window.__isAuthenticated = true;
        return true;
      }
      
      return false;
    }
    
    // Validate user data
    try {
      const userData = JSON.parse(user);
      if (!userData || !userData.id) {
        logAuth('Invalid user data in sessionStorage', { userData });
        return false;
      }
    } catch (e) {
      logAuth('Failed to parse user data from sessionStorage', { error: e.message });
      return false;
    }
    
    // Sync to other storages for redundancy
    syncToAllStorages(token, user, expiry);
    
    // Set global authentication state
    window.__isAuthenticated = true;
    
    logAuth('Auth restored from sessionStorage');
    return true;
  } catch (error) {
    logAuth('Error checking sessionStorage', { error: error.message });
    return false;
  }
}

/**
 * Check and restore auth data from cookies
 */
function checkAndRestoreFromCookies() {
  try {
    const token = getCookie(STORAGE.COOKIE.TOKEN);
    const user = getCookie(STORAGE.COOKIE.USER);
    
    if (!token || !user) {
      return false;
    }
    
    // Validate user data
    try {
      const userData = JSON.parse(user);
      if (!userData || !userData.id) {
        logAuth('Invalid user data in cookies', { userData });
        return false;
      }
    } catch (e) {
      logAuth('Failed to parse user data from cookies', { error: e.message });
      return false;
    }
    
    // Sync to other storages for redundancy
    syncToAllStorages(token, user);
    
    // Set global authentication state
    window.__isAuthenticated = true;
    
    logAuth('Auth restored from cookies');
    return true;
  } catch (error) {
    logAuth('Error checking cookies', { error: error.message });
    return false;
  }
}

/**
 * Sync authentication data to all available storage mechanisms
 */
function syncToAllStorages(token, user, expiry = null) {
  if (!token || !user) {
    logAuth('Cannot sync auth data: missing token or user');
    return false;
  }
  
  try {
    // Calculate token expiry if not provided (30 days from now)
    const tokenExpiry = expiry || (Date.now() + 30 * 24 * 60 * 60 * 1000).toString();
    
    // Track success of each operation
    const results = {
      localStorage: false,
      sessionStorage: false,
      cookies: false
    };
    
    // Sync to localStorage
    if (isStorageAvailable('localStorage')) {
      try {
        localStorage.setItem(STORAGE.LOCAL.TOKEN, token);
        localStorage.setItem(STORAGE.LOCAL.USER, user);
        localStorage.setItem(STORAGE.LOCAL.TOKEN_EXPIRY, tokenExpiry);
        localStorage.setItem(STORAGE.LOCAL.AUTH_STATE, 'true');
        results.localStorage = true;
      } catch (e) {
        logAuth('Failed to sync to localStorage', { error: e.message });
      }
    }
    
    // Sync to sessionStorage
    if (isStorageAvailable('sessionStorage')) {
      try {
        sessionStorage.setItem(STORAGE.SESSION.TOKEN, token);
        sessionStorage.setItem(STORAGE.SESSION.USER, user);
        sessionStorage.setItem(STORAGE.SESSION.TOKEN_EXPIRY, tokenExpiry);
        sessionStorage.setItem(STORAGE.SESSION.AUTH_STATE, 'true');
        
        // Also save to emergency backup keys
        sessionStorage.setItem(STORAGE.SESSION.BACKUP_TOKEN, token);
        sessionStorage.setItem(STORAGE.SESSION.BACKUP_USER, user);
        
        results.sessionStorage = true;
      } catch (e) {
        logAuth('Failed to sync to sessionStorage', { error: e.message });
      }
    }
    
    // Sync to cookies (with size limitation for user data)
    try {
      // For cookies, limit user data size if too large
      let cookieUserData = user;
      if (user.length > 4000) {
        try {
          const parsedUser = JSON.parse(user);
          const minimalUser = {
            id: parsedUser.id,
            name: parsedUser.name,
            email: parsedUser.email
          };
          cookieUserData = JSON.stringify(minimalUser);
        } catch (e) {
          logAuth('Failed to minimize user data for cookie', { error: e.message });
        }
      }
      
      setCookie(STORAGE.COOKIE.TOKEN, token, 30);
      setCookie(STORAGE.COOKIE.USER, cookieUserData, 30);
      setCookie(STORAGE.COOKIE.AUTH_PRESENT, 'true', 30);
      
      results.cookies = true;
    } catch (e) {
      logAuth('Failed to sync to cookies', { error: e.message });
    }
    
    // Log success/failure
    logAuth('Auth data sync complete', { results });
    
    return Object.values(results).some(result => result === true);
  } catch (error) {
    logAuth('Auth sync failed', { error: error.message });
    return false;
  }
}

/**
 * Set up listener for storage events to keep auth data in sync
 */
function setupStorageEventListener() {
  window.addEventListener('storage', (event) => {
    // Only react to auth-related keys
    const authKeys = [
      ...Object.values(STORAGE.LOCAL),
      'was_logged_out' // Also watch for explicit logout flag
    ];
    
    if (!authKeys.includes(event.key)) {
      return;
    }
    
    logAuth('Storage event detected', { key: event.key, newValue: event.newValue ? '[exists]' : '[removed]' });
    
    // Handle token removal
    if (event.key === STORAGE.LOCAL.TOKEN && !event.newValue) {
      // Only restore if not an explicit logout
      if (securityFlags.explicitLogout !== true) {
        logAuth('Token removed in another tab - attempting recovery');
        recoverMissingToken();
      }
    }
    
    // Handle user data removal
    if (event.key === STORAGE.LOCAL.USER && !event.newValue) {
      // Only restore if not an explicit logout
      if (securityFlags.explicitLogout !== true) {
        logAuth('User data removed in another tab - attempting recovery');
        recoverMissingUserData();
      }
    }
    
    // Handle explicit logout flag
    if (event.key === 'was_logged_out' && event.newValue === 'true') {
      logAuth('Explicit logout detected in another tab');
      securityFlags.explicitLogout = true;
      window.__explicitLogout = true;
      window.__isAuthenticated = false;
    }
    
    // Trigger auth state change event for React components
    const isAuthenticated = isUserAuthenticated();
    window.dispatchEvent(new CustomEvent('auth-state-changed', {
      detail: { isAuthenticated }
    }));
  });
}

/**
 * Try to recover a missing token from other storage mechanisms
 */
function recoverMissingToken() {
  // Don't run recovery if we're in an explicit logout state
  if (securityFlags.explicitLogout === true) {
    logAuth('Token recovery skipped - explicit logout state');
    return false;
  }
  
  // Prevent multiple concurrent recoveries
  if (isRecoveryInProgress) {
    return false;
  }
  
  isRecoveryInProgress = true;
  
  try {
    // Try to get token from other sources
    const sessionToken = sessionStorage.getItem(STORAGE.SESSION.TOKEN);
    const backupToken = sessionStorage.getItem(STORAGE.SESSION.BACKUP_TOKEN);
    const cookieToken = getCookie(STORAGE.COOKIE.TOKEN);
    
    // Try each source in order
    if (sessionToken) {
      logAuth('Recovered token from sessionStorage');
      localStorage.setItem(STORAGE.LOCAL.TOKEN, sessionToken);
      return true;
    }
    
    if (backupToken) {
      logAuth('Recovered token from backup in sessionStorage');
      localStorage.setItem(STORAGE.LOCAL.TOKEN, backupToken);
      return true;
    }
    
    if (cookieToken) {
      logAuth('Recovered token from cookies');
      localStorage.setItem(STORAGE.LOCAL.TOKEN, cookieToken);
      return true;
    }
    
    logAuth('Token recovery failed - no token found in any storage');
    return false;
  } catch (error) {
    logAuth('Error during token recovery', { error: error.message });
    return false;
  } finally {
    isRecoveryInProgress = false;
  }
}

/**
 * Try to recover missing user data from other storage mechanisms
 */
function recoverMissingUserData() {
  // Don't run recovery if we're in an explicit logout state
  if (securityFlags.explicitLogout === true) {
    logAuth('User data recovery skipped - explicit logout state');
    return false;
  }
  
  // Prevent multiple concurrent recoveries
  if (isRecoveryInProgress) {
    return false;
  }
  
  isRecoveryInProgress = true;
  
  try {
    // Try to get user data from other sources
    const sessionUser = sessionStorage.getItem(STORAGE.SESSION.USER);
    const backupUser = sessionStorage.getItem(STORAGE.SESSION.BACKUP_USER);
    const cookieUser = getCookie(STORAGE.COOKIE.USER);
    
    // Try each source in order
    if (sessionUser) {
      logAuth('Recovered user data from sessionStorage');
      localStorage.setItem(STORAGE.LOCAL.USER, sessionUser);
      return true;
    }
    
    if (backupUser) {
      logAuth('Recovered user data from backup in sessionStorage');
      localStorage.setItem(STORAGE.LOCAL.USER, backupUser);
      return true;
    }
    
    if (cookieUser) {
      logAuth('Recovered user data from cookies');
      localStorage.setItem(STORAGE.LOCAL.USER, cookieUser);
      return true;
    }
    
    logAuth('User data recovery failed - no data found in any storage');
    return false;
  } catch (error) {
    logAuth('Error during user data recovery', { error: error.message });
    return false;
  } finally {
    isRecoveryInProgress = false;
  }
}

/**
 * Set up page visibility listener to check auth status on tab focus
 */
function setupPageVisibilityListener() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      logAuth('Tab became visible, checking auth status');
      
      // Check if auth data is missing and try to recover
      const token = localStorage.getItem(STORAGE.LOCAL.TOKEN);
      const user = localStorage.getItem(STORAGE.LOCAL.USER);
      
      // Clear any logout flags
      if (securityFlags.explicitLogout !== true) {
        localStorage.removeItem('was_logged_out');
        window.__explicitLogout = false;
      }
      
      // If we're missing token or user data, try to recover
      if (!token || !user) {
        // Don't attempt recovery if user explicitly logged out
        if (securityFlags.explicitLogout !== true) {
          logAuth('Missing auth data detected on tab focus - attempting recovery');
          
          if (!token) {
            recoverMissingToken();
          }
          
          if (!user) {
            recoverMissingUserData();
          }
          
          // After recovery attempt, check if we're authenticated now
          const isAuthenticated = isUserAuthenticated();
          window.__isAuthenticated = isAuthenticated;
          
          // Trigger auth state change event for React components
          window.dispatchEvent(new CustomEvent('auth-state-changed', {
            detail: { isAuthenticated }
          }));
        }
      } else {
        // We have both token and user, make sure auth flag is set
        window.__isAuthenticated = true;
      }
    }
  });
}

/**
 * Set up periodic token expiration check
 */
function setupTokenExpirationCheck() {
  // Check every 5 minutes
  const checkInterval = 5 * 60 * 1000;
  
  setInterval(() => {
    // Only check if we think we're authenticated
    if (!window.__isAuthenticated) {
      return;
    }
    
    const expiry = localStorage.getItem(STORAGE.LOCAL.TOKEN_EXPIRY);
    if (!expiry) {
      // No expiry set, set one now (30 days)
      const newExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE.LOCAL.TOKEN_EXPIRY, newExpiry.toString());
      return;
    }
    
    // Check if token is expired
    const expiryTime = Number(expiry);
    if (expiryTime < Date.now()) {
      logAuth('Token expired during periodic check', { expiry: new Date(expiryTime).toISOString() });
      
      // DON'T clear auth data on expiration - let the server reject it
      // This is more robust as the server is the source of truth for token validity
      
      // Instead, notify the application that the token may be expired
      window.dispatchEvent(new CustomEvent('auth-token-may-be-expired'));
    }
  }, checkInterval);
}

/**
 * Save authentication data to all storage mechanisms
 */
export function saveAuthData(token, userData, expiry = null) {
  if (!token || !userData) {
    logAuth('Cannot save auth data: missing token or user data');
    return false;
  }
  
  try {
    // Format user data as string if it's an object
    const userString = typeof userData === 'string' ? userData : JSON.stringify(userData);
    
    // Calculate token expiry if not provided (30 days)
    const tokenExpiry = expiry || (Date.now() + 30 * 24 * 60 * 60 * 1000).toString();
    
    // Reset explicit logout flag
    securityFlags.explicitLogout = false;
    window.__explicitLogout = false;
    localStorage.removeItem('was_logged_out');
    sessionStorage.removeItem('was_logged_out');
    
    // Sync to all storages
    const syncSuccess = syncToAllStorages(token, userString, tokenExpiry);
    
    // Set global auth flag
    window.__isAuthenticated = true;
    
    // Ensure the auth system is initialized
    if (!isInitialized) {
      initAuth();
    }
    
    logAuth('Auth data saved successfully', { tokenPreview: token.substring(0, 10) + '...' });
    return syncSuccess;
  } catch (error) {
    logAuth('Error saving auth data', { error: error.message });
    return false;
  }
}

/**
 * Load authentication data from any available storage
 */
export function loadAuthData() {
  try {
    // Clear any explicit logout flag
    if (securityFlags.explicitLogout !== true) {
      localStorage.removeItem('was_logged_out');
      sessionStorage.removeItem('was_logged_out');
      window.__explicitLogout = false;
    }
    
    // If we're explicitly logged out, don't try to load auth data
    if (securityFlags.explicitLogout === true) {
      logAuth('Not loading auth data - explicit logout state');
      return { isAuthenticated: false };
    }
    
    // Try localStorage first
    let token = localStorage.getItem(STORAGE.LOCAL.TOKEN);
    let user = localStorage.getItem(STORAGE.LOCAL.USER);
    
    // If not in localStorage, try sessionStorage
    if (!token || !user) {
      token = sessionStorage.getItem(STORAGE.SESSION.TOKEN);
      user = sessionStorage.getItem(STORAGE.SESSION.USER);
      
      // If found in session storage, restore to local storage
      if (token && user) {
        const expiry = sessionStorage.getItem(STORAGE.SESSION.TOKEN_EXPIRY);
        localStorage.setItem(STORAGE.LOCAL.TOKEN, token);
        localStorage.setItem(STORAGE.LOCAL.USER, user);
        localStorage.setItem(STORAGE.LOCAL.AUTH_STATE, 'true');
        if (expiry) localStorage.setItem(STORAGE.LOCAL.TOKEN_EXPIRY, expiry);
      }
    }
    
    // If still not found, try cookies
    if (!token || !user) {
      token = getCookie(STORAGE.COOKIE.TOKEN);
      user = getCookie(STORAGE.COOKIE.USER);
      
      if (token && user) {
        logAuth('Restoring auth data from cookies');
        localStorage.setItem(STORAGE.LOCAL.TOKEN, token);
        localStorage.setItem(STORAGE.LOCAL.USER, user);
        localStorage.setItem(STORAGE.LOCAL.AUTH_STATE, 'true');
        localStorage.setItem(STORAGE.LOCAL.TOKEN_EXPIRY, (Date.now() + 30*24*60*60*1000).toString());
      }
    }
    
    // If still not found, try emergency backup
    if (!token || !user) {
      token = sessionStorage.getItem(STORAGE.SESSION.BACKUP_TOKEN);
      user = sessionStorage.getItem(STORAGE.SESSION.BACKUP_USER);
      
      if (token && user) {
        logAuth('Restoring auth data from emergency backup');
        localStorage.setItem(STORAGE.LOCAL.TOKEN, token);
        localStorage.setItem(STORAGE.LOCAL.USER, user);
        localStorage.setItem(STORAGE.LOCAL.AUTH_STATE, 'true');
        localStorage.setItem(STORAGE.LOCAL.TOKEN_EXPIRY, (Date.now() + 30*24*60*60*1000).toString());
      }
    }
    
    // Check token expiration
    if (token && user) {
      const expiry = localStorage.getItem(STORAGE.LOCAL.TOKEN_EXPIRY);
      
      // Parse user data
      let userData;
      try {
        userData = JSON.parse(user);
      } catch (e) {
        logAuth('Error parsing user data', { error: e.message });
        userData = user;
      }
      
      // Set global auth flag
      window.__isAuthenticated = true;
      
      return {
        token,
        user: userData,
        isAuthenticated: true,
        expiry: expiry ? new Date(Number(expiry)) : null
      };
    }
    
    return { isAuthenticated: false };
  } catch (error) {
    logAuth('Error loading auth data', { error: error.message });
    return { isAuthenticated: false };
  }
}

/**
 * Clear authentication data from all storages
 * THIS IS THE ONLY INTENTIONAL LOGOUT FUNCTION
 */
export function clearAuthData() {
  try {
    // Check if this is an explicitly allowed logout
    if (!securityFlags.allowLogout) {
      logAuth('Logout attempt blocked - not explicitly allowed');
      return false;
    }
    
    logAuth('Explicit logout requested and allowed');
    
    // Mark auth state as explicitly logged out
    localStorage.setItem('was_logged_out', 'true');
    securityFlags.explicitLogout = true;
    window.__explicitLogout = true;
    
    // Clear from localStorage
    localStorage.removeItem(STORAGE.LOCAL.TOKEN);
    localStorage.removeItem(STORAGE.LOCAL.USER);
    localStorage.removeItem(STORAGE.LOCAL.TOKEN_EXPIRY);
    localStorage.removeItem(STORAGE.LOCAL.AUTH_STATE);
    
    // Clear from sessionStorage
    sessionStorage.removeItem(STORAGE.SESSION.TOKEN);
    sessionStorage.removeItem(STORAGE.SESSION.USER);
    sessionStorage.removeItem(STORAGE.SESSION.TOKEN_EXPIRY);
    sessionStorage.removeItem(STORAGE.SESSION.AUTH_STATE);
    
    // Clear from cookies
    removeCookie(STORAGE.COOKIE.TOKEN);
    removeCookie(STORAGE.COOKIE.USER);
    removeCookie(STORAGE.COOKIE.AUTH_PRESENT);
    
    // Clear global auth flag
    window.__isAuthenticated = false;
    
    logAuth('Logout complete - all auth data cleared');
    return true;
  } catch (error) {
    logAuth('Error clearing auth data', { error: error.message });
    return false;
  } finally {
    // Always reset the allowLogout flag
    securityFlags.allowLogout = false;
  }
}

/**
 * Check if the user is authenticated by checking all storage mechanisms
 */
export function isUserAuthenticated() {
  // If explicitly logged out, always return false
  if (securityFlags.explicitLogout === true) {
    return false;
  }
  
  // Try all storage mechanisms
  const token = localStorage.getItem(STORAGE.LOCAL.TOKEN) || 
                sessionStorage.getItem(STORAGE.SESSION.TOKEN) ||
                getCookie(STORAGE.COOKIE.TOKEN);
                
  const user = localStorage.getItem(STORAGE.LOCAL.USER) ||
               sessionStorage.getItem(STORAGE.SESSION.USER) ||
               getCookie(STORAGE.COOKIE.USER);
  
  // Check if token and user exist
  const isAuth = !!(token && user && !securityFlags.explicitLogout);
  
  // Update global flag
  window.__isAuthenticated = isAuth;
  
  return isAuth;
}

// Export the isAuthenticated function that's being imported in main.tsx
export const isAuthenticated = isUserAuthenticated;

/**
 * Wait for auth initialization to complete
 */
export function waitForInit() {
  if (isInitialized) {
    return Promise.resolve(window.__isAuthenticated || false);
  }
  
  if (!initializationPromise) {
    return initAuth();
  }
  
  return initializationPromise;
}

/**
 * Expose global authentication helper functions
 */
function exposeGlobalAuthHelpers() {
  // Make diagnostic functions available globally
  window.__authDiagnostics = {
    getReport: getAuthReport,
    logs: authLog,
  };
  
  // EMERGENCY RECOVERY FUNCTION
  window.__recoverAuth = function() {
    logAuth('Manual auth recovery triggered');
    
    // Reset explicit logout flag
    securityFlags.explicitLogout = false;
    window.__explicitLogout = false;
    localStorage.removeItem('was_logged_out');
    sessionStorage.removeItem('was_logged_out');
    
    // Try to recover from any storage
    const recovered = 
      checkAndRestoreFromLocalStorage() || 
      checkAndRestoreFromSessionStorage() || 
      checkAndRestoreFromCookies();
    
    if (recovered) {
      logAuth('Manual auth recovery successful');
      window.__isAuthenticated = true;
      return true;
    } else {
      logAuth('Manual auth recovery failed - no valid auth data found');
      return false;
    }
  };
  
  // FORCE RELOAD WITH AUTH RECOVERY
  window.__recoverAndReload = function() {
    const recovered = window.__recoverAuth?.();
    if (recovered) {
      window.location.reload();
      return true;
    }
    return false;
  };
  
  // MANUAL LOGOUT FUNCTION
  window.__forceLogout = function() {
    logAuth('Manual forced logout triggered');
    securityFlags.allowLogout = true;
    const success = clearAuthData();
    logAuth('Manual forced logout result', { success });
    return success;
  };
}

/**
 * Override storage functions to prevent accidental clearing of auth data
 */
function enforceStorageProtection() {
  try {
    // Override localStorage.removeItem to protect auth keys
    const originalRemoveItem = localStorage.removeItem;
    localStorage.removeItem = function(key) {
      const protectedKeys = Object.values(STORAGE.LOCAL);
      if (protectedKeys.includes(key) && !securityFlags.allowLogout) {
        logAuth('Protected localStorage key removal blocked', { key });
        return;
      }
      return originalRemoveItem.apply(this, arguments);
    };
    
    // Override localStorage.clear to preserve auth data
    const originalClear = localStorage.clear;
    localStorage.clear = function() {
      // Save auth data
      const token = localStorage.getItem(STORAGE.LOCAL.TOKEN);
      const user = localStorage.getItem(STORAGE.LOCAL.USER);
      const expiry = localStorage.getItem(STORAGE.LOCAL.TOKEN_EXPIRY);
      const authState = localStorage.getItem(STORAGE.LOCAL.AUTH_STATE);
      
      // Call original clear
      originalClear.apply(this, arguments);
      
      // Restore auth data if it existed and we're not in logout mode
      if (token && user && !securityFlags.allowLogout) {
        logAuth('Restored auth data after localStorage.clear');
        localStorage.setItem(STORAGE.LOCAL.TOKEN, token);
        localStorage.setItem(STORAGE.LOCAL.USER, user);
        if (expiry) localStorage.setItem(STORAGE.LOCAL.TOKEN_EXPIRY, expiry);
        if (authState) localStorage.setItem(STORAGE.LOCAL.AUTH_STATE, authState);
      }
    };
    
    logAuth('Storage protection enforced');
  } catch (error) {
    logAuth('Failed to enforce storage protection', { error: error.message });
  }
}

// Export cookie utilities for other components
export const cookieUtils = {
  getCookie,
  setCookie,
  removeCookie
};

// Initialize auth service
const authInit = initAuth();

// Export the promise for components to wait on
export const authReadyPromise = authInit; 