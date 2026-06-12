import './Projects.css';
import './AddItemModal.css';
import React, { useState, useMemo, useEffect } from 'react';
import {
  MdRefresh, MdWarehouse,
  MdLocationOn, MdPerson, MdPhone, MdEmail,
  MdInfo, MdCheckCircle, MdSearch,
  MdArrowBack, MdInbox, MdOutbox,
  MdLock, MdAdd, MdEdit, MdDelete, MdClose, MdSave,
  MdKeyboardArrowDown, MdKeyboardArrowUp, MdFileDownload,
  MdPrint,
} from 'react-icons/md';
import { useProjects }       from '../contexts/ProjectsContext';
import { useAuth }           from '../contexts/AuthContext';
import { useInventoryStock } from '../hooks/useInventoryStock';
import { exportSnapshot, nextProjectId } from '../services/projectsDb';
<<<<<<< Updated upstream
=======
import api from '../services/api';
import {
  fetchInventoryItems,
  selectInventoryItems,
  selectInventoryStatus,
  selectInventoryError,
  invalidateInventory,
} from '../store/inventorySlice';
>>>>>>> Stashed changes
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';

/* ── Constants ─────────────────────────────────────────── */
const STATUS_STYLE = {
  Active:              { bg: 'var(--success-bg)', color: 'var(--success)', border: 'rgba(16,185,129,0.2)' },
  Inactive:            { bg: 'var(--danger-bg)',  color: 'var(--danger)',  border: 'rgba(239,68,68,0.2)'  },
  'Under Maintenance': { bg: 'var(--warning-bg)', color: 'var(--warning)', border: 'rgba(245,158,11,0.2)' },
};

/* ══════════════════════════════════════════════════════════
   PROJECT MODAL  —  Add / Edit
   ══════════════════════════════════════════════════════════ */
const EMPTY_FORM = {
  name: '', location: '', address: '', description: '',
  createdAt: '', manager: '', phone: '', email: '',
  status: 'Active',
};

