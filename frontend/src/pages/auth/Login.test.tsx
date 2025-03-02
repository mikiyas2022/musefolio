/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import ApiService from '../../services/api';
import { toast } from 'react-toastify';
import AuthContext from '../../contexts/AuthContext';

// Mock dependencies
vi.mock('../../services/api', () => ({
  default: {
    login: vi.fn()
  }
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  }
}));

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });
  
  // Mock auth context value
  const mockAuthContext = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    serverStatus: 'online' as const,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn()
  };
  
  const renderLogin = (contextOverrides = {}) => {
    return render(
      <AuthContext.Provider value={{ ...mockAuthContext, ...contextOverrides }}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthContext.Provider>
    );
  };
  
  it('renders login form correctly', () => {
    renderLogin();
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
  
  it('shows server offline message when server is down', async () => {
    // Render with offline server status
    renderLogin({ serverStatus: 'offline' as const });
    
    // Check if server error warning is displayed
    expect(screen.getByText(/server is currently offline/i)).toBeInTheDocument();
  });
  
  it('submits the form with correct values', async () => {
    // Setup auth context login mock
    mockAuthContext.login.mockResolvedValue(undefined);
    
    renderLogin();
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check if login was called with correct values
    expect(mockAuthContext.login).toHaveBeenCalledWith('test@example.com', 'password123');
    
    // Check if success toast was shown
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Login successful!');
    });
  });
  
  it('shows error message when login fails', async () => {
    // Setup auth context login mock to throw error
    const errorMessage = 'Invalid credentials';
    mockAuthContext.login.mockRejectedValue(new Error(errorMessage));
    
    renderLogin();
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check if error toast was shown
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });
}); 