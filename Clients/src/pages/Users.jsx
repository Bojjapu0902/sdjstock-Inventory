import React, { useState, useMemo, useEffect } from 'react';
import './Users.css';
import {
  MdAdd, MdEdit, MdDelete, MdPerson, MdAdminPanelSettings,
  MdRefresh, MdVisibility, MdVisibilityOff,
} from 'react-icons/md';
import DataTable from '../components/common/DataTable';
import Modal     from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

/* ── helpers ─────────────────────────────────────────── */
const ROLES = ['Admin', 'User'];

const INIT_FORM = {
  name: '', username: '', password: '', role: 'User',
  email: '', phone: '', projectId: '',
};

const RoleBadge = ({ role }) => {
  const isAdmin = role === 'Admin';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
      background: isAdmin ? 'var(--primary-pale)' : 'var(--success-bg)',
      color:      isAdmin ? 'var(--primary-dark)' : '#065F46',
      border:     `1px solid ${isAdmin ? 'var(--primary-lighter)' : 'rgba(16,185,129,0.2)'}`,
    }}>
      {isAdmin ? <MdAdminPanelSettings size={13} /> : <MdPerson size={13} />}
      {role}
    </span>
  );
};

const Avatar = ({ name, role, size = 36 }) => {
  const isAdmin = role === 'Admin';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: isAdmin ? 'var(--primary-pale)' : 'var(--success-bg)',
      color:      isAdmin ? 'var(--primary)'      : 'var(--success)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.36,
    }}>
      {(name || '?').slice(0, 2).toUpperCase()}
    </div>
  );
};

