import React, { useState } from 'react';
import './DeleteConfirmModal.css';
import { MdClose, MdDeleteForever } from 'react-icons/md';

const DeleteConfirmModal = ({ title, message, onConfirm, onClose }) => {
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState('');

  const confirm = async () => {
    setDeleting(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message || 'Delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="dcm-backdrop" onClick={onClose} />
      <div className="dcm-modal" role="alertdialog" aria-modal="true">

        <div className="dcm-header">
          <div className="dcm-header-icon">
            <MdDeleteForever />
          </div>
          <button className="dcm-close-btn" onClick={onClose} title="Cancel">
            <MdClose />
          </button>
        </div>

        <div className="dcm-body">
          <div className="dcm-title">{title}</div>
          <div className="dcm-message">{message}</div>
          <div className="dcm-warning">This action cannot be undone.</div>
          {error && (
            <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.25)', color: '#DC2626', fontSize: 12.5, fontWeight: 600 }}>
              ⚠ {error}
            </div>
          )}
        </div>

        <div className="dcm-footer">
          <button className="dcm-btn-cancel" onClick={onClose} disabled={deleting}>
            Cancel
          </button>
          <button className="dcm-btn-delete" onClick={confirm} disabled={deleting}>
            <MdDeleteForever style={{ fontSize: 16 }} />
            {deleting ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>

      </div>
    </>
  );
};

export default DeleteConfirmModal;
