/// <reference types="jest" />

import { formatErrorMessage, ErrorCategory, shouldUseMockMode } from './apiUtils';

describe('API Utilities', () => {
  describe('formatErrorMessage', () => {
    it('formats server errors correctly', () => {
      const error = {
        category: ErrorCategory.SERVER,
        message: 'Internal server error',
        retryable: true
      };
      
      expect(formatErrorMessage(error)).toContain('Server error');
      expect(formatErrorMessage(error)).toContain('try again later');
    });
    
    it('formats network errors correctly', () => {
      const error = {
        category: ErrorCategory.NETWORK,
        message: 'Connection timeout',
        retryable: true
      };
      
      expect(formatErrorMessage(error)).toContain('Network error');
      expect(formatErrorMessage(error)).toContain('check your connection');
    });
    
    it('handles plain Error objects', () => {
      const error = new Error('Something went wrong');
      expect(formatErrorMessage(error)).toBe('Something went wrong');
    });
    
    it('handles string errors', () => {
      expect(formatErrorMessage('Error message')).toBe('Error message');
    });
    
    it('handles unknown error types', () => {
      expect(formatErrorMessage(null)).toBe('An unknown error occurred');
      expect(formatErrorMessage(undefined)).toBe('An unknown error occurred');
      expect(formatErrorMessage({})).toBe('An unknown error occurred');
    });
  });
  
  describe('shouldUseMockMode', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });
    
    it('always returns false now that mock mode is disabled', () => {
      // Mock mode is now permanently disabled
      expect(shouldUseMockMode('/any/endpoint')).toBe(false);
      
      // Even if these were set, it should still return false
      localStorage.setItem('useMockAuth', 'true');
      expect(shouldUseMockMode('/any/endpoint')).toBe(false);
      
      const recentTime = Date.now() - 5 * 60 * 1000;
      localStorage.setItem('mockModeEnabledAt', recentTime.toString());
      expect(shouldUseMockMode('/any/endpoint')).toBe(false);
    });
  });
}); 