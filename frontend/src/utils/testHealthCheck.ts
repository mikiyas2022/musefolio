import { checkBackendHealth } from './apiUtils';
import { initMockServer } from '../test/mockServer';
import apiConfig from '../config/apiConfig';

/**
 * Test utility for health check functionality
 * Run this in the browser console to check health status
 */
export async function testHealthCheck() {
  console.group('🩺 Health Check Diagnostics');
  
  // Show current API configuration
  const config = apiConfig.get();
  console.log('Current API environment:', apiConfig.env());
  console.log('Current API base URL:', config.baseUrl);
  console.log('Current health endpoint:', apiConfig.health.endpoint);
  
  // Check mock settings
  const useMockServer = localStorage.getItem('useMockServer') === 'true';
  
  console.log('Mock server enabled:', useMockServer);
  
  if (useMockServer) {
    // Initialize mock server if enabled
    initMockServer();
  }
  
  // Run health check
  try {
    const result = await checkBackendHealth();
    console.log('Health check result:', result ? '✅ Backend is healthy' : '❌ Backend is offline');
    
    if (!result) {
      console.log('💡 Troubleshooting tips:');
      console.log('1. Make sure your backend server is running');
      console.log('2. Check that the health endpoint is implemented on your server');
      console.log('3. Verify your API URL configuration matches your backend server');
      console.log('4. Try a direct connection with different port: apiConfig.useDirectConnection()');
    } else {
      console.log('Backend connection successful! You should be able to log in with real credentials now.');
    }
  } catch (error) {
    console.error('Health check error:', error);
  }
  
  console.groupEnd();
  
  return 'Health check diagnostics complete';
}

/**
 * Toggle mock server mode
 */
export function toggleMockServer() {
  const current = localStorage.getItem('useMockServer') === 'true';
  localStorage.setItem('useMockServer', (!current).toString());
  console.log(`Mock server ${!current ? 'enabled' : 'disabled'}. Reload to apply.`);
}

/**
 * Disable all mock features
 */
export function disableAllMocks() {
  localStorage.removeItem('useMockServer');
  console.log('All mock features disabled. Reload to apply.');
}

/**
 * Try different API connection configurations
 */
export function tryDirectConnection() {
  apiConfig.useDirectConnection();
  console.log('Switched to direct API connection. Reload to apply.');
}

// Add to window for easier console access
if (typeof window !== 'undefined') {
  (window as any).testHealthCheck = testHealthCheck;
  (window as any).toggleMockServer = toggleMockServer;
  (window as any).disableAllMocks = disableAllMocks;
  (window as any).tryDirectConnection = tryDirectConnection;
} 