import React from 'react';
import './CustomLoginPage.css';

// PKCE utility functions
async function generateCodeVerifier() {
  // Generate a random string of 43-128 characters (URL-safe)
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  // Convert to base64url (URL-safe base64)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier) {
  // SHA-256 hash the verifier
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  // Base64-URL encode the hash
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function CustomLoginPage() {
  const handleLogin = async () => {
    try {
      // Step 1: Generate code_verifier
      const codeVerifier = await generateCodeVerifier();
      console.log('Generated code_verifier:', codeVerifier);

      // Step 2: Derive code_challenge
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      console.log('Generated code_challenge:', codeChallenge);

      // Step 3: Store code_verifier in Session Storage
      sessionStorage.setItem('pkce_code_verifier', codeVerifier);
      console.log('Stored code_verifier in sessionStorage');

      // Step 4: Build Cognito OAuth URL with PKCE parameters
      const cognitoDomain = process.env.REACT_APP_COGNITO_DOMAIN;
      const clientId = process.env.REACT_APP_COGNITO_CLIENT_ID;
      
      if (!cognitoDomain || !clientId) {
        throw new Error('Cognito configuration missing. Please set REACT_APP_COGNITO_DOMAIN and REACT_APP_COGNITO_CLIENT_ID in your .env file.');
      }
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
      const responseType = 'code';
      const scope = 'openid email profile';
      
      // Build the authorization URL with PKCE parameters
      const authUrl = `https://${cognitoDomain}/oauth2/authorize?` +
        `client_id=${clientId}&` +
        `response_type=${responseType}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `redirect_uri=${redirectUri}&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=S256`;

      console.log('Redirecting to Cognito:', authUrl);

      // Step 5: Redirect to Cognito
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error during login:', error);
      alert('An error occurred during login. Please try again.');
    }
  };

  return (
    <div className="custom-login-container">
      <div className="custom-login-card">
        <h2>Login</h2>
        <p className="custom-login-description">
          Click the button below to login with Cognito
        </p>
        <button
          onClick={handleLogin}
          className="custom-login-button"
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default CustomLoginPage;

