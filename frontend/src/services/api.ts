import apiConfig from '../config/apiConfig';
import { apiRequest, formatErrorMessage, ErrorCategory, shouldUseMockMode } from '../utils/apiUtils';
import { Portfolio, User } from '../types';

// CRITICAL: Debug information to track auth issues
let authDebugLog: string[] = [];
let lastAuthAttempt: any = null;
const MAX_DEBUG_ENTRIES = 50;

function logAuthDebug(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const entry = `${timestamp}: ${message}`;
  console.log(`🔍 AUTH DEBUG: ${entry}`, data || '');
  
  // Store in debug log
  authDebugLog.unshift(entry);
  if (authDebugLog.length > MAX_DEBUG_ENTRIES) {
    authDebugLog.pop();
  }
  
  // Make debug log accessible globally
  if (!window.__authDebug) {
    window.__authDebug = {
      log: authDebugLog,
      lastAttempt: null,
      getReport: getAuthDebugReport
    };
  }
  
  window.__authDebug.log = authDebugLog;
  if (data) {
    window.__authDebug.lastAttempt = data;
  }
}

// Define correct interfaces for our token info objects
interface TokenInfo {
  exists: boolean;
  length?: number;
}

interface UserInfo {
  exists: boolean;
  valid?: boolean;
}

// Function to generate an auth debug report
function getAuthDebugReport(): string {
  try {
    const tokenInfo: TokenInfo = localStorage.getItem('token') 
      ? { exists: true, length: localStorage.getItem('token')?.length || 0 }
      : { exists: false };
    
    const sessionTokenInfo: TokenInfo = sessionStorage.getItem('token')
      ? { exists: true, length: sessionStorage.getItem('token')?.length || 0 }
      : { exists: false };
    
    // Get cookie token info
    let cookieTokenInfo: TokenInfo = { exists: false };
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth_token') {
        cookieTokenInfo = { exists: true, length: value.length };
      }
    });
    
    const userData = localStorage.getItem('user');
    const userInfo: UserInfo = userData ? { exists: true, valid: true } : { exists: false };
    
    if (userData) {
      try {
        JSON.parse(userData);
      } catch (e) {
        userInfo.valid = false;
      }
    }
    
    const report = `
    AUTH DEBUG REPORT
    =================
    Time: ${new Date().toISOString()}
    
    Token Status:
    - localStorage: ${JSON.stringify(tokenInfo)}
    - sessionStorage: ${JSON.stringify(sessionTokenInfo)}
    - cookies: ${JSON.stringify(cookieTokenInfo)}
    
    User Data Status:
    - exists: ${userInfo.exists}
    - valid JSON: ${userInfo.valid || false}
    
    Global Flags:
    - window.__isAuthenticated: ${window.__isAuthenticated}
    - window.__explicitLogout: ${window.__explicitLogout}
    - window.__authInitialized: ${window.__authInitialized}
    
    Last 5 Auth Events:
    ${authDebugLog.slice(0, 5).join('\n')}
    
    Last Auth Attempt:
    ${JSON.stringify(lastAuthAttempt, null, 2)}
    `;
    
    return report;
  } catch (e) {
    return `Error generating report: ${e}`;
  }
}

// Declare the global debug interface
declare global {
  interface Window {
    __authDebug?: {
      log: string[];
      lastAttempt: any;
      getReport: () => string;
    };
    __diagnoseMissingAuth?: () => void;
  }
}

