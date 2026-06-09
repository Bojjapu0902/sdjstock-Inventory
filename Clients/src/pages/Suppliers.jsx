import './Suppliers.css';
import React, { useState, useMemo, useEffect } from 'react';
import { MdStar, MdRefresh, MdFileDownload } from 'react-icons/md';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import { getSupplierStatusType, formatCurrency } from '../services/mockData';
import api from '../services/api';

const StarRating = ({ rating }) => (
  <div className="star-rating">
    {[1, 2, 3, 4, 5].map((s) => (
      <MdStar
        key={s}
        style={{
          color: s <= Math.round(rating) ? 'var(--warning)' : 'var(--border-color)',
          fontSize: 14,
        }}
      />
    ))}
    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>{rating.toFixed(1)}</span>
  </div>
);

const Suppliers = () => {
  const [items, setItems]         = useState([]);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('All');

  useEffect(() => {
    api.get('/suppliers').then(setItems).catch(console.error);
  }, []);

  const filtered = useMemo(() => items.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.contact.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchSearch && matchStatus;
  }), [items, search, statusFilter]);

  const activeCount = items.filter((s) => s.status === 'Active').length;
  const onHoldCount = items.filter((s) => s.status === 'On Hold').length;
  const totalSpend  = items.reduce((sum, s) => sum + s.totalSpend, 0);

  const columns = [
    {
      key: 'name', label: 'Supplier', sortable: true,
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'var(--primary-pale)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 14, flexShrink: 0,
          }}>
            {v.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{v}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{row.category}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact', label: 'Contact', sortable: true,
      render: (v, row) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{row.email}</div>
        </div>
      ),
    },
    {
      key: 'phone', label: 'Phone',
      render: (v) => <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{v}</span>,
    },
    {
      key: 'city', label: 'Location', sortable: true,
      render: (v, row) => <span style={{ fontSize: 13 }}>{v}, {row.country}</span>,
    },
    {
      key: 'rating', label: 'Rating', sortable: true,
      render: (v) => <StarRating rating={v} />,
    },
    {
      key: 'totalOrders', label: 'Orders', sortable: true,
      render: (v) => <span style={{ fontWeight: 700 }}>{v}</span>,
    },
    {
      key: 'totalSpend', label: 'Total Spend', sortable: true,
      render: (v) => <span style={{ fontWeight: 700 }}>{formatCurrency(v)}</span>,
    },
    {
      key: 'paymentTerms', label: 'Terms',
      render: (v) => (
        <span style={{
          padding: '2px 8px', borderRadius: 20, fontSize: 11,
          background: 'var(--primary-pale)', color: 'var(--primary)', fontWeight: 700,
        }}>{v}</span>
      ),
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (v) => <StatusBadge label={v} type={getSupplierStatusType(v)} />,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Suppliers</h1>
          <p>View your supplier directory, contacts, and performance ratings</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary-fsp"><MdFileDownload /> Export</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Suppliers', val: items.length,              color: 'var(--primary)'  },
          { label: 'Active',          val: activeCount,               color: 'var(--success)'  },
          { label: 'On Hold',         val: onHoldCount,               color: 'var(--warning)'  },
          { label: 'Total Spend',     val: formatCurrency(totalSpend), color: 'var(--info)'     },
        ].map((s) => (
          <div key={s.label} className="fsp-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
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
              placeholder="Search supplier, contact, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
            {['All', 'Active', 'On Hold', 'Inactive'].map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="btn-icon-sm" onClick={() => { setSearch(''); setStatus('All'); }} title="Reset">
            <MdRefresh />
          </button>
          <span className="filter-count">{filtered.length} of {items.length} suppliers</span>
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          pageSize={10}
          selectable
          emptyMessage="No suppliers match your filters."
        />
      </div>
    </div>
  );
};

export default Suppliers;