/* ── component ───────────────────────────────────────── */
const Users = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers]       = useState([]);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRole]   = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm]         = useState(INIT_FORM);
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  useEffect(() => {
    api.get('/users').then(setUsers).catch(console.error);
  }, []);

  /* ── counts ────────────────────────────────────────── */
  const adminCount   = users.filter((u) => u.role === 'Admin').length;
  const projectCount = users.filter((u) => u.role === 'User').length;

  /* ── filter ────────────────────────────────────────── */
  const filtered = useMemo(() => users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      u.username.toLowerCase().includes(q) ||
      (u.name  || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchRole;
  }), [users, search, roleFilter]);

  /* ── modal ─────────────────────────────────────────── */
  const openAdd = () => {
    setEditItem(null); setForm(INIT_FORM); setFormError(''); setShowPass(false); setShowModal(true);
  };
  const openEdit = (u) => {
    setEditItem(u);
    setForm({ name: u.name || '', username: u.username, password: u.password,
              role: u.role, email: u.email || '', phone: u.phone || '', projectId: u.projectId || '' });
    setFormError(''); setShowPass(false); setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditItem(null); };
  const handleField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  /* ── save ──────────────────────────────────────────── */
  const handleSave = async () => {
    try {
      if (editItem) {
        if (!form.username.trim()) { setFormError('Username is required.'); return; }
        const payload = {
          name:      form.name.trim() || form.username.trim().toLowerCase(),
          username:  form.username.trim().toLowerCase(),
          role:      form.role,
          email:     form.email.trim(),
          phone:     form.phone.trim(),
          projectId: form.role === 'Admin' ? null : (form.projectId.trim() || editItem.projectId || null),
        };
        if (form.password.trim()) payload.password = form.password.trim();
        const updated = await api.put(`/users/${editItem.id}`, payload);
        setUsers((prev) => prev.map((u) => u.id === editItem.id ? updated : u));
      } else {
        if (!form.username.trim() || !form.password.trim()) { setFormError('Username and password are required.'); return; }
        const created = await api.post('/users', form);
        setUsers((prev) => [...prev, created]);
      }
      closeModal();
    } catch (err) { setFormError(err.message || 'Save failed'); }
  };

  /* ── delete ────────────────────────────────────────── */
  const handleDelete = async () => {
    try {
      await api.delete(`/users/${deleteId}`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteId));
    } catch (err) { console.error(err); }
    setDeleteId(null);
  };

  const canDelete = (u) => u.id !== currentUser?.id && u.id !== 'USR-000';

  /* ── columns ───────────────────────────────────────── */
  const columns = [
    { key: 'id', label: 'User ID', sortable: true, width: 110 },
    {
      key: 'name', label: 'Name', sortable: true,
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={val || row.username} role={row.role} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{val || row.username}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>@{row.username}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role', label: 'Role', sortable: true,
      render: (val) => <RoleBadge role={val} />,
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
        ? <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: 'var(--primary-pale)', color: 'var(--primary)', fontWeight: 700 }}>{val}</span>
        : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>,
    },
    { key: 'createdAt', label: 'Created', sortable: true },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-icon-sm" title="View"   onClick={() => setViewItem(row)}><MdVisibility /></button>
          <button className="btn-icon-sm" title="Edit"   onClick={() => openEdit(row)}><MdEdit /></button>
          {canDelete(row) && (
            <button className="btn-icon-sm danger" title="Delete" onClick={() => setDeleteId(row.id)}><MdDelete /></button>
          )}
        </div>
      ),
    },
  ];

  /* ── render ────────────────────────────────────────── */
  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>User Management</h1>
          <p>Manage admin and project user accounts</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary-fsp" onClick={() => api.get('/users').then(setUsers).catch(console.error)}>
            <MdRefresh /> Refresh
          </button>
          <button className="btn-primary-fsp" onClick={openAdd}>
            <MdAdd /> Add User
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Users',   val: users.length, color: 'var(--primary)' },
          { label: 'Admins',        val: adminCount,   color: '#7C3AED'        },
          { label: 'Project Users', val: projectCount, color: 'var(--success)' },
        ].map((k) => (
          <div key={k.label} className="fsp-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color, letterSpacing: -1 }}>{k.val}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Table Card */}
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
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button className="btn-icon-sm" title="Reset" onClick={() => { setSearch(''); setRole('All'); }}>
            <MdRefresh />
          </button>
          <span className="filter-count">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <DataTable columns={columns} data={filtered} pageSize={10} emptyMessage="No users found." />
      </div>

      {/* ── Create / Edit Modal ── */}
      <Modal
        show={showModal}
        onClose={closeModal}
        title={editItem ? 'Edit User' : 'Add New User'}
        size="md"
        footer={
          <>
            <button className="btn-secondary-fsp" onClick={closeModal}>Cancel</button>
            <button className="btn-primary-fsp" onClick={handleSave}>
              {editItem ? 'Save Changes' : 'Create User'}
            </button>
          </>
        }
      >
        {formError && (
          <div style={{
            padding: '10px 14px', marginBottom: 16, borderRadius: 8,
            background: 'var(--danger-bg)', color: 'var(--danger)',
            border: '1px solid rgba(239,68,68,0.25)', fontSize: 13,
          }}>
            {formError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="fsp-label">Full Name</label>
            <input className="fsp-input" name="name" value={form.name} onChange={handleField} placeholder="Display name" />
          </div>

          <div>
            <label className="fsp-label">Username *</label>
            <input className="fsp-input" name="username" value={form.username} onChange={handleField} placeholder="Login username" />
          </div>

          <div>
            <label className="fsp-label">Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                className="fsp-input"
                name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={handleField}
                placeholder="Password"
                style={{ paddingRight: 38 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                }}
              >
                {showPass ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="fsp-label">Role</label>
            <select className="fsp-select" name="role" value={form.role} onChange={handleField}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="fsp-label">Email</label>
            <input className="fsp-input" name="email" value={form.email} onChange={handleField} placeholder="user@example.com" />
          </div>

          <div>
            <label className="fsp-label">Phone</label>
            <input className="fsp-input" name="phone" value={form.phone} onChange={handleField} placeholder="+91 XXXXX XXXXX" />
          </div>

          {form.role === 'User' && (
            <div>
              <label className="fsp-label">Project ID</label>
              <input className="fsp-input" name="projectId" value={form.projectId} onChange={handleField} placeholder="e.g. PROJ-1234" />
            </div>
          )}
        </div>
      </Modal>

      {/* ── View Modal ── */}
      <Modal
        show={!!viewItem}
        onClose={() => setViewItem(null)}
        title="User Details"
        size="sm"
        footer={<button className="btn-secondary-fsp" onClick={() => setViewItem(null)}>Close</button>}
      >
        {viewItem && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '4px 0 20px' }}>
              <Avatar name={viewItem.name || viewItem.username} role={viewItem.role} size={60} />
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>{viewItem.name || viewItem.username}</div>
              <RoleBadge role={viewItem.role} />
            </div>
            <div className="info-grid">
              {[
                ['User ID',  viewItem.id],
                ['Username', viewItem.username],
                ['Email',    viewItem.email || '—'],
                ['Phone',    viewItem.phone || '—'],
                ['Project',  viewItem.projectId || '—'],
                ['Created',  viewItem.createdAt],
              ].map(([k, v]) => (
                <div key={k} className="info-cell">
                  <span className="info-cell-label">{k}</span>
                  <span className="info-cell-value" style={{ fontSize: 13 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal
        show={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete User"
        size="sm"
        footer={
          <>
            <button className="btn-secondary-fsp" onClick={() => setDeleteId(null)}>Cancel</button>
            <button className="btn-danger-fsp" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
          Are you sure you want to delete this user? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Users;
