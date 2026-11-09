import React from 'react';
import './DemoBanner.css';
import { useAuth } from '../../contexts/AuthContext';
import { resetDemoData } from '../../services/demoSandbox';

/** Shown only to the sandboxed demo user. */
const DemoBanner = () => {
  const { user } = useAuth();
  if (!user?.isDemo) return null;

  const handleReset = () => {
    if (!window.confirm('Reset the demo? Your changes will be discarded and the 10 sample records restored.')) return;
    resetDemoData();
    window.location.reload();
  };

  return (
    <div className="demo-banner" role="status">
      <span className="demo-banner-badge">DEMO</span>
      <span className="demo-banner-text">
        You are signed in as a <strong>User</strong>. You can add and delete items, create projects and assign stock.
        Changes are saved only in this browser and never affect the live data.
      </span>
      <button type="button" className="demo-banner-reset" onClick={handleReset}>Reset demo data</button>
    </div>
  );
};

export default DemoBanner;
