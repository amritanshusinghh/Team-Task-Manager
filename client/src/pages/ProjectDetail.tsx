import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowLeft, Plus, Trash2, Users, List, LayoutGrid, Search } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const STATUS_LABELS: Record<string, string> = { PROPOSED: 'Proposed', IN_PROGRESS: 'In Progress', NEEDS_REVIEW: 'Needs Review', COMPLETE: 'Complete', ON_HOLD: 'On Hold' };
const STATUSES = ['PROPOSED', 'IN_PROGRESS', 'NEEDS_REVIEW', 'COMPLETE', 'ON_HOLD'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const fmtDate = (d?: string) => { if (!d) return '-'; const dt = new Date(d); return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`; };
const isOverdue = (d?: string) => d ? new Date(d) < new Date() : false;

interface Member { _id: string; name: string; email: string; }
interface Task { _id: string; title: string; description?: string; notes?: string; status: string; priority: string; dueDate?: string; assignees: Member[]; project: { _id: string; name: string }; }
interface Project { _id: string; name: string; description: string; priority: string; members: Member[]; }

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [otherTasks, setOtherTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const [newTask, setNewTask] = useState({ title: '', description: '', notes: '', dueDate: '', assigneeIds: [] as string[], priority: 'MEDIUM' });
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editAssigneeIds, setEditAssigneeIds] = useState<string[]>([]);

  const fetchProject = async () => { try { const res = await api.get(`/projects/${id}`); setProject(res.data); } catch {  } };

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      params.append('projectId', id!);
      if (searchQuery) params.append('search', searchQuery);

      if (user?.role === 'ADMIN') {
        const res = await api.get(`/tasks?${params.toString()}`);
        setMyTasks(res.data);
        setOtherTasks([]);
      } else {
        const myRes = await api.get(`/tasks?${params.toString()}`);
        setMyTasks(myRes.data);
        const allParams = new URLSearchParams(params);
        allParams.set('includeAll', 'true');
        const allRes = await api.get(`/tasks?${allParams.toString()}`);
        const myIds = new Set(myRes.data.map((t: Task) => t._id));
        setOtherTasks(allRes.data.filter((t: Task) => !myIds.has(t._id)));
      }
    } catch {  }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProject(); fetchTasks(); }, [id]);
  useEffect(() => { fetchTasks(); }, [searchQuery]);

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setEditNotes(task.notes || '');
    setEditStatus(task.status);
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setEditPriority(task.priority);
    setEditAssigneeIds(task.assignees?.map(a => a._id) || []);
  };

  const isMyTask = (task: Task) => {
    if (user?.role === 'ADMIN') return true;
    return task.assignees?.some(a => a._id === user?.id);
  };

  const handleSaveTaskDetails = async () => {
    if (!selectedTask) return;
    try {
      const updates: any = {};
      if (editStatus !== selectedTask.status) updates.status = editStatus;
      if (editNotes !== (selectedTask.notes || '')) updates.notes = editNotes;
      const origDate = selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : '';
      if (editDueDate !== origDate) updates.dueDate = editDueDate || null;
      if (user?.role === 'ADMIN') {
        if (editPriority !== selectedTask.priority) updates.priority = editPriority;
        const origIds = (selectedTask.assignees?.map(a => a._id) || []).sort().join(',');
        const newIds = editAssigneeIds.sort().join(',');
        if (origIds !== newIds) updates.assigneeIds = editAssigneeIds;
      }
      if (Object.keys(updates).length > 0) { await api.patch(`/tasks/${selectedTask._id}`, updates); fetchTasks(); }
      setSelectedTask(null);
    } catch (err: any) { alert(err.response?.data?.error || 'Failed to update task.'); }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/tasks', { title: newTask.title, description: newTask.description, notes: newTask.notes, dueDate: newTask.dueDate || undefined, projectId: id, assigneeIds: newTask.assigneeIds.length > 0 ? newTask.assigneeIds : undefined, priority: newTask.priority });
      setShowCreateTask(false);
      setNewTask({ title: '', description: '', notes: '', dueDate: '', assigneeIds: [], priority: 'MEDIUM' });
      fetchTasks();
    } catch (err: any) { setError(err.response?.data?.error || 'Failed to create task.'); }
  };

  const handleDeleteTask = (taskId: string, title: string) => {
    setConfirmAction({
      title: 'Delete Task',
      message: `Are you sure you want to delete "${title}"? This cannot be undone.`,
      onConfirm: async () => {
        try { await api.delete(`/tasks/${taskId}`); setSelectedTask(null); fetchTasks(); }
        catch (err: any) { alert(err.response?.data?.error || 'Failed'); }
        setConfirmAction(null);
      }
    });
  };

  const toggleAssignee = (list: string[], setList: (v: string[]) => void, memberId: string) => {
    setList(list.includes(memberId) ? list.filter(id => id !== memberId) : [...list, memberId]);
  };

  const renderTaskCard = (task: Task, readOnly = false) => (
    <div key={task._id} className="board-task-card" onClick={() => openTaskDetail(task)} style={readOnly ? { opacity: 0.7 } : {}}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span className={`priority-dot priority-dot-${task.priority}`}></span>
        <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{task.title}</span>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
        <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
        <span className={`badge priority-${task.priority}`}>{task.priority}</span>
      </div>
      {task.assignees?.length > 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.4rem' }}><Users size={12} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />{task.assignees.map(a => a.name).join(', ')}</p>}
      {task.dueDate && <p style={{ fontSize: '0.75rem', marginTop: '0.3rem', color: isOverdue(task.dueDate) && task.status !== 'COMPLETE' ? '#ef4444' : 'var(--text-muted)' }}>ETA: {fmtDate(task.dueDate)}{isOverdue(task.dueDate) && task.status !== 'COMPLETE' && ' (Overdue!)'}</p>}
    </div>
  );

  const renderTable = (tasks: Task[], readOnly = false) => (
    <div className="glass-panel" style={{ overflow: 'auto', marginBottom: '1.5rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
        <thead><tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(128,128,128,0.03)' }}>
          <th style={{ padding: '0.8rem 1rem', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Task</th>
          <th style={{ padding: '0.8rem 1rem', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Assignees</th>
          <th style={{ padding: '0.8rem 1rem', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Priority</th>
          <th style={{ padding: '0.8rem 1rem', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status</th>
          <th style={{ padding: '0.8rem 1rem', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>ETA</th>
          {user?.role === 'ADMIN' && !readOnly && <th style={{ padding: '0.8rem 1rem' }}></th>}
        </tr></thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task._id} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', opacity: readOnly ? 0.7 : 1 }} onClick={() => openTaskDetail(task)}>
              <td style={{ padding: '0.8rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`priority-dot priority-dot-${task.priority}`}></span>
                  <div><span style={{ fontWeight: 500 }}>{task.title}</span>{task.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.1rem' }}>{task.description.substring(0, 60)}{task.description.length > 60 ? '...' : ''}</p>}</div>
                </div>
              </td>
              <td style={{ padding: '0.8rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{task.assignees?.length > 0 ? task.assignees.map(a => a.name).join(', ') : <span style={{ fontStyle: 'italic' }}>Unassigned</span>}</td>
              <td style={{ padding: '0.8rem 1rem' }}><span className={`badge priority-${task.priority}`}>{task.priority}</span></td>
              <td style={{ padding: '0.8rem 1rem' }}><span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span></td>
              <td style={{ padding: '0.8rem 1rem', fontSize: '0.85rem' }}>
                {task.dueDate ? <span style={{ color: isOverdue(task.dueDate) && task.status !== 'COMPLETE' ? '#ef4444' : 'inherit' }}>{fmtDate(task.dueDate)}{isOverdue(task.dueDate) && task.status !== 'COMPLETE' && <span style={{ display: 'block', fontSize: '0.7rem' }}>Overdue!</span>}</span> : '-'}
              </td>
              {user?.role === 'ADMIN' && !readOnly && (
                <td style={{ padding: '0.8rem 1rem' }} onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(task._id, task.title)} title="Delete"><Trash2 size={14} /></button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderBoard = (tasks: Task[], readOnly = false) => (
    <div className="board-grid" style={{ marginBottom: '1.5rem' }}>
      {STATUSES.map(status => {
        const st = tasks.filter(t => t.status === status);
        return (
          <div key={status} className="glass-panel board-column" style={{ padding: 0 }}>
            <div className="board-column-header"><span>{STATUS_LABELS[status]}</span><span className="badge" style={{ background: 'rgba(128,128,128,0.2)', border: 'none' }}>{st.length}</span></div>
            <div style={{ padding: '0.5rem' }}>{st.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>No tasks</p> : st.map(t => renderTaskCard(t, readOnly))}</div>
          </div>
        );
      })}
    </div>
  );

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><div className="spinner"></div></div>;

  return (
    <div>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => navigate('/projects')}><ArrowLeft size={20} /></button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><h1 style={{ margin: 0 }}>{project?.name || 'Project'}</h1>{project?.priority && <span className={`badge priority-${project.priority}`}>{project.priority}</span>}</div>
            <p style={{ color: 'var(--text-muted)' }}>{project?.description || 'Manage tasks'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <div className="view-toggle">
            <button className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={14} /> List</button>
            <button className={`view-toggle-btn ${viewMode === 'board' ? 'active' : ''}`} onClick={() => setViewMode('board')}><LayoutGrid size={14} /> Board</button>
          </div>
          {user?.role === 'ADMIN' && <button className="btn btn-primary" onClick={() => { setShowCreateTask(true); setError(''); }}><Plus size={18} /> New Task</button>}
        </div>
      </header>

      <div className="filter-bar">
        <div className="search-wrapper"><Search size={14} /><input type="text" className="search-input" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
      </div>

      {}
      <h2 style={{ marginBottom: '1rem' }}>{user?.role === 'ADMIN' ? 'All Tasks' : 'My Tasks'}</h2>
      {myTasks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          <p>{searchQuery ? 'No tasks match.' : (user?.role === 'ADMIN' ? 'No tasks yet.' : 'No tasks assigned to you.')}</p>
        </div>
      ) : viewMode === 'list' ? renderTable(myTasks) : renderBoard(myTasks)}

      {}
      {user?.role === 'MEMBER' && otherTasks.length > 0 && (
        <>
          <div className="section-label">Other Members' Tasks (Read Only)</div>
          {viewMode === 'list' ? renderTable(otherTasks, true) : renderBoard(otherTasks, true)}
        </>
      )}

      {}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="glass-card modal-content" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{selectedTask.title}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedTask(null)}>✕</button>
            </div>
            {selectedTask.description && <div style={{ marginBottom: '1.2rem' }}><label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Description</label><p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', marginTop: '0.3rem' }}>{selectedTask.description}</p></div>}

            {isMyTask(selectedTask) ? (
              
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.2rem' }}>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">Status</label>
                  <select className="form-input" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>{STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>
                </div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">Due Date (ETA)</label>
                  <input type="date" className="form-input" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                </div>
                {user?.role === 'ADMIN' && (
                  <>
                    <div className="form-group" style={{ margin: 0 }}><label className="form-label">Priority</label>
                      <select className="form-input" value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}><label className="form-label">Assignees</label>
                      <div className="multi-select">
                        {project?.members.map(m => (
                          <label key={m._id}><input type="checkbox" checked={editAssigneeIds.includes(m._id)} onChange={() => toggleAssignee(editAssigneeIds, setEditAssigneeIds, m._id)} />{m.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({m.email})</span></label>
                        ))}
                        {(!project?.members || project.members.length === 0) && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.5rem' }}>No members</p>}
                      </div>
                    </div>
                  </>
                )}
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">Notes / Details</label>
                  <textarea className="form-input" placeholder="Write notes..." value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={4} />
                </div>
              </div>
            ) : (
              
              <div style={{ display: 'grid', gap: '0.8rem', marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}><span className={`badge badge-${selectedTask.status}`}>{STATUS_LABELS[selectedTask.status]}</span><span className={`badge priority-${selectedTask.priority}`}>{selectedTask.priority}</span></div>
                <div><label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Assignees</label><p>{selectedTask.assignees?.length > 0 ? selectedTask.assignees.map(a => a.name).join(', ') : 'Unassigned'}</p></div>
                <div><label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>ETA</label><p>{selectedTask.dueDate ? fmtDate(selectedTask.dueDate) : 'Not set'}</p></div>
                {selectedTask.notes && <div><label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Notes</label><p style={{ whiteSpace: 'pre-wrap', background: 'var(--bg-input)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem' }}>{selectedTask.notes}</p></div>}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
              {user?.role === 'ADMIN' && <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(selectedTask._id, selectedTask.title)}><Trash2 size={14} /> Delete</button>}
              <div style={{ flex: 1 }}></div>
              <button className="btn btn-secondary" onClick={() => setSelectedTask(null)}>Cancel</button>
              {isMyTask(selectedTask) && <button className="btn btn-primary" onClick={handleSaveTaskDetails}>Save</button>}
            </div>
          </div>
        </div>
      )}

      {}
      {showCreateTask && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxWidth: '480px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Create Task</h2>
            {error && <div style={{ padding: '0.6rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5', marginBottom: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>{error}</div>}
            <form onSubmit={handleCreateTask}>
              <div className="form-group"><label className="form-label">Task Title *</label><input type="text" className="form-input" placeholder="e.g., Implement login" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} required minLength={2} /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" placeholder="What is this task about?" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} rows={2} /></div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" placeholder="Additional details..." value={newTask.notes} onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })} rows={2} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">Priority</label><select className="form-input" value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Due Date (ETA)</label><input type="date" className="form-input" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="form-label">Assign To (select multiple)</label>
                <div className="multi-select">
                  {project?.members.map(m => (
                    <label key={m._id}><input type="checkbox" checked={newTask.assigneeIds.includes(m._id)} onChange={() => toggleAssignee(newTask.assigneeIds, (ids) => setNewTask({ ...newTask, assigneeIds: ids }), m._id)} />{m.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({m.email})</span></label>
                  ))}
                  {(!project?.members || project.members.length === 0) && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.5rem' }}>Add members to the project first</p>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateTask(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {confirmAction && <ConfirmModal title={confirmAction.title} message={confirmAction.message} onConfirm={confirmAction.onConfirm} onCancel={() => setConfirmAction(null)} danger confirmLabel="Delete" />}
    </div>
  );
};

export default ProjectDetail;
