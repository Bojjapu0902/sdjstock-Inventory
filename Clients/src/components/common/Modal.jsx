import React, { useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import './Modal.css';

const Modal = ({ show, onClose, title, children, footer, size = 'md' }) => {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (show) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [show, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (show) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  if (!show) return null;

  const sizeMap = { sm: '400px', md: '560px', lg: '760px', xl: '960px' };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-dialog" style={{ maxWidth: sizeMap[size] || sizeMap.md }}>
        <div className="modal-header">
          <h5>{title}</h5>
          <button className="modal-close-btn" onClick={onClose}><MdClose /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