// Add a global function to diagnose auth issues
window.__diagnoseMissingAuth = function() {
  logAuthDebug('Manual auth diagnosis triggered');
  
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const sessionToken = sessionStorage.getItem('token');
    
    let cookieToken = null;
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth_token') {
        cookieToken = value;
      }
    });
    
    if (!token && !sessionToken && !cookieToken) {
      console.error('🔴 CRITICAL AUTH FAILURE: No token found in any storage!');
      return 'No token exists in any storage. You need to log in again.';
    }
    
    if (token && !user) {
      console.error('🔴 CRITICAL AUTH FAILURE: Token exists but no user data!');
      
      // Try to restore from other storages
      const sessionUser = sessionStorage.getItem('user');
      const backupUser = sessionStorage.getItem('auth_backup_user');
      
      if (sessionUser) {
        localStorage.setItem('user', sessionUser);
        console.log('🟢 FIXED: Restored user data from sessionStorage');
        window.location.reload();
        return 'Fixed: User data restored from session storage. Reloading...';
      }
      
      if (backupUser) {
        localStorage.setItem('user', backupUser);
        console.log('🟢 FIXED: Restored user data from backup');
        window.location.reload();
        return 'Fixed: User data restored from backup. Reloading...';
      }
      
      return 'Token exists but user data is missing and could not be restored.';
    }
    
    if (!token && user) {
      console.error('🔴 CRITICAL AUTH FAILURE: User data exists but no token!');
      
      // Try to restore token from other storages
      if (sessionToken) {
        localStorage.setItem('token', sessionToken);
        console.log('🟢 FIXED: Restored token from sessionStorage');
        window.location.reload();
        return 'Fixed: Token restored from session storage. Reloading...';
      }
      
      if (cookieToken) {
        localStorage.setItem('token', cookieToken);
        console.log('🟢 FIXED: Restored token from cookie');
        window.location.reload();
        return 'Fixed: Token restored from cookie. Reloading...';
      }
      
      return 'User data exists but token is missing and could not be restored.';
    }
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        const tokenFirst10 = token.substring(0, 10);
        
        console.log('🟢 AUTH LOOKS GOOD:');
        console.log(`- Token: ${tokenFirst10}...`);
        console.log(`- User: ${userData.name} (${userData.email})`);
        
        // Force reload auth state
        import('../services/auth').then(AuthService => {
          AuthService.loadAuthData();
          window.location.reload();
        });
        
        return 'Authentication data looks valid. Reloading to apply...';
      } catch (e) {
        console.error('🔴 CRITICAL AUTH FAILURE: User data is not valid JSON!', e);
        return 'User data exists but is corrupted. Please log in again.';
      }
    }
    
    return 'Unknown authentication state. Please log in again.';
  } catch (e) {
    console.error('Error during auth diagnosis:', e);
    return `Error during diagnosis: ${e}`;
  }
};

const API_BASE_URL = '/api/v1';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
    profession?: string;
    bio?: string;
    avatar?: string;
    socialLinks?: {
      linkedin?: string;
      github?: string;
      twitter?: string;
      instagram?: string;
      website?: string;
      behance?: string;
      dribbble?: string;
    };
  };
  token: string;
}

interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  instagram?: string;
  website?: string;
  behance?: string;
  dribbble?: string;
}

interface ProfileUpdateData {
  name?: string;
  profession?: string;
  bio?: string;
  socialLinks?: SocialLinks;
}

