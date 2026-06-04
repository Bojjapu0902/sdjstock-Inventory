import './PurchaseOrders.css';
import React, { useState, useMemo } from 'react';
import { MdAdd, MdFileDownload, MdEdit, MdDelete, MdVisibility, MdRefresh } from 'react-icons/md';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { purchaseOrders, poStatusSummary, suppliers, getPOStatusType, formatCurrency, formatDate } from '../data/mockData';

const INITIAL_PO = {
  supplier: 'AgroSource Ltd',
  date: new Date().toISOString().split('T')[0],
  deliveryDate: '',
  items: 1,
  totalValue: '',
  notes: '',
  status: 'Draft',
  paymentStatus: 'Unpaid',
};

const PurchaseOrders = () => {
  const [orders, setOrders]       = useState(purchaseOrders);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editPO, setEditPO]       = useState(null);
  const [form, setForm]           = useState(INITIAL_PO);
  const [viewPO, setViewPO]       = useState(null);

  const filtered = useMemo(() => orders.filter((o) => {
    const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) || o.supplier.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchSearch && matchStatus;
  }), [orders, search, statusFilter]);

  const totalOrders   = orders.length;
  const totalSpend    = orders.reduce((sum, o) => sum + o.totalValue, 0);
  const pendingOrders = orders.filter((o) => ['Draft', 'Approved', 'Processing', 'In Transit'].includes(o.status)).length;
  const delivered     = orders.filter((o) => o.status === 'Delivered').length;

  const openAdd  = () => { setEditPO(null); setForm(INITIAL_PO); setShowModal(true); };
  const openEdit = (po) => { setEditPO(po); setForm({ ...po }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditPO(null); };

  const handleSave = () => {
    if (editPO) {
      setOrders((prev) => prev.map((o) => o.id === editPO.id ? { ...o, ...form } : o));
    } else {
      const newId = `PO-2024-0${String(orders.length + 1).padStart(2, '0')}`;
      setOrders((prev) => [{ id: newId, ...form }, ...prev]);
    }
    closeModal();
  };

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
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-icon-sm" onClick={() => setViewPO(row)} title="View Details">
            <MdVisibility />
          </button>
          <button className="btn-icon-sm" onClick={() => openEdit(row)} title="Edit">
            <MdEdit />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Purchase Orders</h1>
          <p>Create, manage, and track all supplier purchase orders</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary-fsp"><MdFileDownload /> Export</button>
          <button className="btn-primary-fsp" onClick={openAdd}><MdAdd /> New Order</button>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Orders',   val: totalOrders,             color: 'var(--primary)', fmtType: 'num' },
          { label: 'Active Orders',  val: pendingOrders,           color: 'var(--warning)', fmtType: 'num' },
          { label: 'Delivered',      val: delivered,               color: 'var(--success)', fmtType: 'num' },
          { label: 'Total Spend',    val: formatCurrency(totalSpend), color: 'var(--info)', fmtType: 'str' },
        ].map((s) => (
          <div key={s.label} className="fsp-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* PO Status Pipeline + Chart Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, marginBottom: 16 }}>
        {/* Status Pipeline */}
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
                  {/* Connector line */}
                  {idx > 0 && (
                    <div style={{
                      position: 'absolute', left: 0, top: '28px',
                      width: '50%', height: 2, background: 'var(--border-color)', zIndex: 0,
                    }} />
                  )}
                  {idx < poStatusSummary.length - 1 && (
                    <div style={{
                      position: 'absolute', right: 0, top: '28px',
                      width: '50%', height: 2, background: 'var(--border-color)', zIndex: 0,
                    }} />
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

        {/* Order value by supplier chart */}
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

      {/* Table Card */}
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

      {/* Create / Edit PO Modal */}
      <Modal
        show={showModal}
        onClose={closeModal}
        title={editPO ? `Edit PO — ${editPO.id}` : 'Create Purchase Order'}
        size="md"
        footer={
          <>
            <button className="btn-secondary-fsp" onClick={closeModal}>Cancel</button>
            <button className="btn-primary-fsp" onClick={handleSave}>
              {editPO ? 'Save Changes' : 'Create Order'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="fsp-label">Supplier *</label>
            <select className="fsp-select" value={form.supplier}
              onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}>
              {suppliers.map((s) => <option key={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="fsp-label">Order Date</label>
            <input className="fsp-input" type="date" value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="fsp-label">Expected Delivery</label>
            <input className="fsp-input" type="date" value={form.deliveryDate}
              onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))} />
          </div>
          <div>
            <label className="fsp-label">Number of Items</label>
            <input className="fsp-input" type="number" min="1" value={form.items}
              onChange={(e) => setForm((f) => ({ ...f, items: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="fsp-label">Total Value (₹)</label>
            <input className="fsp-input" type="number" step="0.01" value={form.totalValue}
              onChange={(e) => setForm((f) => ({ ...f, totalValue: Number(e.target.value) }))}
              placeholder="0.00" />
          </div>
          <div>
            <label className="fsp-label">Order Status</label>
            <select className="fsp-select" value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              {['Draft', 'Approved', 'Processing', 'In Transit', 'Delivered', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="fsp-label">Payment Status</label>
            <select className="fsp-select" value={form.paymentStatus}
              onChange={(e) => setForm((f) => ({ ...f, paymentStatus: e.target.value }))}>
              {['Unpaid', 'Pending', 'Paid'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="fsp-label">Notes</label>
            <textarea className="fsp-textarea" value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Order notes or instructions…" />
          </div>
        </div>
      </Modal>

      {/* View PO Modal */}
      {viewPO && (
        <Modal
          show={!!viewPO}
          onClose={() => setViewPO(null)}
          title={`Purchase Order — ${viewPO.id}`}
          size="md"
          footer={<button className="btn-secondary-fsp" onClick={() => setViewPO(null)}>Close</button>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['Supplier',          viewPO.supplier],
              ['Order Date',        formatDate(viewPO.date)],
              ['Expected Delivery', formatDate(viewPO.deliveryDate)],
              ['Total Items',       viewPO.items],
              ['Total Value',       formatCurrency(viewPO.totalValue)],
              ['Payment Status',    viewPO.paymentStatus],
              ['Notes',             viewPO.notes || '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', paddingBottom: 10 }}>
                <span style={{ width: 160, fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 500 }}>{val}</span>
              </div>
            ))}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', paddingBottom: 10 }}>
              <span style={{ width: 160, fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>Status</span>
              <StatusBadge label={viewPO.status} type={getPOStatusType(viewPO.status)} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PurchaseOrders;
