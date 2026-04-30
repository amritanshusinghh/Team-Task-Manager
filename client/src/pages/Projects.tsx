import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Plus, Users, LayoutList, Eye, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

interface Member { _id: string; name: string; email: string; }
interface Project { _id: string; name: string; description: string; priority: string; owner: { _id: string; name: string; email: string }; members: Member[]; }

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({ name: '', description: '', priority: 'MEDIUM' });
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [error, setError] = useState('');

  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const fetchProjects = async () => { try { const res = await api.get('/projects'); setProjects(res.data); } catch {  } finally { setLoading(false); } };
  const fetchMembers = async () => { if (user?.role !== 'ADMIN') return; try { const res = await api.get('/users/members'); setAllMembers(res.data); } catch {  } };

  useEffect(() => { fetchProjects(); fetchMembers(); }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try { await api.post('/projects', newProject); setShowCreateModal(false); setNewProject({ name: '', description: '', priority: 'MEDIUM' }); fetchProjects(); }
    catch (err: any) { setError(err.response?.data?.error || 'Failed to create project.'); }
  };

  const handleAddMember = async (projectId: string) => {
    setError('');
    if (!selectedMemberId) { setError('Please select a member.'); return; }
    try { await api.post(`/projects/${projectId}/members`, { userId: selectedMemberId }); setShowAddMemberModal(null); setSelectedMemberId(''); fetchProjects(); }
    catch (err: any) { setError(err.response?.data?.error || 'Failed to add member.'); }
  };

  const handleRemoveMember = (projectId: string, userId: string, memberName: string) => {
    setConfirmAction({
      title: 'Remove Member',
      message: `Remove "${memberName}" from this project? Their tasks will be unassigned.`,
      onConfirm: async () => {
        try { await api.delete(`/projects/${projectId}/members/${userId}`); fetchProjects(); }
        catch (err: any) { alert(err.response?.data?.error || 'Failed'); }
        setConfirmAction(null);
      }
    });
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    setConfirmAction({
      title: 'Delete Project',
      message: `Are you sure you want to delete "${projectName}" and ALL its tasks? This action cannot be undone.`,
      onConfirm: async () => {
        try { await api.delete(`/projects/${projectId}`); fetchProjects(); }
        catch (err: any) { alert(err.response?.data?.error || 'Failed'); }
        setConfirmAction(null);
      }
    });
  };

  const handlePriorityChange = async (projectId: string, priority: string) => {
    try { await api.patch(`/projects/${projectId}`, { priority }); fetchProjects(); }
    catch (err: any) { alert(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><div className="spinner"></div></div>;

  return (
    <div>
      <header className="topbar">
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Projects</h1>
          <p style={{ color: 'var(--text-muted)' }}>{user?.role === 'ADMIN' ? 'Manage projects, members, and tasks' : 'Projects you are a member of'}</p>
        </div>
        {user?.role === 'ADMIN' && <button className="btn btn-primary" onClick={() => { setShowCreateModal(true); setError(''); }}><Plus size={18} /> New Project</button>}
      </header>

      {projects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <LayoutList size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>{user?.role === 'ADMIN' ? 'No projects yet. Create one!' : 'You have not been added to any projects yet.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {projects.map(project => (
            <div key={project._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', borderLeft: `4px solid var(--priority-${(project.priority || 'MEDIUM').toLowerCase()})` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0 }}>{project.name}</h3>
                {user?.role === 'ADMIN' && (
                  <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                    <select value={project.priority || 'MEDIUM'} onChange={(e) => handlePriorityChange(project._id, e.target.value)} className="form-input" style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', width: 'auto', minWidth: '80px' }}>
                      {VALID_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProject(project._id, project.name)} title="Delete project"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
              {user?.role !== 'ADMIN' && <span className={`badge priority-${project.priority || 'MEDIUM'}`} style={{ alignSelf: 'flex-start', marginBottom: '0.5rem' }}>{project.priority || 'MEDIUM'}</span>}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.4, marginBottom: '1rem' }}>{project.description || 'No description provided.'}</p>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Members ({project.members?.length || 0})</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {project.members?.map(m => (
                    <span key={m._id} className="badge badge-IN_PROGRESS" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      {m.name}
                      {user?.role === 'ADMIN' && <span style={{ cursor: 'pointer', marginLeft: '0.2rem', fontWeight: 700 }} onClick={() => handleRemoveMember(project._id, m._id, m.name)}>×</span>}
                    </span>
                  ))}
                  {(!project.members || project.members.length === 0) && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No members yet</span>}
                </div>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                {user?.role === 'ADMIN' && <button className="btn btn-secondary btn-sm" onClick={() => { setShowAddMemberModal(project._id); setSelectedMemberId(''); setError(''); }}><Users size={14} /> Add Member</button>}
                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/projects/${project._id}`)}><Eye size={14} /> View Tasks</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      {showCreateModal && (
        <div className="modal-overlay"><div className="glass-card modal-content">
          <h2 style={{ marginBottom: '1.5rem' }}>Create Project</h2>
          {error && <div style={{ padding: '0.6rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5', marginBottom: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>{error}</div>}
          <form onSubmit={handleCreateProject}>
            <div className="form-group"><label className="form-label">Project Name *</label><input type="text" className="form-input" placeholder="e.g., Website Redesign" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} required minLength={2} /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" placeholder="Optional..." value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} rows={3} /></div>
            <div className="form-group"><label className="form-label">Priority</label><select className="form-input" value={newProject.priority} onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}>{VALID_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create</button>
            </div>
          </form>
        </div></div>
      )}

      {}
      {showAddMemberModal && (
        <div className="modal-overlay"><div className="glass-card modal-content">
          <h2 style={{ marginBottom: '1.5rem' }}>Add Member</h2>
          {error && <div style={{ padding: '0.6rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5', marginBottom: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>{error}</div>}
          <div className="form-group"><label className="form-label">Select Member</label><select className="form-input" value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}><option value="">-- Select --</option>{allMembers.map(m => <option key={m._id} value={m._id}>{m.name} ({m.email})</option>)}</select></div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddMemberModal(null)}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleAddMember(showAddMemberModal)}>Add</button>
          </div>
        </div></div>
      )}

      {}
      {confirmAction && <ConfirmModal title={confirmAction.title} message={confirmAction.message} onConfirm={confirmAction.onConfirm} onCancel={() => setConfirmAction(null)} danger confirmLabel="Delete" />}
    </div>
  );
};

export default Projects;
