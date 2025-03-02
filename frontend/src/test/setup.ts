/// <reference types="vitest" />
import { vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Mock window.location
const locationMock = {
  origin: 'http://localhost:3000',
};

// Setup mocks before each test
beforeEach(() => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  Object.defineProperty(window, 'location', { value: locationMock });
  
  // Clear localStorage before each test
  localStorageMock.clear();
});

// Clean up mocks after each test
afterEach(() => {
  vi.clearAllMocks();
}); 