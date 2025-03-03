import { apiRequest } from '../utils/apiUtils';

// Interface for auth data
interface AuthData {
  isAuthenticated: boolean;
  user: any;
  token?: string;
}

// Interface for auth response
interface AuthResponse {
  token: string;
  user: any;
}

// Initialize a promise that resolves when auth is initialized
let authInitPromise: Promise<void>;
let authInitResolve: () => void;

// Create the promise
authInitPromise = new Promise<void>((resolve) => {
  authInitResolve = resolve;
});

// Function to wait for auth initialization
export const waitForInit = (): Promise<void> => {
  return authInitPromise;
};

// Function to load auth data from localStorage
export const loadAuthData = (): AuthData => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      const user = JSON.parse(userStr);
      
      // Mark auth as initialized
      if (authInitResolve) {
        authInitResolve();
      }
      
      return {
        isAuthenticated: true,
        user,
        token
      };
    }
    
    // Mark auth as initialized even if not authenticated
    if (authInitResolve) {
      authInitResolve();
    }
    
    return {
      isAuthenticated: false,
      user: null
    };
  } catch (error) {
    console.error('Error loading auth data:', error);
    
    // Mark auth as initialized even on error
    if (authInitResolve) {
      authInitResolve();
    }
    
    return {
      isAuthenticated: false,
      user: null
    };
  }
};

// Function to save auth data to localStorage
export const saveAuthData = (token: string, user: any): void => {
  try {
    localStorage.setItem('token', token);
    localStorage.setItem('user', typeof user === 'string' ? user : JSON.stringify(user));
    localStorage.setItem('authState', 'true');
  } catch (error) {
    console.error('Error saving auth data:', error);
  }
};

// Function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  const { isAuthenticated } = loadAuthData();
  return isAuthenticated;
};

// Function to login user
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await apiRequest<AuthResponse>('auth/login', 'POST', { email, password });
    
    if (response && response.token && response.user) {
      saveAuthData(response.token, response.user);
      return response;
    }
    
    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Function to register user
export const register = async (userData: any): Promise<AuthResponse> => {
  try {
    const response = await apiRequest<AuthResponse>('auth/register', 'POST', userData);
    
    if (response && response.token && response.user) {
      saveAuthData(response.token, response.user);
      return response;
    }
    
    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Function to logout user
export const logout = (): void => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authState');
    localStorage.setItem('was_logged_out', 'true');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Initialize auth on module load
loadAuthData(); 