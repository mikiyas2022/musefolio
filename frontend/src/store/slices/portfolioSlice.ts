import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Project {
  id: string;
  title: string;
  description: string;
  content: string;
  media: string[];
  tags: string[];
  order: number;
}

interface Section {
  id: string;
  title: string;
  type: string;
  content: string;
  order: number;
}

interface Portfolio {
  id: string;
  title: string;
  description: string;
  theme: string;
  layout: string;
  projects: Project[];
  sections: Section[];
  customDomain?: string;
  subdomain: string;
}

interface PortfolioState {
  currentPortfolio: Portfolio | null;
  portfolios: Portfolio[];
  loading: boolean;
  error: string | null;
}

const initialState: PortfolioState = {
  currentPortfolio: null,
  portfolios: [],
  loading: false,
  error: null,
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    setCurrentPortfolio: (state, action: PayloadAction<Portfolio>) => {
      state.currentPortfolio = action.payload;
    },
    updatePortfolio: (state, action: PayloadAction<Portfolio>) => {
      const index = state.portfolios.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.portfolios[index] = action.payload;
      }
      if (state.currentPortfolio?.id === action.payload.id) {
        state.currentPortfolio = action.payload;
      }
    },
    setPortfolios: (state, action: PayloadAction<Portfolio[]>) => {
      state.portfolios = action.payload;
    },
    addProject: (state, action: PayloadAction<Project>) => {
      if (state.currentPortfolio) {
        state.currentPortfolio.projects.push(action.payload);
      }
    },
    updateProject: (state, action: PayloadAction<Project>) => {
      if (state.currentPortfolio) {
        const index = state.currentPortfolio.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.currentPortfolio.projects[index] = action.payload;
        }
      }
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      if (state.currentPortfolio) {
        state.currentPortfolio.projects = state.currentPortfolio.projects.filter(
          p => p.id !== action.payload
        );
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setCurrentPortfolio,
  updatePortfolio,
  setPortfolios,
  addProject,
  updateProject,
  deleteProject,
  setLoading,
  setError,
} = portfolioSlice.actions;

export default portfolioSlice.reducer; 