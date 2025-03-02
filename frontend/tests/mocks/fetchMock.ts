import { vi } from 'vitest';

interface MockFetch extends ReturnType<typeof vi.fn> {
  lastCall: [string, RequestInit] | null;
  calls: [string, RequestInit][];
  resetMock: () => void;
}

/**
 * Mock implementation of fetch for testing
 * Records calls and returns predetermined responses
 */
export const mockFetch = vi.fn().mockImplementation((url: string, options: RequestInit = {}) => {
  // Store the call information for assertions
  (mockFetch as MockFetch).lastCall = [url, options];
  (mockFetch as MockFetch).calls.push([url, options]);

  // Default response for successful requests
  const defaultResponse = {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: async () => ({ data: { message: 'Mocked response success' } }),
    text: async () => JSON.stringify({ data: { message: 'Mocked response success' } }),
  };

  // Route-specific responses
  if (url.includes('/api/v1/auth/login')) {
    return Promise.resolve({
      ...defaultResponse,
      json: async () => ({
        token: 'mocked-auth-token',
        user: {
          id: 'mocked-user-id',
          name: 'Mocked User',
          email: 'mocked@example.com'
        }
      })
    });
  }

  if (url.includes('/api/v1/user/profile')) {
    // Check for auth header to validate secure requests
    const authHeader = options.headers instanceof Headers
      ? options.headers.get('Authorization')
      : options.headers && typeof options.headers === 'object'
        ? (options.headers as Record<string, string>)['Authorization']
        : null;
    
    if (!authHeader) {
      return Promise.resolve({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ error: 'Authentication required' }),
        text: async () => JSON.stringify({ error: 'Authentication required' }),
      });
    }

    return Promise.resolve({
      ...defaultResponse,
      json: async () => ({
        data: {
          user: {
            id: 'mocked-user-id',
            name: 'Mocked User',
            email: 'mocked@example.com',
            username: 'mockeduser',
            profession: 'Software Engineer',
            bio: 'I am a mocked user for testing',
            socialLinks: {
              github: 'https://github.com/mockeduser',
              linkedin: 'https://linkedin.com/in/mockeduser'
            }
          }
        }
      })
    });
  }

  if (url.includes('/api/v1/health')) {
    return Promise.resolve({
      ...defaultResponse,
      json: async () => ({ status: 'healthy', mongodb: 'connected' })
    });
  }

  // Return default response for other routes
  return Promise.resolve(defaultResponse);
}) as MockFetch;

// Store tracking information
(mockFetch as MockFetch).lastCall = null;
(mockFetch as MockFetch).calls = [];

// Reset mock helper
(mockFetch as MockFetch).resetMock = () => {
  (mockFetch as MockFetch).lastCall = null;
  (mockFetch as MockFetch).calls = [];
  mockFetch.mockClear();
};

// Export the typed mock
export default mockFetch; 