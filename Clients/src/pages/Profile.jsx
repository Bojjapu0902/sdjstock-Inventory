import './Profile.css';
import React, { useState, useEffect } from 'react';
import {
  MdPerson, MdEdit, MdSave, MdClose,
  MdEmail, MdPhone, MdBadge, MdShield,
  MdCalendarToday, MdAdminPanelSettings,
  MdVisibility, MdVisibilityOff, MdLock,
  MdCheckCircle, MdError,
} from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { changePassword } from '../services/loginDb';

/* ── Toast ─────────────────────────────────────────────── */
const Toast = ({ msg, type, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`profile-toast ${type}`}>
      {type === 'success'
        ? <MdCheckCircle style={{ fontSize: 20, color: '#10B981', flexShrink: 0 }} />
        : <MdError       style={{ fontSize: 20, color: '#EF4444', flexShrink: 0 }} />}
      {msg}
    </div>
  );
};

/* ── Password strength helper ────────────────────────────── */
function pwStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  const score =
    (pw.length >= 6        ? 1 : 0) +
    (/[A-Z]/.test(pw)      ? 1 : 0) +
    (/\d/.test(pw)         ? 1 : 0) +
    (/[^a-zA-Z0-9]/.test(pw) ? 1 : 0);
  const map = [
    null,
    { label: 'Weak',   color: '#EF4444' },
    { label: 'Fair',   color: '#F59E0B' },
    { label: 'Good',   color: '#3B82F6' },
    { label: 'Strong', color: '#10B981' },
  ];
  return { score, ...map[score] };
}

/* ════════════════════════════════════════════════════════
   PROFILE PAGE
   ════════════════════════════════════════════════════════ */
