/**
 * Mock Server for Development and Testing
 * 
 * This file provides a minimal mock server implementation that can be used
 * during development to simulate backend responses without needing a real backend.
 */

/**
 * Start a mock server for development and testing
 * This uses the browser's service worker API if available
 */
export function startMockServer() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Mock server requires service worker support');
    return;
  }

  // Check if we're in a development environment
  if (import.meta.env.DEV) {
    // Register our mock endpoints
    setupMockEndpoints();
    console.log('📡 Mock server endpoints ready for development');
  }
}

/**
 * Set up fetch interception for mock responses
 */
function setupMockEndpoints() {
  const originalFetch = window.fetch;
  
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    // Extract URL from input
    let urlString = '';
    let method = init?.method || 'GET';
    
    if (typeof input === 'string') {
      urlString = input;
    } else if (input instanceof URL) {
      urlString = input.href;
    } else {
      // It's a Request object
      urlString = (input as Request).url;
      method = (input as Request).method;
    }
    
    // Don't intercept login requests - let them go to the real server
    if (urlString.includes('/auth/login') || urlString.includes('/auth/register')) {
      console.log('⏩ Passing through authentication request to real server:', urlString);
      return originalFetch(input, init);
    }
    
    // Only intercept calls to our API (except auth)
    if (urlString.includes('/api/v1')) {
      console.log(`🔍 Mock server intercepted ${method} request to ${urlString}`);
      
      // Handle health check endpoints
      if (urlString.includes('/status') || urlString.includes('/health')) {
        return createMockResponse({ status: 'healthy', version: '1.0.0' }, 200);
      }
      
      // Handle base API path (used for fallback health checks)
      if (urlString.endsWith('/api/v1') && (method === 'HEAD' || method === 'GET')) {
        console.log('💡 Mock server handling base API request for health check');
        return new Response(null, {
          status: 200,
          headers: {
            'X-Mock-Server': 'true'
          }
        });
      }
      
      // For any other API endpoints, return a generic success
      return createMockResponse({ 
        success: true,
        message: 'Mock server response',
        data: {}
      }, 200);
    }
    
    // Let requests outside our API pass through to the original fetch
    return originalFetch(input, init);
  };
}

/**
 * Create a mock response object
 */
function createMockResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Mock-Server': 'true'
    }
  });
}

/**
 * Initialize the mock server
 * Call this from your app entry point
 */
export function initMockServer() {
  // Only start in development mode
  if (import.meta.env.DEV) {
    // Check for mock server flag
    const useMockServer = localStorage.getItem('useMockServer') === 'true';
    
    if (useMockServer) {
      startMockServer();
      console.log('🚀 Mock server initialized and running');
    }
    
    // Add a toggle function to window for debugging
    (window as any).toggleMockServer = () => {
      const currentValue = localStorage.getItem('useMockServer') === 'true';
      localStorage.setItem('useMockServer', (!currentValue).toString());
      console.log(`Mock server ${!currentValue ? 'enabled' : 'disabled'}. Reload to apply.`);
    };
  }
} 