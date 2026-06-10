import React, { useState, useMemo, useEffect, useCallback } from 'react';
import './Users.css';
import {
  MdPerson, MdAdminPanelSettings, MdRefresh,
  MdAdd, MdEdit, MdDelete, MdClose, MdSave,
  MdVisibility, MdVisibilityOff,
  MdToggleOn, MdToggleOff,
} from 'react-icons/md';
import DataTable from '../components/common/DataTable';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';

/* ── Sub-components ──────────────────────────────────────── */

const StatusBadge = ({ isActive }) => (
  <span className={`users-status-badge ${isActive ? 'active' : 'inactive'}`}>
    <span className="users-status-dot" />
    {isActive ? 'Active' : 'Inactive'}
  </span>
);

const RoleBadge = ({ role }) => {
  const isAdmin = role === 'Admin';
  return (
    <span className={`users-role-badge ${isAdmin ? 'admin' : 'user'}`}>
      {isAdmin ? <MdAdminPanelSettings size={13} /> : <MdPerson size={13} />}
      {role}
    </span>
  );
};

const Avatar = ({ name, role, size = 36 }) => {
  const isAdmin = role === 'Admin';
  return (
    <div
      className="users-avatar"
      style={{
        width: size, height: size,
        background: isAdmin ? 'var(--primary-pale)' : 'var(--success-bg)',
        color:      isAdmin ? 'var(--primary)'      : 'var(--success)',
        fontSize:   size * 0.36,
      }}
    >
      {(name || '?').slice(0, 2).toUpperCase()}
    </div>
  );
};

/* ── User Modal (Add / Edit) ─────────────────────────────── */

const EMPTY_FORM = {
  name: '', username: '', password: '', role: 'User',
  email: '', phone: '', projectId: '', isActive: true,
};

