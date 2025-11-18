import React from 'react';

function TenantMismatchPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const logoutUrl = searchParams.get('logoutUrl');
  const freshLoginUrl = searchParams.get('freshLoginUrl');

  const handleLogoutAndLogin = () => {
    if (logoutUrl) {
      // Option 1: Use logout URL (recommended - clears session properly)
      // Cognito will automatically redirect to freshLoginUrl after logout
      window.location.href = logoutUrl;
    } else if (freshLoginUrl) {
      // Option 2: Direct login (if logout URL is not available)
      window.location.href = freshLoginUrl;
    } else {
      // Fallback: redirect to home page if no URLs are provided
      window.location.href = '/';
    }
  };

  return (
    <div>
      <h1>Tenant Access Denied</h1>
      <p>You are not authorized to access this tenant. Please log in with the correct tenant account.</p>
      <button onClick={handleLogoutAndLogin} disabled={!logoutUrl && !freshLoginUrl}>
        {logoutUrl || freshLoginUrl ? 'Logout and Login Again' : 'Go to Home'}
      </button>
    </div>
  );
}

export default TenantMismatchPage;

