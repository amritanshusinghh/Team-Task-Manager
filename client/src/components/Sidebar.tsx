import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LayoutDashboard, FolderKanban, LogOut, Sun, Moon, X, Lock } from 'lucide-react';
import faviconUrl from '../assets/favicon.svg';

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
    navigate('/');
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

  const closeProfile = () => {
    setShowProfile(false);
    setShowChangePass(false);
    setPassMsg('');
    setPassErr('');
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <div className="sidebar-logo" onClick={() => navigate('/')}>
            <img src={faviconUrl} alt="EtharaTasks" className="sidebar-logo-img" />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>EtharaTasks</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <NavLink to="/dashboard" end className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', padding: '0.7rem 1rem' }} onClick={handleNavClick}>
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
      </aside>

      {/* ── Profile Modal (rendered outside sidebar, centered on screen) ── */}
      {showProfile && (
        <div className="profile-modal-overlay" onClick={closeProfile}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="profile-modal-header">
              <h2>Profile</h2>
              <button className="btn btn-secondary btn-sm" onClick={closeProfile}>
                <X size={16} />
              </button>
            </div>

            {/* Avatar + Name */}
            <div className="profile-modal-identity">
              <div className="profile-modal-avatar">{initials}</div>
              <div>
                <h3>{user?.name}</h3>
                <p>{user?.designation || 'Team Member'}</p>
              </div>
            </div>

            {/* Info grid */}
            <div className="profile-modal-info">
              <div className="profile-modal-field">
                <label>Email</label>
                <p>{user?.email}</p>
              </div>
              <div className="profile-modal-field">
                <label>Designation</label>
                <p>{user?.designation || 'Not set'}</p>
              </div>
              <div className="profile-modal-field">
                <label>Role</label>
                <span className={`badge ${user?.role === 'ADMIN' ? 'badge-NEEDS_REVIEW' : 'badge-IN_PROGRESS'}`}>{user?.role}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="profile-modal-actions">
              <button className="btn btn-secondary" onClick={() => { setShowChangePass(!showChangePass); setPassMsg(''); setPassErr(''); }}>
                <Lock size={16} /> Change Password
              </button>

              {showChangePass && (
                <form onSubmit={handleChangePassword} className="profile-change-pass-form">
                  {passErr && <p className="profile-pass-error">{passErr}</p>}
                  {passMsg && <p className="profile-pass-success">{passMsg}</p>}
                  <div className="auth-field">
                    <label className="auth-label">Current Password</label>
                    <input type="password" className="auth-input" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required minLength={6} />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">New Password</label>
                    <input type="password" className="auth-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                  </div>
                  <button type="submit" className="auth-submit-btn" style={{ padding: '0.6rem' }}>Update Password</button>
                </form>
              )}

              <button className="btn btn-danger" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
