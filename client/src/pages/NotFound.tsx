import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, ArrowLeft, Home, Sun, Moon } from 'lucide-react';

const NotFound = () => {
  const { theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-navbar" id="notfound-nav">
        <div className="landing-navbar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <AlertTriangle size={22} color="#f59e0b" />
          <span>EtharaTasks</span>
        </div>
        <div className="landing-navbar-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </nav>

      {/* 404 Content */}
      <section className="landing-hero" id="notfound-section" style={{ justifyContent: 'center' }}>
        {/* Glowing orbs */}
        <div className="hero-orb hero-orb--1" />
        <div className="hero-orb hero-orb--2" />

        <div className="notfound-content">
          <div className="notfound-code">404</div>
          <h1 className="notfound-title">Page Not Found</h1>
          <p className="notfound-description">
            Oops! The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>
          <div className="hero-cta">
            <button className="btn-cta-primary" onClick={() => navigate('/')} id="notfound-home-btn">
              <Home size={16} /> Back to Home
            </button>
            <button className="btn-cta-outline" onClick={() => navigate(-1)} id="notfound-back-btn">
              <ArrowLeft size={16} /> Go Back
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NotFound;
