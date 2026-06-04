import React, { useState, useRef, useEffect, useMemo } from 'react';
import './Header.css';
import { useLocation } from 'react-router-dom';
import {
  MdMenu, MdSearch, MdNotifications, MdRefresh,
  MdOutlineHelpOutline, MdKeyboardArrowDown,
  MdLogout, MdSettings, MdPerson, MdPersonAdd,
  MdVisibility, MdVisibilityOff, MdCheckCircle,
} from 'react-icons/md';
import { useAuth }             from '../../contexts/AuthContext';
import Modal                   from '../common/Modal';
import { getUsers, createUser } from '../../data/loginDb';
import { getProjects }          from '../../data/projectsDb';

const pageMap = {
  '/':             { title: 'Dashboard',       sub: 'Overview of your food stock & inventory' },
  '/inventory':    { title: 'Inventory',       sub: 'Manage all food items and stock levels' },
  '/add-items':    { title: 'Add Items',       sub: 'Add and manage your item catalogue' },
  '/stock-update': { title: 'Update Stock',    sub: 'Record stock-in and stock-out transactions' },
  '/orders':       { title: 'Purchase Orders', sub: 'Track and manage supplier orders' },
  '/suppliers':    { title: 'Suppliers',       sub: 'Manage your supplier directory' },
  '/wastage':      { title: 'Wastage Log',     sub: 'Track and reduce food wastage' },
  '/reports':      { title: 'Reports',         sub: 'Analytics and performance insights' },
  '/settings':     { title: 'Settings',        sub: 'System configuration and preferences' },
  '/projects':     { title: 'Projects',        sub: 'Manage project locations and stock' },
};

const FORM_INIT = { name: '', username: '', password: '', confirm: '', role: 'User', email: '', phone: '', projectId: '' };