const ProjectModal = ({ mode, project, onSave, onClose }) => {
  const [form,   setForm]   = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && project) {
      setForm({
        name:        project.name        || '',
        location:    project.location    || '',
        address:     project.address     || '',
        description: project.description || '',
        createdAt:   project.createdAt   || '',
        manager:     project.manager     || '',
        phone:       project.phone       || '',
        email:       project.email       || '',
        status:      project.status      || 'Active',
      });
    } else {
      setForm({ ...EMPTY_FORM, createdAt: new Date().toISOString().split('T')[0] });
    }
    setErrors({});
  }, [mode, project]);

  const change = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())     errs.name     = 'Project title is required';
    if (!form.location.trim()) errs.location = 'Location is required';
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  };

  const isEdit = mode === 'edit';

  return (
    <>
      <div className="aim-backdrop" onClick={onClose} />
      <div className="aim-modal" role="dialog" aria-modal="true" style={{ width: 660 }}>

        {/* Header */}
        <div className="aim-header">
          <div className="aim-header-left">
            <div className="aim-header-icon">{isEdit ? '✏️' : '🏗️'}</div>
            <div>
              <div className="aim-title">{isEdit ? 'Edit Project' : 'Add Project'}</div>
              <div className="aim-subtitle">{isEdit ? `Updating: ${project?.name}` : 'Fill in the details for the new project'}</div>
            </div>
          </div>
          <button className="aim-close-btn" onClick={onClose} title="Close"><MdClose /></button>
        </div>

        {/* Body */}
        <form onSubmit={submit}>
          <div className="aim-body">

            {/* Project Title */}
            <div className="aim-field">
              <label>Project Title <span className="aim-required">*</span></label>
              <input
                value={form.name}
                onChange={(e) => change('name', e.target.value)}
                placeholder="Enter project name"
                className={errors.name ? 'aim-input-error' : ''}
              />
              {errors.name && <span className="aim-error-msg">{errors.name}</span>}
            </div>

            <div className="aim-form-row">
              {/* Location */}
              <div className="aim-field">
                <label>Location <span className="aim-required">*</span></label>
                <input
                  value={form.location}
                  onChange={(e) => change('location', e.target.value)}
                  placeholder="City / Area"
                  className={errors.location ? 'aim-input-error' : ''}
                />
                {errors.location && <span className="aim-error-msg">{errors.location}</span>}
              </div>

              {/* Date */}
              <div className="aim-field">
                <label>Date</label>
                <input type="date" value={form.createdAt} onChange={(e) => change('createdAt', e.target.value)} />
              </div>
            </div>

            <div className="aim-form-row">
              {/* Manager */}
              <div className="aim-field">
                <label>Manager</label>
                <input value={form.manager} onChange={(e) => change('manager', e.target.value)} placeholder="Manager name" />
              </div>

              {/* Contact No */}
              <div className="aim-field">
                <label>Contact No</label>
                <input value={form.phone} onChange={(e) => change('phone', e.target.value)} placeholder="+91 00000 00000" />
              </div>
            </div>

            <div className="aim-form-row">
              {/* Email */}
              <div className="aim-field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => change('email', e.target.value)} placeholder="manager@example.com" />
              </div>

              {/* Status */}
              <div className="aim-field">
                <label>Status</label>
                <select value={form.status} onChange={(e) => change('status', e.target.value)}>
                  {['Active', 'Inactive', 'Under Maintenance'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="aim-field">
              <label>Address</label>
              <input value={form.address} onChange={(e) => change('address', e.target.value)} placeholder="Full address" />
            </div>

            {/* Description */}
            <div className="aim-field">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => change('description', e.target.value)}
                placeholder="Project description…"
                rows={3}
                style={{ padding: '9px 12px', border: '1.5px solid var(--border-color)', borderRadius: 8, fontSize: 13.5, fontFamily: 'inherit', resize: 'vertical', outline: 'none', transition: 'border-color 0.18s' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'; }}
                onBlur={(e)  => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

          </div>

          {/* Footer */}
          <div className="aim-footer">
            <button type="button" className="aim-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="aim-btn-save" disabled={saving}>
              {saving
                ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Saving…</>
                : <><MdSave /> {isEdit ? 'Save Changes' : 'Add Project'}</>}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

/* ══════════════════════════════════════════════════════════
   INVENTORY STOCK MODAL  —  select items from DB
   ══════════════════════════════════════════════════════════ */
const ISM_TH = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: '1px solid var(--border-color)',
  whiteSpace: 'nowrap',
  background: 'var(--primary-pale)',
};
const ISM_TD = {
  padding: '8px 12px',
  verticalAlign: 'middle',
  borderBottom: '1px solid var(--border-light)',
};

const InventoryStockModal = ({ project, adminName, onSave, onClose }) => {
  const now = new Date();
  const [date,         setDate]         = useState(now.toISOString().split('T')[0]);
  const [time,         setTime]         = useState(now.toTimeString().slice(0, 5));
  const [items,        setItems]        = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadError,    setLoadError]    = useState('');
  const [selections,   setSelections]   = useState({});
  const [saving,       setSaving]       = useState(false);
  const [submitErr,    setSubmitErr]    = useState('');

  useEffect(() => {
    api.get('/inventory')
      .then((data) => {
        const active = (data || []).filter((i) => i.active !== false);
        setItems(active);
        const sel = {};
        active.forEach((item) => { sel[item.id] = { checked: false, qty: '', price: String(item.unitCost || 0), description: '' }; });
        setSelections(sel);
      })
      .catch((err) => setLoadError(err.message || 'Failed to load inventory items'))
      .finally(() => setLoadingItems(false));
  }, []);

  const toggle = (id) =>
    setSelections((p) => ({ ...p, [id]: { ...p[id], checked: !p[id].checked } }));

  const allChecked = items.length > 0 && items.every((i) => selections[i.id]?.checked);
  const toggleAll  = () => {
    const next = !allChecked;
    setSelections((p) => {
      const updated = { ...p };
      items.forEach((i) => { updated[i.id] = { ...p[i.id], checked: next }; });
      return updated;
    });
  };

  const setQty   = (id, val) => setSelections((p) => ({ ...p, [id]: { ...p[id], qty:   val } }));
  const setPrice = (id, val) => setSelections((p) => ({ ...p, [id]: { ...p[id], price: val } }));
  const setDesc  = (id, val) => setSelections((p) => ({ ...p, [id]: { ...p[id], description: val } }));

  const selectedItems = items.filter((i) => selections[i.id]?.checked);
  const grandTotal = selectedItems.reduce((sum, i) => {
    const qty   = parseFloat(selections[i.id]?.qty)   || 0;
    const price = parseFloat(selections[i.id]?.price) || 0;
    return sum + qty * price;
  }, 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedItems.length) { setSubmitErr('Please select at least one item.'); return; }
    const bad = selectedItems.find((i) => !(parseFloat(selections[i.id]?.qty) > 0));
    if (bad) { setSubmitErr(`Enter a valid quantity for: ${bad.name}`); return; }
    const overStock = selectedItems.find((i) => parseFloat(selections[i.id]?.qty) > (i.currentStock ?? 0));
    if (overStock) {
      setSubmitErr(`Insufficient stock for "${overStock.name}" — available: ${overStock.currentStock ?? 0} ${overStock.unit}, requested: ${parseFloat(selections[overStock.id]?.qty)}`);
      return;
    }
    setSubmitErr('');
    setSaving(true);
    try {
      const subItems = selectedItems.map((item) => {
        const qty  = parseFloat(selections[item.id].qty);
        const rate = parseFloat(selections[item.id].price) || 0;
        return {
          itemId:   item.id,
          itemName: item.name,
          category: item.category,
          quantity: qty,
          unit:     item.unit,
          rate,
          total:    qty * rate,
          notes:    selections[item.id].description || '',
          supplier: item.supplier || '',
        };
      });
      await onSave({
        id:         `SUB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        adminName,
        date,
        time,
        totalValue: subItems.reduce((s, i) => s + i.total, 0),
        items: subItems,
      });
    } catch (err) {
      setSubmitErr(err.message || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="aim-backdrop" onClick={onClose} />
      <div className="aim-modal" role="dialog" aria-modal="true" style={{ width: 900 }}>

        {/* Header */}
        <div className="aim-header">
          <div className="aim-header-left">
            <div className="aim-header-icon">📦</div>
            <div>
              <div className="aim-title">Add Stock</div>
              <div className="aim-subtitle">Select inventory items for: <strong>{project.name}</strong></div>
            </div>
          </div>
          <button className="aim-close-btn" onClick={onClose} title="Close"><MdClose /></button>
        </div>

        <form onSubmit={submit}>
          <div className="aim-body" style={{ padding: '16px 20px', gap: 14 }}>

            {/* Meta row — 4 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px 120px', gap: 12 }}>
              <div className="aim-field">
                <label>Project</label>
                <input value={project.name} readOnly style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', cursor: 'default' }} />
              </div>
              <div className="aim-field">
                <label>Admin</label>
                <input value={adminName} readOnly style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', cursor: 'default' }} />
              </div>
              <div className="aim-field">
                <label>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="aim-field">
                <label>Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>

            {/* Items table */}
            {loadingItems ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', verticalAlign: 'middle', marginRight: 8 }} />
                Loading inventory items…
              </div>
            ) : loadError ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--danger)', fontSize: 13 }}>{loadError}</div>
            ) : items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>No inventory items found.</div>
            ) : (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ overflowY: 'auto', maxHeight: 360 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th style={{ ...ISM_TH, width: 42, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={allChecked}
                            onChange={toggleAll}
                            style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--primary)' }}
                            title="Select / deselect all"
                          />
                        </th>
                        <th style={ISM_TH}>Item List</th>
                        <th style={{ ...ISM_TH, width: 100, textAlign: 'center' }}>Available</th>
                        <th style={{ ...ISM_TH, width: 130 }}>Quantity</th>
                        <th style={{ ...ISM_TH, width: 115 }}>Pricing (₹)</th>
                        <th style={{ ...ISM_TH, width: 125 }}>Total Price (₹)</th>
                        <th style={ISM_TH}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const sel       = selections[item.id] || {};
                        const isChecked = !!sel.checked;
                        const qty       = parseFloat(sel.qty)   || 0;
                        const price     = parseFloat(sel.price) || 0;
                        const total     = qty * price;
                        const overLimit = isChecked && qty > 0 && qty > (item.currentStock ?? 0);
                        return (
                          <tr
                            key={item.id}
                            style={{
                              background: isChecked ? (overLimit ? '#FFF5F5' : 'var(--primary-pale)') : idx % 2 === 0 ? '#fff' : 'var(--bg-main)',
                              transition: 'background 0.15s',
                              cursor: 'pointer',
                            }}
                            onClick={() => toggle(item.id)}
                          >
                            <td style={{ ...ISM_TD, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggle(item.id)}
                                style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--primary)' }}
                              />
                            </td>
                            <td style={ISM_TD}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.3 }}>{item.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{item.category} · {item.unit}</div>
                            </td>
                            {/* Available stock badge */}
                            <td style={{ ...ISM_TD, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <span style={{
                                display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 700,
                                background: (item.currentStock ?? 0) === 0 ? '#FEE2E2' : '#ECFDF5',
                                color:      (item.currentStock ?? 0) === 0 ? '#DC2626' : '#059669',
                                border:     `1px solid ${(item.currentStock ?? 0) === 0 ? 'rgba(220,38,38,0.2)' : 'rgba(5,150,105,0.2)'}`,
                              }}>
                                {item.currentStock ?? 0} {item.unit}
                              </span>
                            </td>
                            <td style={ISM_TD} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={sel.qty || ''}
                                  onChange={(e) => setQty(item.id, e.target.value)}
                                  disabled={!isChecked}
                                  placeholder="0"
                                  style={{
                                    width: 72, height: 30, padding: '0 8px',
                                    border: `1.5px solid ${overLimit ? '#DC2626' : 'var(--border-color)'}`,
                                    borderRadius: 6, fontSize: 13,
                                    outline: 'none', fontFamily: 'inherit',
                                    background: isChecked ? (overLimit ? '#FFF5F5' : '#fff') : 'var(--bg-main)',
                                    color: isChecked ? (overLimit ? '#DC2626' : 'var(--text-primary)') : 'var(--text-muted)',
                                    cursor: isChecked ? 'text' : 'not-allowed',
                                  }}
                                />
                                <span style={{ fontSize: 11, color: overLimit ? '#DC2626' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{item.unit}</span>
                              </div>
                              {overLimit && (
                                <div style={{ fontSize: 10.5, color: '#DC2626', marginTop: 2, fontWeight: 600 }}>
                                  max {item.currentStock} {item.unit}
                                </div>
                              )}
                            </td>
                            <td style={ISM_TD} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 12.5, color: 'var(--text-muted)', flexShrink: 0 }}>₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={sel.price ?? (item.unitCost || 0)}
                                  onChange={(e) => setPrice(item.id, e.target.value)}
                                  disabled={!isChecked}
                                  placeholder="0.00"
                                  style={{
                                    width: 70, height: 30, padding: '0 8px',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: 6, fontSize: 13,
                                    outline: 'none', fontFamily: 'inherit',
                                    background: isChecked ? '#fff' : 'var(--bg-main)',
                                    color: isChecked ? 'var(--text-primary)' : 'var(--text-muted)',
                                    cursor: isChecked ? 'text' : 'not-allowed',
                                  }}
                                />
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>/{item.unit}</span>
                              </div>
                            </td>
                            <td style={{ ...ISM_TD, fontWeight: 700, color: isChecked && qty > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                              {isChecked && qty > 0
                                ? `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : '—'}
                            </td>
                            <td style={ISM_TD} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={sel.description || ''}
                                onChange={(e) => setDesc(item.id, e.target.value)}
                                disabled={!isChecked}
                                placeholder="Notes / description…"
                                style={{
                                  width: '100%', height: 30, padding: '0 8px',
                                  border: '1.5px solid var(--border-color)',
                                  borderRadius: 6, fontSize: 12.5, fontFamily: 'inherit',
                                  outline: 'none', boxSizing: 'border-box',
                                  background: isChecked ? '#fff' : 'var(--bg-main)',
                                  color: isChecked ? 'var(--text-primary)' : 'var(--text-muted)',
                                  cursor: isChecked ? 'text' : 'not-allowed',
                                  minWidth: 130,
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {submitErr && (
              <div style={{ color: 'var(--danger)', fontSize: 12.5, fontWeight: 600, padding: '8px 12px', background: 'var(--danger-bg)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                {submitErr}
              </div>
            )}
          </div>

          <div className="aim-footer" style={{ justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{selectedItems.length}</span>
              {' '}item{selectedItems.length !== 1 ? 's' : ''} selected
              {selectedItems.length > 0 && (
                <span style={{ marginLeft: 10, fontWeight: 800, color: 'var(--success)', fontSize: 14 }}>
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="aim-btn-cancel" onClick={onClose}>Cancel</button>
              <button
                type="submit"
                className="aim-btn-save"
                disabled={saving || !selectedItems.length || loadingItems}
              >
                {saving
                  ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Saving…</>
                  : <><MdSave /> Submit Stock</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

/* ══════════════════════════════════════════════════════════
   EDIT SUBMISSION MODAL  —  edit an existing stock record
   ══════════════════════════════════════════════════════════ */
const EditSubmissionModal = ({ submission, onSave, onClose }) => {
  const [date,      setDate]      = useState(submission.date || '');
  const [time,      setTime]      = useState(submission.time || '');
  const [items,     setItems]     = useState(
    (submission.items || []).map((it) => ({
      ...it,
      qty:         String(it.quantity ?? it.qty ?? ''),
      price:       String(it.rate    ?? it.price ?? ''),
      description: it.notes || it.description || '',
    }))
  );
  const [saving,    setSaving]    = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  const updateItem = (idx, field, val) =>
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));

  const grandTotal = items.reduce((sum, it) => {
    const qty   = parseFloat(it.qty)   || 0;
    const price = parseFloat(it.price) || 0;
    return sum + qty * price;
  }, 0);

  const submit = async (e) => {
    e.preventDefault();
    const bad = items.find((it) => !(parseFloat(it.qty) > 0));
    if (bad) { setSubmitErr(`Enter a valid quantity for: ${bad.itemName}`); return; }
    setSubmitErr('');
    setSaving(true);
    try {
      const updatedItems = items.map((it) => {
        const qty  = parseFloat(it.qty)   || 0;
        const rate = parseFloat(it.price) || 0;
        return { ...it, quantity: qty, rate, total: qty * rate, notes: it.description || '' };
      });
      await onSave({
        ...submission,
        date,
        time,
        totalValue: updatedItems.reduce((s, i) => s + i.total, 0),
        items: updatedItems,
      });
    } catch (err) {
      setSubmitErr(err.message || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="aim-backdrop" onClick={onClose} />
      <div className="aim-modal" role="dialog" aria-modal="true" style={{ width: 900 }}>

        <div className="aim-header">
          <div className="aim-header-left">
            <div className="aim-header-icon">✏️</div>
            <div>
              <div className="aim-title">Edit Stock Record</div>
              <div className="aim-subtitle">Submitted by <strong>{submission.adminName}</strong> · {submission.items?.length || 0} items</div>
            </div>
          </div>
          <button className="aim-close-btn" onClick={onClose} title="Close"><MdClose /></button>
        </div>

        <form onSubmit={submit}>
          <div className="aim-body" style={{ padding: '16px 20px', gap: 14 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px 120px', gap: 12 }}>
              <div className="aim-field">
                <label>Submitted By</label>
                <input value={submission.adminName || '—'} readOnly style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', cursor: 'default' }} />
              </div>
              <div className="aim-field">
                <label>Record ID</label>
                <input value={submission.id || '—'} readOnly style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', cursor: 'default', fontSize: 11 }} />
              </div>
              <div className="aim-field">
                <label>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="aim-field">
                <label>Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>

            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>No items in this record.</div>
            ) : (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ overflowY: 'auto', maxHeight: 360 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th style={{ ...ISM_TH, width: 36, textAlign: 'center' }}>#</th>
                        <th style={ISM_TH}>Item List</th>
                        <th style={{ ...ISM_TH, width: 130 }}>Quantity</th>
                        <th style={{ ...ISM_TH, width: 115 }}>Pricing (₹)</th>
                        <th style={{ ...ISM_TH, width: 125 }}>Total Price (₹)</th>
                        <th style={ISM_TH}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => {
                        const qty   = parseFloat(it.qty)   || 0;
                        const price = parseFloat(it.price) || 0;
                        const total = qty * price;
                        return (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : 'var(--bg-main)' }}>
                            <td style={{ ...ISM_TD, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
                            <td style={ISM_TD}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.3 }}>{it.itemName}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{it.category} · {it.unit}</div>
                            </td>
                            <td style={ISM_TD}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <input
                                  type="number" min="0" step="any"
                                  value={it.qty}
                                  onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                                  style={{ width: 72, height: 30, padding: '0 8px', border: '1.5px solid var(--border-color)', borderRadius: 6, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                                />
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{it.unit}</span>
                              </div>
                            </td>
                            <td style={ISM_TD}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 12.5, color: 'var(--text-muted)', flexShrink: 0 }}>₹</span>
                                <input
                                  type="number" min="0" step="any"
                                  value={it.price}
                                  onChange={(e) => updateItem(idx, 'price', e.target.value)}
                                  style={{ width: 70, height: 30, padding: '0 8px', border: '1.5px solid var(--border-color)', borderRadius: 6, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                                />
                              </div>
                            </td>
                            <td style={{ ...ISM_TD, fontWeight: 700, color: qty > 0 && price > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                              {qty > 0 && price > 0
                                ? `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : '—'}
                            </td>
                            <td style={ISM_TD}>
                              <input
                                type="text"
                                value={it.description}
                                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                placeholder="Notes / description…"
                                style={{ width: '100%', height: 30, padding: '0 8px', border: '1.5px solid var(--border-color)', borderRadius: 6, fontSize: 12.5, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', minWidth: 130 }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {submitErr && (
              <div style={{ color: 'var(--danger)', fontSize: 12.5, fontWeight: 600, padding: '8px 12px', background: 'var(--danger-bg)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                {submitErr}
              </div>
            )}
          </div>

          <div className="aim-footer" style={{ justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{items.length}</span> item{items.length !== 1 ? 's' : ''}
              {items.length > 0 && (
                <span style={{ marginLeft: 10, fontWeight: 800, color: 'var(--success)', fontSize: 14 }}>
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="aim-btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="aim-btn-save" disabled={saving || items.length === 0}>
                {saving
                  ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Saving…</>
                  : <><MdSave /> Save Changes</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

/* ══════════════════════════════════════════════════════════
   PROJECT DETAIL  —  info card + two stock tabs (read-only)
   ══════════════════════════════════════════════════════════ */
const ProjectDetail = ({ project, onBack, stockReceived, stockUsed, onAddStock, onEditSubmission, onDeleteSubmission }) => {
  const [tab, setTab]               = useState('received');
  const [expandedIds, setExpandedIds] = useState(new Set());

  const sc = STATUS_STYLE[project.status] || STATUS_STYLE.Active;

  const toggleExpand = (id) =>
    setExpandedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  /* ── Excel/CSV download ── */
  const downloadExcel = () => {
    if (!stockReceived.length) return;
    const headers = ['#', 'Admin', 'Date', 'Time', 'Item Name', 'Category', 'Qty', 'Unit', 'Rate (₹)', 'Total (₹)', 'Supplier', 'Notes'];
    const rows = [];
    stockReceived.forEach((sub, si) => {
      sub.items.forEach((it) => {
        rows.push([si + 1, sub.adminName, sub.date, sub.time, it.itemName, it.category, it.quantity, it.unit, it.rate, it.total, it.supplier, it.notes || '']);
      });
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${project.name.replace(/\s+/g, '_')}_stock_received.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  /* ── Print invoice ── */
  const printInvoice = (sub) => {
    const subTotal = sub.totalValue
      ? Number(sub.totalValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : sub.items?.reduce((s, i) => s + Number(i.total || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const rows = (sub.items || []).map((it, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${it.itemName}</strong></td>
        <td>${it.category}</td>
        <td>${it.quantity} ${it.unit}</td>
        <td>₹${Number(it.rate || 0).toFixed(2)}</td>
        <td class="amount">₹${Number(it.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>${it.supplier || '—'}</td>
        <td>${it.notes || '—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Stock Receipt — ${sub.id}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #0f172a; background: #fff; padding: 32px; }
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
    @page { margin: 18mm 14mm; size: A4 landscape; }
  }
  .inv-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid #4F46E5; margin-bottom: 24px; }
  .inv-logo { display: flex; align-items: center; gap: 12px; }
  .inv-logo-icon { width: 48px; height: 48px; background: #4F46E5; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px; font-weight: 800; }
  .inv-brand { font-size: 20px; font-weight: 800; color: #1E1B4B; letter-spacing: -0.5px; }
  .inv-brand-sub { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
  .inv-meta { text-align: right; }
  .inv-title { font-size: 26px; font-weight: 800; color: #4F46E5; letter-spacing: -1px; text-transform: uppercase; }
  .inv-id { font-size: 12px; color: #64748b; margin-top: 4px; }
  .inv-date { font-size: 12px; color: #0f172a; font-weight: 600; margin-top: 2px; }
  .inv-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .inv-box { background: #f8faff; border: 1px solid #e0e7ff; border-radius: 10px; padding: 14px 18px; }
  .inv-box-title { font-size: 10px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .inv-box-row { display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 4px; }
  .inv-box-row span:first-child { color: #64748b; }
  .inv-box-row span:last-child { font-weight: 600; color: #0f172a; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12.5px; }
  thead tr { background: #1E1B4B; color: #fff; }
  thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; white-space: nowrap; }
  tbody tr:nth-child(even) { background: #f8faff; }
  tbody td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
  tfoot tr { background: #eef2ff; font-weight: 700; }
  tfoot td { padding: 10px 12px; font-size: 13px; border-top: 2px solid #4F46E5; }
  .amount { font-weight: 700; color: #059669; }
  .total-amount { font-size: 15px; color: #4F46E5; font-weight: 800; }
  .inv-footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; }
  .sig-box { border-top: 1px solid #94a3b8; padding-top: 8px; text-align: center; font-size: 11px; color: #64748b; margin-top: 40px; }
  .inv-note { margin-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; }
  .print-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 22px; background: #4F46E5; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin-bottom: 20px; }
  .print-btn:hover { background: #3730a3; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: ${sub.approvalStatus === 'approved' ? '#ECFDF5' : '#FFFBEB'}; color: ${sub.approvalStatus === 'approved' ? '#059669' : '#D97706'}; border: 1px solid ${sub.approvalStatus === 'approved' ? '#6EE7B7' : '#FCD34D'}; }
</style>
</head>
<body>
  <div class="no-print" style="margin-bottom:16px;">
    <button class="print-btn" onclick="window.print()">🖨️ Print Invoice</button>
    <button class="print-btn" style="background:#64748b;margin-left:8px;" onclick="window.close()">✕ Close</button>
  </div>
  <div class="inv-header">
    <div class="inv-logo">
      <div class="inv-logo-icon">F</div>
      <div>
        <div class="inv-brand">SDJ MARINE PVT. LTD</div>
        <div class="inv-brand-sub">Inventory Management Suite</div>
      </div>
    </div>
    <div class="inv-meta">
      <div class="inv-title">Stock Receipt</div>
      <div class="inv-id">Receipt No: ${sub.id}</div>
      <div class="inv-date">Date: ${sub.date} &nbsp;·&nbsp; Time: ${sub.time}</div>
      <div style="margin-top:6px;"><span class="status-badge">${sub.approvalStatus === 'approved' ? '✓ Approved' : '⏳ Pending'}</span></div>
    </div>
  </div>
  <div class="inv-info">
    <div class="inv-box">
      <div class="inv-box-title">Project Details</div>
      <div class="inv-box-row"><span>Project Name</span><span>${project.name}</span></div>
      <div class="inv-box-row"><span>Project ID</span><span>${project.id}</span></div>
      <div class="inv-box-row"><span>Location</span><span>${project.location || '—'}</span></div>
      <div class="inv-box-row"><span>Manager</span><span>${project.manager || '—'}</span></div>
    </div>
    <div class="inv-box">
      <div class="inv-box-title">Submission Details</div>
      <div class="inv-box-row"><span>Submitted By</span><span>${sub.adminName}</span></div>
      <div class="inv-box-row"><span>Submission Date</span><span>${sub.date}</span></div>
      <div class="inv-box-row"><span>Submission Time</span><span>${sub.time}</span></div>
      <div class="inv-box-row"><span>Total Items</span><span>${sub.items?.length || 0} line items</span></div>
    </div>
  </div>
  <table>
    <thead>
      <tr><th>#</th><th>Item Name</th><th>Category</th><th>Quantity</th><th>Unit Rate</th><th>Amount</th><th>Supplier</th><th>Notes</th></tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="5" style="text-align:right;color:#64748b;">Grand Total</td>
        <td class="total-amount">₹${subTotal}</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>
  <div class="inv-footer">
    <div><div class="sig-box">Prepared By: ${sub.adminName}</div></div>
    <div><div class="sig-box">Verified By</div></div>
    <div><div class="sig-box">Authorised Signatory</div></div>
  </div>
  <div class="inv-note">This is a system-generated stock receipt. SDJ MARINE PVT. LTD · ${new Date().getFullYear()}</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1100,height=750');
    win.document.write(html);
    win.document.close();
  };

  const totalReceived = stockReceived.reduce((s, r) => s + Number(r.quantity || 0), 0);
  const totalUsed     = stockUsed.reduce((s, r) => s + Number(r.quantity || 0), 0);

  return (
    <div>
      {/* ── Back + header ── */}
      <div className="page-header">
        <div className="page-header-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn-secondary-fsp"
            onClick={onBack}
            style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <MdArrowBack /> Back to Projects
          </button>
          <div>
            <h1 style={{ margin: 0 }}>{project.name}</h1>
            <p style={{ margin: 0 }}>{project.id} · {project.location}</p>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary-fsp" onClick={onAddStock}>
            <MdAdd /> Add Stock
          </button>
        </div>
      </div>

      {/* ── Project Info Card ── */}
      <div className="fsp-card" style={{ marginBottom: 20, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--primary-pale)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>
            <MdWarehouse />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{project.name}</span>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                {project.status}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>ID: {project.id} · Created: {project.createdAt || '—'}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Stock Received', val: stockReceived.length, sub: `${totalReceived} units total`, icon: '📥', color: 'var(--primary)' },
              { label: 'Stock Used',     val: stockUsed.length,     sub: `${totalUsed} units total`,     icon: '📤', color: 'var(--warning)' },
            ].map((k) => (
              <div key={k.label} style={{ padding: '12px 18px', borderRadius: 10, background: 'var(--bg-main)', border: '1px solid var(--border-color)', minWidth: 130, textAlign: 'center' }}>
                <div style={{ fontSize: 22 }}>{k.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: k.color, lineHeight: 1.2 }}>{k.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{k.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-light)' }}>
          {[
            { icon: <MdLocationOn />, label: 'Location',    value: project.location        },
            { icon: <MdInfo />,       label: 'Address',     value: project.address         },
            { icon: <MdPerson />,     label: 'Manager',     value: project.manager || '—'  },
            { icon: <MdPhone />,      label: 'Phone',       value: project.phone   || '—'  },
            { icon: <MdEmail />,      label: 'Email',       value: project.email   || '—'  },
            { icon: <MdInfo />,       label: 'Description', value: project.description || '—' },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--primary-pale)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, marginTop: 1 }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, marginTop: 1 }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="page-tabs">
        <button className={`page-tab ${tab === 'received' ? 'active' : ''}`} onClick={() => setTab('received')}>
          <MdInbox /> Stock Received <span className="page-tab-count">{stockReceived.length}</span>
        </button>
        <button className={`page-tab ${tab === 'used' ? 'active' : ''}`} onClick={() => setTab('used')}>
          <MdOutbox /> Stock Used <span className="page-tab-count">{stockUsed.length}</span>
        </button>
      </div>

      {/* ══ STOCK RECEIVED TAB ══ */}
      {tab === 'received' && (
        <div className="fsp-card">
          <div className="filter-toolbar">
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Stock Received</span>
            <span className="filter-count" style={{ marginLeft: 4 }}>{stockReceived.length} submission{stockReceived.length !== 1 ? 's' : ''}</span>
            {stockReceived.length > 0 && (
              <button className="btn-secondary-fsp" onClick={downloadExcel} title="Download as Excel/CSV">
                <MdFileDownload /> Download Excel
              </button>
            )}
          </div>

          {stockReceived.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 14, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--primary-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                <MdInbox style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No Stock Received Yet</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No stock received records for this project.</div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '12px 16px 16px' }}>
              {stockReceived.map((sub, idx) => {
                const isOpen = expandedIds.has(sub.id);
                const subTotal = sub.totalValue
                  ? Number(sub.totalValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : sub.items?.reduce((s, i) => s + Number(i.total || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return (
                  <div key={sub.id} style={{ marginBottom: 10, borderRadius: 12, border: `1px solid ${isOpen ? 'var(--primary)' : 'var(--border-color)'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                    <div
                      onClick={() => toggleExpand(sub.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer', background: isOpen ? 'var(--primary-pale)' : '#fff', transition: 'background 0.2s' }}
                    >
                      <div style={{ color: 'var(--primary)', fontSize: 22, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        {isOpen ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
                      </div>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: isOpen ? 'var(--primary)' : 'var(--bg-main)', color: isOpen ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>Submission #{idx + 1}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <span>👤 {sub.adminName}</span>
                          <span>📅 {sub.date}</span>
                          <span>🕐 {sub.time}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, background: 'var(--primary-pale)', color: 'var(--primary)', fontSize: 12, fontWeight: 700 }}>
                          {sub.items?.length || 0} items
                        </span>
                        <span style={{ padding: '3px 10px', borderRadius: 20, background: 'var(--success-bg)', color: 'var(--success)', fontSize: 12, fontWeight: 700 }}>
                          ₹{subTotal}
                        </span>
                        {sub.approvalStatus === 'approved' ? (
                          <span style={{ padding: '3px 10px', borderRadius: 20, background: '#ECFDF5', color: '#10B981', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MdCheckCircle size={13} /> Approved
                          </span>
                        ) : (
                          <span style={{ padding: '3px 10px', borderRadius: 20, background: '#FFFBEB', color: '#D97706', fontSize: 12, fontWeight: 700 }}>
                            ⏳ Pending
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                        <button className="btn-icon-sm" onClick={() => printInvoice(sub)} title="Print Invoice" style={{ color: 'var(--primary)' }}>
                          <MdPrint />
                        </button>
                        {sub.approvalStatus !== 'approved' && (
                          <>
                            <button
                              className="btn-icon-sm"
                              onClick={() => onEditSubmission && onEditSubmission(sub)}
                              title="Edit record"
                              style={{ color: 'var(--warning)' }}
                            >
                              <MdEdit />
                            </button>
                            <button
                              className="btn-icon-sm danger"
                              onClick={() => onDeleteSubmission && onDeleteSubmission(sub)}
                              title="Delete record"
                            >
                              <MdDelete />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isOpen && (
                      <div style={{ borderTop: '1px solid var(--border-light)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: 'var(--bg-main)' }}>
                              {[
                                '#', 'Item Name', 'Category', 'Qty', 'Rate (₹)', 'Total (₹)', 'Supplier', 'Notes',
                                ...(sub.approvalStatus === 'approved' ? ['User Status', 'User Comment'] : []),
                              ].map((h) => (
                                <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid var(--border-light)', whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(sub.items || []).map((it, i) => (
                              <tr key={it.itemId + i} style={{ background: i % 2 === 0 ? '#fff' : 'var(--bg-main)' }}>
                                <td style={{ padding: '9px 14px', color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                                <td style={{ padding: '9px 14px', fontWeight: 700 }}>{it.itemName}</td>
                                <td style={{ padding: '9px 14px' }}>
                                  <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11.5, background: 'var(--bg-main)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 600 }}>{it.category}</span>
                                </td>
                                <td style={{ padding: '9px 14px', fontWeight: 700, color: 'var(--primary)' }}>{it.quantity} <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-muted)' }}>{it.unit}</span></td>
                                <td style={{ padding: '9px 14px', color: 'var(--text-secondary)' }}>{it.rate ? `₹${Number(it.rate).toFixed(2)}` : '—'}</td>
                                <td style={{ padding: '9px 14px', fontWeight: 700, color: 'var(--success)' }}>{it.total ? `₹${Number(it.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}</td>
                                <td style={{ padding: '9px 14px', fontSize: 12.5, color: 'var(--text-secondary)' }}>{it.supplier || '—'}</td>
                                <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--text-muted)', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.notes || '—'}</td>
                                {sub.approvalStatus === 'approved' && (
                                  <>
                                    <td style={{ padding: '9px 14px' }}>
                                      {it.userApproved
                                        ? <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700, fontSize: 12 }}><MdCheckCircle /> OK</span>
                                        : <span style={{ color: '#EF4444', fontWeight: 700, fontSize: 12 }}>✗ Issue</span>}
                                    </td>
                                    <td style={{ padding: '9px 14px', fontSize: 12, color: it.userComment ? '#DC2626' : 'var(--text-muted)', fontStyle: it.userComment ? 'normal' : 'italic', maxWidth: 200 }}>
                                      {it.userComment || 'No comment'}
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: 'var(--primary-pale)', fontWeight: 700 }}>
                              <td colSpan={5} style={{ padding: '9px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
                                {sub.items?.length} item{sub.items?.length !== 1 ? 's' : ''}
                              </td>
                              <td style={{ padding: '9px 14px', color: 'var(--success)', fontSize: 13 }}>₹{subTotal}</td>
                              <td colSpan={sub.approvalStatus === 'approved' ? 4 : 2} />
                            </tr>
                          </tfoot>
                        </table>

                        {sub.approvalStatus === 'approved' && (
                          <div style={{ padding: '10px 16px', background: '#ECFDF5', borderTop: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <MdLock style={{ color: '#10B981', fontSize: 14, flexShrink: 0 }} />
                            <span style={{ color: '#059669', fontWeight: 600, fontSize: 12.5 }}>
                              Approved by {sub.approvedBy} · {new Date(sub.approvedAt).toLocaleString('en-IN')}
                            </span>
                            <span style={{ color: '#6EE7B7', fontSize: 12, marginLeft: 4 }}>
                              · {(sub.items || []).filter((it) => it.userApproved).length}/{sub.items?.length} items OK
                              {(sub.items || []).some((it) => it.userComment) && (
                                <span style={{ color: '#DC2626', marginLeft: 6, fontWeight: 600 }}>
                                  · {(sub.items || []).filter((it) => it.userComment).length} issue{(sub.items || []).filter((it) => it.userComment).length !== 1 ? 's' : ''} noted
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <div style={{ marginTop: 8, padding: '12px 16px', borderRadius: 10, background: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {stockReceived.length} submission{stockReceived.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
                  {stockReceived.reduce((s, sub) => s + (sub.items?.length || 0), 0)} total items
                </span>
                <span style={{ fontWeight: 800, color: 'var(--success)', fontSize: 14 }}>
                  Grand Total: ₹{stockReceived.reduce((s, sub) => s + Number(sub.totalValue || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ STOCK USED TAB ══ */}
      {tab === 'used' && (
        <div className="fsp-card">
          <div className="filter-toolbar">
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Stock Used Records</span>
            <span className="filter-count" style={{ marginLeft: 4 }}>{stockUsed.length} record{stockUsed.length !== 1 ? 's' : ''}</span>
          </div>

          {stockUsed.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 14, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                <MdOutbox style={{ color: 'var(--warning)' }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No Stock Used Yet</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No stock usage records for this project.</div>
              </div>
            </div>
          ) : (
            <>
              <div className="fsp-table-wrap">
                <table className="fsp-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Qty</th>
                      <th>Purpose / Used For</th>
                      <th>Date</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockUsed.map((rec, idx) => (
                      <tr key={rec.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
                        <td><div style={{ fontWeight: 700, fontSize: 13.5 }}>{rec.itemName}</div></td>
                        <td>
                          {rec.category
                            ? <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11.5, background: 'var(--bg-main)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 600 }}>{rec.category}</span>
                            : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--warning)' }}>{rec.quantity} <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-muted)' }}>{rec.unit}</span></td>
                        <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{rec.purpose || '—'}</td>
                        <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{rec.date}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rec.notes}>{rec.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-light)', fontSize: 12.5, color: 'var(--text-muted)' }}>
                {stockUsed.length} record{stockUsed.length !== 1 ? 's' : ''} · {totalUsed} units consumed total
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};


/* ══════════════════════════════════════════════════════════
   PROJECTS  —  list view
   ══════════════════════════════════════════════════════════ */
const Projects = () => {
  const { projects, stockReceived, stockUsed, addProject, updateProject, deleteProject, addStockReceived, updateStockReceived, deleteStockReceived } = useProjects();
  const { user }        = useAuth();
  const dispatch        = useDispatch();
  const { deductStock, refreshAll } = useInventoryStock();

  const [search,          setSearch]          = useState('');
  const [statusFilter,    setStatusFilter]    = useState('All');
  const [selectedProject, setSelectedProject] = useState(null);

  const [modalOpen,    setModalOpen]    = useState(false);
  const [modalMode,    setModalMode]    = useState('add');
  const [modalProject, setModalProject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [addStockProject,  setAddStockProject]  = useState(null);
  const [editSubmission,   setEditSubmission]   = useState(null); // { projectId, sub }

  const openAdd  = ()        => { setModalMode('add');  setModalProject(null);    setModalOpen(true); };
  const openEdit = (proj, e) => { e.stopPropagation();  setModalMode('edit'); setModalProject(proj); setModalOpen(true); };
  const closeModal = ()      => setModalOpen(false);

  const handleSave = async (form) => {
    if (modalMode === 'add') {
      await addProject({ ...form, id: nextProjectId() });
    } else {
      await updateProject(modalProject.id, form);
    }
    closeModal();
  };

  const handleDelete = (proj, e) => {
    e.stopPropagation();
    setDeleteConfirm({
      title:   'Delete Project',
      message: `"${proj.name}" and all its associated stock data will be permanently removed.`,
      onConfirm: async () => { await deleteProject(proj.id); },
    });
  };

  const handleToggleActive = async (proj, e) => {
    e.stopPropagation();
    const newStatus = proj.status === 'Active' ? 'Inactive' : 'Active';
    await updateProject(proj.id, { ...proj, status: newStatus });
  };

  const handleAddStock = async (submission) => {
    await addStockReceived(addStockProject.id, submission);

    // Deduct quantities from InventoryItems.currentStock and record 'out' stock record
    const ts = new Date(`${submission.date}T${submission.time}:00`).toISOString();
    await deductStock(submission.items.map((i) => ({
      itemId:       i.itemId,
      qty:          i.quantity,
      projectId:    addStockProject.id,
      projectName:  addStockProject.name,
      submissionId: submission.id,
      loggedBy:     submission.adminName,
      date:         submission.date,
      time:         submission.time,
      timestamp:    ts,
    })));

    // Write an OUT record to stock-history for each item so it appears in Stock Update History
    await Promise.all(
      submission.items.map((i) =>
        api.post(`/stock-history/${i.itemId}`, {
          timestamp: ts,
          qty:       i.quantity,
          rate:      i.rate,
          unit:      i.unit,
          desc:      i.notes || '',
          type:      'OUT',
          itemName:  i.itemName,
          category:  i.category,
          usageType: `Project: ${addStockProject.name}`,
          loggedBy:  submission.adminName,
        }).catch(console.error)
      )
    );

    // Reset Redux inventory cache so next modal open re-fetches fresh stock levels
    dispatch(invalidateInventory());

    setAddStockProject(null);
<<<<<<< Updated upstream
  };
=======
  }, [addStockReceived, addStockProject, deductStock, dispatch]);
>>>>>>> Stashed changes

  const handleUpdateSubmission = async (updatedData) => {
    await updateStockReceived(editSubmission.projectId, editSubmission.sub.id, updatedData);
    setEditSubmission(null);
  };

  const summary = useMemo(() => {
    let active = 0, inactive = 0, maintenance = 0;
    for (const p of projects) {
      if (p.status === 'Active')                 active++;
      else if (p.status === 'Inactive')          inactive++;
      else if (p.status === 'Under Maintenance') maintenance++;
    }
    return { total: projects.length, active, inactive, maintenance };
  }, [projects]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return projects.filter((p) => {
      const matchSearch = !q
        || p.name.toLowerCase().includes(q)
        || p.location.toLowerCase().includes(q)
        || (p.manager || '').toLowerCase().includes(q)
        || p.status.toLowerCase().includes(q);
      return matchSearch && (statusFilter === 'All' || p.status === statusFilter);
    });
  }, [projects, search, statusFilter]);

  const viewingProject = useMemo(
    () => selectedProject ? projects.find((p) => p.id === selectedProject.id) ?? null : null,
    [selectedProject, projects]
  );

  return (
    <>
      {viewingProject ? (
        <ProjectDetail
          project={viewingProject}
          onBack={() => setSelectedProject(null)}
          stockReceived={stockReceived[viewingProject.id] || []}
          stockUsed={stockUsed[viewingProject.id] || []}
          onAddStock={() => setAddStockProject(viewingProject)}
          onEditSubmission={(sub) => setEditSubmission({ projectId: viewingProject.id, sub })}
          onDeleteSubmission={(sub) => setDeleteConfirm({
            title:   'Delete Stock Record',
            message: `Record from ${sub.date} with ${sub.items?.length || 0} items will be permanently removed.`,
            onConfirm: async () => {
              await deleteStockReceived(viewingProject.id, sub.id);
              await refreshAll();
              dispatch(invalidateInventory());
            },
          })}
        />
      ) : (
        <div>
          {/* Page Header */}
          <div className="page-header">
            <div className="page-header-left">
              <h1>Projects</h1>
              <p>Manage your project locations, assign managers, and track operational status</p>
            </div>
            <div className="page-header-actions">
              <button className="btn-secondary-fsp" onClick={exportSnapshot} title="Download full database as JSON">
                <MdFileDownload /> Export JSON
              </button>
              <button className="btn-primary-fsp" onClick={openAdd}>
                <MdAdd /> Add Project
              </button>
            </div>
          </div>

          {/* Summary Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Projects',    val: summary.total,       color: 'var(--primary)' },
              { label: 'Active',            val: summary.active,      color: 'var(--success)' },
              { label: 'Inactive',          val: summary.inactive,    color: 'var(--danger)'  },
              { label: 'Under Maintenance', val: summary.maintenance, color: 'var(--warning)' },
            ].map((s) => (
              <div key={s.label} className="fsp-card" style={{ padding: '14px 18px' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Main Card */}
          <div className="fsp-card">
            <div className="filter-toolbar">
              <div className="filter-search">
                <MdSearch className="filter-search-icon" style={{ width: 15, height: 15 }} />
                <input type="text" placeholder="Search by name, location, manager…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {['All', 'Active', 'Inactive', 'Under Maintenance'].map((s) => <option key={s}>{s}</option>)}
              </select>
              <button className="btn-icon-sm" title="Reset filters" onClick={() => { setSearch(''); setStatusFilter('All'); }}>
                <MdRefresh />
              </button>
              <span className="filter-count">{filtered.length} of {projects.length} projects</span>
            </div>

            {projects.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '72px 20px', gap: 16, textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: 22, background: 'var(--primary-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                  <MdWarehouse style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>No Projects Found</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No projects are available to display.</div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--primary-pale)', borderBottom: '1px solid rgba(79,70,229,0.15)', fontSize: 12.5, color: 'var(--primary)', fontWeight: 500 }}>
                  <MdInfo style={{ fontSize: 16 }} />
                  Click any row to open the project detail view — stock received, stock used, and more.
                </div>

                <div className="fsp-table-wrap">
                  <table className="fsp-table">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Location</th>
                        <th>Address</th>
                        <th>Manager</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>No projects match your search.</td></tr>
                      ) : (
                        filtered.map((proj) => {
                          const sc       = STATUS_STYLE[proj.status] || STATUS_STYLE.Active;
                          const isInactive = proj.status === 'Inactive';
                          return (
                            <tr
                              key={proj.id}
                              className="clickable-row"
                              style={{ cursor: 'pointer', opacity: isInactive ? 0.6 : 1, background: isInactive ? '#F9FAFB' : undefined, transition: 'opacity 0.2s' }}
                              onClick={() => setSelectedProject(proj)}
                            >
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary-pale)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                                    <MdWarehouse />
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{proj.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{proj.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                                  <MdLocationOn style={{ color: 'var(--primary)', flexShrink: 0 }} />{proj.location}
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={proj.address}>
                                  {proj.address || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                                </div>
                              </td>
                              <td>
                                {proj.manager
                                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}><MdPerson style={{ color: 'var(--text-muted)' }} />{proj.manager}</div>
                                  : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  {proj.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><MdPhone style={{ color: 'var(--text-muted)', fontSize: 13 }} />{proj.phone}</div>}
                                  {proj.email && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><MdEmail style={{ color: 'var(--text-muted)', fontSize: 13 }} />{proj.email}</div>}
                                  {!proj.phone && !proj.email && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                                </div>
                              </td>
                              <td>
                                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, whiteSpace: 'nowrap' }}>
                                  {proj.status}
                                </span>
                              </td>
                              <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{proj.createdAt || '—'}</td>
                              <td onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                  {/* Add Stock */}
                                  <button
                                    className="btn-icon-sm"
                                    onClick={() => setAddStockProject(proj)}
                                    title="Add Stock"
                                    style={{ color: 'var(--primary)' }}
                                  >
                                    <MdAdd />
                                  </button>
                                  {/* Active / Inactive toggle */}
                                  <button
                                    onClick={(e) => handleToggleActive(proj, e)}
                                    title={isInactive ? 'Activate project' : 'Deactivate project'}
                                    style={{
                                      height: 27, padding: '0 9px', borderRadius: 7,
                                      border: `1.5px solid ${isInactive ? 'rgba(156,163,175,0.4)' : 'rgba(16,185,129,0.35)'}`,
                                      background: isInactive ? '#F3F4F6' : 'var(--success-bg, #ECFDF5)',
                                      color: isInactive ? '#6B7280' : 'var(--success, #10B981)',
                                      fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', gap: 5,
                                      transition: 'all 0.18s', whiteSpace: 'nowrap',
                                    }}
                                  >
                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: isInactive ? '#9CA3AF' : '#10B981', display: 'inline-block', flexShrink: 0 }} />
                                    {isInactive ? 'Inactive' : 'Active'}
                                  </button>
                                  {/* Edit */}
                                  <button
                                    className="btn-icon-sm"
                                    onClick={(e) => openEdit(proj, e)}
                                    title="Edit project"
                                    style={{ color: 'var(--warning)' }}
                                  >
                                    <MdEdit />
                                  </button>
                                  {/* Delete */}
                                  <button
                                    className="btn-icon-sm danger"
                                    onClick={(e) => handleDelete(proj, e)}
                                    title="Delete project"
                                  >
                                    <MdDelete />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-light)', fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Showing {filtered.length} of {projects.length} projects</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 12 }}>💡 Click any row to view project stock details</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <ProjectModal
          mode={modalMode}
          project={modalProject}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          title={deleteConfirm.title}
          message={deleteConfirm.message}
          onConfirm={deleteConfirm.onConfirm}
          onClose={() => setDeleteConfirm(null)}
        />
      )}

      {/* Add Stock Modal */}
      {addStockProject && (
        <InventoryStockModal
          project={addStockProject}
          adminName={user?.name || user?.username || user?.email || 'Admin'}
          onSave={handleAddStock}
          onClose={() => setAddStockProject(null)}
        />
      )}

      {/* Edit Submission Modal */}
      {editSubmission && (
        <EditSubmissionModal
          submission={editSubmission.sub}
          onSave={handleUpdateSubmission}
          onClose={() => setEditSubmission(null)}
        />
      )}
    </>
  );
};

export default Projects;