import './Wastage.css';
import React, { useState, useMemo, useEffect } from 'react';
import { MdFileDownload, MdRefresh, MdTrendingDown } from 'react-icons/md';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import {
  wastageByReason, wastageByCategory,
  monthlyWastageCost, categories, formatCurrency, formatDate,
} from '../services/mockData';
import api from '../services/api';

const REASON_OPTIONS = ['Expired', 'Spoilage', 'Over-preparation', 'Freezer burn', 'Contamination', 'Mold', 'Theft', 'Damaged', 'Other'];
const REASON_COLORS  = ['#EF4444','#F59E0B','#3B82F6','#8B5CF6','#10B981','#EC4899','#06B6D4','#F97316','#94A3B8'];

const Wastage = () => {
  const [entries, setEntries]     = useState([]);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [reasonFilter, setReason] = useState('All');

  useEffect(() => {
    api.get('/wastage').then(setEntries).catch(console.error);
  }, []);

  const filtered = useMemo(() => entries.filter((e) => {
    const matchSearch = !search || e.item.toLowerCase().includes(search.toLowerCase()) || e.loggedBy.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === 'All' || e.category === catFilter;
    const matchReason = reasonFilter === 'All' || e.reason === reasonFilter;
    return matchSearch && matchCat && matchReason;
  }), [entries, search, catFilter, reasonFilter]);

  const totalCost = entries.reduce((sum, e) => sum + e.costImpact, 0);
  const topReason = wastageByReason.reduce((a, b) => a.cost > b.cost ? a : b, { reason: '', cost: 0 });
  const thisWeek  = entries.filter((e) => {
    const diff = (new Date() - new Date(e.date)) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).reduce((sum, e) => sum + e.costImpact, 0);

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
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Wastage Log</h1>
          <p>Track food wastage events, identify patterns, and reduce cost impact</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary-fsp"><MdFileDownload /> Export</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Entries',     val: entries.length,          color: 'var(--primary)' },
          { label: 'Total Cost Impact', val: formatCurrency(totalCost), color: 'var(--danger)'  },
          { label: 'This Week Loss',    val: formatCurrency(thisWeek), color: 'var(--warning)' },
          { label: 'Top Reason',        val: topReason.reason,        color: 'var(--info)'    },
        ].map((s) => (
          <div key={s.label} className="fsp-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: s.label === 'Top Reason' ? 16 : 24, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
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
    </div>
  );
};

export default Wastage;