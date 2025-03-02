import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Template {
  id: string;
  name: string;
  description: string;
  image: string;
  profession?: string;
  thumbnail?: string;
  layout?: string;
  sections?: {
    type: string;
    label: string;
    required: boolean;
  }[];
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text?: string;
  };
  typography?: {
    fontFamily?: string;
    headings?: string;
    body?: string;
  };
}

interface TemplateState {
  templates: Template[];
  themes: Theme[];
  selectedTemplate: Template | null;
  selectedTheme: Theme | null;
  loading: boolean;
  error: string | null;
}

const initialState: TemplateState = {
  templates: [],
  themes: [],
  selectedTemplate: null,
  selectedTheme: null,
  loading: false,
  error: null,
};

const templateSlice = createSlice({
  name: 'template',
  initialState,
  reducers: {
    setTemplates: (state, action: PayloadAction<Template[]>) => {
      state.templates = action.payload;
    },
    setThemes: (state, action: PayloadAction<Theme[]>) => {
      state.themes = action.payload;
    },
    selectTemplate: (state, action: PayloadAction<Template>) => {
      state.selectedTemplate = action.payload;
    },
    selectTheme: (state, action: PayloadAction<Theme>) => {
      state.selectedTheme = action.payload;
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
  setTemplates,
  setThemes,
  selectTemplate,
  selectTheme,
  setLoading,
  setError,
} = templateSlice.actions;

export default templateSlice.reducer; 