const Profile = () => {
  const { user, login } = useAuth();

  /* ── Personal info state ── */
  const [info, setInfo]       = useState({ name: '', email: '', phone: '' });
  const [editInfo, setEditInfo] = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);

  /* ── Password state ── */
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);

  /* ── Toast ── */
  const [toast, setToast] = useState(null);

  /* seed form from session user */
  useEffect(() => {
    if (user) {
      setInfo({
        name:  user.name  || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  /* ── Save personal info ── */
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!info.name.trim()) { showToast('Name cannot be empty.', 'error'); return; }
    setInfoLoading(true);
    try {
      const updated = await api.put(`/users/${user.id}`, {
        name:  info.name.trim(),
        email: info.email.trim(),
        phone: info.phone.trim(),
      });
      /* update session so header/sidebar reflects new name */
      login({ ...user, name: updated.name, email: updated.email, phone: updated.phone });
      setEditInfo(false);
      showToast('Profile updated successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setInfoLoading(false);
    }
  };

  /* ── Change password ── */
  const handleChangePw = async (e) => {
    e.preventDefault();
    if (!pw.current)                  { showToast('Enter your current password.', 'error'); return; }
    if (pw.newPw.length < 6)          { showToast('New password must be at least 6 characters.', 'error'); return; }
    if (pw.newPw !== pw.confirm)      { showToast('New passwords do not match.', 'error'); return; }
    if (pw.current === pw.newPw)      { showToast('New password must differ from the current one.', 'error'); return; }
    setPwLoading(true);
    try {
      await changePassword(pw.current, pw.newPw);
      setPw({ current: '', newPw: '', confirm: '' });
      showToast('Password changed successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setPwLoading(false);
    }
  };

  const strength = pwStrength(pw.newPw);
  const initials = (user?.name || user?.username || 'AU').slice(0, 2).toUpperCase();
  const isAdmin  = user?.role === 'Admin';

  const accountDetails = [
    { icon: <MdBadge />,              label: 'User ID',   value: user?.id       || '—' },
    { icon: <MdPerson />,             label: 'Username',  value: user?.username || '—' },
    { icon: <MdShield />,             label: 'Role',      value: user?.role     || '—' },
    { icon: <MdCalendarToday />,      label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
    { icon: <MdEmail />,              label: 'Email',     value: user?.email || 'Not set' },
    { icon: <MdPhone />,              label: 'Phone',     value: user?.phone || 'Not set' },
  ];

  return (
    <div>
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}

      {/* ── Page header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Profile</h1>
          <p>Manage your personal information and account security</p>
        </div>
      </div>

      {/* ── Hero card ── */}
      <div className="profile-hero">
        {/* background orbs */}
        <div className="profile-hero-orb" style={{ width: 300, height: 300, top: -100, left: -80, background: 'radial-gradient(circle, rgba(129,140,248,0.1), transparent 70%)' }} />
        <div className="profile-hero-orb" style={{ width: 200, height: 200, bottom: -60, right: 200, background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)' }} />

        {/* Avatar */}
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-avatar-edit" title="Change photo">
            <MdEdit style={{ fontSize: 13 }} />
          </div>
        </div>

        {/* Name / role */}
        <div className="profile-hero-info">
          <div className="profile-hero-name">{user?.name || user?.username || 'User'}</div>
          <div className="profile-hero-username">@{user?.username}</div>
          <div className="profile-hero-badges">
            <span className={`profile-role-badge ${isAdmin ? 'admin' : 'user'}`}>
              {isAdmin ? <MdAdminPanelSettings style={{ fontSize: 13 }} /> : <MdPerson style={{ fontSize: 13 }} />}
              {user?.role || 'User'}
            </span>
            <span className="profile-status-badge">
              <span className="profile-status-dot" />
              Active Session
            </span>
          </div>
        </div>

        {/* Meta tiles */}
        <div className="profile-hero-meta">
          <div className="profile-meta-item">
            <span className="profile-meta-icon">🪪</span>
            <div>
              <div className="profile-meta-label">User ID</div>
              <div className="profile-meta-value">{user?.id || '—'}</div>
            </div>
          </div>
          <div className="profile-meta-item">
            <span className="profile-meta-icon">📅</span>
            <div>
              <div className="profile-meta-label">Member Since</div>
              <div className="profile-meta-value">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—'}
              </div>
            </div>
          </div>
          <div className="profile-meta-item">
            <span className="profile-meta-icon">🔐</span>
            <div>
              <div className="profile-meta-label">Access Level</div>
              <div className="profile-meta-value">{user?.role || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column grid ── */}
      <div className="profile-grid">

        {/* ── Personal Information ── */}
        <div className="fsp-card">
          <div className="fsp-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MdPerson style={{ fontSize: 20, color: 'var(--primary)' }} />
              <div className="fsp-card-title">Personal Information</div>
            </div>
            {!editInfo && (
              <button
                onClick={() => setEditInfo(true)}
                className="btn-secondary-fsp"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 12.5 }}
              >
                <MdEdit style={{ fontSize: 15 }} /> Edit
              </button>
            )}
          </div>

          <div className="fsp-card-body">
            {editInfo ? (
              <form onSubmit={handleSaveInfo} noValidate>
                <div className="profile-form-row" style={{ marginBottom: 16 }}>
                  <div className="profile-field profile-field-full">
                    <label className="fsp-label">Full Name *</label>
                    <input
                      className="fsp-input"
                      value={info.name}
                      onChange={(e) => setInfo(s => ({ ...s, name: e.target.value }))}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="profile-field">
                    <label className="fsp-label">Email Address</label>
                    <input
                      className="fsp-input"
                      type="email"
                      value={info.email}
                      onChange={(e) => setInfo(s => ({ ...s, email: e.target.value }))}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="profile-field">
                    <label className="fsp-label">Phone Number</label>
                    <input
                      className="fsp-input"
                      type="tel"
                      value={info.phone}
                      onChange={(e) => setInfo(s => ({ ...s, phone: e.target.value }))}
                      placeholder="+91 00000 00000"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="submit"
                    className="btn-primary-fsp"
                    disabled={infoLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {infoLoading
                      ? <><span className="spinner-sm" />Saving…</>
                      : <><MdSave style={{ fontSize: 16 }} />Save Changes</>}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary-fsp"
                    onClick={() => {
                      setEditInfo(false);
                      setInfo({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <MdClose style={{ fontSize: 16 }} />Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                {[
                  { icon: <MdPerson />,  label: 'Full Name',     value: user?.name  || 'Not set' },
                  { icon: <MdEmail />,   label: 'Email Address', value: user?.email || 'Not set' },
                  { icon: <MdPhone />,   label: 'Phone Number',  value: user?.phone || 'Not set' },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="profile-info-row">
                    <div className="profile-info-icon">{icon}</div>
                    <div>
                      <div className="profile-info-label">{label}</div>
                      <div className="profile-info-value">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Account Details (read-only) ── */}
        <div className="fsp-card">
          <div className="fsp-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MdShield style={{ fontSize: 20, color: 'var(--primary)' }} />
              <div className="fsp-card-title">Account Details</div>
            </div>
          </div>
          <div className="fsp-card-body">
            {accountDetails.map(({ icon, label, value }) => (
              <div key={label} className="profile-info-row">
                <div className="profile-info-icon">{icon}</div>
                <div>
                  <div className="profile-info-label">{label}</div>
                  <div className="profile-info-value"
                    style={label === 'Role' ? { color: isAdmin ? '#D97706' : 'var(--success)', fontWeight: 700 } : {}}>
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Change Password ── */}
        <div className="fsp-card profile-grid-full">
          <div className="fsp-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MdLock style={{ fontSize: 20, color: 'var(--primary)' }} />
              <div>
                <div className="fsp-card-title">Change Password</div>
                <div className="fsp-card-subtitle">Use a strong password with letters, numbers and symbols</div>
              </div>
            </div>
          </div>
          <div className="fsp-card-body">
            <form onSubmit={handleChangePw} noValidate>
              <div className="profile-form-row">

                {/* Current password */}
                <div className="profile-field">
                  <label className="fsp-label">Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="fsp-input"
                      type={showPw.current ? 'text' : 'password'}
                      value={pw.current}
                      onChange={(e) => setPw(s => ({ ...s, current: e.target.value }))}
                      placeholder="Enter current password"
                      style={{ paddingRight: 42 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}
                      style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, display: 'flex', alignItems: 'center', padding: 3 }}
                    >
                      {showPw.current ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                </div>

                {/* Spacer on desktop */}
                <div />

                {/* New password */}
                <div className="profile-field">
                  <label className="fsp-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="fsp-input"
                      type={showPw.newPw ? 'text' : 'password'}
                      value={pw.newPw}
                      onChange={(e) => setPw(s => ({ ...s, newPw: e.target.value }))}
                      placeholder="Create new password"
                      style={{ paddingRight: 42 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(s => ({ ...s, newPw: !s.newPw }))}
                      style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, display: 'flex', alignItems: 'center', padding: 3 }}
                    >
                      {showPw.newPw ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                  {/* strength bar */}
                  {pw.newPw && (
                    <div className="profile-pw-strength">
                      <div className="profile-pw-bars">
                        {[1,2,3,4].map(n => (
                          <div key={n} className="profile-pw-bar"
                            style={{ background: n <= strength.score ? strength.color : 'var(--border-color)' }} />
                        ))}
                      </div>
                      <div className="profile-pw-label" style={{ color: strength.color }}>{strength.label}</div>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="profile-field">
                  <label className="fsp-label">Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="fsp-input"
                      type={showPw.confirm ? 'text' : 'password'}
                      value={pw.confirm}
                      onChange={(e) => setPw(s => ({ ...s, confirm: e.target.value }))}
                      placeholder="Repeat new password"
                      style={{
                        paddingRight: 42,
                        borderColor: pw.confirm && pw.confirm !== pw.newPw ? 'var(--danger)' : undefined,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                      style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, display: 'flex', alignItems: 'center', padding: 3 }}
                    >
                      {showPw.confirm ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                    {pw.confirm && pw.confirm === pw.newPw && (
                      <MdCheckCircle style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', color: 'var(--success)', fontSize: 17 }} />
                    )}
                  </div>
                  {pw.confirm && pw.confirm !== pw.newPw && (
                    <div style={{ fontSize: 11.5, color: 'var(--danger)', marginTop: 4, fontWeight: 500 }}>Passwords do not match</div>
                  )}
                </div>

              </div>

              {/* Password rules */}
              <div style={{ marginTop: 16, marginBottom: 20, padding: '12px 16px', background: 'var(--primary-pale)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(79,70,229,0.12)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>Password Requirements</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 24px' }}>
                  {[
                    { rule: 'At least 6 characters',      met: pw.newPw.length >= 6 },
                    { rule: 'One uppercase letter (A–Z)',  met: /[A-Z]/.test(pw.newPw) },
                    { rule: 'One number (0–9)',            met: /\d/.test(pw.newPw) },
                    { rule: 'One special character',       met: /[^a-zA-Z0-9]/.test(pw.newPw) },
                  ].map(({ rule, met }) => (
                    <div key={rule} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: met ? 'var(--success)' : 'var(--text-muted)', fontWeight: 500 }}>
                      <span style={{ fontSize: 14 }}>{met ? '✓' : '○'}</span>
                      {rule}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary-fsp"
                disabled={pwLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {pwLoading
                  ? 'Updating Password…'
                  : <><MdLock style={{ fontSize: 16 }} />Update Password</>}
              </button>
            </form>
          </div>
        </div>

      </div>

      <style>{`
        .spinner-sm {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin-sm 0.7s linear infinite;
          margin-right: 4px;
          vertical-align: middle;
        }
        @keyframes spin-sm {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Profile;
