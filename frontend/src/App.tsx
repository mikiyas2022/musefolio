import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import { FeedbackProvider } from './contexts/FeedbackContext';
import './styles/shared.css';
import { ThemeProvider } from './contexts/ThemeContext';
import AppRoutes from './routes';

// Extremely simplified App component
function App() {
  return (
    <Router>
      <ThemeProvider>
        <FeedbackProvider>
          <AuthProvider>
            <ToastContainer position="top-right" autoClose={5000} />
            <AppRoutes />
          </AuthProvider>
        </FeedbackProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
