import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Shield, User, ArrowRight, Sun, Moon, ArrowLeft } from 'lucide-react';
import faviconUrl from '../assets/favicon.svg';

const Login = () => {
  const location = useLocation();
  const initialMode = (location.state as any)?.mode === 'register' ? false : true;
  const [isLogin, setIsLogin] = useState(initialMode);
  const [loginRole, setLoginRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const res = await api.post('/auth/login', { email, password, loginRole });
        login(res.data.token, res.data.user);
        navigate('/dashboard');
      } else {
        const res = await api.post('/auth/register', { name, email, password, designation });
        login(res.data.token, res.data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (role: 'ADMIN' | 'MEMBER') => {
    if (role === 'ADMIN') {
      setEmail('admin@test.com');
      setLoginRole('ADMIN');
    } else {
      setEmail('member@test.com');
      setLoginRole('MEMBER');
    }
    setPassword('password123');
    setIsLogin(true);
    setError('');
  };

  return (
    <div className="auth-page">
      {/* Background decorations */}
      <div className="auth-bg-orb auth-bg-orb--1" />
      <div className="auth-bg-orb auth-bg-orb--2" />
      <div className="auth-bg-orb auth-bg-orb--3" />

      {/* Top bar */}
      <div className="auth-topbar">
        <button className="btn-cta-outline" onClick={() => navigate('/')} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} /> Home
        </button>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Main card */}
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <img src={faviconUrl} alt="EtharaTasks" style={{ width: 36, height: 36 }} />
          </div>
          <h1 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="auth-subtitle">
            {isLogin ? 'Sign in to your EtharaTasks workspace' : 'Join your team on EtharaTasks'}
          </p>
        </div>

        {/* Role toggle (login only) */}
        {isLogin && (
          <div className="auth-role-toggle">
            <button
              type="button"
              className={`auth-role-btn ${loginRole === 'MEMBER' ? 'auth-role-btn--active' : ''}`}
              onClick={() => setLoginRole('MEMBER')}
            >
              <User size={15} /> Member
            </button>
            <button
              type="button"
              className={`auth-role-btn ${loginRole === 'ADMIN' ? 'auth-role-btn--active' : ''}`}
              onClick={() => setLoginRole('ADMIN')}
            >
              <Shield size={15} /> Admin
            </button>
          </div>
        )}

        {/* Signup notice */}
        {!isLogin && (
          <div className="auth-notice auth-notice--info">
            Signup is for <strong>Members</strong> only. Admin access is granted manually.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="auth-notice auth-notice--error">{error}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="auth-field">
                <label className="auth-label">Full Name</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Designation / Role</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g., Frontend Developer"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              type="password"
              className="auth-input"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading} id="auth-submit-btn">
            {loading ? (
              <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
            ) : (
              <>
                {isLogin ? `Sign In` : 'Sign Up'} <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
        <p className="auth-toggle-text">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span className="auth-toggle-link" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </span>
        </p>

        {/* Demo Accounts Section */}
        {isLogin && (
          <div className="auth-demo-section">
            <div className="auth-demo-label">Demo Accounts</div>
            <div className="auth-demo-buttons">
              <button
                type="button"
                className="auth-demo-btn auth-demo-btn--admin"
                onClick={() => fillDemoCredentials('ADMIN')}
                id="demo-admin-btn"
              >
                <Shield size={14} /> Admin Demo
              </button>
              <button
                type="button"
                className="auth-demo-btn auth-demo-btn--member"
                onClick={() => fillDemoCredentials('MEMBER')}
                id="demo-member-btn"
              >
                <User size={14} /> Member Demo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
