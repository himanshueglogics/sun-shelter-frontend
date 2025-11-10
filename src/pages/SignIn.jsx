import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import './SignIn.css';

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-left">
        <div className="top-logo-container">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="#4A90E2" strokeWidth="2"/>
              <path d="M15 20C15 17.2386 17.2386 15 20 15C22.7614 15 25 17.2386 25 20" stroke="#4A90E2" strokeWidth="2"/>
              <circle cx="20" cy="12" r="3" fill="#4A90E2"/>
            </svg>
          </div>
          <div className="logo-text">Sun Shelter</div>
        </div>
        
        <div className="welcome-section">
          <div className='alignment'>
            <div className="progress-bar"></div>
            <div>
              <h1 className="welcome-title">Great to have<br />you back!</h1>
              <p className="welcome-subtitle" >
                Consequat adipisicing ea do labore trure<br />
                adipisicing occaecat cupidatat excepteur duis ino
              </p>
            </div>
          </div>
          <div className="sun-icon">
            <svg width="50" height="50" viewBox="0 0 60 60" fill="none">
              <circle cx="30" cy="30" r="10" fill="#FDB022"/>
              <line x1="30" y1="10" x2="30" y2="16" stroke="#FDB022" strokeWidth="2"/>
              <line x1="30" y1="44" x2="30" y2="50" stroke="#FDB022" strokeWidth="2"/>
              <line x1="50" y1="30" x2="44" y2="30" stroke="#FDB022" strokeWidth="2"/>
              <line x1="16" y1="30" x2="10" y2="30" stroke="#FDB022" strokeWidth="2"/>
              <line x1="43" y1="17" x2="39" y2="21" stroke="#FDB022" strokeWidth="2"/>
              <line x1="21" y1="39" x2="17" y2="43" stroke="#FDB022" strokeWidth="2"/>
              <line x1="43" y1="43" x2="39" y2="39" stroke="#FDB022" strokeWidth="2"/>
              <line x1="21" y1="21" x2="17" y2="17" stroke="#FDB022" strokeWidth="2"/>
            </svg>
      
          </div>
          <div className="wave-decoration">
            {/* <svg width="100%" height="100vh" viewBox="0 0 500 200" preserveAspectRatio="none" fill="none">
              <path d="M0 100C150 50 350 150 500 100L500 200L0 200Z" fill="#B8D4E8" opacity="0.4"/>
              <path d="M0 120C150 70 350 170 500 120L500 200L0 200Z" fill="#A5C9E0" opacity="0.6"/>
            </svg> */}
          </div>
        </div>
      </div>

      <div className="signin-right">
        <div className="signin-form-container">
          <h2 className="signin-title">Sign in</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="forgot-password-link">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="signin-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
