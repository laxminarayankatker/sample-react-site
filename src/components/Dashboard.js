import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('https://b1vxqylf5h.execute-api.us-east-1.amazonaws.com/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: This sends cookies (id_token, access_token, refresh_token)
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Unauthorized: Please login again');
        }
        throw new Error(`Failed to load dashboard: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      // Check if it's a CORS error
      if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
        setError('CORS Error: The dashboard endpoint needs to be configured to allow requests from localhost:3000. Please ensure the backend has CORS headers configured.');
      } else {
        setError(err.message || 'Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear any local state if needed
    navigate('/');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-button">
            Retry
          </button>
          <button onClick={handleLogout} className="logout-button">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-data">
          <h2>Dashboard Data</h2>
          <pre className="dashboard-json">
            {JSON.stringify(dashboardData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

