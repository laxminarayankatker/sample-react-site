import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import AuthCallback from './components/AuthCallback';
import Dashboard from './components/Dashboard';
import TenantMismatchPage from './components/TenantMismatchPage';
import CustomLoginPage from './components/CustomLoginPage';

function Home() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <button
          className="App-link login-button"
          onClick={handleLogin}
        >
          Login
        </button>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<CustomLoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/tenant-mismatch" element={<TenantMismatchPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
