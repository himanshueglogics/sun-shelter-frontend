import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import './ResetPassword.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate token on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await axios.get(`/auth/validate-reset/${token}`);
      } catch (err) {
        if (!isMounted) return;
        navigate('/signin', { replace: true });
      }
    })();
    return () => { isMounted = false; };
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    if (password !== confirm) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      await axios.post(`/auth/reset-password/${token}`, { password });
      setMessage('Password reset successful. Redirecting to sign in...');
      setTimeout(() => navigate('/signin'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-card">
        <h2 className="reset-title">Set a new password</h2>
        <p className="reset-subtitle">Enter and confirm your new password to regain access.</p>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Confirm Password</label>
            <input
              id="confirm"
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="reset-button" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <div className="back-to-login">
          <Link to="/signin">Back to Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