const UserModal = ({ mode, user, projects, onSave, onClose }) => {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && user) {
      setForm({
        name:      user.name      || '',
        username:  user.username  || '',
        password:  '',
        role:      user.role      || 'User',
        email:     user.email     || '',
        phone:     user.phone     || '',
        projectId: user.projectId || '',
        isActive:  user.isActive  !== false,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [mode, user]);

  const change = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.username.trim())                 errs.username = 'Username is required';
    if (mode === 'add' && !form.password.trim()) errs.password = 'Password is required';
    if (!form.name.trim())                     errs.name     = 'Full name is required';
    if (form.role === 'User' && !form.projectId.trim()) errs.projectId = 'Project is required for User role';
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const payload = { ...form };
    if (form.role === 'Admin') payload.projectId = null;
    if (mode === 'edit' && !form.password.trim()) delete payload.password;
    try { await onSave(payload); }
    finally { setSaving(false); }
  };

  const isEdit = mode === 'edit';

  return (
    <>
      <div className="um-backdrop" onClick={onClose} />
      <div className="um-modal" role="dialog" aria-modal="true">

        <div className="um-header">
          <div className="um-header-left">
            <div className="um-header-icon">
              {isEdit ? <MdEdit /> : <MdAdd />}
            </div>
            <div>
              <div className="um-title">{isEdit ? 'Edit User' : 'Add User'}</div>
              <div className="um-subtitle">{isEdit ? `Editing @${user?.username}` : 'Create a new account'}</div>
            </div>
          </div>
          <button className="um-close-btn" onClick={onClose} title="Close">
            <MdClose />
          </button>
        </div>

        <form className="um-body" onSubmit={submit} noValidate>

          {/* Row 1: Name + Username */}
          <div className="um-row">
            <div className="um-field">
              <label className="um-label">Full Name <span className="um-req">*</span></label>
              <input
                className={`um-input ${errors.name ? 'um-input-err' : ''}`}
                type="text"
                placeholder="e.g. John Smith"
                value={form.name}
                onChange={(e) => change('name', e.target.value)}
              />
              {errors.name && <span className="um-err-text">{errors.name}</span>}
            </div>
            <div className="um-field">
              <label className="um-label">Username <span className="um-req">*</span></label>
              <input
                className={`um-input ${errors.username ? 'um-input-err' : ''}`}
                type="text"
                placeholder="e.g. jsmith"
                value={form.username}
                onChange={(e) => change('username', e.target.value)}
                disabled={isEdit}
              />
              {errors.username && <span className="um-err-text">{errors.username}</span>}
            </div>
          </div>

          {/* Row 2: Password + Role */}
          <div className="um-row">
            <div className="um-field">
              <label className="um-label">
                Password {isEdit && <span className="um-optional">(leave blank to keep)</span>}
                {!isEdit && <span className="um-req">*</span>}
              </label>
              <div className="um-pwd-wrap">
                <input
                  className={`um-input ${errors.password ? 'um-input-err' : ''}`}
                  type={showPwd ? 'text' : 'password'}
                  placeholder={isEdit ? 'New password…' : 'Min. 6 characters'}
                  value={form.password}
                  onChange={(e) => change('password', e.target.value)}
                />
                <button type="button" className="um-pwd-toggle" onClick={() => setShowPwd((s) => !s)} tabIndex={-1}>
                  {showPwd ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
              {errors.password && <span className="um-err-text">{errors.password}</span>}
            </div>
            <div className="um-field">
              <label className="um-label">Role <span className="um-req">*</span></label>
              <select
                className="um-select"
                value={form.role}
                onChange={(e) => { change('role', e.target.value); if (e.target.value === 'Admin') change('projectId', ''); }}
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Row 3: Email + Phone */}
          <div className="um-row">
            <div className="um-field">
              <label className="um-label">Email</label>
              <input
                className="um-input"
                type="email"
                placeholder="user@example.com"
                value={form.email}
                onChange={(e) => change('email', e.target.value)}
              />
            </div>
            <div className="um-field">
              <label className="um-label">Phone</label>
              <input
                className="um-input"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => change('phone', e.target.value)}
              />
            </div>
          </div>

          {/* Row 4: Project (only for User role) */}
          {form.role === 'User' && (
            <div className="um-row">
              <div className="um-field" style={{ flex: 1 }}>
                <label className="um-label">Project <span className="um-req">*</span></label>
                <select
                  className={`um-select ${errors.projectId ? 'um-input-err' : ''}`}
                  value={form.projectId}
                  onChange={(e) => change('projectId', e.target.value)}
                >
                  <option value="">— Select project —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))}
                </select>
                {errors.projectId && <span className="um-err-text">{errors.projectId}</span>}
              </div>
            </div>
          )}

          {/* Status toggle */}
          <div className="um-row">
            <div className="um-field" style={{ gridColumn: '1 / -1' }}>
              <label className="um-label">Account Status</label>
              <div className="um-toggle-row">
                <div className="um-toggle-info">
                  <span className="um-toggle-name" style={{ color: form.isActive ? 'var(--success)' : 'var(--text-muted)' }}>
                    {form.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="um-toggle-desc">
                    {form.isActive ? 'User can sign in to the system' : 'Sign-in is disabled for this user'}
                  </span>
                </div>
                <label className="um-switch" aria-label="Toggle account status">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => change('isActive', e.target.checked)}
                  />
                  <span className="um-switch-slider" />
                </label>
              </div>
            </div>
          </div>

          <div className="um-footer">
            <button type="button" className="um-btn-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="um-btn-save" disabled={saving}>
              <MdSave style={{ fontSize: 15 }} />
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>

        </form>
      </div>
    </>
  );
};

/* ── Main Page ───────────────────────────────────────────── */

