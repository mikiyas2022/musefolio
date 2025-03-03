// API Configuration
// This file centralizes all API configuration settings

// Environment-specific API URLs
interface ApiEnvironment {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number; // in milliseconds
}

// Define different environments
const environments: Record<string, ApiEnvironment> = {
  development: {
    baseUrl: '/api/v1',  // This should match your backend API path
    timeout: 10000,
    retryAttempts: 2,
    retryDelay: 1000,
  },
  production: {
    baseUrl: '/api/v1',
    timeout: 15000,
    retryAttempts: 1,
    retryDelay: 1000,
  },
  testing: {
    baseUrl: '/api/v1',
    timeout: 5000,
    retryAttempts: 0,
    retryDelay: 500,
  },
  // Add backup servers if needed
  fallback: {
    baseUrl: 'https://backup-api.musefolio.com/api/v1',
    timeout: 20000,
    retryAttempts: 2,
    retryDelay: 1500,
  },
  // For local development with a non-proxy server
  direct: {
    baseUrl: 'http://localhost:8080/api/v1',  // Changed back to 8080
    timeout: 10000,
    retryAttempts: 2,
    retryDelay: 1000,
  }
};

// Get current environment
const getEnvironment = (): string => {
  // Use environment variable if available (from Vite)
  const envFromVite = import.meta.env.MODE;
  
  // Allow manual override (e.g., for testing)
  const manualEnv = localStorage.getItem('apiEnvironment');
  
  if (manualEnv && environments[manualEnv]) {
    console.log(`Using manually set API environment: ${manualEnv}`);
    return manualEnv;
  }
  
  if (envFromVite && environments[envFromVite]) {
    return envFromVite;
  }
  
  return 'development'; // Default
};

// Current active configuration
const getCurrentConfig = (): ApiEnvironment => {
  const env = getEnvironment();
  return environments[env];
};

// Auth-specific configuration
const authConfig = {
  // How long to keep auth tokens (in milliseconds)
  tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
  
  // URLs for auth endpoints
  endpoints: {
    login: '/auth/login',    // This will become /api/v1/auth/login
    register: '/users',      // This will become /api/v1/users
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
};

// Health check configuration
const healthCheck = {
  endpoint: '/health',  // Updated to match the actual backend endpoint
  interval: 30000, // Check every 30 seconds
  timeout: 5000,   // Health check timeout
};

// Export configuration
export default {
  get: getCurrentConfig,
  env: getEnvironment,
  auth: authConfig,
  health: healthCheck,
  
  // Helper to get full URL for an endpoint
  getFullUrl: (endpoint: string): string => {
    const config = getCurrentConfig();
    // Remove leading slash if present in both baseUrl and endpoint
    if (endpoint.startsWith('/') && config.baseUrl.endsWith('/')) {
      endpoint = endpoint.substring(1);
    }
    return `${config.baseUrl}${endpoint}`;
  },
  
  // Switch to direct connection mode
  useDirectConnection: (): void => {
    localStorage.setItem('apiEnvironment', 'direct');
    console.log('Switched to direct API connection mode. Reload to apply.');
  }
}; 