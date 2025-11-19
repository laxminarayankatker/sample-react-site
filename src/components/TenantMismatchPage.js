import React from 'react';

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

function TenantMismatchPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const logoutUrl = searchParams.get('logoutUrl');
  const freshLoginUrl = searchParams.get('freshLoginUrl');

  const handleLogoutAndLogin = async () => {
    if (logoutUrl) {
      // Option 1: Use logout URL (recommended - clears session properly)
      // Cognito will automatically redirect to freshLoginUrl after logout
      window.location.href = logoutUrl;
    } else if (freshLoginUrl) {
      // Option 2: Direct login (if logout URL is not available)
      const codeVerifier = await generateCodeVerifier();
      sessionStorage.setItem('pkce_code_verifier', codeVerifier);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      console.log('Generated code_challenge:', codeChallenge);
      console.log('Generated code_verifier:', codeVerifier);
       // append the codechallenge value tp frshloginurl along wiht code_challenge_method=S256
       const newFreshLoginUrl = `${freshLoginUrl}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
       console.log('New fresh login url:', newFreshLoginUrl);

      // const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
      // const responseType = 'code';
      // const scope = 'openid email profile';
      // const authUrl = `https://${cognitoDomain}/oauth2/authorize?` +
      //   `client_id=${clientId}&` +
      //   `response_type=${responseType}&` +
      //   `scope=${encodeURIComponent(scope)}&` +
      //   `redirect_uri=${redirectUri}&` +
      //   `code_challenge=${codeChallenge}&` +
      //   `code_challenge_method=S256`;
      // window.location.href = authUrl;
      //
      window.location.href = newFreshLoginUrl;
    } else {
      // Fallback: redirect to home page if no URLs are provided
      window.location.href = '/';
    }
  };

  return (
    <div>
      <h1>Tenant Access Denied</h1>
      <p>You are not authorized to access this tenant. Please log in with the correct tenant account.</p>
      <button onClick={handleLogoutAndLogin} disabled={!logoutUrl}>
        {logoutUrl || freshLoginUrl ? 'Logout and Login Again' : 'Go to Home'}
      </button>
    </div>
  );
}

export default TenantMismatchPage;

