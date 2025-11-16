import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthCallback.css';

function AuthCallback() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Please enter a code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let response;
      try {
        response = await fetch('https://b1vxqylf5h.execute-api.us-east-1.amazonaws.com/auth/v1/exchange-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important: This allows cookies to be sent/received
          body: JSON.stringify({ code: code.trim() }),
        });
      } catch (fetchError) {
        // Check if it's a CORS error
        if (fetchError.message.includes('Failed to fetch') || fetchError.name === 'TypeError') {
          throw new Error('CORS Error: The API Gateway endpoint needs to be configured to allow requests from localhost:3000. Please ensure the backend has CORS headers configured (Access-Control-Allow-Origin, Access-Control-Allow-Credentials).');
        }
        throw fetchError;
      }

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
      }

      // // After successful token exchange, validate card with lambda
      // const validateResponse = await fetch('https://b1vxqylf5h.execute-api.us-east-1.amazonaws.com/auth/v1/validate-card', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   credentials: 'include', // Important: This sends cookies (id_token, access_token, refresh_token)
      // });

      // if (!validateResponse.ok) {
      //   throw new Error(`Card validation failed: ${validateResponse.status} ${validateResponse.statusText}`);
      // }

      // const validationData = await validateResponse.json();
      
      // // Check if card is valid/proper
      // if (!validationData.isValid || !validationData.isProper) {
      //   throw new Error('Card validation failed: Card is not proper or valid');
      // }

      // On successful validation, redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to exchange token. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-card">
        <h2>Token Exchange</h2>
        <p className="auth-callback-description">
          Enter your authorization code to exchange for tokens
        </p>
        
        <form onSubmit={handleSubmit} className="auth-callback-form">
          <div className="form-group">
            <label htmlFor="code">Authorization Code:</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your code"
              disabled={loading}
              className="code-input"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="submit-button"
          >
            {loading ? 'Processing...' : 'Exchange Token'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthCallback;

