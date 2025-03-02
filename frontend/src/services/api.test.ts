/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ApiService from './api';
import { ErrorCategory } from '../utils/apiUtils';
import { ApiError } from '../utils/apiUtils';
import apiConfig from '../config/apiConfig';

// Mock the fetch function
global.fetch = vi.fn();

// Mock apiConfig
vi.mock('../config/apiConfig', () => ({
  default: {
    auth: {
      endpoints: {
        login: '/auth/login',
        register: '/auth/register'
      }
    },
    getFullUrl: (endpoint: string) => `/api/v1${endpoint}`,
    get: () => ({
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 1000
    })
  }
}));

describe('ApiService', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true
    });
  });
  
  describe('login', () => {
    it('should make a POST request to the login endpoint', async () => {
      // Mock successful response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          token: 'test-token',
          user: { id: '1', email: 'test@example.com' }
        }),
      });
      
      // Call the login method
      const result = await ApiService.login({
        email: 'test@example.com', 
        password: 'password'
      });
      
      // Verify fetch was called correctly
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/auth/login', 
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        })
      );
      
      // Verify the result
      expect(result).toHaveProperty('data');
      expect(result.data).toEqual({
        token: 'test-token',
        user: { id: '1', email: 'test@example.com' }
      });
      
      // Verify token was stored in localStorage
      expect(localStorage.getItem('token')).toBe('test-token');
    });
    
    it('should handle login errors', async () => {
      // Mock error response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => JSON.stringify({ error: 'Authentication required. Please log in again.' }),
      });
      
      // Call the login method
      const result = await ApiService.login({
        email: 'test@example.com', 
        password: 'wrong-password'
      });
      
      // Verify the error result
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Authentication required');
      
      // Verify token was not stored
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
  
  describe('register', () => {
    it('should make a POST request to the register endpoint', async () => {
      // Mock successful response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          token: 'new-user-token',
          user: { 
            id: '2', 
            name: 'New User',
            email: 'newuser@example.com',
            username: 'newuser'  
          }
        }),
      });
      
      // Registration data
      const userData = {
        name: 'New User',
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123'
      };
      
      // Call the register method
      const result = await ApiService.register(userData);
      
      // Verify fetch was called correctly
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/auth/register', 
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        })
      );
      
      // Verify the request body was correct
      const requestBody = JSON.parse((fetch as any).mock.calls[0][1].body);
      expect(requestBody).toEqual(userData);
      
      // Verify the result
      expect(result).toHaveProperty('data');
      expect(result.data).toEqual({
        token: 'new-user-token',
        user: { 
          id: '2', 
          name: 'New User',
          email: 'newuser@example.com',
          username: 'newuser'  
        }
      });
      
      // Verify token was stored in localStorage
      expect(localStorage.getItem('token')).toBe('new-user-token');
    });
    
    it('should handle registration errors', async () => {
      // Mock error response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => JSON.stringify({ error: 'Email already in use' }),
      });
      
      // Registration data with existing email
      const userData = {
        name: 'New User',
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123'
      };
      
      // Call the register method
      const result = await ApiService.register(userData);
      
      // Verify the error result
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Email already in use');
      
      // Verify token was not stored
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
  
  // Add more tests for other ApiService methods
}); 