import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as AuthService from '../services/auth';
import { shouldUseMockMode } from '../utils/apiUtils';

// Mock user for development
const MOCK_USER = {
  id: 'mock-user-id',
  username: 'mockuser',
  email: 'mock@example.com',
  name: 'Mock User',
  avatar: '/images/default-avatar.png'
};

// Mock token for development
const MOCK_TOKEN = 'mock-jwt-token-for-development';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: (email: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      try {
        // Use mock mode in development
        if (shouldUseMockMode()) {
          console.log('🔧 Using mock authentication in development mode');
          setIsAuthenticated(true);
          setUser(MOCK_USER);
          localStorage.setItem('token', MOCK_TOKEN);
          localStorage.setItem('user', JSON.stringify(MOCK_USER));
        } else {
          // Real authentication check
          const authData = AuthService.loadAuthData();
          setIsAuthenticated(authData.isAuthenticated);
          setUser(authData.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      if (shouldUseMockMode()) {
        // Mock successful login
        setIsAuthenticated(true);
        setUser(MOCK_USER);
        localStorage.setItem('token', MOCK_TOKEN);
        localStorage.setItem('user', JSON.stringify(MOCK_USER));
        return { success: true, user: MOCK_USER };
      } else {
        // Real login
        const response = await AuthService.login(email, password);
        setIsAuthenticated(true);
        setUser(response.user);
        return response;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: any) => {
    setIsLoading(true);
    
    try {
      if (shouldUseMockMode()) {
        // Mock successful registration
        const mockUser = { ...MOCK_USER, ...userData };
        setIsAuthenticated(true);
        setUser(mockUser);
        localStorage.setItem('token', MOCK_TOKEN);
        localStorage.setItem('user', JSON.stringify(mockUser));
        return { success: true, user: mockUser };
      } else {
        // Real registration
        const response = await AuthService.register(userData);
        setIsAuthenticated(true);
        setUser(response.user);
        return response;
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 