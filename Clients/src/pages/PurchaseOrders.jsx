import './PurchaseOrders.css';
import React, { useState, useMemo, useEffect } from 'react';
import { MdFileDownload, MdRefresh } from 'react-icons/md';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import { poStatusSummary, getPOStatusType, formatCurrency, formatDate } from '../services/mockData';
import api from '../services/api';

const PurchaseOrders = () => {
  const [orders, setOrders]       = useState([]);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('All');

  useEffect(() => {
    api.get('/purchase-orders').then(setOrders).catch(console.error);
  }, []);

  const filtered = useMemo(() => orders.filter((o) => {
    const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) || o.supplier.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchSearch && matchStatus;
  }), [orders, search, statusFilter]);

  const totalOrders   = orders.length;
  const totalSpend    = orders.reduce((sum, o) => sum + o.totalValue, 0);
  const pendingOrders = orders.filter((o) => ['Draft', 'Approved', 'Processing', 'In Transit'].includes(o.status)).length;
  const delivered     = orders.filter((o) => o.status === 'Delivered').length;

  const columns = [
    {
      key: 'id', label: 'PO Number', sortable: true,
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 700, color: 'var(--primary)' }}>{v}</span>
      ),
    },
    {
      key: 'supplier', label: 'Supplier', sortable: true,
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{v}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{row.items} item{row.items !== 1 ? 's' : ''}</div>
        </div>
      ),
    },
    {
      key: 'date', label: 'Order Date', sortable: true,
      render: (v) => <span style={{ fontSize: 13 }}>{formatDate(v)}</span>,
    },
    {
      key: 'deliveryDate', label: 'Expected Delivery', sortable: true,
      render: (v) => <span style={{ fontSize: 13 }}>{formatDate(v)}</span>,
    },
    {
      key: 'totalValue', label: 'Total Value', sortable: true,
      render: (v) => <span style={{ fontWeight: 700, fontSize: 14 }}>{formatCurrency(v)}</span>,
    },
    {
      key: 'paymentStatus', label: 'Payment', sortable: true,
      render: (v) => (
        <StatusBadge
          label={v}
          type={v === 'Paid' ? 'success' : v === 'Pending' ? 'warning' : 'danger'}
        />
      ),
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (v) => <StatusBadge label={v} type={getPOStatusType(v)} />,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Purchase Orders</h1>
          <p>Track all supplier purchase orders</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary-fsp"><MdFileDownload /> Export</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Orders',  val: totalOrders,               color: 'var(--primary)' },
          { label: 'Active Orders', val: pendingOrders,             color: 'var(--warning)' },
          { label: 'Delivered',     val: delivered,                 color: 'var(--success)' },
          { label: 'Total Spend',   val: formatCurrency(totalSpend), color: 'var(--info)'   },
        ].map((s) => (
          <div key={s.label} className="fsp-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* PO Status Pipeline + Chart Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, marginBottom: 16 }}>
        <div className="fsp-card">
          <div className="fsp-card-header">
            <div>
              <div className="fsp-card-title">Order Pipeline</div>
              <div className="fsp-card-subtitle">Current status breakdown of all purchase orders</div>
            </div>
          </div>
          <div className="fsp-card-body">
            <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
              {poStatusSummary.map((s, idx) => (
                <div key={s.status} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                  {idx > 0 && (
                    <div style={{ position: 'absolute', left: 0, top: '28px', width: '50%', height: 2, background: 'var(--border-color)', zIndex: 0 }} />
                  )}
                  {idx < poStatusSummary.length - 1 && (
                    <div style={{ position: 'absolute', right: 0, top: '28px', width: '50%', height: 2, background: 'var(--border-color)', zIndex: 0 }} />
                  )}
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: s.color + '20', border: `2px solid ${s.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 10px', position: 'relative', zIndex: 1,
                    fontSize: 20, fontWeight: 800, color: s.color,
                  }}>
                    {s.count}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{s.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="fsp-card">
          <div className="fsp-card-header">
            <div>
              <div className="fsp-card-title">Order Value by Supplier</div>
              <div className="fsp-card-subtitle">Top suppliers this month</div>
            </div>
          </div>
          <div className="fsp-card-body">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={[...orders]
                  .reduce((acc, o) => {
                    const ex = acc.find((a) => a.supplier === o.supplier.split(' ')[0]);
                    if (ex) ex.value += o.totalValue;
                    else acc.push({ supplier: o.supplier.split(' ')[0], value: o.totalValue });
                    return acc;
                  }, [])
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 5)}
                margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="supplier" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Total']} />
                <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
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
              placeholder="Search PO number or supplier…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
            {['All', 'Draft', 'Approved', 'Processing', 'In Transit', 'Delivered', 'Cancelled'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button className="btn-icon-sm" onClick={() => { setSearch(''); setStatus('All'); }} title="Reset">
            <MdRefresh />
          </button>
          <span className="filter-count">{filtered.length} of {orders.length} orders</span>
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          pageSize={10}
          emptyMessage="No purchase orders match your filters."
        />
      </div>
    </div>
  );
};

export default PurchaseOrders;