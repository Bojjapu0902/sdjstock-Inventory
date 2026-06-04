import './Settings.css';
import React, { useState } from 'react';
import { MdSave, MdBusiness, MdNotifications, MdSecurity, MdStorage } from 'react-icons/md';

const SettingsSection = ({ icon, title, children }) => (
  <div className="fsp-card" style={{ marginBottom: 16 }}>
    <div className="fsp-card-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 20, color: 'var(--primary)' }}>{icon}</div>
        <div className="fsp-card-title">{title}</div>
      </div>
    </div>
    <div className="fsp-card-body">
      {children}
    </div>
  </div>
);

const ToggleSwitch = ({ checked, onChange, label, desc }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
    <div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
      {desc && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>}
    </div>
    <div
      onClick={onChange}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? 'var(--primary)' : 'var(--border-color)',
        cursor: 'pointer', position: 'relative', transition: 'var(--transition)', flexShrink: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: 'white',
        position: 'absolute', top: 3, transition: 'var(--transition)',
        left: checked ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  </div>
);

const Settings = () => {
  const [biz, setBiz] = useState({ name: 'SDJ MARINE PVT. LTD Demo', email: 'admin@foodstock.io', currency: 'INR', timezone: 'Asia/Kolkata' });
  const [notifs, setNotifs] = useState({ lowStock: true, expiry: true, po: true, wastage: false });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p>Configure system preferences, notifications, and integrations</p>
        </div>
        <button className="btn-primary-fsp" onClick={handleSave}>
          <MdSave /> {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div style={{ maxWidth: 720 }}>
        <SettingsSection icon={<MdBusiness />} title="Business Information">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="fsp-label">Business Name</label>
              <input className="fsp-input" value={biz.name}
                onChange={(e) => setBiz((b) => ({ ...b, name: e.target.value }))} />
            </div>
            <div>
              <label className="fsp-label">Admin Email</label>
              <input className="fsp-input" type="email" value={biz.email}
                onChange={(e) => setBiz((b) => ({ ...b, email: e.target.value }))} />
            </div>
            <div>
              <label className="fsp-label">Currency</label>
              <select className="fsp-select" value={biz.currency}
                onChange={(e) => setBiz((b) => ({ ...b, currency: e.target.value }))}>
                {['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'INR'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="fsp-label">Timezone</label>
              <select className="fsp-select" value={biz.timezone}
                onChange={(e) => setBiz((b) => ({ ...b, timezone: e.target.value }))}>
                {['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Asia/Kolkata'].map((tz) => <option key={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection icon={<MdNotifications />} title="Notification Preferences">
          <ToggleSwitch checked={notifs.lowStock} onChange={() => setNotifs((n) => ({ ...n, lowStock: !n.lowStock }))}
            label="Low Stock Alerts" desc="Get notified when any item falls below its minimum threshold" />
          <ToggleSwitch checked={notifs.expiry} onChange={() => setNotifs((n) => ({ ...n, expiry: !n.expiry }))}
            label="Expiry Warnings" desc="Receive alerts 7 days before items expire" />
          <ToggleSwitch checked={notifs.po} onChange={() => setNotifs((n) => ({ ...n, po: !n.po }))}
            label="Purchase Order Updates" desc="Notify when PO status changes (dispatched, delivered, etc.)" />
          <ToggleSwitch checked={notifs.wastage} onChange={() => setNotifs((n) => ({ ...n, wastage: !n.wastage }))}
            label="Weekly Wastage Report" desc="Receive a weekly summary of wastage cost and trends" />
        </SettingsSection>

        <SettingsSection icon={<MdStorage />} title="Inventory Defaults">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
            <div>
              <label className="fsp-label">Default Low Stock Threshold (%)</label>
              <input className="fsp-input" type="number" defaultValue={25} min={5} max={50} />
            </div>
            <div>
              <label className="fsp-label">Expiry Warning Lead Time (days)</label>
              <input className="fsp-input" type="number" defaultValue={7} min={1} max={30} />
            </div>
            <div>
              <label className="fsp-label">Default Wastage Logger</label>
              <input className="fsp-input" defaultValue="Admin User" />
            </div>
            <div>
              <label className="fsp-label">Items Per Page (Tables)</label>
              <select className="fsp-select" defaultValue="10">
                {['10', '20', '50', '100'].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection icon={<MdSecurity />} title="Security">
          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label className="fsp-label">Current Password</label>
              <input className="fsp-input" type="password" placeholder="••••••••" />
            </div>
            <div>
              <label className="fsp-label">New Password</label>
              <input className="fsp-input" type="password" placeholder="••••••••" />
            </div>
            <div>
              <label className="fsp-label">Confirm New Password</label>
              <input className="fsp-input" type="password" placeholder="••••••••" />
            </div>
            <div>
              <button className="btn-secondary-fsp" style={{ width: 'fit-content' }}>Update Password</button>
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
};

export default Settings;
