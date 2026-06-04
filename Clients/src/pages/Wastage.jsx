import './Wastage.css';
import React, { useState, useMemo, useEffect } from 'react';
import { MdAdd, MdDelete, MdFileDownload, MdRefresh, MdTrendingDown } from 'react-icons/md';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import {
  wastageByReason, wastageByCategory,
  monthlyWastageCost, categories, formatCurrency, formatDate,
} from '../data/mockData';
import api from '../services/api';

const REASON_OPTIONS = ['Expired', 'Spoilage', 'Over-preparation', 'Freezer burn', 'Contamination', 'Mold', 'Theft', 'Damaged', 'Other'];
const REASON_COLORS  = ['#EF4444','#F59E0B','#3B82F6','#8B5CF6','#10B981','#EC4899','#06B6D4','#F97316','#94A3B8'];

const INITIAL_FORM = {
  date: new Date().toISOString().split('T')[0],
  item: '', category: 'Produce', qty: '', unit: 'kg',
  reason: 'Expired', costImpact: '', loggedBy: '', notes: '',
};

const Wastage = () => {
  const [entries, setEntries]     = useState([]);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [reasonFilter, setReason] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(INITIAL_FORM);
  const [deleteId, setDeleteId]   = useState(null);

  useEffect(() => {
    api.get('/wastage').then(setEntries).catch(console.error);
  }, []);

  const filtered = useMemo(() => entries.filter((e) => {
    const matchSearch = !search || e.item.toLowerCase().includes(search.toLowerCase()) || e.loggedBy.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === 'All' || e.category === catFilter;
    const matchReason = reasonFilter === 'All' || e.reason === reasonFilter;
    return matchSearch && matchCat && matchReason;
  }), [entries, search, catFilter, reasonFilter]);

  const totalCost   = entries.reduce((sum, e) => sum + e.costImpact, 0);
  const totalQty    = entries.reduce((sum, e) => sum + e.qty, 0);
  const topReason   = wastageByReason.reduce((a, b) => a.cost > b.cost ? a : b, { reason: '', cost: 0 });
  const thisWeek    = entries.filter((e) => {
    const d = new Date(e.date);
    const now = new Date();
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).reduce((sum, e) => sum + e.costImpact, 0);

  const openAdd  = () => { setForm(INITIAL_FORM); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const handleSave = async () => {
    try {
      const newId = `WST-${Date.now()}`;
      const created = await api.post('/wastage', { id: newId, ...form });
      setEntries((prev) => [created, ...prev]);
      closeModal();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/wastage/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) { console.error(err); }
    setDeleteId(null);
  };

  const columns = [
    {
      key: 'date', label: 'Date', sortable: true,
      render: (v) => <span style={{ fontSize: 13 }}>{formatDate(v)}</span>,
    },
    {
      key: 'item', label: 'Item', sortable: true,
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{v}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{row.category}</div>
        </div>
      ),
    },
    {
      key: 'qty', label: 'Quantity', sortable: true,
      render: (v, row) => <span style={{ fontWeight: 600 }}>{v} {row.unit}</span>,
    },
    {
      key: 'reason', label: 'Reason', sortable: true,
      render: (v) => {
        const typeMap = {
          'Expired':          'danger',
          'Spoilage':         'warning',
          'Over-preparation': 'info',
          'Freezer burn':     'primary',
          'Contamination':    'danger',
          'Mold':             'warning',
        };
        return <StatusBadge label={v} type={typeMap[v] || 'neutral'} />;
      },
    },
    {
      key: 'costImpact', label: 'Cost Impact', sortable: true,
      render: (v) => (
        <span style={{ fontWeight: 700, color: 'var(--danger)' }}>
          -{formatCurrency(v)}
        </span>
      ),
    },
    {
      key: 'loggedBy', label: 'Logged By', sortable: true,
      render: (v) => <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{v}</span>,
    },
    {
      key: 'notes', label: 'Notes',
      render: (v) => (
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: v ? 'normal' : 'italic' }}>
          {v || '—'}
        </span>
      ),
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <button className="btn-icon-sm danger" onClick={() => setDeleteId(row.id)} title="Delete">
          <MdDelete />
        </button>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Wastage Log</h1>
          <p>Track food wastage events, identify patterns, and reduce cost impact</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary-fsp"><MdFileDownload /> Export</button>
          <button className="btn-primary-fsp" onClick={openAdd}><MdAdd /> Log Wastage</button>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Entries',    val: entries.length,          color: 'var(--primary)' },
          { label: 'Total Cost Impact',val: formatCurrency(totalCost), color: 'var(--danger)'  },
          { label: 'This Week Loss',   val: formatCurrency(thisWeek), color: 'var(--warning)' },
          { label: 'Top Reason',       val: topReason.reason,        color: 'var(--info)'    },
        ].map((s) => (
          <div key={s.label} className="fsp-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: s.label === 'Top Reason' ? 16 : 24, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Monthly Trend */}
        <div className="fsp-card">
          <div className="fsp-card-header">
            <div>
              <div className="fsp-card-title">Monthly Wastage Trend</div>
              <div className="fsp-card-subtitle">6-month cost (₹)</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
              <MdTrendingDown /> 18% improvement
            </div>
          </div>
          <div className="fsp-card-body">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={monthlyWastageCost} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => [`$${v}`, 'Wastage Cost']} />
                <Bar dataKey="cost" fill="#EF4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Reason */}
        <div className="fsp-card">
          <div className="fsp-card-header">
            <div>
              <div className="fsp-card-title">Wastage by Reason</div>
              <div className="fsp-card-subtitle">Cost breakdown per cause</div>
            </div>
          </div>
          <div className="fsp-card-body">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={wastageByReason} dataKey="cost" nameKey="reason"
                  cx="50%" cy="50%" outerRadius={65} paddingAngle={2}>
                  {wastageByReason.map((_, idx) => (
                    <Cell key={idx} fill={REASON_COLORS[idx % REASON_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [formatCurrency(v), 'Cost']} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 4 }}>
              {wastageByReason.map((r, idx) => (
                <div key={r.reason} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: REASON_COLORS[idx % REASON_COLORS.length] }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{r.reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* By Category */}
        <div className="fsp-card">
          <div className="fsp-card-header">
            <div>
              <div className="fsp-card-title">Wastage by Category</div>
              <div className="fsp-card-subtitle">Cost impact per food category</div>
            </div>
          </div>
          <div className="fsp-card-body">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={wastageByCategory} layout="vertical" margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={60} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Cost']} />
                <Bar dataKey="cost" fill="#F59E0B" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
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
              placeholder="Search item name or logged by…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            {['All', ...categories.filter((c) => c !== 'All Categories')].map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="filter-select" value={reasonFilter} onChange={(e) => setReason(e.target.value)}>
            {['All', ...REASON_OPTIONS].map((r) => <option key={r}>{r}</option>)}
          </select>
          <button className="btn-icon-sm" onClick={() => { setSearch(''); setCatFilter('All'); setReason('All'); }} title="Reset">
            <MdRefresh />
          </button>
          <span className="filter-count">{filtered.length} of {entries.length} records</span>
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          pageSize={10}
          emptyMessage="No wastage records match your filters."
        />
      </div>

      {/* Log Wastage Modal */}
      <Modal
        show={showModal}
        onClose={closeModal}
        title="Log Wastage Event"
        size="md"
        footer={
          <>
            <button className="btn-secondary-fsp" onClick={closeModal}>Cancel</button>
            <button className="btn-primary-fsp" onClick={handleSave}>Log Wastage</button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
          <div>
            <label className="fsp-label">Date *</label>
            <input className="fsp-input" type="date" value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="fsp-label">Category</label>
            <select className="fsp-select" value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {categories.filter((c) => c !== 'All Categories').map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="fsp-label">Item Name *</label>
            <input className="fsp-input" value={form.item}
              onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
              placeholder="e.g. Roma Tomatoes" />
          </div>
          <div>
            <label className="fsp-label">Quantity</label>
            <input className="fsp-input" type="number" step="0.1" value={form.qty}
              onChange={(e) => setForm((f) => ({ ...f, qty: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="fsp-label">Unit</label>
            <select className="fsp-select" value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
              {['kg', 'g', 'L', 'mL', 'doz', 'pcs', 'ctn'].map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="fsp-label">Reason</label>
            <select className="fsp-select" value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}>
              {REASON_OPTIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="fsp-label">Cost Impact (₹)</label>
            <input className="fsp-input" type="number" step="0.01" value={form.costImpact}
              onChange={(e) => setForm((f) => ({ ...f, costImpact: Number(e.target.value) }))}
              placeholder="0.00" />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="fsp-label">Logged By</label>
            <input className="fsp-input" value={form.loggedBy}
              onChange={(e) => setForm((f) => ({ ...f, loggedBy: e.target.value }))}
              placeholder="e.g. Chef Marco" />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="fsp-label">Notes</label>
            <textarea className="fsp-textarea" value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Additional context or notes…" />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        show={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Wastage Record"
        size="sm"
        footer={
          <>
            <button className="btn-secondary-fsp" onClick={() => setDeleteId(null)}>Cancel</button>
            <button className="btn-danger-fsp" onClick={() => handleDelete(deleteId)}>Delete Record</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          Are you sure you want to delete this wastage record? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Wastage;
