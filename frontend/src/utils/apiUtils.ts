import apiConfig from '../config/apiConfig';
import { toast } from 'react-toastify';

// Constants for API URLs
export const API_BASE_URL = 'http://localhost:3000/api/v1';
export const API_BASE_URL_DIRECT = 'http://localhost:3000/api/v1';
export const MOCK_MODE = process.env.NODE_ENV === 'development';

// Flag to determine if we should use direct mode (bypassing proxy)
export const directMode = true;

// Log the API configuration on startup
console.log('🌐 API Configuration:', {
  baseUrl: API_BASE_URL,
  directUrl: API_BASE_URL_DIRECT,
  directMode,
  mockMode: MOCK_MODE
});

// Enum for error categories
export enum ErrorCategory {
  NETWORK = 'network',
  SERVER = 'server',
  AUTH = 'auth',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
  CLIENT = 'client'
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

// Add global authentication status flag to window
declare global {
  interface Window {
    __isAuthenticated?: boolean;
  }
}

// Add a request throttling mechanism with a maximum request count
const requestThrottleMap = new Map<string, number>();
const requestCountMap = new Map<string, number>();
const MIN_REQUEST_INTERVAL = 2000; // ms between identical requests (increased to 2 seconds)
const MAX_REQUESTS_PER_ENDPOINT = 2; // Maximum number of requests per endpoint (reduced to 2)
const MAX_CONCURRENT_REQUESTS = 5; // Maximum number of concurrent requests
let currentConcurrentRequests = 0;

// Reset the request counts every 30 seconds to prevent permanent blocking
setInterval(() => {
  requestCountMap.clear();
  requestThrottleMap.clear();
  currentConcurrentRequests = 0;
  console.log('🔄 Request limits reset');
}, 30000);

// Helper to determine if we should use mock mode
export const shouldUseMockMode = (): boolean => {
  return MOCK_MODE;
};

/**
 * Validate the token status in localStorage
 * Returns true if token is valid, false otherwise
 */
export function validateTokenStatus(): boolean {
  try {
    console.log('🔑 MOCK: Validating authentication token status...');
    // In mock mode, always return true
    window.__isAuthenticated = true;
    return true;
  } catch (error) {
    console.error('❌ Token validation error:', error);
    return false;
  }
}

/**
 * Check backend health
 */
export async function checkBackendHealth(): Promise<boolean> {
  console.log('🏥 MOCK: Checking backend health...');
  // In mock mode, always return true
  return true;
}

/**
 * Function to get mock responses for development
 */
export function getMockResponse<T>(endpoint: string, options?: any): T {
  console.log(`🔸 MOCK API: ${endpoint}`);
  
  // Mock user data
  const mockUser = {
    id: 'mock-user-123',
    name: 'Development User',
    email: 'dev@example.com',
    username: 'devuser',
    profession: 'Software Developer',
    bio: 'This is a mock user for development',
    avatar: '/avatars/default.png',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/devuser',
      github: 'https://github.com/devuser',
      twitter: 'https://twitter.com/devuser',
    }
  };
  
  // Return different mock data based on the endpoint
  if (endpoint.includes('auth/login') || endpoint.includes('auth/register')) {
    return {
      user: mockUser,
      token: 'mock-token-123'
    } as unknown as T;
  }
  
  if (endpoint.includes('users/me')) {
    return mockUser as unknown as T;
  }
  
  if (endpoint.includes('health')) {
    return { status: 'OK', version: '1.0.0' } as unknown as T;
  }
  
  // Default mock response
  return {} as T;
}

/**
 * Function to construct API URLs
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present to prevent double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Always use direct mode in development
  const url = `${API_BASE_URL_DIRECT}/${cleanEndpoint}`;
  
  console.log(`🔗 API URL: ${url}`);
  return url;
}

// Function to handle API requests with proper error handling
export const apiRequest = async <T = any>(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  headers: Record<string, string> = {}
): Promise<T> => {
  try {
    // Determine the base URL based on direct mode
    const baseUrl = directMode ? API_BASE_URL_DIRECT : API_BASE_URL;
    
    // Remove leading slash from endpoint if present to prevent double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    // Construct the full URL
    const url = `${baseUrl}/${cleanEndpoint}`;
    
    console.log(`🌐 API Request: ${method} ${url}`);
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Set up request options
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    };
    
    // Add body if provided
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    // Make the request
    const response = await fetch(url, options);
    
    // Parse the response
    const data = await response.json();
    
    // Check if the response is successful
    if (!response.ok) {
      throw data;
    }
    
    return data as T;
  } catch (error) {
    console.error('API request failed:', error);
    
    // Format and display error message
    const errorMessage = formatErrorMessage(error);
    toast.error(errorMessage);
    
    throw error;
  }
};

/**
 * Helper function to determine error category based on status code
 */
function getErrorCategory(status: number): ErrorCategory {
  if (status >= 400 && status < 500) {
    if (status === 401 || status === 403) {
      return ErrorCategory.AUTH;
    }
    if (status === 422) {
      return ErrorCategory.VALIDATION;
    }
    return ErrorCategory.CLIENT;
  }
  if (status >= 500) {
    return ErrorCategory.SERVER;
  }
  return ErrorCategory.UNKNOWN;
}

/**
 * Helper function to get cookie value
 */
function getCookieValue(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

// Format error messages from API responses
export const formatErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred';
  
  if (typeof error === 'string') return error;
  
  if (error.message) return error.message;
  
  if (error.error) return error.error;
  
  return 'An unexpected error occurred';
}; 