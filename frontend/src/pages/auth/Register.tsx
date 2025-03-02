import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';
import ApiService from '../../services/api';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, serverStatus, isLoading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
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
      await register({
        name,
        username,
        email,
        password
      });
      toast.success('Registration successful!');
      navigate('/onboarding');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      toast.error(errorMessage);
      console.error('Registration error:', error);
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
          <h1>Create your account</h1>
          <p>Start building your creative portfolio</p>
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
            <span>or sign up with email</span>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="form-control"
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                required
                className="form-control"
                disabled={isLoading}
              />
            </div>
            
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
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
        
        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 