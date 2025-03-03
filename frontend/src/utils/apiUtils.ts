import apiConfig from '../config/apiConfig';

// Constants for API URLs - FIXED TO ALWAYS USE DIRECT CONNECTION
const API_BASE_URL = 'http://localhost:8080/api/v1';
const API_BASE_URL_DIRECT = 'http://localhost:8080/api/v1';
const directMode = true; // Always use direct mode

// Enum for error categories
export enum ErrorCategory {
  NETWORK = 'network',
  SERVER = 'server',
  AUTH = 'auth',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

// Define API error class that extends Error
export class ApiError extends Error {
  status: number;
  category: ErrorCategory;
  data?: any;
  retryable: boolean;

  constructor(
    status: number, 
    message: string, 
    data?: any, 
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.category = category;
    this.data = data;
    this.retryable = retryable;
    // This is needed in TypeScript to properly extend built-in classes
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Track API health
let consecutiveServerFailures = 0;
const lastFailures: {timestamp: number, endpoint: string}[] = [];

// Track when a health check was last performed
let lastHealthCheckTime = 0;
let isBackendHealthy = true;

// API request options type
interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipAuthCheck?: boolean;
}

// Add global authentication status flag to window
declare global {
  interface Window {
    __isAuthenticated?: boolean;
  }
}

/**
 * Validate the token status in localStorage
 * Returns true if token is valid, false otherwise
 */
export function validateTokenStatus(): boolean {
  try {
    console.log('🔑 CRITICAL: Validating authentication token status...');
    // Get token from localStorage
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    const userData = localStorage.getItem('user');

    // Debug validation process in detail
    console.log('Token validation details:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      hasExpiry: !!tokenExpiry,
      hasUserData: !!userData
    });
    
    // CRITICAL FIX: Token existence is more important than format
    // If there's no token or user data, we're not authenticated
    if (!token || !userData) {
      console.log('❌ Token validation failed: Missing token or user data');
      return false;
    }
    
    // RELAXED CHECK: Don't fail on token format to be more robust
    // Just warn about it instead of failing
    if (!token.includes('.') || token.split('.').length !== 3) {
      console.warn('⚠️ Token validation warning: Token format is not standard JWT');
      // Continue anyway - the server will validate the token format
    }

    // Parse user data to ensure it's valid
    try {
      const user = JSON.parse(userData);
      if (!user || !user.id) {
        console.log('❌ Token validation failed: Invalid user data structure');
        return false;
      }
      
      // If we have a token and valid user data with ID, consider it valid
      // regardless of expiry (server will reject if truly expired)
      window.__isAuthenticated = true;
      
      // Update token expiry if present
      if (tokenExpiry) {
        // CRITICAL FIX: Always use numeric timestamp for expiry (more reliable)
        // Extend token expiry on every validation by 7 days
        const newExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days in ms
        localStorage.setItem('tokenExpiry', newExpiry.toString());
        console.log('🔄 Extended token expiry to', new Date(newExpiry).toLocaleString());
      } else {
        // If no expiry is set, set one now
        const newExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days in ms
        localStorage.setItem('tokenExpiry', newExpiry.toString());
        console.log('🔄 Created new token expiry:', new Date(newExpiry).toLocaleString());
      }
      
      console.log('✅ Token validation successful - User is authenticated');
      return true;
    } catch (e) {
      console.log('❌ Token validation failed: Could not parse user data');
      return false;
    }
  } catch (error) {
    console.error('❌ Token validation error:', error);
    return false;
  }
}

/**
 * Enhanced API request function with proper authentication headers
 */
export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  // Log start of API request with debugging info
  console.log(`📡 API Request: ${options.method || 'GET'} ${endpoint}`);
  
  // Check if this is an auth endpoint (login/register) which doesn't need token
  const isAuthEndpoint = endpoint.includes('/auth/') || 
                        endpoint.includes('/login') || 
                        endpoint.includes('/register');
  
  // CRITICAL FIX: Check for PATCH method and change to PUT
  if (options.method === 'PATCH') {
    console.warn('⚠️ PATCH method detected but not supported by backend CORS - changing to PUT');
    options.method = 'PUT';
  }
  
  // Set up API URL
  let url: string;
  
  // Handle absolute URLs vs relative paths
  if (endpoint.startsWith('http')) {
    url = endpoint;
  } else {
    const apiBase = directMode ? API_BASE_URL_DIRECT : API_BASE_URL;
    url = apiBase + (endpoint.startsWith('/') ? endpoint : `/${endpoint}`);
  }
  
