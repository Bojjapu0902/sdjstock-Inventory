import React, { useState, useEffect } from 'react';
import './AddStockModal.css';
import { MdClose, MdAdd, MdSave } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';

const today   = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);

/* record prop → edit mode; null → add mode */
const AddStockModal = ({ item, record = null, onSave, onClose }) => {
  const { user } = useAuth();
  const loggedByName = user?.name || user?.username || 'Admin';

  const isEdit = !!record;

  const [qty,      setQty]      = useState('');
  const [rate,     setRate]     = useState('');
  const [date,     setDate]     = useState(today());
  const [time,     setTime]     = useState(nowTime());
  const [supplier, setSupplier] = useState('');
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (isEdit && record) {
      setQty(record.qty ?? '');
      setRate(record.rate ?? '');
      setDate(record.date || today());
      const t = record.timestamp ? record.timestamp.split('T')[1]?.slice(0, 5) : nowTime();
      setTime(t || nowTime());
      setSupplier(record.supplier || '');
    } else {
      setQty('');
      setRate('');
      setDate(today());
      setTime(nowTime());
      setSupplier(item?.supplier || '');
    }
    setErrors({});
  }, [item, record]);

  const set = (setter, field) => (e) => {
    setter(e.target.value);
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!qty  || +qty  <= 0) errs.qty  = 'Enter a quantity greater than 0';
    if (!rate || +rate <  0) errs.rate = 'Enter a valid unit price';
    if (!date)               errs.date = 'Date is required';
    if (!time)               errs.time = 'Time is required';
    return errs;
  };

  const submit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSave({
        qty:       +qty,
        rate:      +rate,
        date,
        time,
        supplier:  supplier.trim(),
        timestamp: `${date}T${time}:00`,
        loggedBy:  loggedByName,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!item) return null;

  /* projected stock preview */
  const previewStock = isEdit
    ? item.currentStock - (record.qty || 0) + (+qty || 0)
    : item.currentStock + (+qty || 0);

  return (
    <>
      <div className="asm-backdrop" onClick={onClose} />
      <div className="asm-modal" role="dialog" aria-modal="true">

        {/* Header */}
        <div className="asm-header">
          <div className="asm-header-left">
            <div className="asm-header-icon">{isEdit ? '✏️' : '📦'}</div>
            <div>
              <div className="asm-title">{isEdit ? 'Edit Stock Record' : 'Add Stock'}</div>
              <div className="asm-subtitle">
                {isEdit ? `Updating record for ${item.name}` : 'Record an incoming stock entry'}
              </div>
            </div>
          </div>
          <button className="asm-close-btn" onClick={onClose} title="Close">
            <MdClose />
          </button>
        </div>

        {/* Body */}
        <div className="asm-body">

          {/* Item Name — readonly */}
          <div className="asm-field">
            <label>Item</label>
            <div className="asm-readonly-row">
              <div className="asm-readonly-avatar">{item.name.charAt(0)}</div>
              <div className="asm-readonly-info">
                <span className="asm-readonly-name">{item.name}</span>
                <span className="asm-readonly-meta">{item.id} · {item.category} · {item.unit}</span>
              </div>
            </div>
          </div>

          {/* Quantity + Unit Price */}
          <div className="asm-form-row">
            <div className="asm-field">
              <label>
                Quantity <span className="asm-required">*</span>
                <span className="asm-unit-hint">({item.unit})</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={qty}
                onChange={set(setQty, 'qty')}
                placeholder={`0 ${item.unit}`}
                className={errors.qty ? 'asm-input-error' : ''}
              />
              {errors.qty && <span className="asm-error-msg">{errors.qty}</span>}
            </div>
            <div className="asm-field">
              <label>Unit Price (₹) <span className="asm-required">*</span></label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={rate}
                onChange={set(setRate, 'rate')}
                placeholder="0.00"
                className={errors.rate ? 'asm-input-error' : ''}
              />
              {errors.rate && <span className="asm-error-msg">{errors.rate}</span>}
            </div>
          </div>

          {/* Total cost badge */}
          {qty && rate && +qty > 0 && +rate >= 0 && (
            <div className="asm-total-badge">
              <span className="asm-total-label">Total cost</span>
              <span className="asm-total-value">
                ₹{(+qty * +rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Date + Time */}
          <div className="asm-form-row">
            <div className="asm-field">
              <label>Date <span className="asm-required">*</span></label>
              <input
                type="date"
                value={date}
                onChange={set(setDate, 'date')}
                className={errors.date ? 'asm-input-error' : ''}
              />
              {errors.date && <span className="asm-error-msg">{errors.date}</span>}
            </div>
            <div className="asm-field">
              <label>Time <span className="asm-required">*</span></label>
              <input
                type="time"
                value={time}
                onChange={set(setTime, 'time')}
                className={errors.time ? 'asm-input-error' : ''}
              />
              {errors.time && <span className="asm-error-msg">{errors.time}</span>}
            </div>
          </div>

          {/* Supplier */}
          <div className="asm-field">
            <label>Supplier</label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. Lalitha Stores"
            />
          </div>

          {/* Logged By — read-only */}
          <div className="asm-field">
            <label>Logged By</label>
            <div className="asm-loggedby-chip">
              <span className="asm-loggedby-avatar">{loggedByName.charAt(0).toUpperCase()}</span>
              <span className="asm-loggedby-name">{loggedByName}</span>
            </div>
          </div>

          {/* Stock preview */}
          <div className="asm-preview-row">
            <span className="asm-preview-label">Stock after {isEdit ? 'update' : 'entry'}</span>
            <span className="asm-preview-current">{item.currentStock} {item.unit}</span>
            {qty && +qty > 0 && (
              <>
                <span className="asm-preview-arrow">→</span>
                <span className={`asm-preview-new ${isEdit && previewStock < item.currentStock ? 'asm-preview-down' : ''}`}>
                  {previewStock.toFixed(2)} {item.unit}
                </span>
              </>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="asm-footer">
          <button className="asm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="asm-btn-save" onClick={submit} disabled={saving}>
            {saving
              ? 'Saving…'
              : isEdit
                ? <><MdSave style={{ fontSize: 15 }} /> Update Record</>
                : <><MdAdd  style={{ fontSize: 15 }} /> Add Stock</>}
          </button>
        </div>

      </div>
    </>
  );
};

export default AddStockModal;
