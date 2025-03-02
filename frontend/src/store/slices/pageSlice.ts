import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import ApiService from '../../services/api';

// Use a common type definition for portfolios across the application
export type PortfolioType = 'about' | 'cv' | 'portfolio';

export interface Portfolio {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
  updatedAt: string;
  createdAt: string;
  userId: string;
  type?: PortfolioType;
  theme?: string;
  layout?: string;
  subdomain?: string;
  customDomain?: string;
  projects?: any[];
  sections?: any[];
}

// Define the state structure
interface PortfolioState {
  portfolios: Portfolio[];
  loading: boolean;
  error: string | null;
  currentOperation: {
    type: 'create' | 'update' | 'delete' | 'publish' | null;
    loading: boolean;
    error: string | null;
  };
}

const initialState: PortfolioState = {
  portfolios: [],
  loading: false,
  error: null,
  currentOperation: {
    type: null,
    loading: false,
    error: null,
  },
};

// Fetch portfolios async thunk
export const fetchPortfolios = createAsyncThunk<
  Portfolio[],
  void,
  { rejectValue: string }
>(
  'portfolios/fetchPortfolios',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ApiService.getPortfolios();
      
      if (typeof response === 'string') {
        return rejectWithValue(response);
      }
      
      // Response is already an array of portfolios
      return response as Portfolio[];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch portfolios');
    }
  }
);

// Create portfolio async thunk
export const createPortfolio = createAsyncThunk<
  Portfolio,
  { 
    title: string; 
    description: string; 
    type?: PortfolioType;
    theme?: string;
    layout?: string;
    subdomain?: string; 
  },
  { rejectValue: string }
>(
  'portfolios/createPortfolio',
  async (portfolioData, { rejectWithValue }) => {
    try {
      const response = await ApiService.createPortfolio(portfolioData);
      
      if (typeof response === 'string') {
        return rejectWithValue(response);
      }
      
      return response as Portfolio;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create portfolio');
    }
  }
);

// Update portfolio async thunk
export const updatePortfolio = createAsyncThunk<
  Portfolio,
  { id: string; data: Partial<Portfolio> },
  { rejectValue: string }
>(
  'portfolios/updatePortfolio',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await ApiService.updatePortfolio(id, data);
      
      if (typeof response === 'string' || (typeof response === 'object' && 'error' in response)) {
        return rejectWithValue(typeof response === 'string' ? response : response.error || 'Update failed');
      }
      
      return response as Portfolio;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update portfolio');
    }
  }
);

// Delete portfolio async thunk
export const deletePortfolio = createAsyncThunk<
  string, 
  string, 
  { rejectValue: string }
>(
  'portfolios/deletePortfolio',
  async (id, { rejectWithValue }) => {
    try {
      const response = await ApiService.deletePortfolio(id);
      
      if (typeof response === 'object' && 'error' in response && response.error) {
        return rejectWithValue(response.error);
      }
      
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete portfolio');
    }
  }
);

// Publish portfolio async thunk
export const publishPortfolio = createAsyncThunk<
  Portfolio, 
  string, 
  { rejectValue: string }
>(
  'portfolios/publishPortfolio',
  async (id, { rejectWithValue }) => {
    try {
      const response = await ApiService.publishPortfolio(id);
      
      if (typeof response === 'string') {
        return rejectWithValue(response);
      }
      
      if (typeof response === 'object') {
        if ('error' in response && response.error) {
          return rejectWithValue(response.error);
        }
        
        if ('data' in response && response.data) {
          // Force type cast to Portfolio through unknown to satisfy TypeScript
          return response.data as unknown as Portfolio;
        }
      }
      
      // If we get here, the response is invalid
      return rejectWithValue('Invalid response from server');
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to publish portfolio');
    }
  }
);

// Slice definition
const portfolioSlice = createSlice({
  name: 'portfolios',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.currentOperation = {
        type: null,
        loading: false,
        error: null,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch portfolios
    builder.addCase(fetchPortfolios.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPortfolios.fulfilled, (state, action) => {
      state.loading = false;
      state.portfolios = action.payload || [];
      console.log('📋 Portfolios stored in Redux:', state.portfolios);
    });
    builder.addCase(fetchPortfolios.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to fetch portfolios';
      state.portfolios = [];
    });

    // Create portfolio
    builder.addCase(createPortfolio.pending, (state) => {
      state.currentOperation = {
        type: 'create',
        loading: true,
        error: null,
      };
    });
    builder.addCase(createPortfolio.fulfilled, (state, action) => {
      state.portfolios.push(action.payload);
      state.currentOperation = {
        type: null,
        loading: false,
        error: null,
      };
    });
    builder.addCase(createPortfolio.rejected, (state, action) => {
      state.currentOperation = {
        type: 'create',
        loading: false,
        error: action.payload || 'Failed to create portfolio',
      };
    });

    // Update portfolio
    builder.addCase(updatePortfolio.pending, (state) => {
      state.currentOperation = {
        type: 'update',
        loading: true,
        error: null,
      };
    });
    builder.addCase(updatePortfolio.fulfilled, (state, action) => {
      const index = state.portfolios.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.portfolios[index] = action.payload;
      }
      state.currentOperation = {
        type: null,
        loading: false,
        error: null,
      };
    });
    builder.addCase(updatePortfolio.rejected, (state, action) => {
      state.currentOperation = {
        type: 'update',
        loading: false,
        error: action.payload || 'Failed to update portfolio',
      };
    });

    // Delete portfolio
    builder.addCase(deletePortfolio.pending, (state) => {
      state.currentOperation = {
        type: 'delete',
        loading: true,
        error: null,
      };
    });
    builder.addCase(deletePortfolio.fulfilled, (state, action) => {
      state.portfolios = state.portfolios.filter(p => p.id !== action.payload);
      state.currentOperation = {
        type: null,
        loading: false,
        error: null,
      };
    });
    builder.addCase(deletePortfolio.rejected, (state, action) => {
      state.currentOperation = {
        type: 'delete',
        loading: false,
        error: action.payload || 'Failed to delete portfolio',
      };
    });

    // Publish portfolio
    builder.addCase(publishPortfolio.pending, (state) => {
      state.currentOperation = {
        type: 'publish',
        loading: true,
        error: null,
      };
    });
    builder.addCase(publishPortfolio.fulfilled, (state, action) => {
      const index = state.portfolios.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.portfolios[index] = action.payload;
      }
      state.currentOperation = {
        type: null,
        loading: false,
        error: null,
      };
    });
    builder.addCase(publishPortfolio.rejected, (state, action) => {
      state.currentOperation = {
        type: 'publish',
        loading: false,
        error: action.payload || 'Failed to publish portfolio',
      };
    });
  },
});

export const { clearError } = portfolioSlice.actions;
export default portfolioSlice.reducer; 