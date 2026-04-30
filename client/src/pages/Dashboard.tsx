import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ListTodo, Search, List, LayoutGrid, Users } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = { PROPOSED: 'Proposed', IN_PROGRESS: 'In Progress', NEEDS_REVIEW: 'Needs Review', COMPLETE: 'Complete', ON_HOLD: 'On Hold' };
const STATUSES = ['PROPOSED', 'IN_PROGRESS', 'NEEDS_REVIEW', 'COMPLETE', 'ON_HOLD'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const fmtDate = (d?: string) => { if (!d) return '-'; const dt = new Date(d); return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`; };
const isOverdue = (d?: string) => d ? new Date(d) < new Date() : false;

interface Task { _id: string; title: string; description?: string; notes?: string; status: string; priority: string; dueDate?: string; project: { _id: string; name: string }; assignees: { _id: string; name: string; email: string; designation?: string }[]; }
interface Member { _id: string; name: string; email: string; }

const Dashboard = () => {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [otherTasks, setOtherTasks] = useState<Task[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (assigneeFilter) params.append('assigneeId', assigneeFilter);

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
    } catch (error) { console.error('Failed to fetch tasks', error); }
    finally { setLoading(false); }
  };

  const fetchMembers = async () => {
    if (user?.role !== 'ADMIN') return;
    try { const res = await api.get('/users/members'); setAllMembers(res.data); }
    catch {  }
  };

  useEffect(() => { if (user) { fetchTasks(); fetchMembers(); } }, [user]);
  useEffect(() => { if (user) fetchTasks(); }, [searchQuery, statusFilter, priorityFilter, assigneeFilter]);

  const stats = {
    total: myTasks.length,
    proposed: myTasks.filter(t => t.status === 'PROPOSED').length,
    inProgress: myTasks.filter(t => t.status === 'IN_PROGRESS').length,
    complete: myTasks.filter(t => t.status === 'COMPLETE').length,
    onHold: myTasks.filter(t => t.status === 'ON_HOLD').length,
    overdue: myTasks.filter(t => isOverdue(t.dueDate) && t.status !== 'COMPLETE').length
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try { await api.patch(`/tasks/${taskId}`, { status: newStatus }); fetchTasks(); }
    catch (err: any) { alert(err.response?.data?.error || 'Failed to update status.'); }
  };

  const renderTaskCard = (task: Task, readOnly = false) => (
    <div key={task._id} className="board-task-card" onClick={() => setSelectedTask(task)} style={readOnly ? { opacity: 0.7 } : {}}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span className={`priority-dot priority-dot-${task.priority}`}></span>
        <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{task.title}</span>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
        <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
        <span className={`badge priority-${task.priority}`}>{task.priority}</span>
      </div>
      {task.assignees?.length > 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
          <Users size={12} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
          {task.assignees.map(a => a.name).join(', ')}
        </p>
      )}
      {task.dueDate && (
        <p style={{ fontSize: '0.75rem', marginTop: '0.3rem', color: isOverdue(task.dueDate) && task.status !== 'COMPLETE' ? '#ef4444' : 'var(--text-muted)' }}>
          ETA: {fmtDate(task.dueDate)}{isOverdue(task.dueDate) && task.status !== 'COMPLETE' && ' (Overdue!)'}
        </p>
      )}
    </div>
  );

  const renderTable = (tasks: Task[], readOnly = false) => (
    <div className="glass-panel" style={{ overflow: 'auto', marginBottom: '1.5rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(128,128,128,0.03)' }}>
            <th style={{ padding: '0.8rem 1rem', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Task</th>
            <th style={{ padding: '0.8rem 1rem', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Project</th>
            <th style={{ padding: '0.8rem 1rem', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Assignees</th>
            <th style={{ padding: '0.8rem 1rem', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Priority</th>
            <th style={{ padding: '0.8rem 1rem', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status</th>
            <th style={{ padding: '0.8rem 1rem', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>ETA</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task._id} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', opacity: readOnly ? 0.7 : 1 }} onClick={() => setSelectedTask(task)}>
              <td style={{ padding: '0.8rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`priority-dot priority-dot-${task.priority}`}></span>
                  <span style={{ fontWeight: 500 }}>{task.title}</span>
                </div>
              </td>
              <td style={{ padding: '0.8rem 1rem', color: 'var(--text-muted)' }}>{task.project?.name}</td>
              <td style={{ padding: '0.8rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {task.assignees?.length > 0 ? task.assignees.map(a => a.name).join(', ') : <span style={{ fontStyle: 'italic' }}>Unassigned</span>}
              </td>
              <td style={{ padding: '0.8rem 1rem' }}><span className={`badge priority-${task.priority}`}>{task.priority}</span></td>
              <td style={{ padding: '0.8rem 1rem' }}>
                {!readOnly ? (
                  <select value={task.status} onChange={(e) => { e.stopPropagation(); handleStatusChange(task._id, e.target.value); }} onClick={(e) => e.stopPropagation()} className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 'auto', minWidth: '120px' }}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                ) : <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>}
              </td>
              <td style={{ padding: '0.8rem 1rem', fontSize: '0.85rem' }}>
                {task.dueDate ? <span style={{ color: isOverdue(task.dueDate) && task.status !== 'COMPLETE' ? '#ef4444' : 'inherit' }}>{fmtDate(task.dueDate)}{isOverdue(task.dueDate) && task.status !== 'COMPLETE' && <span style={{ display: 'block', fontSize: '0.7rem' }}>Overdue!</span>}</span> : '-'}
              </td>
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
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Welcome back, <strong>{user?.name}</strong> <span className={`badge ${user?.role === 'ADMIN' ? 'badge-NEEDS_REVIEW' : 'badge-IN_PROGRESS'}`} style={{ marginLeft: '0.5rem' }}>{user?.role}</span></p>
        </div>
        <div className="view-toggle">
          <button className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={14} /> List</button>
          <button className={`view-toggle-btn ${viewMode === 'board' ? 'active' : ''}`} onClick={() => setViewMode('board')}><LayoutGrid size={14} /> Board</button>
        </div>
      </header>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total', value: stats.total, color: 'var(--text-main)' },
          { label: 'Proposed', value: stats.proposed, color: 'var(--status-proposed)' },
          { label: 'In Progress', value: stats.inProgress, color: 'var(--status-in-progress)' },
          { label: 'Complete', value: stats.complete, color: 'var(--status-complete)' },
          { label: 'On Hold', value: stats.onHold, color: 'var(--status-on-hold)' },
          { label: 'Overdue', value: stats.overdue, color: '#ef4444', border: stats.overdue > 0 }
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '1.2rem', borderLeft: s.border ? '4px solid #ef4444' : '' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>{s.label}</span>
            <p style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {}
      <div className="filter-bar">
        <div className="search-wrapper">
          <Search size={14} />
          <input type="text" className="search-input" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select className="form-input" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {user?.role === 'ADMIN' && (
          <select className="form-input" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
            <option value="">All Members</option>
            {allMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
        )}
      </div>

      {}
      <h2 style={{ marginBottom: '1rem' }}>{user?.role === 'ADMIN' ? 'All Tasks' : 'My Tasks'}</h2>
      {myTasks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          <ListTodo size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>{user?.role === 'ADMIN' ? 'No tasks found. Adjust filters or create tasks in Projects.' : 'No tasks assigned to you yet.'}</p>
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
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{selectedTask.title}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedTask(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <span className={`badge badge-${selectedTask.status}`}>{STATUS_LABELS[selectedTask.status]}</span>
              <span className={`badge priority-${selectedTask.priority}`}>{selectedTask.priority} Priority</span>
            </div>
            <div style={{ display: 'grid', gap: '0.8rem' }}>
              <div><label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Project</label><p>{selectedTask.project?.name}</p></div>
              <div><label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Assignees</label><p>{selectedTask.assignees?.length > 0 ? selectedTask.assignees.map(a => a.name).join(', ') : 'Unassigned'}</p></div>
              <div><label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Due Date (ETA)</label>
                <p style={{ color: isOverdue(selectedTask.dueDate) && selectedTask.status !== 'COMPLETE' ? '#ef4444' : 'inherit' }}>
                  {selectedTask.dueDate ? fmtDate(selectedTask.dueDate) : 'Not set'}{isOverdue(selectedTask.dueDate) && selectedTask.status !== 'COMPLETE' && ' — Overdue!'}
                </p>
              </div>
              {selectedTask.description && <div><label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Description</label><p style={{ whiteSpace: 'pre-wrap' }}>{selectedTask.description}</p></div>}
              {selectedTask.notes && <div><label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Notes</label><p style={{ whiteSpace: 'pre-wrap', background: 'var(--bg-input)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem' }}>{selectedTask.notes}</p></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