  // Set default fetch options
  const defaultOptions: RequestOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    // CRITICAL: Always include credentials to ensure cookies are sent with the request
    credentials: 'include',
    timeout: 30000, // 30 seconds
    retries: 2,
    retryDelay: 1000,
  };
  
  // Merge default options with provided options
  const mergedOptions: RequestOptions = {
    ...defaultOptions,
    ...options,
    // CRITICAL: Always preserve credentials setting
    credentials: 'include',
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  // CRITICAL FIX: Add Authorization header for authenticated requests
  if (!isAuthEndpoint && !options.skipAuthCheck) {
    const token = localStorage.getItem('token') || 
                 sessionStorage.getItem('token') || 
                 getCookieValue('auth_token');
                 
    if (token) {
      console.log('🔐 Adding authorization token to request');
      mergedOptions.headers = {
        ...mergedOptions.headers,
        'Authorization': `Bearer ${token}`,
      };
    } else {
      console.warn('⚠️ No auth token available for authenticated request');
    }
  }
  
  // Log request details for debugging
  console.log('API Request Details:', {
    url,
    method: mergedOptions.method || 'GET',
    isAuthEndpoint,
    hasAuthHeader: mergedOptions.headers && 
                  'Authorization' in (mergedOptions.headers as Record<string, string>),
    contentType: mergedOptions.headers && 
                (mergedOptions.headers as Record<string, string>)['Content-Type'],
    credentials: mergedOptions.credentials,
  });
  
  // Create a promise for fetch with timeout
  const fetchPromise = async (): Promise<Response> => {
    try {
      const response = await fetch(url, mergedOptions as RequestInit);
      
      // Log response status
      console.log(`📥 API Response: ${response.status} ${response.statusText} for ${options.method || 'GET'} ${endpoint}`);
      
      if (!response.ok) {
        // Get detailed error information
        const contentType = response.headers.get('content-type');
        let errorData: any;
        
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            errorData = await response.text();
          }
        } catch (e) {
          errorData = 'Failed to parse error response';
        }
        
        // Enhanced error logging
        console.error('API Error:', {
          status: response.status,
          url,
          method: mergedOptions.method || 'GET',
          errorData,
        });
        
        // Handle authentication errors
        if (response.status === 401) {
          console.error('🚫 Authentication error - token may be invalid or expired');
          
          // Check if this was already an authentication endpoint
          if (!isAuthEndpoint) {
            // Only log issue, don't automatically clear auth data
            console.warn('⚠️ Authentication failed for an authenticated request');
          }
        }
        
        // Add special case handling for /users/me endpoint errors
        if (response.status === 400 && url.includes('/users/me')) {
          console.warn('⚠️ Bad Request for /users/me endpoint:', errorData);
          
          // Try to recover by using the user ID from localStorage instead
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              if (userData && userData.id) {
                console.log('🔄 Recommending using direct user ID endpoint instead of /users/me');
                // Don't throw a fatal error - let the caller decide what to do
                const recoveryError = new ApiError(
                  response.status,
                  'User ID validation issue - use direct ID endpoint instead',
                  errorData,
                  ErrorCategory.VALIDATION,
                  true // This is retryable with the correct endpoint
                );
                throw recoveryError;
              }
            } catch (e) {
              // Can't parse user data, continue with normal error handling
            }
          }
        }
        
        throw new ApiError(
          response.status,
          errorData?.message || errorData?.error || response.statusText,
          errorData
        );
      }
      
      // For successful 204 responses with no content
      if (response.status === 204) {
        console.log('📤 API Success: 204 No Content');
        return response;
      }
      
      // For successful responses with content
      return response;
    } catch (error) {
      // Log detailed error information
      if (error instanceof ApiError) {
        throw error; // Re-throw ApiErrors as they're already formatted
      } else {
        console.error('📛 API Request failed:', error);
        throw new ApiError(
          0, 
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  };
  
  // Execute fetch with retry logic
  let lastError: Error | null = null;
  const maxRetries = mergedOptions.retries || 0;
  
  for (let retry = 0; retry <= maxRetries; retry++) {
    try {
      const response = await fetchPromise();
      
      // Parse JSON response
      if (response.status !== 204) {
      const data = await response.json();
        console.log('📊 API Success with data');
        return data as T;
      } else {
        // Handle no-content responses
        return {} as T;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error occurred');
      
      // Don't retry auth errors or 4xx errors (client errors)
      if (error instanceof ApiError && 
         (error.status === 401 || (error.status >= 400 && error.status < 500))) {
        throw error;
      }
      
      if (retry < maxRetries) {
        const delay = mergedOptions.retryDelay || 1000;
        console.log(`🔄 Retrying API request (${retry + 1}/${maxRetries}) after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we've exhausted retries, throw the last error
  if (lastError) {
    throw lastError;
  }
  
  // We should never reach here, but TypeScript requires a return
  throw new Error('Unexpected error in API request');
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Handle non-ok responses and translate them to our error format
 */
async function handleErrorResponse(response: Response, endpoint: string): Promise<ApiError> {
  let message = '';
  let data = null;
  
  try {
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
        message = data.error || data.message || response.statusText;
      } catch {
        message = text;
      }
    } else {
      message = response.statusText;
    }
  } catch (error) {
    message = `Error ${response.status}: ${response.statusText}`;
  }
  
  // Create the appropriate error type based on status
  if (response.status >= 500) {
    recordFailure(endpoint);
    return new ApiError(
      response.status,
      `Server error (${response.status}): ${message || 'The server is currently unavailable'}`,
      data,
      ErrorCategory.SERVER,
      true
    );
  }
  
  if (response.status === 401 || response.status === 403) {
    // Clear invalid tokens on auth errors
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiry');
    }
    
    return new ApiError(
      response.status,
      response.status === 401 
        ? 'Authentication required. Please log in again.'
        : 'You don\'t have permission to access this resource.',
      data,
      ErrorCategory.AUTH,
      false
    );
  }
  
  if (response.status === 400 || response.status === 422) {
    return new ApiError(
      response.status,
      message || 'Invalid input provided',
      data,
      ErrorCategory.VALIDATION,
      false
    );
  }
  
  if (response.status === 404) {
    return new ApiError(
      response.status,
      `Resource not found: ${endpoint}`,
      data,
      ErrorCategory.UNKNOWN,
      false
    );
  }
  
  // Generic error for other status codes
  return new ApiError(
    response.status,
    message || `Unknown error (${response.status})`,
    data,
    ErrorCategory.UNKNOWN,
    false
  );
}

/**
 * Record a server failure for health monitoring
 */
function recordFailure(endpoint: string): void {
  const now = Date.now();
  
  // Clean up old failures (older than 5 minutes)
  const recentWindow = 5 * 60 * 1000;
  const recentFailures = lastFailures.filter(f => now - f.timestamp < recentWindow);
  
  // Add this failure
  recentFailures.push({ timestamp: now, endpoint });
  
  // Update the array
  lastFailures.length = 0;
  lastFailures.push(...recentFailures);
  
  // Count consecutive failures in the recent window
  consecutiveServerFailures = recentFailures.length;
}

/**
 * Reset failure tracking after a successful request
 */
function resetFailureTracking(endpoint: string): void {
  // Only reset for health endpoints or regular requests if recent failures is low
  if (endpoint.includes('health') || endpoint.includes('status') || consecutiveServerFailures <= 1) {
    consecutiveServerFailures = 0;
    lastFailures.length = 0;
    
    // Mark backend as healthy
    isBackendHealthy = true;
  }
}

/**
 * Check backend health status
 */
export async function checkBackendHealth(): Promise<boolean> {
  const now = Date.now();
  
  // Don't check too frequently
  if (now - lastHealthCheckTime < 15000) {
    return isBackendHealthy;
  }
  
  lastHealthCheckTime = now;
  
  try {
    const config = apiConfig.get();
    const isDirectMode = apiConfig.env() === 'direct';
    
    // Use direct health endpoint for direct mode, relative for proxy mode
    const healthEndpoint = isDirectMode 
      ? 'http://localhost:8080/health'  // Direct URL for direct mode
      : '/health';                      // Relative URL for proxy mode
    
    console.log('Checking health with endpoint:', healthEndpoint);
    
    const response = await fetch(healthEndpoint, {
      method: 'GET',
      headers: { 'Accept': 'text/plain' },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      const text = await response.text();
      if (text.includes('OK')) {
        console.log('Health check successful');
        isBackendHealthy = true;
        return true;
      }
    }
    
    // If first attempt fails, try with API v1 prefix
    const apiHealthEndpoint = isDirectMode
      ? 'http://localhost:8080/api/v1/health'  // Direct URL with API prefix
      : '/api/v1/health';                      // Relative URL with API prefix
      
    console.log('Trying API health endpoint:', apiHealthEndpoint);
    
    const apiResponse = await fetch(apiHealthEndpoint, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    
    if (apiResponse.ok) {
      console.log('API health check successful');
      isBackendHealthy = true;
      return true;
    }
    
    // Both checks failed
    console.log('Both health checks failed');
    isBackendHealthy = false;
    return false;
  } catch (error) {
    console.error('Health check error:', error);
    isBackendHealthy = false;
    return false;
  }
}

/**
 * This function previously determined if mock mode should be used
 * Now it always returns false as mock mode has been disabled
 */
export function shouldUseMockMode(endpoint: string): boolean {
  return false;
}

/**
 * Format user-friendly error messages
 */
export function formatErrorMessage(error: any): string {
  if (error instanceof ApiError) {
    if (error.category === ErrorCategory.SERVER) {
      return `Server error: ${error.message}. Please try again later.`;
    }
    
    if (error.category === ErrorCategory.NETWORK) {
      return `Network error: ${error.message}. Please check your connection.`;
    }
    
    if (error.category === ErrorCategory.AUTH) {
      return error.message;
    }
    
    if (error.category === ErrorCategory.VALIDATION) {
      return `Validation error: ${error.message}`;
    }
    
    // For any other ApiError category
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, any>;
    
    if ('message' in errorObj) {
      return errorObj.message as string;
    }
    
    if ('error' in errorObj) {
      return typeof errorObj.error === 'string' 
        ? errorObj.error 
        : JSON.stringify(errorObj.error);
    }
  }
  
  return 'An unknown error occurred';
}

/**
 * Get cookie value by name
 */
function getCookieValue(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
} 