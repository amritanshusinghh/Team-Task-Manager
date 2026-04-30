import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CheckCircle, Shield, User, Briefcase } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginRole, setLoginRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const res = await api.post('/auth/login', { email, password, loginRole });
        login(res.data.token, res.data.user);
        navigate('/');
      } else {
        const res = await api.post('/auth/register', { name, email, password, designation });
        login(res.data.token, res.data.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <CheckCircle size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ textAlign: 'center', margin: 0 }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Team Task Manager</p>
        </div>

        {isLogin && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-input)', borderRadius: '10px', padding: '4px' }}>
            <button type="button" className={loginRole === 'MEMBER' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ flex: 1, padding: '0.6rem', border: loginRole === 'MEMBER' ? 'none' : '1px solid transparent' }} onClick={() => setLoginRole('MEMBER')}>
              <User size={16} /> Member
            </button>
            <button type="button" className={loginRole === 'ADMIN' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ flex: 1, padding: '0.6rem', border: loginRole === 'ADMIN' ? 'none' : '1px solid transparent' }} onClick={() => setLoginRole('ADMIN')}>
              <Shield size={16} /> Admin
            </button>
          </div>
        )}

        {!isLogin && (
          <div style={{ padding: '0.8rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', color: '#93c5fd', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
            Signup is for <strong>Members</strong> only. Admin access is granted manually.
          </div>
        )}

        {error && (
          <div style={{ padding: '0.8rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
              </div>
              <div className="form-group">
                <label className="form-label">Designation / Role</label>
                <input type="text" className="form-input" placeholder="e.g., Frontend Developer" value={designation} onChange={(e) => setDesignation(e.target.value)} />
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div> : (isLogin ? `Sign In as ${loginRole === 'ADMIN' ? 'Admin' : 'Member'}` : 'Sign Up as Member')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 500 }} onClick={() => { setIsLogin(!isLogin); setError(''); }}>{isLogin ? 'Sign up' : 'Sign in'}</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
