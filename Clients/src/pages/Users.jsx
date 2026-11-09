import React, { useState, useMemo, useEffect, useCallback } from 'react';
import './Users.css';
import {
  MdPerson, MdAdminPanelSettings, MdRefresh,
  MdAdd, MdEdit, MdDelete, MdClose, MdSave,
  MdToggleOn, MdToggleOff, MdVpnKey, MdContentCopy, MdCheck, MdError,
} from 'react-icons/md';
import DataTable from '../components/common/DataTable';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectsContext';

const displayName = (u) => (u ? u.name || u.username : '');

/* ── Sub-components ──────────────────────────────────────── */

const StatusBadge = ({ isActive, label }) => (
  <span className={`users-status-badge ${isActive ? 'active' : 'inactive'}`}>
    <span className="users-status-dot" />
    {label || (isActive ? 'Active' : 'Inactive')}
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

const Avatar = ({ name, role }) => (
  <div className={`users-avatar ${role === 'Admin' ? 'admin' : 'user'}`}>
    {(name || '?').slice(0, 2).toUpperCase()}
  </div>
);

/* ── User Modal (Add / Edit) ─────────────────────────────── */

const EMPTY_FORM = {
  name: '', role: 'User', email: '', phone: '', projectIds: [], isActive: true,
};

const UserModal = ({ mode, user, projects, users, isSelf, onSave, onClose }) => {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState(() => (isEdit ? {
    name:       user.name  || '',
    role:       user.role  || 'User',
    email:      user.email || '',
    phone:      user.phone || '',
    projectIds: projects.filter((p) => p.assignedUserId === user.id).map((p) => p.id),
    isActive:   user.isActive !== false,
  } : EMPTY_FORM));
  const [errors,    setErrors]    = useState({});
  const [saveError, setSaveError] = useState('');
  const [saving,    setSaving]    = useState(false);

  const change = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const toggleProject = (id) => setForm((f) => ({
    ...f,
    projectIds: f.projectIds.includes(id) ? f.projectIds.filter((x) => x !== id) : [...f.projectIds, id],
  }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'A valid email is required. Password codes are sent here.';
    }
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setSaveError('');
    try {
      await onSave({ ...form, projectIds: form.role === 'Admin' ? [] : form.projectIds });
    } catch (err) {
      setSaveError(err.message || 'Could not save the user.');
    } finally {
      setSaving(false);
    }
  };

  const ownerName = (p) => displayName(users.find((u) => u.id === p.assignedUserId)) || p.assignedUserId;

  return (
    <>
      <div className="um-backdrop" onClick={onClose} />
      <div className="um-modal" role="dialog" aria-modal="true">

        <div className="um-header">
          <div className="um-header-left">
            <div className="um-header-icon">{isEdit ? <MdEdit /> : <MdAdd />}</div>
            <div>
              <div className="um-title">{isEdit ? 'Edit User' : 'Add User'}</div>
              <div className="um-subtitle">
                {isEdit ? `${user.id} · @${user.username}` : 'The user ID, username and password are generated for you'}
              </div>
            </div>
          </div>
          <button className="um-close-btn" onClick={onClose} title="Close"><MdClose /></button>
        </div>

        <form className="um-body" onSubmit={submit} noValidate>

          <div className="um-row">
            <div className="um-field">
              <label className="um-label" htmlFor="um-name">Full Name <span className="um-req">*</span></label>
              <input
                id="um-name"
                className={`um-input ${errors.name ? 'um-input-err' : ''}`}
                type="text"
                placeholder="e.g. John Smith"
                value={form.name}
                onChange={(e) => change('name', e.target.value)}
              />
              {errors.name && <span className="um-err-text">{errors.name}</span>}
            </div>
            <div className="um-field">
              <label className="um-label" htmlFor="um-role">Role <span className="um-req">*</span></label>
              <select
                id="um-role"
                className="um-select"
                value={form.role}
                disabled={isSelf}
                onChange={(e) => change('role', e.target.value)}
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="um-row">
            <div className="um-field">
              <label className="um-label" htmlFor="um-email">Email <span className="um-req">*</span></label>
              <input
                id="um-email"
                className={`um-input ${errors.email ? 'um-input-err' : ''}`}
                type="email"
                placeholder="user@gmail.com"
                value={form.email}
                onChange={(e) => change('email', e.target.value)}
              />
              {errors.email && <span className="um-err-text">{errors.email}</span>}
            </div>
            <div className="um-field">
              <label className="um-label" htmlFor="um-phone">Phone</label>
              <input
                id="um-phone"
                className="um-input"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => change('phone', e.target.value)}
              />
            </div>
          </div>

          {form.role === 'User' ? (
            <div className="um-field">
              <span className="um-label">Projects <span className="um-optional">(a project can only belong to one user)</span></span>
              <div className="um-project-list">
                {projects.length === 0 && <div className="um-project-empty">No projects yet. Create one from the Projects page.</div>}
                {projects.map((p) => {
                  const heldByOther = p.assignedUserId && (!isEdit || p.assignedUserId !== user.id);
                  return (
                    <label key={p.id} className={`um-project-option ${heldByOther ? 'taken' : ''}`}>
                      <input
                        type="checkbox"
                        disabled={heldByOther}
                        checked={form.projectIds.includes(p.id)}
                        onChange={() => toggleProject(p.id)}
                      />
                      <span className="um-project-name">{p.name}</span>
                      <span className="um-project-note">
                        {heldByOther ? `Assigned to ${ownerName(p)}` : p.status === 'Inactive' ? 'Inactive' : p.id}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="um-note">Admins can access every project, so no projects are assigned to them.</div>
          )}

          <div className="um-field">
            <span className="um-label">Account Status</span>
            <div className="um-toggle-row">
              <div className="um-toggle-info">
                <span className={`um-toggle-name ${form.isActive ? 'on' : ''}`}>{form.isActive ? 'Active' : 'Inactive'}</span>
                <span className="um-toggle-desc">
                  {isSelf
                    ? "You can't deactivate your own account"
                    : form.isActive ? 'User can sign in to the system' : 'Sign-in is disabled for this user'}
                </span>
              </div>
              <label className="um-switch" aria-label="Toggle account status">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  disabled={isSelf}
                  onChange={(e) => change('isActive', e.target.checked)}
                />
                <span className="um-switch-slider" />
              </label>
            </div>
          </div>

          {isEdit && (
            <div className="um-note">
              Created {user.createdAt || 'date not recorded'} by {user.createdByName || 'an unrecorded admin'}
            </div>
          )}

          {saveError && <div className="users-notice" role="alert"><MdError /> {saveError}</div>}

          <div className="um-footer">
            <button type="button" className="um-btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="um-btn-save" disabled={saving}>
              <MdSave />
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

/* ── Generated credentials (shown once) ──────────────────── */

const CopyButton = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" className="um-copy-btn" onClick={copy} title={`Copy ${label}`} aria-label={`Copy ${label}`}>
      {copied ? <MdCheck /> : <MdContentCopy />}
    </button>
  );
};

const CredentialsModal = ({ title, credentials, onClose }) => {
  const rows = [
    ['User ID',  credentials.id],
    ['Username', credentials.username],
    ['Password', credentials.password],
  ];
  const allText = rows.map(([label, value]) => `${label}: ${value}`).join('\n');

  return (
    <>
      <div className="um-backdrop" />
      <div className="um-modal" role="dialog" aria-modal="true">
        <div className="um-header">
          <div className="um-header-left">
            <div className="um-header-icon"><MdVpnKey /></div>
            <div>
              <div className="um-title">{title}</div>
              <div className="um-subtitle">Pass these details on to the user</div>
            </div>
          </div>
        </div>
        <div className="um-body">
          <div className="um-cred-list">
            {rows.map(([label, value]) => (
              <div key={label} className="um-cred-row">
                <span className="um-cred-label">{label}</span>
                <code className="um-cred-value">{value}</code>
                <CopyButton text={value} label={label} />
              </div>
            ))}
          </div>
          <div className="users-notice warning">
            <MdError /> This password won't be shown again. If it's lost, generate a new one with the key button.
          </div>
          <div className="um-footer">
            <button type="button" className="um-btn-cancel um-copy-all" onClick={() => navigator.clipboard.writeText(allText).catch(() => {})}>
              <MdContentCopy /> Copy All
            </button>
            <button type="button" className="um-btn-save" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    </>
  );
};

/* ── Confirm step for status, password and assignment changes ── */

const ConfirmModal = ({ title, message, confirmLabel, onConfirm, onClose }) => {
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message || 'That did not work. Please try again.');
      setBusy(false);
    }
  };

  return (
    <>
      <div className="um-backdrop" onClick={onClose} />
      <div className="um-modal um-modal-small" role="alertdialog" aria-modal="true">
        <div className="um-header"><div className="um-title">{title}</div></div>
        <div className="um-body">
          <div className="um-confirm-message">{message}</div>
          {error && <div className="users-notice" role="alert"><MdError /> {error}</div>}
          <div className="um-footer">
            <button type="button" className="um-btn-cancel" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="button" className="um-btn-save" onClick={confirm} disabled={busy}>
              {busy ? 'Working…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/* ── Main Page ───────────────────────────────────────────── */

const Users = () => {
  const { user: currentUser } = useAuth();
  const { users, projects, loading, refreshUsers, refreshProjects } = useProjects();

  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRole]         = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [refreshing,   setRefreshing]   = useState(false);
  const [pageError,    setPageError]    = useState('');

  const [modal,       setModal]       = useState(null); // 'add' | 'edit' | 'delete'
  const [selected,    setSelected]    = useState(null);
  const [credentials, setCredentials] = useState(null); // { title, credentials }
  const [confirm,     setConfirm]     = useState(null); // { title, message, confirmLabel, action }

  const reload = useCallback(async () => {
    setRefreshing(true);
    setPageError('');
    try {
      await Promise.all([refreshUsers(), refreshProjects()]);
    } catch (err) {
      setPageError(err.message || 'Could not load users and projects.');
    } finally {
      setRefreshing(false);
    }
  }, [refreshUsers, refreshProjects]);

  useEffect(() => { reload(); }, [reload]);

  const closeModal = () => { setModal(null); setSelected(null); };

  /* ── User actions ── */

  const handleCreate = async (form) => {
    const { credentials: created } = await api.post('/users', form);
    closeModal();
    setCredentials({ title: 'User Created', credentials: created });
    await reload();
  };

  const handleUpdate = async (form) => {
    await api.put(`/users/${selected.id}`, form);
    closeModal();
    await reload();
  };

  const handleDelete = async () => {
    await api.delete(`/users/${selected.id}`);
    await reload();
  };

  const runConfirmed = async () => {
    await confirm.action();
    setConfirm(null);
    await reload();
  };

  const askToggleUser = (u) => {
    const deactivating = u.isActive !== false;
    setConfirm({
      title: deactivating ? 'Deactivate User' : 'Activate User',
      message: deactivating
        ? `${displayName(u)} will be signed out and won't be able to sign in. Their projects stay assigned to them.`
        : `${displayName(u)} will be able to sign in again.`,
      confirmLabel: deactivating ? 'Deactivate' : 'Activate',
      action: () => api.put(`/users/${u.id}`, { isActive: !deactivating }),
    });
  };

  const askResetPassword = (u) => setConfirm({
    title: 'Generate New Password',
    message: `${displayName(u)}'s current password will stop working straight away.`,
    confirmLabel: 'Generate Password',
    action: async () => {
      const { credentials: fresh } = await api.post(`/users/${u.id}/reset-password`, {});
      setCredentials({ title: 'New Password Generated', credentials: fresh });
    },
  });

  /* ── Project actions ── */

  const askToggleProject = (p) => {
    const deactivating = p.status !== 'Inactive';
    setConfirm({
      title: deactivating ? 'Deactivate Project' : 'Activate Project',
      message: deactivating
        ? `The assigned user won't be able to open "${p.name}" until it is activated again.`
        : `"${p.name}" will be available to its assigned user again.`,
      confirmLabel: deactivating ? 'Deactivate' : 'Activate',
      action: () => api.put(`/projects/${p.id}`, { status: deactivating ? 'Inactive' : 'Active' }),
    });
  };

  const askAssign = (p, userId) => {
    const assign = () => api.put(`/projects/${p.id}/assignment`, { userId: userId || null });
    const from = users.find((u) => u.id === p.assignedUserId);
    const to   = users.find((u) => u.id === userId);

    // Giving a free project to someone can't take anything away from anyone.
    if (!from) {
      setPageError('');
      assign().then(reload).catch((err) => setPageError(err.message || 'Could not assign the project.'));
      return;
    }
    setConfirm({
      title: to ? 'Change Assigned User' : 'Remove Assignment',
      message: to
        ? `Move "${p.name}" from ${displayName(from)} to ${displayName(to)}? ${displayName(from)} will lose access to it.`
        : `Remove "${p.name}" from ${displayName(from)}? They will lose access to it.`,
      confirmLabel: to ? 'Move Project' : 'Remove',
      action: assign,
    });
  };

  /* ── Derived data ── */

  const projectsByUser = useMemo(() => {
    const map = {};
    projects.forEach((p) => {
      if (p.assignedUserId) (map[p.assignedUserId] = map[p.assignedUserId] || []).push(p);
    });
    return map;
  }, [projects]);

  const activeCount     = users.filter((u) => u.isActive !== false).length;
  const inactiveCount   = users.length - activeCount;
  const unassignedCount = projects.filter((p) => !p.assignedUserId).length;

  const filtered = useMemo(() => users.filter((u) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || [
      u.id, u.username, u.name, u.email,
      ...(projectsByUser[u.id] || []).map((p) => p.name),
    ].some((val) => (val || '').toLowerCase().includes(q));
    const matchRole   = roleFilter   === 'All' || u.role === roleFilter;
    const matchStatus = statusFilter === 'All' ||
      (statusFilter === 'Active' ? u.isActive !== false : u.isActive === false);
    return matchSearch && matchRole && matchStatus;
  }), [users, search, roleFilter, statusFilter, projectsByUser]);

  const assignableUsers = users.filter((u) => u.role === 'User' && u.isActive !== false);

  /* ── Table columns ── */

  const userColumns = [
    {
      key: 'name', label: 'User', sortable: true,
      render: (val, row) => (
        <div className="users-name-cell">
          <Avatar name={val || row.username} role={row.role} />
          <div>
            <div className="users-name-primary">{val || row.username}</div>
            <div className="users-name-secondary">@{row.username} · {row.id}</div>
          </div>
        </div>
      ),
    },
    { key: 'role', label: 'Role', sortable: true, render: (val) => <RoleBadge role={val} /> },
    {
      key: 'isActive', label: 'Status', sortable: true,
      render: (val) => <StatusBadge isActive={val !== false} />,
    },
    {
      key: 'email', label: 'Contact',
      render: (val, row) => (
        <div>
          {val
            ? <div className="users-contact-primary">{val}</div>
            : <div className="users-contact-missing">No email</div>}
          {row.phone && <div className="users-name-secondary">{row.phone}</div>}
        </div>
      ),
    },
    {
      key: '_projects', label: 'Projects',
      render: (_, row) => {
        if (row.role === 'Admin') return <span className="users-muted">All projects</span>;
        const own = projectsByUser[row.id] || [];
        if (!own.length) return <span className="users-muted">None</span>;
        return (
          <div className="users-project-chips">
            {own.map((p) => (
              <span key={p.id} className={`users-project-chip ${p.status === 'Inactive' ? 'inactive' : ''}`} title={p.id}>
                {p.name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'createdByName', label: 'Created By', sortable: true,
      render: (val, row) => (
        <div>
          <div className="users-contact-primary">{val || <span className="users-muted">Not recorded</span>}</div>
          {row.createdAt && <div className="users-name-secondary">{row.createdAt}</div>}
        </div>
      ),
    },
    {
      key: '_actions', label: '',
      render: (_, row) => {
        const isSelf = row.id === currentUser?.id;
        const active = row.isActive !== false;
        return (
          <div className="users-actions">
            {!isSelf && (
              <button
                className={`users-action-btn ${active ? 'deactivate' : 'activate'}`}
                title={active ? 'Deactivate user' : 'Activate user'}
                aria-label={active ? `Deactivate ${displayName(row)}` : `Activate ${displayName(row)}`}
                onClick={() => askToggleUser(row)}
              >
                {active ? <MdToggleOn /> : <MdToggleOff />}
              </button>
            )}
            <button
              className="users-action-btn edit"
              title="Edit user"
              aria-label={`Edit ${displayName(row)}`}
              onClick={() => { setSelected(row); setModal('edit'); }}
            >
              <MdEdit />
            </button>
            {!isSelf && (
              <button
                className="users-action-btn key"
                title="Generate new password"
                aria-label={`Generate new password for ${displayName(row)}`}
                onClick={() => askResetPassword(row)}
              >
                <MdVpnKey />
              </button>
            )}
            {row.role !== 'Admin' && (
              <button
                className="users-action-btn delete"
                title="Delete user"
                aria-label={`Delete ${displayName(row)}`}
                onClick={() => { setSelected(row); setModal('delete'); }}
              >
                <MdDelete />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const projectColumns = [
    {
      key: 'name', label: 'Project', sortable: true,
      render: (val, row) => (
        <div>
          <div className="users-name-primary">{val}</div>
          <div className="users-name-secondary">{row.id}{row.location ? ` · ${row.location}` : ''}</div>
        </div>
      ),
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (val) => <StatusBadge isActive={val !== 'Inactive'} label={val || 'Active'} />,
    },
    {
      key: 'assignedUserId', label: 'Assigned User',
      render: (val, row) => {
        // Keep a deactivated owner in the list so the select shows who holds it.
        const owner = users.find((u) => u.id === val);
        const options = owner && !assignableUsers.includes(owner) ? [owner, ...assignableUsers] : assignableUsers;
        return (
          <select
            className="filter-select users-assign-select"
            aria-label={`Assigned user for ${row.name}`}
            value={val || ''}
            onChange={(e) => askAssign(row, e.target.value)}
          >
            <option value="">Unassigned</option>
            {options.map((u) => (
              <option key={u.id} value={u.id}>
                {displayName(u)} (@{u.username}){u.isActive === false ? ' (inactive)' : ''}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      key: '_actions', label: '',
      render: (_, row) => {
        const active = row.status !== 'Inactive';
        return (
          <div className="users-actions">
            <button
              className={`users-action-btn ${active ? 'deactivate' : 'activate'}`}
              title={active ? 'Deactivate project' : 'Activate project'}
              aria-label={active ? `Deactivate ${row.name}` : `Activate ${row.name}`}
              onClick={() => askToggleProject(row)}
            >
              {active ? <MdToggleOn /> : <MdToggleOff />}
            </button>
          </div>
        );
      },
    },
  ];

  const kpis = [
    { label: 'Total Users',         val: users.length,    tone: 'primary' },
    { label: 'Active',              val: activeCount,     tone: 'success' },
    { label: 'Inactive',            val: inactiveCount,   tone: 'muted'   },
    { label: 'Unassigned Projects', val: unassignedCount, tone: 'warning' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>User Management</h1>
          <p>Create accounts, assign projects and control access</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary-fsp" onClick={reload} disabled={refreshing}>
            <MdRefresh /> Refresh
          </button>
          <button className="btn-primary-fsp" onClick={() => setModal('add')}>
            <MdAdd /> Add User
          </button>
        </div>
      </div>

      {pageError && <div className="users-notice users-page-notice" role="alert"><MdError /> {pageError}</div>}

      <div className="users-kpi-strip">
        {kpis.map((k) => (
          <div key={k.label} className="fsp-card users-kpi-card">
            <div className={`users-kpi-value ${k.tone}`}>{k.val}</div>
            <div className="users-kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="fsp-card users-section">
        <div className="filter-toolbar">
          <div className="filter-search">
            <svg className="filter-search-icon users-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, username, email or project…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" aria-label="Filter by role" value={roleFilter} onChange={(e) => setRole(e.target.value)}>
            <option value="All">All Roles</option>
            {['Admin', 'User'].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="filter-select" aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button className="btn-icon-sm" title="Reset filters" aria-label="Reset filters" onClick={() => { setSearch(''); setRole('All'); setStatusFilter('All'); }}>
            <MdRefresh />
          </button>
          <span className="filter-count">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <DataTable
          columns={userColumns}
          data={filtered}
          pageSize={10}
          emptyMessage={loading ? 'Loading users…' : 'No users found.'}
        />
      </div>

      <div className="fsp-card users-section">
        <div className="fsp-card-header">
          <div>
            <div className="fsp-card-title">Project Assignments</div>
            <div className="users-section-sub">Each project has one user. Moving a project to another user removes the current user's access.</div>
          </div>
        </div>
        <DataTable
          columns={projectColumns}
          data={projects}
          pageSize={10}
          emptyMessage={loading ? 'Loading projects…' : 'No projects yet. Create one from the Projects page.'}
        />
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <UserModal
          mode={modal}
          user={selected}
          projects={projects}
          users={users}
          isSelf={modal === 'edit' && selected?.id === currentUser?.id}
          onSave={modal === 'add' ? handleCreate : handleUpdate}
          onClose={closeModal}
        />
      )}

      {modal === 'delete' && selected && (
        <DeleteConfirmModal
          title="Delete User"
          message={`Delete the account for "${displayName(selected)}" (@${selected.username})? Their projects will become unassigned. Project data is kept.`}
          onConfirm={handleDelete}
          onClose={closeModal}
        />
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onConfirm={runConfirmed}
          onClose={() => setConfirm(null)}
        />
      )}

      {credentials && (
        <CredentialsModal
          title={credentials.title}
          credentials={credentials.credentials}
          onClose={() => setCredentials(null)}
        />
      )}
    </div>
  );
};

export default Users;
