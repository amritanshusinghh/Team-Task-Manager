import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LayoutDashboard, FolderKanban, LogOut, CheckCircle, Sun, Moon, X, Lock } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(''); setPassErr('');
    try {
      const res = await api.post('/auth/change-password', { oldPassword, newPassword });
      setPassMsg(res.data.message);
      setOldPassword(''); setNewPassword('');
    } catch (err: any) {
      setPassErr(err.response?.data?.error || 'Failed to change password.');
    }
  };

  const handleNavClick = () => {
    onClose(); 
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <CheckCircle size={24} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>EtharaTasks</h3>
        </div>
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {}
          <button className="theme-toggle" onClick={onClose} style={{ display: 'none' }} id="sidebar-close-btn">
            <X size={16} />
          </button>
        </div>
      </div>

      {}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <NavLink to="/" end className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', padding: '0.7rem 1rem' }} onClick={handleNavClick}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', padding: '0.7rem 1rem' }} onClick={handleNavClick}>
          <FolderKanban size={18} /> Projects
        </NavLink>
      </nav>

      {}
      <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
        <button className="profile-btn" onClick={() => setShowProfile(true)}>
          <div className="profile-avatar">{initials}</div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>{user?.name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.designation || user?.role}
            </p>
          </div>
        </button>
      </div>

      {}
      {showProfile && (
        <div className="modal-overlay" onClick={() => { setShowProfile(false); setShowChangePass(false); setPassMsg(''); setPassErr(''); }}>
          <div className="glass-card modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Profile</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => { setShowProfile(false); setShowChangePass(false); setPassMsg(''); setPassErr(''); }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="profile-avatar" style={{ width: 56, height: 56, fontSize: '1.2rem' }}>{initials}</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{user?.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{user?.designation || 'Team Member'}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '0.8rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Email</label>
                <p style={{ fontSize: '0.9rem' }}>{user?.email}</p>
              </div>
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Designation</label>
                <p style={{ fontSize: '0.9rem' }}>{user?.designation || 'Not set'}</p>
              </div>
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Role</label>
                <p style={{ fontSize: '0.9rem' }}>{user?.role}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => { setShowChangePass(!showChangePass); setPassMsg(''); setPassErr(''); }}>
                <Lock size={16} /> Reset Password
              </button>

              {showChangePass && (
                <form onSubmit={handleChangePassword} style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: '8px' }}>
                  {passErr && <p style={{ color: '#fca5a5', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{passErr}</p>}
                  {passMsg && <p style={{ color: '#6ee7b7', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{passMsg}</p>}
                  <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Current Password</label>
                    <input type="password" className="form-input" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required minLength={6} style={{ fontSize: '0.85rem', padding: '0.5rem 0.8rem' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>New Password</label>
                    <input type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} style={{ fontSize: '0.85rem', padding: '0.5rem 0.8rem' }} />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>Update Password</button>
                </form>
              )}

              <button className="btn btn-danger" style={{ justifyContent: 'flex-start' }} onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
