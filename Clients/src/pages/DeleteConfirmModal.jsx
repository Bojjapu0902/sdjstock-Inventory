import React, { useState } from 'react';
import './DeleteConfirmModal.css';
import { MdClose, MdDeleteForever } from 'react-icons/md';

const DeleteConfirmModal = ({ title, message, onConfirm, onClose }) => {
  const [deleting, setDeleting] = useState(false);

  const confirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
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
