import React from 'react';
import './StatusBadge.css';

// type: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary'
const StatusBadge = ({ label, type = 'neutral', dot = true }) => (
  <span className={`status-badge ${type}`}>
    {dot && <span className="dot" />}
    {label}
  </span>
);

export default StatusBadge;
