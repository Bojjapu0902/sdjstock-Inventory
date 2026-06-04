import './Suppliers.css';
import React, { useState, useMemo, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdVisibility, MdStar, MdRefresh, MdFileDownload } from 'react-icons/md';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { getSupplierStatusType, formatCurrency } from '../data/mockData';
import api from '../services/api';

const INITIAL_FORM = {
  name: '', category: '', contact: '', email: '', phone: '',
  city: '', country: 'USA', rating: 4.0, status: 'Active',
  paymentTerms: 'Net 30', since: new Date().toISOString().split('T')[0],
  totalOrders: 0, totalSpend: 0,
};

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
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState(INITIAL_FORM);
  const [viewItem, setViewItem]   = useState(null);
  const [deleteId, setDeleteId]   = useState(null);

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

  const activeCount   = items.filter((s) => s.status === 'Active').length;
  const onHoldCount   = items.filter((s) => s.status === 'On Hold').length;
  const totalSpend    = items.reduce((sum, s) => sum + s.totalSpend, 0);
  const avgRating     = (items.reduce((sum, s) => sum + s.rating, 0) / items.length).toFixed(1);

  const openAdd   = () => { setEditItem(null); setForm(INITIAL_FORM); setShowModal(true); };
  const openEdit  = (s)  => { setEditItem(s); setForm({ ...s }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditItem(null); };

  const handleSave = async () => {
    try {
      if (editItem) {
        const updated = await api.put(`/suppliers/${editItem.id}`, form);
        setItems((prev) => prev.map((s) => s.id === editItem.id ? updated : s));
      } else {
        const newId = `SUP-${String(Date.now()).slice(-6)}`;
        const created = await api.post('/suppliers', { id: newId, ...form });
        setItems((prev) => [...prev, created]);
      }
      closeModal();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/suppliers/${id}`);
      setItems((prev) => prev.filter((s) => s.id !== id));
    } catch (err) { console.error(err); }
    setDeleteId(null);
  };

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
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-icon-sm" onClick={() => setViewItem(row)} title="View">
            <MdVisibility />
          </button>
          <button className="btn-icon-sm" onClick={() => openEdit(row)} title="Edit">
            <MdEdit />
          </button>
          <button className="btn-icon-sm danger" onClick={() => setDeleteId(row.id)} title="Delete">
            <MdDelete />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Suppliers</h1>
          <p>Manage your supplier directory, contacts, and performance ratings</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary-fsp"><MdFileDownload /> Export</button>
          <button className="btn-primary-fsp" onClick={openAdd}><MdAdd /> Add Supplier</button>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Suppliers', val: items.length,         color: 'var(--primary)'  },
          { label: 'Active',          val: activeCount,           color: 'var(--success)'  },
          { label: 'On Hold',         val: onHoldCount,           color: 'var(--warning)'  },
          { label: 'Total Spend',     val: formatCurrency(totalSpend), color: 'var(--info)' },
        ].map((s) => (
          <div key={s.label} className="fsp-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
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

      {/* Add / Edit Modal */}
      <Modal
        show={showModal}
        onClose={closeModal}
        title={editItem ? `Edit Supplier — ${editItem.name}` : 'Add New Supplier'}
        size="lg"
        footer={
          <>
            <button className="btn-secondary-fsp" onClick={closeModal}>Cancel</button>
            <button className="btn-primary-fsp" onClick={handleSave}>
              {editItem ? 'Save Changes' : 'Add Supplier'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="fsp-label">Supplier Name *</label>
            <input className="fsp-input" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. AgroSource Ltd" />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="fsp-label">Category</label>
            <input className="fsp-input" value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="e.g. Grains & Cereals" />
          </div>
          <div>
            <label className="fsp-label">Contact Name</label>
            <input className="fsp-input" value={form.contact}
              onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} />
          </div>
          <div>
            <label className="fsp-label">Email</label>
            <input className="fsp-input" type="email" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="fsp-label">Phone</label>
            <input className="fsp-input" value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="fsp-label">City</label>
            <input className="fsp-input" value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </div>
          <div>
            <label className="fsp-label">Rating (1–5)</label>
            <input className="fsp-input" type="number" min="1" max="5" step="0.1" value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="fsp-label">Payment Terms</label>
            <select className="fsp-select" value={form.paymentTerms}
              onChange={(e) => setForm((f) => ({ ...f, paymentTerms: e.target.value }))}>
              {['Net 7', 'Net 14', 'Net 15', 'Net 21', 'Net 30', 'Net 45', 'COD'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="fsp-label">Status</label>
            <select className="fsp-select" value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              {['Active', 'On Hold', 'Inactive'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="fsp-label">Partner Since</label>
            <input className="fsp-input" type="date" value={form.since}
              onChange={(e) => setForm((f) => ({ ...f, since: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      {viewItem && (
        <Modal
          show={!!viewItem}
          onClose={() => setViewItem(null)}
          title={viewItem.name}
          size="md"
          footer={
            <>
              <button className="btn-secondary-fsp" onClick={() => setViewItem(null)}>Close</button>
              <button className="btn-primary-fsp" onClick={() => { openEdit(viewItem); setViewItem(null); }}>Edit Supplier</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0 16px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'var(--primary-pale)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 22,
              }}>
                {viewItem.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{viewItem.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{viewItem.category}</div>
                <StarRating rating={viewItem.rating} />
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <StatusBadge label={viewItem.status} type={getSupplierStatusType(viewItem.status)} />
              </div>
            </div>
            {[
              ['Contact',       viewItem.contact],
              ['Email',         viewItem.email],
              ['Phone',         viewItem.phone],
              ['Location',      `${viewItem.city}, ${viewItem.country}`],
              ['Payment Terms', viewItem.paymentTerms],
              ['Partner Since', viewItem.since],
              ['Total Orders',  viewItem.totalOrders],
              ['Total Spend',   formatCurrency(viewItem.totalSpend)],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', paddingBottom: 10, alignItems: 'center' }}>
                <span style={{ width: 140, fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 500 }}>{val}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      <Modal
        show={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Remove Supplier"
        size="sm"
        footer={
          <>
            <button className="btn-secondary-fsp" onClick={() => setDeleteId(null)}>Cancel</button>
            <button className="btn-danger-fsp" onClick={() => handleDelete(deleteId)}>Remove Supplier</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          Are you sure you want to remove this supplier from your directory? Existing orders linked to them will not be affected.
        </p>
      </Modal>
    </div>
  );
};

export default Suppliers;
