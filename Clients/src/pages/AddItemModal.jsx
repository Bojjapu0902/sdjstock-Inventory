import React, { useState, useEffect } from 'react';
import './AddItemModal.css';
import { MdClose, MdSave, MdAdd } from 'react-icons/md';
import { categories } from '../services/mockData';

const UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'dozen', 'bottle', 'box', 'bag', 'pack'];
const CATEGORY_OPTIONS = categories.filter((c) => c !== 'All Categories');

const EMPTY_FORM = {
  id: '', name: '', category: '', unit: '', supplier: '',
};

function generateId() {
  return 'ITEM-' + Date.now().toString(36).toUpperCase().slice(-6);
}

const AddItemModal = ({ mode = 'add', item = null, onSave, onClose }) => {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && item) {
      setForm({
        id:       item.id       || '',
        name:     item.name     || '',
        category: item.category || '',
        unit:     item.unit     || '',
        supplier: item.supplier || '',
      });
    } else {
      setForm({ ...EMPTY_FORM, id: generateId() });
    }
    setErrors({});
  }, [mode, item]);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name     = 'Name is required';
    if (!form.category)    errs.category = 'Category is required';
    if (!form.unit)        errs.unit     = 'Unit is required';
    return errs;
  };

  const submit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSave({ ...form });
    } finally {
      setSaving(false);
    }
  };

  const isEdit = mode === 'edit';

  return (
    <>
      <div className="aim-backdrop" onClick={onClose} />
      <div className="aim-modal" role="dialog" aria-modal="true">

        {/* Header */}
        <div className="aim-header">
          <div className="aim-header-left">
            <div className="aim-header-icon">{isEdit ? '✏️' : '➕'}</div>
            <div>
              <div className="aim-title">{isEdit ? 'Edit Item' : 'Add New Item'}</div>
              <div className="aim-subtitle">
                {isEdit
                  ? `Updating: ${item?.name}`
                  : 'Fill in the details for the new inventory item'}
              </div>
            </div>
          </div>
          <button className="aim-close-btn" onClick={onClose} title="Close">
            <MdClose />
          </button>
        </div>

        {/* Body */}
        <div className="aim-body">

          {/* ID + Name */}
          <div className="aim-form-row">
            <div className="aim-field">
              <label>Item ID</label>
              <input
                name="id"
                value={form.id}
                onChange={change}
                disabled={isEdit}
                className={isEdit ? 'aim-input-disabled' : ''}
                placeholder="Auto-generated"
              />
            </div>
            <div className="aim-field">
              <label>Item Name <span className="aim-required">*</span></label>
              <input
                name="name"
                value={form.name}
                onChange={change}
                placeholder="e.g. Basmati Rice"
                className={errors.name ? 'aim-input-error' : ''}
              />
              {errors.name && <span className="aim-error-msg">{errors.name}</span>}
            </div>
          </div>

          {/* Category + Unit */}
          <div className="aim-form-row">
            <div className="aim-field">
              <label>Category <span className="aim-required">*</span></label>
              <select
                name="category"
                value={form.category}
                onChange={change}
                className={errors.category ? 'aim-input-error' : ''}
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <span className="aim-error-msg">{errors.category}</span>}
            </div>
            <div className="aim-field">
              <label>Unit <span className="aim-required">*</span></label>
              <select
                name="unit"
                value={form.unit}
                onChange={change}
                className={errors.unit ? 'aim-input-error' : ''}
              >
                <option value="">Select unit</option>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              {errors.unit && <span className="aim-error-msg">{errors.unit}</span>}
            </div>
          </div>

          {/* Supplier — full width */}
          <div className="aim-field">
            <label>Supplier</label>
            <input
              name="supplier"
              value={form.supplier}
              onChange={change}
              placeholder="e.g. Lalitha Stores"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="aim-footer">
          <button className="aim-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="aim-btn-save" onClick={submit} disabled={saving}>
            {saving
              ? 'Saving…'
              : isEdit
                ? <><MdSave style={{ fontSize: 15 }} /> Update Item</>
                : <><MdAdd  style={{ fontSize: 15 }} /> Add Item</>}
          </button>
        </div>

      </div>
    </>
  );
};

export default AddItemModal;
