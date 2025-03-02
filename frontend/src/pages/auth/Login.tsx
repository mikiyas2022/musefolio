import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';
import ApiService from '../../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, serverStatus, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Update server status notification
  useEffect(() => {
    if (serverStatus === 'offline') {
      toast.warning('Server appears to be offline. Please try again later.', {
        autoClose: 10000,
        position: 'top-center'
      });
    }
  }, [serverStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Determine if we should show server warning
  const showServerWarning = serverStatus === 'offline' || serverStatus === 'unknown';
  
  // Combined loading state (from form submission or auth context)
  const isLoading = loading || authLoading;

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="gradient-sphere"></div>
        <div className="mesh-grid"></div>
      </div>
      <div className="auth-content">
        <div className="auth-header">
          <Link to="/" className="logo">Musefolio</Link>
          <h1>Welcome back</h1>
          <p>Sign in to continue building your portfolio</p>
        </div>
        
        {/* Server status indicator */}
        <div className="server-status">
          <span className={`status-indicator ${serverStatus}`}></span>
          <span className="status-text">
            {serverStatus === 'online' ? 'Server: Online' : 
             serverStatus === 'offline' ? 'Server: Offline' : 'Server status: Checking...'}
          </span>
        </div>
        
        {/* Show server error warning if detected */}
        {showServerWarning && (
          <div className="server-error-warning">
            <p>
              {serverStatus === 'offline' 
                ? 'Server is currently offline. Please try again later.' 
                : 'Server status is unknown. Please check your connection.'}
            </p>
          </div>
        )}
        
        <div className="auth-card">
          <div className="oauth-buttons">
            <button className="oauth-button" disabled={isLoading}>
              <i className="fab fa-github"></i>
              Continue with GitHub
            </button>
            <button className="oauth-button" disabled={isLoading}>
              <i className="fab fa-google"></i>
              Continue with Google
            </button>
          </div>
          
          <div className="divider">
            <span>or sign in with email</span>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="form-control"
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="form-control"
                disabled={isLoading}
              />
            </div>
            
            <div className="form-footer">
              <button 
                type="submit" 
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
              <Link to="/forgot-password" className="forgot-password">
                Forgot password?
              </Link>
            </div>
          </form>
        </div>
        
        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 