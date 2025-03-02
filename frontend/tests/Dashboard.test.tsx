import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../src/pages/dashboard/Dashboard';
import { AuthProvider } from '../src/contexts/AuthContext';
import { FeedbackProvider } from '../src/contexts/FeedbackContext';
import configureStore from '../src/store';

// Mock the API service
vi.mock('../src/services/api', () => ({
  default: {
    isAuthenticated: () => true,
    logout: vi.fn(),
    updateProfile: vi.fn().mockResolvedValue({ 
      data: { name: 'Updated Name', socialLinks: { linkedin: 'https://linkedin.com/test' } } 
    }),
    uploadAvatar: vi.fn().mockResolvedValue({ data: { avatar: 'new-avatar.jpg' } }),
  }
}));

// Mock the Redux thunks
vi.mock('../src/store/slices/pageSlice', () => ({
  fetchPortfolios: () => ({ type: 'portfolio/fetchPortfolios' }),
  createPortfolio: () => ({ type: 'portfolio/createPortfolio' }),
  updatePortfolio: () => ({ type: 'portfolio/updatePortfolio' }),
  deletePortfolio: () => ({ type: 'portfolio/deletePortfolio' }),
  publishPortfolio: () => ({ type: 'portfolio/publishPortfolio' }),
  Portfolio: {},
}));

// Mock the AuthContext
vi.mock('../src/contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      profession: 'Developer',
      bio: 'Test bio',
      socialLinks: {
        linkedin: '',
        github: '',
        twitter: '',
        behance: '',
        dribbble: '',
      }
    },
    isAuthenticated: true,
    updateProfile: vi.fn().mockResolvedValue({ 
      name: 'Updated Name', 
      socialLinks: { linkedin: 'https://linkedin.com/test' } 
    }),
  }),
}));

// Mock the FeedbackContext
vi.mock('../src/contexts/FeedbackContext', () => ({
  FeedbackProvider: ({ children }) => children,
  useFeedback: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
  }),
}));

describe('Dashboard Component', () => {
  const store = configureStore();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should render the profile section', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <AuthProvider>
            <FeedbackProvider>
              <Dashboard />
            </FeedbackProvider>
          </AuthProvider>
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('Test bio')).toBeInTheDocument();
  });
  
  it('should update social links correctly', async () => {
    const { updateProfile } = vi.mocked(useAuth());
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <AuthProvider>
            <FeedbackProvider>
              <Dashboard />
            </FeedbackProvider>
          </AuthProvider>
        </BrowserRouter>
      </Provider>
    );
    
    // Find the LinkedIn input field
    const linkedinInput = screen.getByPlaceholderText('LinkedIn URL');
    
    // Type a LinkedIn URL
    await userEvent.type(linkedinInput, 'https://linkedin.com/test');
    
    // Click the Save Links button
    const saveButton = screen.getByText('Save Links');
    fireEvent.click(saveButton);
    
    // Verify that updateProfile was called with the correct data
    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        socialLinks: {
          linkedin: 'https://linkedin.com/test'
        }
      });
    });
  });
}); 