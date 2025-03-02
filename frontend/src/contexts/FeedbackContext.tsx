import React, { createContext, useContext, useState, useCallback, forwardRef, useEffect } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface FeedbackContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

interface FeedbackProviderProps {
  children: React.ReactNode;
}

// Create a custom AlertWrapper component to prevent prop forwarding issues
const AlertWrapper = forwardRef<HTMLDivElement, {
  onClose: () => void;
  severity: AlertColor;
  children: React.ReactNode;
}>((props, ref) => {
  const { onClose, severity, children } = props;
  return (
    <Alert 
      ref={ref}
      onClose={onClose} 
      severity={severity} 
      sx={{ width: '100%' }}
    >
      {children}
    </Alert>
  );
});

// Give the component a display name
AlertWrapper.displayName = 'AlertWrapper';

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('success');

  // Add debug code to monitor network errors
  useEffect(() => {
    // Save original fetch to restore it later
    const originalFetch = window.fetch;
    
    // Override fetch to catch and log errors
    window.fetch = async function(input, init) {
      try {
        const response = await originalFetch(input, init);
        return response;
      } catch (error) {
        console.error('Network request failed:', error);
        throw error;
      }
    };
    
    return () => {
      // Restore original fetch when component unmounts
      window.fetch = originalFetch;
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const showFeedback = useCallback((message: string, severity: AlertColor) => {
    setMessage(message);
    setSeverity(severity);
    setOpen(true);
  }, []);

  const showSuccess = useCallback((message: string) => {
    showFeedback(message, 'success');
    toast.success(message);
  }, [showFeedback]);

  const showError = useCallback((message: string) => {
    console.error("Error feedback:", message);
    showFeedback(message, 'error');
    toast.error(message);
  }, [showFeedback]);

  const showInfo = useCallback((message: string) => {
    showFeedback(message, 'info');
    toast.info(message);
  }, [showFeedback]);

  const showWarning = useCallback((message: string) => {
    showFeedback(message, 'warning');
    toast.warning(message);
  }, [showFeedback]);

  // Create the alert element separately to prevent prop forwarding issues
  const alertElement = (
    <AlertWrapper onClose={handleClose} severity={severity}>
      {message}
    </AlertWrapper>
  );

  return (
    <FeedbackContext.Provider value={{ showSuccess, showError, showInfo, showWarning }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {alertElement}
      </Snackbar>
      {/* Use ToastContainer for better notifications */}
      <ToastContainer 
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </FeedbackContext.Provider>
  );
};

export default FeedbackContext; 