class ApiService {
  // Authentication
  static async login(credentials: { email: string; password: string }): Promise<ApiResponse<AuthResponse>> {
    try {
      logAuthDebug('Attempting login', credentials);
      console.log('Attempting login with backend server');
      
      // Get the login endpoint from config
      const loginEndpoint = apiConfig.auth.endpoints.login;
      console.log('Login endpoint:', loginEndpoint, 'Environment:', apiConfig.env());
      
      const data = await apiRequest<AuthResponse>(loginEndpoint, {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      if (data && data.token && data.user) {
        logAuthDebug('Login successful', { token: data.token.substring(0, 10) + '...', userId: data.user.id });
      } else {
        logAuthDebug('Login response missing token or user', data);
      }
      
      this.saveAuthData(data);
      return { data };
    } catch (error) {
      logAuthDebug('Login failed', error);
      console.error('Login request failed:', error);
      return { error: formatErrorMessage(error) };
    }
  }

  static async register(userData: {
    name: string;
    username: string;
    email: string;
    password: string;
    profession?: string;
    bio?: string;
  }): Promise<ApiResponse<AuthResponse>> {
    try {
      logAuthDebug('Attempting registration', { email: userData.email });
      console.log('Attempting registration with backend server');
      
      const data = await apiRequest<AuthResponse>(apiConfig.auth.endpoints.register, {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      if (data && data.token && data.user) {
        logAuthDebug('Registration successful', { token: data.token.substring(0, 10) + '...', userId: data.user.id });
      } else {
        logAuthDebug('Registration response missing token or user', data);
      }
      
      this.saveAuthData(data);
      return { data };
    } catch (error) {
      logAuthDebug('Registration failed', error);
      console.error('Registration request failed:', error);
      return { error: formatErrorMessage(error) };
    }
  }

  /**
   * Save authentication data with expiry time
   */
  private static saveAuthData(authData: AuthResponse): void {
    if (!authData || !authData.token || !authData.user) {
      console.error('Cannot save auth data: Invalid or empty auth data received');
      return;
    }
    
    try {
      console.log('🔑 Saving authentication data to localStorage');
      
      // Save token 
      localStorage.setItem('token', authData.token);
      
      // CRITICAL FIX: Always use numeric timestamp for expiry (more reliable)
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      const expiryTime = Date.now() + sevenDaysInMs;
      localStorage.setItem('tokenExpiry', expiryTime.toString());
      
      // Ensure we save ALL user data fields correctly with defaults
      const userData = {
        ...authData.user,
        id: authData.user.id,
        name: authData.user.name || '',
        email: authData.user.email || '',
        username: authData.user.username || '',
        profession: authData.user.profession || '',
        bio: authData.user.bio || '',
        avatar: authData.user.avatar || '',
        socialLinks: authData.user.socialLinks || {}
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set global auth flag
      window.__isAuthenticated = true;
      
      // Clear any prior server errors
      localStorage.removeItem('serverError');
      
      console.log('✅ Authentication data saved successfully with expiry:', new Date(expiryTime).toLocaleString());
      console.log('Auth token (preview):', authData.token.substring(0, 15) + '...');
      console.log('User data saved:', userData.name);
    } catch (error) {
      console.error('❌ Failed to save auth data:', error);
    }
  }

  private static getHeaders() {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
    
    // Debug: log headers being sent (but mask most of the token for security)
    if (token) {
      const shortToken = token.substring(0, 10) + '...' + token.substring(token.length - 5);
      console.log('Using auth token in request headers:', shortToken);
    } else {
      console.log('No auth token available for request headers');
    }
    
    return headers;
  }

  private static async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || response.statusText;
      } catch {
        errorMessage = errorText || response.statusText;
      }

      if (response.status === 401) {
        console.error('Authentication failed:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });
        
        // Check token details for debugging
        const token = localStorage.getItem('token');
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        
        if (!token) {
          console.error('Authentication error: No token found in localStorage');
        } else if (tokenExpiry && parseInt(tokenExpiry) < Date.now()) {
          console.error('Authentication error: Token has expired');
          // Only clear if actually expired
          localStorage.removeItem('token');
          localStorage.removeItem('tokenExpiry');
        } else {
          console.error('Authentication error: Token exists but was rejected by server');
          // Don't immediately remove token on first rejection - could be temporary server issue
        }
        
        return { error: 'Your session has expired. Please log in again.' };
      }

      return { error: errorMessage };
    }

    const data = await response.json();
    return { data };
  }
  
  /**
   * Check if user is authenticated with valid token
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      return false;
    }
    
    // Check token expiry with some buffer time (5 minutes)
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    if (tokenExpiry && parseInt(tokenExpiry) < (Date.now() + bufferTime)) {
      // If token is about to expire within 5 minutes, try to refresh it instead of logout
      // But for now, we'll just extend it as we don't have refresh token mechanism
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem('tokenExpiry', (Date.now() + sevenDaysInMs).toString());
      return true;
    }
    
    return true;
  }

  // User Profile
  static async updateProfile(profileData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      logAuthDebug('Updating profile', { userId: profileData.id });
      
      const data = await apiRequest<User>('/users/me', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      
      logAuthDebug('Profile update successful', { userId: data.id });
      return { data };
    } catch (error) {
      logAuthDebug('Profile update failed', error);
      console.error('Profile update failed:', error);
      return { error: formatErrorMessage(error) };
    }
  }

  static async updateSocialLinks(socialLinks: SocialLinks): Promise<ApiResponse<User>> {
    try {
      console.log('Updating social links:', socialLinks);
      
      // Make the API request to the /users/me endpoint
      const data = await apiRequest<User>('/users/me', {
        method: 'PUT',
        credentials: 'include',
        body: JSON.stringify({ socialLinks }),
      });
      
      console.log('Social links updated successfully');
      return { data };
    } catch (error) {
      console.error('Failed to update social links:', error);
      return { error: formatErrorMessage(error) };
    }
  }

  static async uploadAvatar(file: File) {
    try {
      // Get current user data for ID
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        return { error: 'No user data found. Please log in again.' };
      }
      
      const currentUser = JSON.parse(storedUser) as User;
      if (!currentUser || !currentUser.id) {
        return { error: 'Invalid user data. Please log in again.' };
      }
      
      console.log('🖼️ Uploading avatar for user:', currentUser.id);
      
      const formData = new FormData();
      formData.append('avatar', file);

      // Use user ID in the path instead of 'profile'
      const updatedUser = await apiRequest<AuthResponse['user']>(`/users/${currentUser.id}/avatar`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type for FormData - browser will set it with boundary
        headers: {},
      });
      
      // Update user in localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.avatar = updatedUser.avatar;
        localStorage.setItem('user', JSON.stringify(user));
        
        // Add logging to verify data was saved
        console.log('🖼️ Avatar updated successfully:', user.avatar);
      }
      
      // Add a utility function to force UI updates directly when needed
      this.forceUIUpdate({ avatar: updatedUser.avatar });
      
      return { data: updatedUser };
    } catch (error) {
      console.error('❌ Failed to upload avatar:', error);
      return { error: formatErrorMessage(error) };
    }
  }

  // Portfolios
  static async fetchPortfolios(): Promise<ApiResponse<Portfolio[]>> {
    try {
      console.log('🌐 ApiService: Fetching portfolios from API');
      console.log('🔑 Auth token status:', ApiService.isAuthenticated() ? 'Token exists' : 'No token');
      
      // Log the current token (first 10 chars only for security)
      const token = localStorage.getItem('token');
      if (token) {
        console.log('🔑 Token preview:', token.substring(0, 10) + '...');
      }
      
      const portfolios = await apiRequest<Portfolio[]>('/portfolios');
      console.log('📦 Raw portfolios response:', portfolios);
      return { data: portfolios };
    } catch (error) {
      console.error('❌ Error fetching portfolios:', error);
      return { error: formatErrorMessage(error) };
    }
  }
  
  static async createPortfolio(portfolioData: { 
    title: string; 
    description: string; 
    type?: string;
    theme?: string;
    layout?: string;
    subdomain?: string;
  }): Promise<Portfolio | string> {
    try {
      console.log('Creating portfolio with data:', portfolioData);
      
      // Map the frontend data to match backend expectations
      const backendData = {
        title: portfolioData.title,
        description: portfolioData.description,
        theme: portfolioData.theme || 'modern', // Default theme
        layout: portfolioData.layout || 'standard', // Default layout
        type: portfolioData.type || 'portfolio', // Default type
        subdomain: portfolioData.subdomain || portfolioData.title.toLowerCase().replace(/\s+/g, '-'),
      };
      
      // Validate required fields
      if (!backendData.title || !backendData.description || !backendData.subdomain) {
        return 'Missing required fields: title, description, or subdomain';
      }
      
      console.log('Sending portfolio data to backend:', backendData);
      
      // Make the API request
      const rawResponse = await apiRequest('/portfolios', {
        method: 'POST',
        body: JSON.stringify(backendData),
      });
      
      // Handle different response formats
      if (!rawResponse) {
        return 'No response from server';
      }
      
      // If the response is already a portfolio object with required fields
      if (typeof rawResponse === 'object' && 'id' in rawResponse && 'title' in rawResponse) {
        return rawResponse as Portfolio;
      }
      
      // If the response is in the {data: Portfolio} format
      if (typeof rawResponse === 'object' && 'data' in rawResponse && rawResponse.data) {
        return rawResponse.data as Portfolio;
      }
      
      // If we get here, the response doesn't match expected format
      console.error('Unexpected response format:', rawResponse);
      return 'Invalid response format from server';
    } catch (error) {
      console.error('Failed to create portfolio:', error);
      return formatErrorMessage(error);
    }
  }

  static async updatePortfolio(id: string, portfolioData: { title?: string; description?: string; type?: string }) {
    try {
      const portfolio = await apiRequest(`/portfolios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(portfolioData),
      });
      return { data: portfolio };
    } catch (error) {
      return { error: formatErrorMessage(error) };
    }
  }

  static async deletePortfolio(id: string) {
    try {
      await apiRequest(`/portfolios/${id}`, {
        method: 'DELETE',
      });
      return { data: { success: true } };
    } catch (error) {
      return { error: formatErrorMessage(error) };
    }
  }

  static async publishPortfolio(id: string) {
    try {
      const portfolio = await apiRequest(`/portfolios/${id}/publish`, {
        method: 'POST',
      });
      return { data: portfolio };
    } catch (error) {
      return { error: formatErrorMessage(error) };
    }
  }

  // Logout
  static logout(): void {
    console.log('📤 API SERVICE: Performing logout cleanup');
    
    try {
      // Clear all authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('user');
      
      // Clear any other session data
      localStorage.removeItem('serverError');
      
      // Clear global auth flag
      window.__isAuthenticated = false;
      
      console.log('✅ Logout completed - all auth data cleared');
    } catch (error) {
      console.error('Failed to logout cleanly:', error);
    }
  }

  // Fetch a user's portfolios
  static async getPortfolios(): Promise<Portfolio[] | string> {
    try {
      console.log('🔍 ApiService: Fetching portfolios');
      
      // Check authentication status first
      if (!ApiService.isAuthenticated()) {
        console.error('🔑 Cannot fetch portfolios: User is not authenticated');
        return 'Authentication required. Please log in again.';
      }
      
      // Log token info for debugging (masked for security)
      const token = localStorage.getItem('token');
      if (token) {
        const shortToken = token.substring(0, 10) + '...' + token.substring(token.length - 5);
        console.log('🔑 Using token for portfolio request:', shortToken);
      } else {
        console.error('🔑 No token available for portfolio request');
      }
      
      // Make API request with enhanced error handling
      const response = await apiRequest<any>('/portfolios');
      
      // Enhanced handling of response formats
      if (Array.isArray(response)) {
        console.log('📦 Portfolios fetched successfully:', response.length, 'items');
        return response;
      } else if (response && typeof response === 'object') {
        if (response.data && Array.isArray(response.data)) {
          // Handle nested response format {data: [...]}
          console.log('📦 Portfolios fetched from nested data:', response.data.length, 'items');
          return response.data;
        } else if ('error' in response) {
          // Handle error object response
          console.error('❌ Error in portfolio response:', response.error);
          return response.error as string;
        }
      }
      
      // Fallback when response format is unexpected
      console.warn('📦 Empty or invalid portfolio response format:', response);
      return [];
    } catch (error) {
      // Enhanced error handling and diagnostics
      console.error('❌ Error fetching portfolios:', error);
      
      // Check auth status after error
      if (!ApiService.isAuthenticated()) {
        console.log('🔑 Auth check after error: User is not authenticated');
      }
      
      // Try to provide a useful error message
      if (typeof error === 'object' && error !== null) {
        if ('status' in error && error.status === 401) {
          console.error('🔑 Authentication error (401) fetching portfolios');
          return 'Authentication required. Please log in again.';
        }
        
        if ('message' in error && typeof error.message === 'string') {
          return error.message;
        }
      }
      
      return formatErrorMessage(error);
    }
  }

  // Add a utility function to force UI updates directly when needed
  private static forceUIUpdate(userData: Partial<User>) {
    // Force DOM update for critical UI elements
    setTimeout(() => {
      try {
        // Update any elements with data-profile-* attributes
        const nameElements = document.querySelectorAll('[data-profile-name]');
        const professionElements = document.querySelectorAll('[data-profile-profession]');
        const bioElements = document.querySelectorAll('[data-profile-bio]');
        
        if (userData.name) {
          nameElements.forEach(el => {
            if (el instanceof HTMLElement) {
              el.textContent = userData.name || '';
            }
          });
        }
        
        if (userData.profession) {
          professionElements.forEach(el => {
            if (el instanceof HTMLElement) {
              el.textContent = userData.profession || 'Professional Title';
            }
          });
        }
        
        if (userData.bio) {
          bioElements.forEach(el => {
            if (el instanceof HTMLElement) {
              el.textContent = userData.bio || 'Add a short bio to tell your story...';
            }
          });
        }
        
        console.log('Forced UI update for user data:', userData);
      } catch (error) {
        console.error('Error in forced UI update:', error);
      }
    }, 100);
  }

  /**
   * Get current user data from the server
   * Useful to check if the token is still valid 
   */
  static async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      console.log('🔍 Fetching current user data from /users/me endpoint');
      
      // Use the /users/me endpoint which relies on the HTTP-only cookie
      const data = await apiRequest<User>('/users/me', {
        method: 'GET',
      });
      
      console.log('✅ Current user data fetched successfully');
      return { data };
    } catch (error) {
      console.error('❌ Failed to fetch current user:', error);
      return { error: formatErrorMessage(error) };
    }
  }
}

export default ApiService; 