const Header = ({ onMenuClick }) => {
  const location         = useLocation();
  const { user, logout } = useAuth();

  /* ── existing dropdown state ── */
  const [searchVal, setSearchVal]   = useState('');
  const [dropdownOpen, setDropdown] = useState(false);
  const dropdownRef = useRef(null);

  /* ── create-user modal state ── */
  const [showModal,    setShowModal]    = useState(false);
  const [form,         setForm]         = useState(FORM_INIT);
  const [formError,    setFormError]    = useState('');
  const [success,      setSuccess]      = useState(false);
  const [showPass,     setShowPass]     = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  const page        = pageMap[location.pathname] || pageMap['/'];
  const displayName = user?.username ? user.username.toUpperCase() : 'Admin';
  const initials    = displayName.slice(0, 2);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── projects list (refreshed each time modal opens) ── */
  const projects = useMemo(() => getProjects(), [showModal]);

  /* IDs of projects that already have a user assigned */
  const takenProjectIds = useMemo(() => {
    const users = getUsers();
    return new Set(users.filter((u) => u.projectId).map((u) => u.projectId));
  }, [showModal]);

  /* ── create user handlers ── */
  const openModal  = () => { setForm(FORM_INIT); setFormError(''); setSuccess(false); setShowPass(false); setShowConfirm(false); setShowModal(true); };
  const closeModal = () => { setShowModal(false); };

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleSubmit = () => {
    setFormError('');
    if (!form.username.trim() || !form.password) {
      setFormError('Username and password are required.');
      return;
    }
    if (form.password.length < 4) {
      setFormError('Password must be at least 4 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setFormError('Passwords do not match.');
      return;
    }
    const result = createUser(getUsers(), {
      name:      form.name,
      username:  form.username,
      password:  form.password,
      role:      form.role,
      email:     form.email,
      phone:     form.phone,
      projectId: form.role === 'User' ? (form.projectId || null) : null,
    });
    if (result.error) { setFormError(result.error); return; }
    setSuccess(true);
    setTimeout(() => { closeModal(); }, 1600);
  };

  /* ── shared field style ── */
  const fieldStyle = {
    width: '100%', padding: '9px 12px', border: '1.5px solid var(--border-color)',
    borderRadius: 8, fontSize: 13.5, outline: 'none', background: 'var(--bg-main)',
    color: 'var(--text-primary)', fontFamily: 'inherit', transition: 'border-color 0.2s',
  };

  return (
    <>
      <header className="app-header">
        <button className="header-toggle-btn" onClick={onMenuClick} title="Toggle Sidebar">
          <MdMenu />
        </button>

        <div className="header-breadcrumb">
          <div className="header-page-title">{page.title}</div>
          <div className="header-page-sub">{today} · {page.sub}</div>
        </div>

        <div className="header-search-wrap">
          <MdSearch className="header-search-icon" />
          <input
            type="text"
            className="header-search"
            placeholder="Search items, orders, suppliers…"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
        </div>

        <div className="header-actions">
          <button className="header-icon-btn" title="Refresh data"><MdRefresh /></button>
          <button className="header-icon-btn" title="Help"><MdOutlineHelpOutline /></button>
          <button className="header-icon-btn" title="Notifications">
            <MdNotifications />
            <span className="header-notif-dot" />
          </button>

          {/* ── New User button — Admin only ── */}
          {user?.role === 'Admin' && (
            <button
              onClick={openModal}
              title="Create New User"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.18s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-dark, #3730A3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--primary)'; }}
            >
              <MdPersonAdd style={{ fontSize: 17 }} />
              New User
            </button>
          )}

          <div className="header-divider" />

          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              className="header-user-btn"
              onClick={() => setDropdown((d) => !d)}
              aria-expanded={dropdownOpen}
            >
              <div className="header-avatar">{initials}</div>
              <span className="header-user-name">{displayName}</span>
              <MdKeyboardArrowDown style={{
                color: 'var(--text-muted)', fontSize: 18,
                transition: 'transform 0.2s',
                transform: dropdownOpen ? 'rotate(180deg)' : 'none',
              }} />
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 220, background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden', zIndex: 200,
                animation: 'dropdown-in 0.18s cubic-bezier(0.4,0,0.2,1)',
              }}>
                <div style={{ padding: '14px 16px', background: 'var(--primary-pale)', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#818CF8,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13 }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{displayName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role || 'Operations Manager'}</div>
                    </div>
                  </div>
                </div>

                {[
                  { icon: <MdPerson />,    label: 'My Profile' },
                  { icon: <MdSettings />,  label: 'Settings'   },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setDropdown(false)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontFamily: "'Inter',sans-serif" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-main)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none';           e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}

                <div style={{ height: 1, background: 'var(--border-light)', margin: '4px 0' }} />

                <button
                  onClick={() => { setDropdown(false); logout(); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 14px', background: 'none', border: 'none', color: '#DC2626', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontFamily: "'Inter',sans-serif" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <MdLogout style={{ fontSize: 18 }} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Create New User Modal ── */}
      <Modal
        show={showModal}
        onClose={closeModal}
        title="Create New User"
        size="md"
        footer={success ? null : (
          <>
            <button
              onClick={closeModal}
              style={{ padding: '9px 20px', background: 'var(--bg-main)', border: '1.5px solid var(--border-color)', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              style={{ padding: '9px 22px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <MdPersonAdd /> Create User
            </button>
          </>
        )}
      >
        {success ? (
          /* ── Success state ── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: '#10B981' }}>
              <MdCheckCircle />
            </div>
            <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)' }}>User Created!</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.7 }}>
              <strong>{form.username}</strong> has been created with role <strong>{form.role}</strong>.
              {form.role === 'User' && form.projectId && (() => {
                const p = projects.find((x) => x.id === form.projectId);
                return p ? (
                  <div style={{ marginTop: 6, fontSize: 13, color: '#10B981', fontWeight: 600 }}>
                    🏭 Linked to project: {p.name}
                  </div>
                ) : null;
              })()}
              {form.role === 'User' && !form.projectId && (
                <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--text-muted)' }}>
                  No project assigned — link from the Projects page later.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0' }}>

            {/* Error banner */}
            {formError && (
              <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#DC2626', fontSize: 13, fontWeight: 600 }}>
                ⚠ {formError}
              </div>
            )}

            {/* Row 1: Name + Role */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  name="name"
                  placeholder="e.g. John Smith"
                  value={form.name}
                  onChange={handleField}
                  style={fieldStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
                  onBlur={(e)  => { e.target.style.borderColor = 'var(--border-color)'; }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                  Role <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleField}
                  style={{ ...fieldStyle, cursor: 'pointer' }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
                  onBlur={(e)  => { e.target.style.borderColor = 'var(--border-color)'; }}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            {/* Row 2: Username */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                Username <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                name="username"
                placeholder="e.g. john_site"
                value={form.username}
                onChange={handleField}
                autoComplete="off"
                style={fieldStyle}
                onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
                onBlur={(e)  => { e.target.style.borderColor = 'var(--border-color)'; }}
              />
            </div>

            {/* Row 2b: Assign Project — visible for User role only */}
            {form.role === 'User' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                  Assign Project <span style={{ fontSize: 10, fontWeight: 400 }}>(optional)</span>
                </label>

                {projects.length === 0 ? (
                  <div style={{ padding: '9px 12px', border: '1.5px dashed var(--border-color)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)', background: 'var(--bg-main)' }}>
                    No projects found — create a project first from the Projects page.
                  </div>
                ) : (
                  <>
                    <select
                      name="projectId"
                      value={form.projectId}
                      onChange={handleField}
                      style={{ ...fieldStyle, cursor: 'pointer' }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
                      onBlur={(e)  => { e.target.style.borderColor = 'var(--border-color)'; }}
                    >
                      <option value="">— No Project (assign later) —</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}  ({p.id})  {p.location ? `· ${p.location}` : ''}
                          {takenProjectIds.has(p.id) ? '  ⚠ already has a user' : ''}
                        </option>
                      ))}
                    </select>

                    {/* Warning when selected project already has a user */}
                    {form.projectId && takenProjectIds.has(form.projectId) && (
                      <div style={{ marginTop: 6, padding: '8px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 7, fontSize: 12.5, color: '#92400E', display: 'flex', gap: 7 }}>
                        <span>⚠</span>
                        <span>This project already has a user linked. Creating this user will <strong>replace</strong> the existing project login.</span>
                      </div>
                    )}

                    {/* Confirmation chip when a project is selected */}
                    {form.projectId && !takenProjectIds.has(form.projectId) && (() => {
                      const p = projects.find((x) => x.id === form.projectId);
                      return p ? (
                        <div style={{ marginTop: 6, padding: '7px 12px', background: 'var(--primary-pale)', border: '1px solid rgba(79,70,229,0.18)', borderRadius: 7, fontSize: 12.5, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span>🏭</span>
                          <span>Will be linked to <strong>{p.name}</strong> — {p.location || p.address || p.id}</span>
                        </div>
                      ) : null;
                    })()}
                  </>
                )}
              </div>
            )}

            {/* Row 3: Password + Confirm */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                  Password <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min 4 characters"
                    value={form.password}
                    onChange={handleField}
                    autoComplete="new-password"
                    style={{ ...fieldStyle, paddingRight: 38 }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
                    onBlur={(e)  => { e.target.style.borderColor = 'var(--border-color)'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center' }}
                    tabIndex={-1}
                  >
                    {showPass ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                  Confirm Password <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    name="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={form.confirm}
                    onChange={handleField}
                    autoComplete="new-password"
                    style={{
                      ...fieldStyle, paddingRight: 38,
                      borderColor: form.confirm && form.confirm !== form.password ? '#FCA5A5' : 'var(--border-color)',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
                    onBlur={(e)  => { e.target.style.borderColor = form.confirm && form.confirm !== form.password ? '#FCA5A5' : 'var(--border-color)'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center' }}
                    tabIndex={-1}
                  >
                    {showConfirm ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
                {form.confirm && form.confirm !== form.password && (
                  <div style={{ fontSize: 11.5, color: '#DC2626', marginTop: 4 }}>Passwords do not match</div>
                )}
              </div>
            </div>

            {/* Row 4: Email + Phone (optional) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                  Email <span style={{ fontSize: 10, fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  value={form.email}
                  onChange={handleField}
                  style={fieldStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
                  onBlur={(e)  => { e.target.style.borderColor = 'var(--border-color)'; }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                  Phone <span style={{ fontSize: 10, fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  name="phone"
                  placeholder="+91-XXXXXXXXXX"
                  value={form.phone}
                  onChange={handleField}
                  style={fieldStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; }}
                  onBlur={(e)  => { e.target.style.borderColor = 'var(--border-color)'; }}
                />
              </div>
            </div>

            {/* Role hint */}
            <div style={{ padding: '10px 14px', background: 'var(--primary-pale)', borderRadius: 8, fontSize: 12.5, color: 'var(--primary)', display: 'flex', gap: 8 }}>
              <span style={{ fontWeight: 700, flexShrink: 0 }}>ℹ</span>
              <span>
                {form.role === 'Admin'
                  ? 'Admin users have full access to all pages, inventory, and settings.'
                  : form.projectId
                    ? `This user will log in and see only the assigned project's stock view.`
                    : 'Select a project above to give this user access to that project\'s stock view.'}
              </span>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        @keyframes dropdown-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default Header;
