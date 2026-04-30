import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, danger = false }) => {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="glass-card confirm-modal" style={{ padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: danger ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={24} color={danger ? '#ef4444' : 'var(--accent-primary)'} />
          </div>
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
