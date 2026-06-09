import React, { useState, useMemo, useEffect } from 'react';
import './Users.css';
import {
  MdPerson, MdAdminPanelSettings, MdRefresh,
} from 'react-icons/md';
import DataTable from '../components/common/DataTable';
import api from '../services/api';

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

const Users = () => {
  const [users, setUsers]     = useState([]);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRole] = useState('All');

  useEffect(() => {
    api.get('/users').then(setUsers).catch(console.error);
  }, []);

  const adminCount   = users.filter((u) => u.role === 'Admin').length;
  const projectCount = users.filter((u) => u.role === 'User').length;

  const filtered = useMemo(() => users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      u.username.toLowerCase().includes(q) ||
      (u.name  || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchRole;
  }), [users, search, roleFilter]);

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
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>User Management</h1>
          <p>View admin and project user accounts</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary-fsp" onClick={() => api.get('/users').then(setUsers).catch(console.error)}>
            <MdRefresh /> Refresh
          </button>
        </div>
      </div>

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
          <button className="btn-icon-sm" title="Reset" onClick={() => { setSearch(''); setRole('All'); }}>
            <MdRefresh />
          </button>
          <span className="filter-count">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <DataTable columns={columns} data={filtered} pageSize={10} emptyMessage="No users found." />
      </div>
    </div>
  );
};

export default Users;