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
    // fetch code_verifier in Session Storage
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
    if (!codeVerifier) {
      setError('Code verifier not found');
      return;
    }
    

    setLoading(true);
    setError('');

    try {
      let response;
      try {
        response = await fetch('https://2052tlcei8.execute-api.us-east-1.amazonaws.com/auth/exchange-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-host': window.location.host,
          },
          credentials: 'include', // Important: This allows cookies to be sent/received
          body: JSON.stringify({ code: code.trim() , code_verifier: codeVerifier }),
          redirect: 'manual', // Use 'manual' to intercept 302 redirects
        });
      } catch (fetchError) {
        // Check if it's a CORS error
        if (fetchError.message.includes('Failed to fetch') || fetchError.name === 'TypeError') {
          throw new Error('CORS Error: The API Gateway endpoint needs to be configured to allow requests from localhost:3000. Please ensure the backend has CORS headers configured (Access-Control-Allow-Origin, Access-Control-Allow-Credentials).');
        }
        throw fetchError;
      }

      // Log response details for debugging
      console.log('=== Response Details ===');
      console.log('response.type:', response.type);
      console.log('response.status:', response.status);
      console.log('response.statusText:', response.statusText);
      console.log('response.ok:', response.ok);
      console.log('response.url:', response.url);
      console.log('response.redirected:', response.redirected);
      
      // Try to log headers (may not be accessible for opaque responses)
      try {
        console.log('response.headers:', response.headers);
        console.log('Location header:', response.headers.get('Location'));
        // Log all headers
        const headersObj = {};
        response.headers.forEach((value, key) => {
          headersObj[key] = value;
        });
        console.log('All headers:', headersObj);
      } catch (headerError) {
        console.log('Cannot access headers:', headerError.message);
      }

      // Possible response.type values:
      // - "basic": Standard same-origin response
      // - "cors": Valid CORS response (most common for cross-origin with CORS headers)
      // - "error": Network error occurred
      // - "opaque": Opaque response (for no-cors requests, cannot read body/headers)
      // - "opaqueredirect": Opaque redirect (when redirect: 'manual' and it's a redirect, cannot read body/headers)

      // Check for tenant mismatch - handle both 302 (redirect) and 401 (unauthorized) status codes
      // Note: Status code doesn't affect header accessibility - CORS configuration does
      if (response.status === 302 || response.status === 401 || response.type === 'opaqueredirect') {
        console.log(`${response.status} or opaqueredirect detected - handling tenant mismatch`);
        
        // Try to read from response body first (for 401 with JSON body - more reliable)
        if (response.status === 401 && response.type !== 'opaqueredirect') {
          try {
            const responseData = await response.json();
            console.log('Response body data:', responseData);
            const logoutUrl = responseData.logoutUrl;

            if (logoutUrl) {
              console.log('Found URLs in response body');
              navigate(`/auth/tenant-mismatch?logoutUrl=${encodeURIComponent(logoutUrl)}`);
              // navigate(`/auth/tenant-mismatch?freshLoginUrl=${encodeURIComponent(freshLoginUrl)}`);
              return;
            }
          } catch (bodyError) {
            console.log('Could not parse response body:', bodyError);
            // Continue to try Location header approach
          }
        }

        // Try to read from Location header (for 302 redirects)
        // Note: This requires Access-Control-Expose-Headers: Location in CORS config
        if ((response.status === 302 || response.status === 401) && response.type !== 'opaqueredirect') {
          try {
            console.log('Response type is NOT opaqueredirect, attempting to read headers');
            // Extract logoutUrl and freshLoginUrl from Location header query string
            const locationHeader = response.headers.get('Location');
            console.log('Location header value:', locationHeader);
            if (locationHeader) {
              try {
                console.log('Parsing Location header:', locationHeader);
                // Parse the URL to extract query parameters
                const locationUrl = new URL(locationHeader);
                const logoutUrl = locationUrl.searchParams.get('logoutUrl');
                const freshLoginUrl = locationUrl.searchParams.get('freshLoginUrl');

                if (logoutUrl && freshLoginUrl) {
                  console.log('Found URLs in Location header');
                  // navigate(`/auth/tenant-mismatch?logoutUrl=${encodeURIComponent(logoutUrl)}&freshLoginUrl=${encodeURIComponent(freshLoginUrl)}`);
                  navigate(`/auth/tenant-mismatch?freshLoginUrl=${encodeURIComponent(freshLoginUrl)}`);
                  return;
                }
              } catch (urlParseError) {
                console.log('URL parsing error:', urlParseError);
                // If URL parsing fails, try parsing as relative URL or extract query string manually
                const queryString = locationHeader.includes('?') ? locationHeader.split('?')[1] : '';
                console.log('Extracted query string:', queryString);
                if (queryString) {
                  const params = new URLSearchParams(queryString);
                  const logoutUrl = params.get('logoutUrl');
                  const freshLoginUrl = params.get('freshLoginUrl');
                  console.log('Extracted logoutUrl:', logoutUrl);
                  console.log('Extracted freshLoginUrl:', freshLoginUrl);

                  if (logoutUrl && freshLoginUrl) {
                    // navigate(`/auth/tenant-mismatch?logoutUrl=${encodeURIComponent(logoutUrl)}&freshLoginUrl=${encodeURIComponent(freshLoginUrl)}`);
                    navigate(`/auth/tenant-mismatch?freshLoginUrl=${encodeURIComponent(freshLoginUrl)}`);
                    return;
                  }
                }
              }
            } else {
              console.log('No Location header found');
            }
          } catch (headerError) {
            // Headers might not be accessible
            console.log('Error accessing headers:', headerError);
          }
        } else if (response.type === 'opaqueredirect') {
          console.log('Response type is opaqueredirect - cannot read headers/body');
        }
        
        // Fallback: redirect to tenant mismatch page without URLs
        // The page will handle the case where URLs are missing
        console.log('Redirecting to tenant mismatch page (fallback)');
        navigate('/auth/tenant-mismatch');
        return;
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
          Enter your authorization code to exchange for tokens XXX
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