const Users = () => {
  const [users,      setUsers]    = useState([]);
  const [projects,   setProjects] = useState([]);
  const [search,     setSearch]   = useState('');
  const [roleFilter, setRole]     = useState('All');
  const [loading,    setLoading]  = useState(true);

  const [modal,        setModal]        = useState(null);
  const [selected,     setSelected]     = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    api.get('/projects').then(setProjects).catch(console.error);
  }, [loadUsers]);

  /* ── CRUD handlers ── */

  const handleCreate = async (form) => {
    const created = await api.post('/users', form);
    setUsers((prev) => [...prev, created]);
    setModal(null);
  };

  const handleUpdate = async (form) => {
    const updated = await api.put(`/users/${selected.id}`, form);
    setUsers((prev) => prev.map((u) => (u.id === selected.id ? updated : u)));
    setModal(null);
    setSelected(null);
  };

  const handleDelete = async () => {
    await api.delete(`/users/${selected.id}`);
    setUsers((prev) => prev.filter((u) => u.id !== selected.id));
    setSelected(null);
  };

  const handleToggleStatus = async (u) => {
    const updated = await api.put(`/users/${u.id}`, { isActive: !u.isActive });
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: updated.isActive } : x)));
  };

  const openEdit   = (u) => { setSelected(u); setModal('edit');   };
  const openDelete = (u) => { setSelected(u); setModal('delete'); };
  const closeModal = ()  => { setModal(null); setSelected(null);  };

  /* ── Derived counts ── */
  const adminCount    = users.filter((u) => u.role === 'Admin').length;
  const activeCount   = users.filter((u) => u.isActive !== false).length;
  const inactiveCount = users.filter((u) => u.isActive === false).length;

  const filtered = useMemo(() => users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      u.username.toLowerCase().includes(q) ||
      (u.name  || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q);
    const matchRole   = roleFilter   === 'All' || u.role === roleFilter;
    const matchStatus = statusFilter === 'All' ||
      (statusFilter === 'Active' ? u.isActive !== false : u.isActive === false);
    return matchSearch && matchRole && matchStatus;
  }), [users, search, roleFilter, statusFilter]);

  /* ── Table columns ── */
  const columns = [
    { key: 'id', label: 'User ID', sortable: true, width: 130 },
    {
      key: 'name', label: 'Name', sortable: true,
      render: (val, row) => (
        <div className="users-name-cell">
          <Avatar name={val || row.username} role={row.role} />
          <div>
            <div className="users-name-primary">{val || row.username}</div>
            <div className="users-name-secondary">@{row.username}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role', label: 'Role', sortable: true,
      render: (val) => <RoleBadge role={val} />,
    },
    {
      key: 'isActive', label: 'Status', sortable: true,
      render: (val) => <StatusBadge isActive={val !== false} />,
    },
    {
      key: 'email', label: 'Email',
      render: (val) => val
        ? <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{val}</span>
        : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>,
    },
    {
      key: 'phone', label: 'Phone',
      render: (val) => val || <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>,
    },
    {
      key: 'projectId', label: 'Project',
      render: (val) => val
        ? <span className="users-project-chip">{val}</span>
        : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>,
    },
    { key: 'createdAt', label: 'Created', sortable: true },
    {
      key: '_actions', label: '',
      render: (_, row) => (
        <div className="users-actions">
          <button
            className={`users-action-btn toggle ${row.isActive !== false ? 'deactivate' : 'activate'}`}
            title={row.isActive !== false ? 'Deactivate user' : 'Activate user'}
            onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
          >
            {row.isActive !== false ? <MdToggleOn /> : <MdToggleOff />}
          </button>
          <button
            className="users-action-btn edit"
            title="Edit user"
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
          >
            <MdEdit />
          </button>
          <button
            className="users-action-btn delete"
            title="Delete user"
            onClick={(e) => { e.stopPropagation(); openDelete(row); }}
          >
            <MdDelete />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>User Management</h1>
          <p>Manage admin and project user accounts</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary-fsp" onClick={loadUsers} disabled={loading}>
            <MdRefresh /> Refresh
          </button>
          <button className="btn-primary-fsp" onClick={() => setModal('add')}>
            <MdAdd /> Add User
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="users-kpi-strip">
        {[
          { label: 'Total Users', val: users.length,  color: 'var(--primary)' },
          { label: 'Active',      val: activeCount,   color: 'var(--success)' },
          { label: 'Inactive',    val: inactiveCount, color: 'var(--text-muted)' },
          { label: 'Admins',      val: adminCount,    color: '#7C3AED'        },
        ].map((k) => (
          <div key={k.label} className="fsp-card users-kpi-card">
            <div className="users-kpi-value" style={{ color: k.color }}>{k.val}</div>
            <div className="users-kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="fsp-card">
        <div className="filter-toolbar">
          <div className="filter-search">
            <svg className="filter-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 15, height: 15 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, username or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={roleFilter} onChange={(e) => setRole(e.target.value)}>
            <option value="All">All Roles</option>
            {['Admin', 'User'].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button className="btn-icon-sm" title="Reset filters" onClick={() => { setSearch(''); setRole('All'); setStatusFilter('All'); }}>
            <MdRefresh />
          </button>
          <span className="filter-count">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          pageSize={10}
          emptyMessage={loading ? 'Loading users…' : 'No users found.'}
        />
      </div>

      {/* Add / Edit modal */}
      {(modal === 'add' || modal === 'edit') && (
        <UserModal
          mode={modal}
          user={selected}
          projects={projects}
          onSave={modal === 'add' ? handleCreate : handleUpdate}
          onClose={closeModal}
        />
      )}

      {/* Delete confirmation */}
      {modal === 'delete' && selected && (
        <DeleteConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete the account for "${selected.name || selected.username}" (@${selected.username})?`}
          onConfirm={handleDelete}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default Users;
