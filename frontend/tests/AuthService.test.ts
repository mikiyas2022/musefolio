import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as AuthService from '../src/services/auth';
import { mockFetch } from './mocks/fetchMock';

// Mock the fetch API
vi.stubGlobal('fetch', mockFetch);

// Mock localStorage and sessionStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    length: Object.keys(store).length,
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    length: Object.keys(store).length,
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

// Mock document.cookie
let documentCookies: Record<string, string> = {};
Object.defineProperty(document, 'cookie', {
  get: vi.fn(() => {
    return Object.entries(documentCookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }),
  set: vi.fn((cookie) => {
    const [cookieStr] = cookie.split(';');
    const [name, value] = cookieStr.split('=');
    documentCookies[name] = value;
  }),
  configurable: true,
});

// Setup mocks before each test
beforeEach(() => {
  // Restore mocks for storage
  vi.stubGlobal('localStorage', localStorageMock);
  vi.stubGlobal('sessionStorage', sessionStorageMock);

  // Clear storages
  localStorage.clear();
  sessionStorage.clear();
  documentCookies = {};

  // Reset window properties
  if (window.__isAuthenticated !== undefined) delete window.__isAuthenticated;
  if (window.__explicitLogout !== undefined) delete window.__explicitLogout;
  if (window.__authInitialized !== undefined) delete window.__authInitialized;
});

// Clean up after each test
afterEach(() => {
  vi.resetAllMocks();
});

describe('Authentication Service', () => {
  describe('Authentication Data Storage', () => {
    it('should store authentication data in all storage mechanisms', async () => {
      // Mock user data
      const token = 'test-token-12345';
      const userData = {
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com'
      };

      // Save auth data
      const result = AuthService.saveAuthData(token, userData);
      
      // Verify it was saved
      expect(result).toBe(true);
      
      // Check localStorage
      expect(localStorage.getItem('token')).toBe(token);
      expect(JSON.parse(localStorage.getItem('user') || '{}')).toMatchObject(userData);
      
      // Check sessionStorage
      expect(sessionStorage.getItem('token')).toBe(token);
      expect(JSON.parse(sessionStorage.getItem('user') || '{}')).toMatchObject(userData);
      
      // Check cookies
      expect(AuthService.cookieUtils.getCookie('auth_token')).toBe(token);
      
      // Check global auth flag
      expect(window.__isAuthenticated).toBe(true);
    });

    it('should load authentication data from localStorage', async () => {
      // Setup - store in localStorage only
      const token = 'test-token-local';
      const userData = { id: 'user456', name: 'Local User', email: 'local@example.com' };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Load auth data
      const authData = AuthService.loadAuthData();
      
      // Verify data is loaded
      expect(authData.isAuthenticated).toBe(true);
      expect(authData.token).toBe(token);
      expect(authData.user).toMatchObject(userData);
    });

    it('should fallback to sessionStorage if localStorage is empty', async () => {
      // Setup - store in sessionStorage only
      const token = 'test-token-session';
      const userData = { id: 'user789', name: 'Session User', email: 'session@example.com' };
      
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(userData));
      
      // Load auth data
      const authData = AuthService.loadAuthData();
      
      // Verify data is loaded from sessionStorage
      expect(authData.isAuthenticated).toBe(true);
      expect(authData.token).toBe(token);
      expect(authData.user).toMatchObject(userData);
      
      // Verify it was also restored to localStorage for redundancy
      expect(localStorage.getItem('token')).toBe(token);
      expect(JSON.parse(localStorage.getItem('user') || '{}')).toMatchObject(userData);
    });

    it('should fallback to cookies if both localStorage and sessionStorage are empty', async () => {
      // Setup - store in cookies only
      const token = 'test-token-cookie';
      const userData = { id: 'user999', name: 'Cookie User', email: 'cookie@example.com' };
      
      AuthService.cookieUtils.setCookie('auth_token', token, 1);
      AuthService.cookieUtils.setCookie('auth_user', JSON.stringify(userData), 1);
      AuthService.cookieUtils.setCookie('auth_present', 'true', 1);
      
      // Load auth data
      const authData = AuthService.loadAuthData();
      
      // Verify data is loaded from cookies
      expect(authData.isAuthenticated).toBe(true);
      expect(authData.token).toBe(token);
      expect(authData.user).toMatchObject(userData);
      
      // Verify it was also restored to localStorage for redundancy
      expect(localStorage.getItem('token')).toBe(token);
      expect(JSON.parse(localStorage.getItem('user') || '{}')).toMatchObject(userData);
    });
  });

  describe('Authentication Protection', () => {
    it('should prevent accidental logout', async () => {
      // Setup - store auth data
      const token = 'protected-token-123';
      const userData = { id: 'user123', name: 'Protected User', email: 'protected@example.com' };
      
      AuthService.saveAuthData(token, userData);
      
      // Try to clear localStorage (simulating accidental clear)
      localStorage.clear();
      
      // Auth data should still be there (because we've overridden clear method)
      expect(localStorage.getItem('token')).toBe(token);
      expect(JSON.parse(localStorage.getItem('user') || '{}')).toMatchObject(userData);
    });

    it('should require explicit permission to logout', async () => {
      // Setup - store auth data
      const token = 'logout-token-123';
      const userData = { id: 'user456', name: 'Logout User', email: 'logout@example.com' };
      
      AuthService.saveAuthData(token, userData);
      
      // Try to logout without setting the allow flag
      AuthService.clearAuthData();
      
      // Auth data should still be there
      expect(localStorage.getItem('token')).toBe(token);
      expect(JSON.parse(localStorage.getItem('user') || '{}')).toMatchObject(userData);
      expect(window.__isAuthenticated).toBe(true);
      
      // Now set the allow flag
      window.__allowLogout = true;
      
      // Try again with the allow flag set
      AuthService.clearAuthData();
      
      // Auth data should be cleared
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(window.__isAuthenticated).toBe(false);
    });
  });

  describe('Recovery Mechanisms', () => {
    it('should recover authentication when localStorage is cleared', async () => {
      // Setup - store in all storages
      const token = 'recovery-token-123';
      const userData = { id: 'user789', name: 'Recovery User', email: 'recovery@example.com' };
      
      AuthService.saveAuthData(token, userData);
      
      // Bypass the override and force clear localStorage
      Object.getOwnPropertyDescriptor(Storage.prototype, 'clear')!
        .value.call(localStorage);
      
      // Auth data should be gone from localStorage
      expect(localStorage.getItem('token')).toBeNull();
      
      // Initialize auth to trigger recovery
      await AuthService.initAuth();
      
      // Auth data should be recovered
      expect(localStorage.getItem('token')).toBe(token);
      expect(JSON.parse(localStorage.getItem('user') || '{}')).toMatchObject(userData);
      expect(window.__isAuthenticated).toBe(true);
    });
  });

  describe('MongoDB Integration', () => {
    it('should make authenticated requests to MongoDB API endpoints', async () => {
      // Setup - store auth data
      const token = 'mongo-token-123';
      const userData = { id: 'user123', name: 'MongoDB User', email: 'mongo@example.com' };
      
      AuthService.saveAuthData(token, userData);
      
      // The actual API request would be handled by the API service, but we can
      // verify that the auth token is available for requests
      const authData = AuthService.loadAuthData();
      
      // Verify auth data is available for API requests
      expect(authData.token).toBe(token);
      expect(authData.isAuthenticated).toBe(true);
      
      // Make a mock API request (in a real app this would use the API service)
      const headers = new Headers();
      if (authData.token) {
        headers.append('Authorization', `Bearer ${authData.token}`);
      }
      
      // This would be the request to MongoDB
      const response = await fetch('/api/v1/user/profile', {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });
      
      // Verify the mock response
      expect(response.status).toBe(200);
      
      // Verify the token was used in the request
      const requestHeaders = (mockFetch as any).lastCall[1].headers;
      expect(requestHeaders.get('Authorization')).toBe(`Bearer ${token}`);
    });
  });
}); 