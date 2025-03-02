import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import ApiService from '../services/api';
import { checkBackendHealth, validateTokenStatus } from '../utils/apiUtils';
import { User } from '../types';
import { useDispatch } from 'react-redux';
import { logout as logoutAction, updateUser } from '../store/slices/authSlice';
import { useFeedback } from '../contexts/FeedbackContext';

// Import these types to match ApiService
interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface AuthResponse {
  token?: string;
  user: User;
}

// Create the auth context with proper typing
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  serverStatus: 'unknown' | 'online' | 'offline';
  login: (email: string, password: string) => Promise<ApiResponse<AuthResponse>>;
  register: (name: string, email: string, password: string) => Promise<ApiResponse<AuthResponse>>;
  logout: () => void;
  updateProfile: (profileData: Partial<User>) => Promise<User>;
  refreshUserData: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const dispatch = useDispatch();
  const { showError } = useFeedback();
  const [serverStatus, setServerStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  
  // Function to refresh user data from server
  const refreshUserData = useCallback(async () => {
    try {
      console.log('Refreshing user data from server');
      setLoading(true);
      
      // Use API service to get current user directly from server
      const response = await ApiService.getCurrentUser();
      
      if (response.error) {
        console.error('Failed to refresh user data:', response.error);
        setUser(null);
        dispatch(logoutAction());
        return false;
      }
      
      if (response.data) {
        console.log('User data refreshed successfully:', response.data);
        setUser(response.data);
        dispatch(updateUser(response.data));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state');
        await refreshUserData();
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
    
    // Set up periodic refresh for auth data
    const refreshInterval = setInterval(() => {
      refreshUserData();
    }, 10 * 60 * 1000); // Refresh every 10 minutes
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [refreshUserData]);

  // Clear user data on logout
  const handleLogout = useCallback(() => {
    ApiService.logout();
    setUser(null);
    dispatch(logoutAction());
  }, [dispatch]);

  // Update profile
  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    try {
      const response = await ApiService.updateProfile(profileData);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        setUser(response.data);
        dispatch(updateUser(response.data));
        return response.data;
      }
      
      throw new Error('Failed to update profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError(error instanceof Error ? error.message : 'Failed to update profile');
      throw error;
    }
  }, [dispatch, showError]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check server status first
        const isServerUp = await checkBackendHealth();
        setServerStatus(isServerUp ? 'online' : 'offline');
        
        if (!isServerUp) {
          console.log('Server is offline, skipping auth check');
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Use the new /auth/check endpoint to verify authentication
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/check`, {
          method: 'GET',
          credentials: 'include', // This sends the cookies
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          // We're authenticated, get the user data
          const apiUserResponse = await ApiService.getCurrentUser();
          if (apiUserResponse.data) {
            setUser(apiUserResponse.data);
          } else {
            setUser(null);
          }
        } else {
          // Not authenticated
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Login user with email and password
  const login = async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    setLoading(true);
    
    try {
      const response = await ApiService.login({ email, password });
      
      if (response.data) {
        setUser(response.data.user);
        return { data: response.data };
      }
      
      return { error: response.error || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error during login' 
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Register user
  const register = async (name: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    setLoading(true);
    
    try {
      const response = await ApiService.register({ 
        name, 
        email, 
        password,
        username: email.split('@')[0] // Default username from email
      });
      
      if (response.data) {
        setUser(response.data.user);
        return { data: response.data };
      }
      
      return { error: response.error || 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error during registration' 
      };
    } finally {
      setLoading(false);
    }
  };
  
  const value = useMemo((): AuthContextType => ({
    user,
    isLoading: loading,
    isAuthenticated: !!user,
    serverStatus,
    login,
    register,
    logout: handleLogout,
    updateProfile,
    refreshUserData,
  }), [user, loading, handleLogout, updateProfile, refreshUserData, serverStatus]);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 