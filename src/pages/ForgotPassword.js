import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import axios from '../api/axios';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await axios.post('/auth/forgot-password', { email });
      setMessage('Verification link sent to your email address. Please check your inbox.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-left">
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

        <div className="decoration-section">
          <div className="progress-bar"></div>
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
            <svg width="100%" height="200" viewBox="0 0 500 200" preserveAspectRatio="none" fill="none">
              <path d="M0 100C150 50 350 150 500 100L500 200L0 200Z" fill="#B8D4E8" opacity="0.4"/>
              <path d="M0 120C150 70 350 170 500 120L500 200L0 200Z" fill="#A5C9E0" opacity="0.6"/>
            </svg>
          </div>
        </div>
      </div>

      <div className="forgot-password-right">
        <div className="forgot-password-form-container">
          <button className="back-button" onClick={() => navigate('/signin')}>
            <ArrowLeft size={24} />
          </button>

          <h2 className="forgot-password-title">Forgot Password</h2>
          <p className="forgot-password-description">
            We have sent a verification link to your email address.
            Please check your inbox (and spam or junk folder if you
            don't see it) and click on the link to confirm your email
            address.
          </p>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Sending...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
