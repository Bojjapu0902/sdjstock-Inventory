import './ProjectDetails.css';
import React, { useState, useMemo, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  MdWarehouse, MdLocationOn, MdPerson, MdPhone, MdEmail,
  MdInbox, MdOutbox, MdLogout, MdRestaurant,
  MdKeyboardArrowDown, MdKeyboardArrowUp, MdInfo,
  MdCheckCircle, MdLock, MdFilterList, MdSwapVert, MdClose,
  MdAdd, MdInventory, MdUndo,
} from 'react-icons/md';
import { getCurrentUser } from '../services/loginDb';
import { useProjects }    from '../contexts/ProjectsContext';
import { useAuth }        from '../contexts/AuthContext';
import ProfileDrawer      from '../components/common/ProfileDrawer';

const STATUS_STYLE = {
  Active:              { bg: '#ECFDF5', color: '#10B981', border: 'rgba(16,185,129,0.2)' },
  Inactive:            { bg: '#FEF2F2', color: '#EF4444', border: 'rgba(239,68,68,0.2)'  },
  'Under Maintenance': { bg: '#FFFBEB', color: '#F59E0B', border: 'rgba(245,158,11,0.2)' },
};

/* ════════════════════════════════════════════════════════
   STOCK USED MODAL
   ════════════════════════════════════════════════════════ */
const StockUsedModal = ({ project, stockReceived, stockUsed, onSave, onClose }) => {
  const now = new Date();
  const [date,      setDate]      = useState(now.toISOString().split('T')[0]);
  const [purpose,   setPurpose]   = useState('');
  const [saving,    setSaving]    = useState(false);
  const [submitErr, setSubmitErr] = useState('');
  const [selections, setSelections] = useState({});

  /* Build pool of available stock from approved deliveries */
  const availablePool = useMemo(() => {
    const receivedMap = {};
    (stockReceived || [])
      .filter((s) => s.approvalStatus === 'approved')
      .forEach((sub) => {
        (sub.items || []).forEach((it) => {
          const key = it.itemId || it.itemName;
          if (!receivedMap[key]) {
            receivedMap[key] = {
              itemId:   it.itemId   || '',
              itemName: it.itemName,
              category: it.category || '',
              unit:     it.unit     || '',
              totalReceived: 0,
            };
          }
          receivedMap[key].totalReceived += Number(it.quantity || 0);
        });
      });

    const usedMap = {};
    (stockUsed || []).forEach((r) => {
      usedMap[r.itemName] = (usedMap[r.itemName] || 0) + Number(r.quantity || 0);
    });

    return Object.values(receivedMap).map((it) => ({
      ...it,
      alreadyUsed: usedMap[it.itemName] || 0,
      available:   it.totalReceived - (usedMap[it.itemName] || 0),
    }));
  }, [stockReceived, stockUsed]);

  /* Initialise selection rows when pool is ready */
  React.useEffect(() => {
    const sel = {};
    availablePool.forEach((it) => {
      const key = it.itemId || it.itemName;
      sel[key] = { checked: false, qty: '', notes: '' };
    });
    setSelections(sel);
  }, [availablePool.length]); // eslint-disable-line

  const setChecked = (key, val) => setSelections((p) => ({ ...p, [key]: { ...p[key], checked: val } }));
  const setQty     = (key, val) => setSelections((p) => ({ ...p, [key]: { ...p[key], qty:     val } }));
  const setNotes   = (key, val) => setSelections((p) => ({ ...p, [key]: { ...p[key], notes:   val } }));

  const selectedItems = availablePool.filter((it) => selections[it.itemId || it.itemName]?.checked);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItems.length) { setSubmitErr('Select at least one item.'); return; }
    for (const it of selectedItems) {
      const key = it.itemId || it.itemName;
      const qty = parseFloat(selections[key]?.qty);
      if (!(qty > 0))         { setSubmitErr(`Enter a valid quantity for: ${it.itemName}`); return; }
      if (qty > it.available) { setSubmitErr(`"${it.itemName}" exceeds available stock (${it.available} ${it.unit}).`); return; }
    }
    setSubmitErr('');
    setSaving(true);
    try {
      for (const it of selectedItems) {
        const key = it.itemId || it.itemName;
        await onSave({
          id:       `SU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          itemId:   it.itemId,
          itemName: it.itemName,
          category: it.category,
          quantity: parseFloat(selections[key].qty),
          unit:     it.unit,
          purpose:  purpose.trim(),
          date,
          notes:    selections[key].notes || '',
        });
      }
      onClose();
    } catch (err) {
      setSubmitErr(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const tdStyle  = { padding: '9px 13px', borderBottom: '1px solid #F1F5F9' };
  const thStyle  = { padding: '9px 13px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', background: '#F8FAFF', borderBottom: '1px solid #E2E8F0' };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(900px, 96vw)', maxHeight: '90vh', background: '#fff', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 301, boxShadow: '0 24px 72px rgba(0,0,0,0.28)', fontFamily: "'Inter', sans-serif" }}>

        {/* ── Header ── */}
        <div style={{ background: '#1E1B4B', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              <MdOutbox style={{ color: '#FCD34D' }} />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Record Stock Used</div>
              <div style={{ color: 'rgba(199,210,254,0.6)', fontSize: 12 }}>From approved deliveries · {project.name}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 20 }}>
            <MdClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

          {/* ── Date + Purpose ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 14, padding: '16px 24px', borderBottom: '1px solid #F1F5F9', flexShrink: 0, background: '#FAFBFF' }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 5 }}>Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13.5, outline: 'none', color: '#0F172A' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 5 }}>Purpose / Used For</label>
              <input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Site breakfast, Crew lunch, Emergency use…"
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13.5, outline: 'none', color: '#0F172A' }}
              />
            </div>
          </div>

          {/* ── Item Table ── */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {availablePool.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 20px', gap: 12, textAlign: 'center', color: '#94A3B8' }}>
                <MdInbox style={{ fontSize: 44 }} />
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>No approved stock available</div>
                <div style={{ fontSize: 13 }}>Stock must be received and approved before you can record usage.</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['✓', 'Item Name', 'Category', 'Received', 'Already Used', 'Available', 'Qty to Record', 'Notes'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {availablePool.map((it, idx) => {
                    const key      = it.itemId || it.itemName;
                    const sel      = selections[key] || { checked: false, qty: '', notes: '' };
                    const qtyNum   = parseFloat(sel.qty) || 0;
                    const overLimit = sel.checked && qtyNum > it.available;
                    const rowBg    = sel.checked
                      ? (overLimit ? '#FFF5F5' : '#F0FDF4')
                      : (idx % 2 === 0 ? '#fff' : '#FAFBFF');

                    return (
                      <tr key={key} style={{ background: rowBg }}>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={sel.checked}
                            onChange={(e) => setChecked(key, e.target.checked)}
                            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#F59E0B' }}
                          />
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>{it.itemName}</td>
                        <td style={tdStyle}>
                          {it.category
                            ? <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11.5, background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>{it.category}</span>
                            : <span style={{ color: '#94A3B8' }}>—</span>}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#10B981' }}>
                          {it.totalReceived} <span style={{ fontWeight: 400, fontSize: 11, color: '#94A3B8' }}>{it.unit}</span>
                        </td>
                        <td style={{ ...tdStyle, color: it.alreadyUsed > 0 ? '#EF4444' : '#94A3B8', fontWeight: it.alreadyUsed > 0 ? 700 : 400 }}>
                          {it.alreadyUsed > 0 ? `${it.alreadyUsed} ${it.unit}` : '—'}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 800, color: it.available > 0 ? '#4F46E5' : '#EF4444' }}>
                            {it.available} <span style={{ fontWeight: 400, fontSize: 11, color: '#94A3B8' }}>{it.unit}</span>
                          </span>
                        </td>
                        <td style={{ ...tdStyle, minWidth: 110 }}>
                          <input
                            type="number"
                            min={0}
                            max={it.available}
                            step="any"
                            placeholder="0"
                            value={sel.qty}
                            onChange={(e) => {
                              setQty(key, e.target.value);
                              if (e.target.value && !sel.checked) setChecked(key, true);
                            }}
                            style={{
                              width: '100%', padding: '6px 8px',
                              border: `1.5px solid ${overLimit ? '#EF4444' : (sel.checked && sel.qty) ? '#10B981' : '#E2E8F0'}`,
                              borderRadius: 7, fontSize: 13, outline: 'none',
                              background: overLimit ? '#FFF5F5' : '#fff',
                            }}
                          />
                          {overLimit && (
                            <div style={{ fontSize: 10.5, color: '#EF4444', marginTop: 2, fontWeight: 600 }}>
                              Max {it.available}
                            </div>
                          )}
                        </td>
                        <td style={{ ...tdStyle, minWidth: 160 }}>
                          <input
                            type="text"
                            placeholder="Optional…"
                            value={sel.notes}
                            onChange={(e) => setNotes(key, e.target.value)}
                            style={{ width: '100%', padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 12, outline: 'none', background: '#FAFAFA' }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ padding: '14px 24px', borderTop: '1px solid #F1F5F9', background: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
            <div style={{ fontSize: 12.5, color: '#64748B' }}>
              {selectedItems.length > 0
                ? <><span style={{ fontWeight: 700, color: '#F59E0B' }}>{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}</span> selected</>
                : <span style={{ color: '#94A3B8' }}>Check the items you used and enter the quantity</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {submitErr && (
                <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, maxWidth: 300 }}>{submitErr}</div>
              )}
              <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569' }}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || selectedItems.length === 0}
                style={{
                  padding: '9px 22px', borderRadius: 8, border: 'none',
                  background: selectedItems.length > 0 && !saving ? '#F59E0B' : '#E2E8F0',
                  color: selectedItems.length > 0 && !saving ? '#fff' : '#94A3B8',
                  fontSize: 13, fontWeight: 700,
                  cursor: selectedItems.length > 0 && !saving ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {saving
                  ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'pd-spin 0.7s linear infinite' }} /> Saving…</>
                  : <><MdOutbox /> Record Usage</>}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`@keyframes pd-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

/* ════════════════════════════════════════════════════════
   STOCK RETURNED MODAL
   ════════════════════════════════════════════════════════ */
const StockReturnedModal = ({ project, availablePool, onSave, onClose }) => {
  const now = new Date();
  const [date,       setDate]       = useState(now.toISOString().split('T')[0]);
  const [reason,     setReason]     = useState('');
  const [saving,     setSaving]     = useState(false);
  const [submitErr,  setSubmitErr]  = useState('');
  const [selections, setSelections] = useState(() => {
    const sel = {};
    availablePool.forEach((it) => { sel[it.key] = { checked: false, qty: '', notes: '' }; });
    return sel;
  });

  const setChecked = (key, val) => setSelections((p) => ({ ...p, [key]: { ...p[key], checked: val } }));
  const setQty     = (key, val) => setSelections((p) => ({ ...p, [key]: { ...p[key], qty:     val } }));
  const setNotes   = (key, val) => setSelections((p) => ({ ...p, [key]: { ...p[key], notes:   val } }));

  const selectedItems = availablePool.filter((it) => selections[it.key]?.checked);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItems.length) { setSubmitErr('Select at least one item to return.'); return; }
    for (const it of selectedItems) {
      const qty = parseFloat(selections[it.key]?.qty);
      if (!(qty > 0))           { setSubmitErr(`Enter a valid quantity for: ${it.itemName}`); return; }
      if (qty > it.balance)     { setSubmitErr(`"${it.itemName}" exceeds available inhouse stock (${it.balance} ${it.unit}).`); return; }
    }
    setSubmitErr('');
    setSaving(true);
    try {
      for (const it of selectedItems) {
        const sel = selections[it.key];
        await onSave({
          itemId:     it.itemId,
          itemName:   it.itemName,
          category:   it.category,
          quantity:   parseFloat(sel.qty),
          unit:       it.unit,
          reason:     reason.trim(),
          date,
          notes:      sel.notes || '',
        });
      }
      onClose();
    } catch (err) {
      setSubmitErr(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const thS = { padding: '9px 13px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', background: '#F8FAFF', borderBottom: '1px solid #E2E8F0' };
  const tdS = { padding: '9px 13px', borderBottom: '1px solid #F1F5F9' };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(900px, 96vw)', maxHeight: '90vh', background: '#fff', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 301, boxShadow: '0 24px 72px rgba(0,0,0,0.28)', fontFamily: "'Inter', sans-serif" }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              <MdUndo style={{ color: '#DDD6FE' }} />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Record Stock Returned</div>
              <div style={{ color: 'rgba(221,214,254,0.65)', fontSize: 12 }}>Return inhouse items back to main inventory · {project.name}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 20 }}>
            <MdClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

          {/* Date + Reason */}
          <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 14, padding: '16px 24px', borderBottom: '1px solid #F1F5F9', flexShrink: 0, background: '#FAFBFF' }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 5 }}>Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13.5, outline: 'none', color: '#0F172A' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 5 }}>Reason for Return</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Project completed, excess stock, damaged goods…"
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13.5, outline: 'none', color: '#0F172A' }} />
            </div>
          </div>

          {/* Item Table */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {availablePool.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 20px', gap: 12, textAlign: 'center', color: '#94A3B8' }}>
                <MdUndo style={{ fontSize: 44 }} />
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>No inhouse stock available to return</div>
                <div style={{ fontSize: 13 }}>All approved stock has already been used or there is no approved stock for this project.</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['✓', 'Item Name', 'Category', 'Inhouse Balance', 'Qty to Return', 'Notes'].map((h) => (
                      <th key={h} style={thS}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {availablePool.map((it, idx) => {
                    const sel       = selections[it.key] || { checked: false, qty: '', notes: '' };
                    const qtyNum    = parseFloat(sel.qty) || 0;
                    const overLimit = sel.checked && qtyNum > it.balance;
                    const rowBg     = sel.checked ? (overLimit ? '#FFF5F5' : '#F5F3FF') : (idx % 2 === 0 ? '#fff' : '#FAFBFF');

                    return (
                      <tr key={it.key} style={{ background: rowBg }}>
                        <td style={{ ...tdS, textAlign: 'center' }}>
                          <input type="checkbox" checked={sel.checked} onChange={(e) => setChecked(it.key, e.target.checked)}
                            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#7C3AED' }} />
                        </td>
                        <td style={{ ...tdS, fontWeight: 700 }}>{it.itemName}</td>
                        <td style={tdS}>
                          {it.category
                            ? <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11.5, background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>{it.category}</span>
                            : <span style={{ color: '#94A3B8' }}>—</span>}
                        </td>
                        <td style={tdS}>
                          <span style={{ fontWeight: 800, color: it.balance > 0 ? '#7C3AED' : '#94A3B8' }}>
                            {it.balance} <span style={{ fontWeight: 400, fontSize: 11, color: '#94A3B8' }}>{it.unit}</span>
                          </span>
                        </td>
                        <td style={{ ...tdS, minWidth: 110 }}>
                          <input type="number" min={0} max={it.balance} step="any" placeholder="0" value={sel.qty}
                            onChange={(e) => { setQty(it.key, e.target.value); if (e.target.value && !sel.checked) setChecked(it.key, true); }}
                            style={{ width: '100%', padding: '6px 8px', border: `1.5px solid ${overLimit ? '#EF4444' : sel.checked && sel.qty ? '#7C3AED' : '#E2E8F0'}`, borderRadius: 7, fontSize: 13, outline: 'none', background: overLimit ? '#FFF5F5' : '#fff' }} />
                          {overLimit && <div style={{ fontSize: 10.5, color: '#EF4444', marginTop: 2, fontWeight: 600 }}>Max {it.balance}</div>}
                        </td>
                        <td style={{ ...tdS, minWidth: 160 }}>
                          <input type="text" placeholder="Optional…" value={sel.notes} onChange={(e) => setNotes(it.key, e.target.value)}
                            style={{ width: '100%', padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 12, outline: 'none', background: '#FAFAFA' }} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 24px', borderTop: '1px solid #F1F5F9', background: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
            <div style={{ fontSize: 12.5, color: '#64748B' }}>
              {selectedItems.length > 0
                ? <><span style={{ fontWeight: 700, color: '#7C3AED' }}>{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}</span> selected for return</>
                : <span style={{ color: '#94A3B8' }}>Check items to return and enter the quantity</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {submitErr && <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, maxWidth: 300 }}>{submitErr}</div>}
              <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569' }}>
                Cancel
              </button>
              <button type="submit" disabled={saving || selectedItems.length === 0}
                style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: selectedItems.length > 0 && !saving ? '#7C3AED' : '#E2E8F0', color: selectedItems.length > 0 && !saving ? '#fff' : '#94A3B8', fontSize: 13, fontWeight: 700, cursor: selectedItems.length > 0 && !saving ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6 }}>
                {saving
                  ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'pd-spin 0.7s linear infinite' }} /> Saving…</>
                  : <><MdUndo /> Confirm Return</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

/* ════════════════════════════════════════════════════════
   INHOUSE DETAIL MODAL
   ════════════════════════════════════════════════════════ */
const InhouseDetailModal = ({ item, stockReceived, stockUsed, stockReturned, onClose }) => {
  const [tab, setTab] = useState('received');

  /* All individual deliveries of this item from approved submissions */
  const receivedRows = [];
  (stockReceived || [])
    .filter((s) => s.approvalStatus === 'approved')
    .forEach((sub, subIdx) => {
      (sub.items || []).forEach((it) => {
        if ((it.itemId || it.itemName) === item.key) {
          receivedRows.push({
            subNum:    subIdx + 1,
            date:      sub.date      || '—',
            time:      sub.time      || '',
            adminName: sub.adminName || '—',
            qty:       Number(it.quantity || 0),
            unit:      it.unit     || item.unit || '',
            rate:      Number(it.rate  || 0),
            total:     Number(it.total || 0),
            supplier:  it.supplier || '—',
          });
        }
      });
    });

  /* All usage records for this item */
  const usedRows = (stockUsed || []).filter(
    (r) => (r.itemId || r.itemName) === item.key,
  );

  /* All return records for this item */
  const returnedRows = (stockReturned || []).filter(
    (r) => (r.itemId || r.itemName) === item.key,
  );

  const totalReceived = receivedRows.reduce((s, r) => s + r.qty, 0);
  const totalUsed     = usedRows.reduce((s, r) => s + Number(r.quantity || 0), 0);
  const totalReturned = returnedRows.reduce((s, r) => s + Number(r.quantity || 0), 0);
  const balance       = totalReceived - totalUsed - totalReturned;
  const balColor      = balance > 0 ? '#10B981' : balance < 0 ? '#EF4444' : '#94A3B8';

  const thS = {
    padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px',
    borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap', background: '#F8FAFF',
  };
  const tdS = { padding: '10px 14px', borderBottom: '1px solid #F8FAFF', fontSize: 13 };

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.52)', zIndex: 400 }}
        onClick={onClose}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 'min(820px, 96vw)', maxHeight: '88vh',
        background: '#fff', borderRadius: 18, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        zIndex: 401, boxShadow: '0 28px 80px rgba(0,0,0,0.32)',
        fontFamily: "'Inter', sans-serif",
      }}>

        {/* ── Header ── */}
        <div style={{ background: 'linear-gradient(135deg,#1E1B4B,#3730A3)', padding: '20px 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                <MdInventory style={{ color: '#C7D2FE' }} />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 17, lineHeight: 1.2 }}>{item.itemName}</div>
                {item.category && (
                  <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 9px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: '#C7D2FE', fontSize: 11.5, fontWeight: 600 }}>
                    {item.category}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {/* Balance pill */}
              <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: balance > 0 ? '#6EE7B7' : balance < 0 ? '#FCA5A5' : '#CBD5E1' }}>{balance} <span style={{ fontSize: 12, fontWeight: 500 }}>{item.unit}</span></div>
                <div style={{ fontSize: 10, color: 'rgba(199,210,254,0.6)', marginTop: 1, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inhouse Balance</div>
              </div>
              <button
                onClick={onClose}
                style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <MdClose />
              </button>
            </div>
          </div>

          {/* Mini summary */}
          <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.12)', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Received', val: `${totalReceived} ${item.unit}`,  color: '#93C5FD' },
              { label: 'Total Used',     val: `${totalUsed} ${item.unit}`,      color: '#FCD34D' },
              { label: 'Total Returned', val: `${totalReturned} ${item.unit}`,  color: '#DDD6FE' },
              { label: 'Balance',        val: `${balance} ${item.unit}`,        color: balance > 0 ? '#6EE7B7' : '#FCA5A5' },
              { label: 'Deliveries',     val: receivedRows.length,              color: '#C7D2FE' },
              { label: 'Usage Records',  val: usedRows.length,                  color: '#C7D2FE' },
              { label: 'Returns',        val: returnedRows.length,              color: '#DDD6FE' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 10.5, color: 'rgba(199,210,254,0.55)', marginTop: 1, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Inner Tabs ── */}
        <div style={{ display: 'flex', borderBottom: '2px solid #F1F5F9', background: '#FAFBFF', flexShrink: 0 }}>
          {[
            { id: 'received', label: 'Received History', count: receivedRows.length,  color: '#3B82F6' },
            { id: 'used',     label: 'Usage History',    count: usedRows.length,      color: '#F59E0B' },
            { id: 'returned', label: 'Returned History', count: returnedRows.length,  color: '#7C3AED' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '11px 22px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? t.color : '#94A3B8',
                borderBottom: tab === t.id ? `2.5px solid ${t.color}` : '2.5px solid transparent',
                marginBottom: -2, display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s',
              }}
            >
              {t.label}
              <span style={{ padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: tab === t.id ? (t.id === 'received' ? '#EFF6FF' : '#FFFBEB') : '#F1F5F9', color: tab === t.id ? t.color : '#94A3B8' }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* Received History */}
          {tab === 'received' && (
            receivedRows.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 20px', gap: 10, textAlign: 'center', color: '#94A3B8' }}>
                <MdInbox style={{ fontSize: 40 }} />
                <div style={{ fontWeight: 700, color: '#0F172A' }}>No approved deliveries</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Batch #', 'Date', 'Time', 'Received By', 'Qty', 'Rate (₹)', 'Total Value (₹)', 'Supplier'].map((h) => (
                      <th key={h} style={thS}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {receivedRows.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                      <td style={tdS}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, background: '#EFF6FF', color: '#3B82F6', fontSize: 11.5, fontWeight: 700 }}>
                          #{r.subNum}
                        </span>
                      </td>
                      <td style={{ ...tdS, fontWeight: 600, color: '#0F172A' }}>{r.date}</td>
                      <td style={{ ...tdS, color: '#64748B', fontSize: 12 }}>{r.time || '—'}</td>
                      <td style={{ ...tdS, color: '#475569' }}>{r.adminName}</td>
                      <td style={{ ...tdS, fontWeight: 700, color: '#3B82F6' }}>
                        {r.qty} <span style={{ fontWeight: 400, fontSize: 11, color: '#94A3B8' }}>{r.unit}</span>
                      </td>
                      <td style={{ ...tdS, color: '#475569' }}>{r.rate ? `₹${r.rate.toFixed(2)}` : '—'}</td>
                      <td style={{ ...tdS, fontWeight: 700, color: '#10B981' }}>
                        {r.total ? `₹${Number(r.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td style={{ ...tdS, color: '#64748B', fontSize: 12.5 }}>{r.supplier}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#EFF6FF', fontWeight: 700 }}>
                    <td colSpan={4} style={{ ...tdS, color: '#64748B', fontSize: 12 }}>{receivedRows.length} deliveries</td>
                    <td style={{ ...tdS, color: '#3B82F6' }}>{totalReceived} <span style={{ fontWeight: 400, fontSize: 11 }}>{item.unit}</span></td>
                    <td />
                    <td style={{ ...tdS, color: '#10B981' }}>
                      ₹{receivedRows.reduce((s, r) => s + r.total, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )
          )}

          {/* Usage History */}
          {tab === 'used' && (
            usedRows.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 20px', gap: 10, textAlign: 'center', color: '#94A3B8' }}>
                <MdOutbox style={{ fontSize: 40 }} />
                <div style={{ fontWeight: 700, color: '#0F172A' }}>No usage recorded yet</div>
                <div style={{ fontSize: 13 }}>Use the "Record Stock Used" button to log consumption.</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['#', 'Date', 'Qty Used', 'Purpose / Used For', 'Notes'].map((h) => (
                      <th key={h} style={thS}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usedRows.map((r, i) => (
                    <tr key={r.id || i} style={{ background: i % 2 === 0 ? '#fff' : '#FFFBEB' }}>
                      <td style={{ ...tdS, color: '#94A3B8', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ ...tdS, fontWeight: 600, color: '#0F172A' }}>{r.date}</td>
                      <td style={{ ...tdS, fontWeight: 700, color: '#F59E0B' }}>
                        {r.quantity} <span style={{ fontWeight: 400, fontSize: 11, color: '#94A3B8' }}>{r.unit}</span>
                      </td>
                      <td style={{ ...tdS, color: '#475569' }}>{r.purpose || <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>—</span>}</td>
                      <td style={{ ...tdS, color: '#94A3B8', fontSize: 12 }}>{r.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#FFFBEB', fontWeight: 700 }}>
                    <td colSpan={2} style={{ ...tdS, color: '#64748B', fontSize: 12 }}>{usedRows.length} records</td>
                    <td style={{ ...tdS, color: '#F59E0B' }}>
                      {totalUsed} <span style={{ fontWeight: 400, fontSize: 11 }}>{item.unit}</span>
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            )
          )}

          {/* Returned History */}
          {tab === 'returned' && (
            returnedRows.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 20px', gap: 10, textAlign: 'center', color: '#94A3B8' }}>
                <MdUndo style={{ fontSize: 40 }} />
                <div style={{ fontWeight: 700, color: '#0F172A' }}>No returns recorded yet</div>
                <div style={{ fontSize: 13 }}>Use the "Record Stock Returned" button to log items sent back.</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['#', 'Date', 'Qty Returned', 'Reason', 'Returned By', 'Notes'].map((h) => (
                      <th key={h} style={thS}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {returnedRows.map((r, i) => (
                    <tr key={r.id || i} style={{ background: i % 2 === 0 ? '#fff' : '#F5F3FF' }}>
                      <td style={{ ...tdS, color: '#94A3B8', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ ...tdS, fontWeight: 600, color: '#0F172A' }}>{r.date}</td>
                      <td style={{ ...tdS, fontWeight: 700, color: '#7C3AED' }}>
                        {r.quantity} <span style={{ fontWeight: 400, fontSize: 11, color: '#94A3B8' }}>{r.unit}</span>
                      </td>
                      <td style={{ ...tdS, color: '#475569' }}>{r.reason || <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>—</span>}</td>
                      <td style={{ ...tdS, color: '#64748B', fontSize: 12.5 }}>{r.returnedBy || '—'}</td>
                      <td style={{ ...tdS, color: '#94A3B8', fontSize: 12 }}>{r.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#F5F3FF', fontWeight: 700 }}>
                    <td colSpan={2} style={{ ...tdS, color: '#64748B', fontSize: 12 }}>{returnedRows.length} records</td>
                    <td style={{ ...tdS, color: '#7C3AED' }}>
                      {totalReturned} <span style={{ fontWeight: 400, fontSize: 11 }}>{item.unit}</span>
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            )
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid #F1F5F9', background: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>
            {item.supplier && <>Last supplier: <strong style={{ color: '#475569' }}>{item.supplier}</strong> &nbsp;·&nbsp;</>}
            {item.lastRate > 0 && <>Last rate: <strong style={{ color: '#475569' }}>₹{item.lastRate.toFixed(2)}</strong></>}
          </span>
          <button
            onClick={onClose}
            style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

/* ════════════════════════════════════════════════════════ */

const ProjectDetails = () => {
  const { projectId }  = useParams();
  const { user: ctxUser, logout, login } = useAuth();
  const { projects, stockReceived: allReceived, stockUsed: allUsed, stockReturned: allReturned, approveSubmission, addStockUsed, addStockReturned } = useProjects();
  const currentUser = ctxUser || getCurrentUser();

  /* ── UI state ── */
  const [activeTab, setActiveTab]         = useState('received');
  const [expandedIds, setExpandedIds]     = useState(new Set());
  const [expandedBundleIds, setExpandedBundleIds] = useState(new Set());
  const [approvalDraft, setApprovalDraft] = useState({});
  const [usedModalOpen,       setUsedModalOpen]       = useState(false);
  const [returnedModalOpen,   setReturnedModalOpen]   = useState(false);
  const [inhouseDetailItem,   setInhouseDetailItem]   = useState(null);
  const [profileOpen,         setProfileOpen]         = useState(false);

  /* ── Stock Received filters ── */
  const [sortOrder,      setSortOrder]      = useState('newest');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate,   setFilterToDate]   = useState('');

  /* ── derived data ── */
  const project        = useMemo(() => projects.find((p) => p.id === projectId) ?? null, [projects, projectId]);
  const stockReceived  = allReceived[projectId] || [];
  const stockUsed      = allUsed[projectId]      || [];
  const stockReturned  = allReturned[projectId]  || [];

  /* ── all hooks must be declared before any early return ── */
  const toggleExpand = useCallback((id) =>
    setExpandedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);

  const filteredReceived = useMemo(() => {
    let list = [...stockReceived];
    if (filterFromDate) list = list.filter((s) => s.date >= filterFromDate);
    if (filterToDate)   list = list.filter((s) => s.date <= filterToDate);
    list.sort((a, b) => {
      const cmp = (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''));
      return sortOrder === 'newest' ? -cmp : cmp;
    });
    return list;
  }, [stockReceived, filterFromDate, filterToDate, sortOrder]);

  const grandTotal = filteredReceived.reduce((s, sub) => s + Number(sub.totalValue || 0), 0);
  const grandTotalAll = stockReceived.reduce((s, sub) => s + Number(sub.totalValue || 0), 0);

  /* ── Stock Inhouse: aggregate approved received minus used ── */
  const inhouseItems = useMemo(() => {
    const map = {};
    (stockReceived || [])
      .filter((s) => s.approvalStatus === 'approved')
      .forEach((sub) => {
        (sub.items || []).forEach((it) => {
          const key = it.itemId || it.itemName;
          if (!map[key]) {
            map[key] = {
              key,
              itemId:   it.itemId   || '',
              itemName: it.itemName || '',
              category: it.category || '',
              unit:     it.unit     || '',
              totalReceived: 0,
              totalValue:    0,
              lastRate:      0,
              supplier:      '',
            };
          }
          map[key].totalReceived += Number(it.quantity || 0);
          map[key].totalValue    += Number(it.total    || 0);
          if (it.rate)     map[key].lastRate  = Number(it.rate);
          if (it.supplier) map[key].supplier  = it.supplier;
        });
      });

    const usedMap = {};
    (stockUsed || []).forEach((r) => {
      const key = r.itemId || r.itemName;
      usedMap[key] = (usedMap[key] || 0) + Number(r.quantity || 0);
    });

    const returnedMap = {};
    (stockReturned || []).forEach((r) => {
      const key = r.itemId || r.itemName;
      returnedMap[key] = (returnedMap[key] || 0) + Number(r.quantity || 0);
    });

    return Object.values(map)
      .map((it) => {
        const used     = usedMap[it.key]     || 0;
        const returned = returnedMap[it.key] || 0;
        const balance  = it.totalReceived - used - returned;
        return { ...it, totalUsed: used, totalReturned: returned, balance, estValue: +(balance * it.lastRate).toFixed(2) };
      })
      .sort((a, b) => a.itemName.localeCompare(b.itemName));
  }, [stockReceived, stockUsed, stockReturned]);

  /* Return draft array for a submission — falls back to stored per-item values */
  const getDraft = useCallback((sub) =>
    approvalDraft[sub.id] ?? (sub.items || []).map((it) => ({
      approved: it.userApproved ?? false,
      comment:  it.userComment  ?? '',
    })), [approvalDraft]);

  /* Toggle one item's "approved" checkbox */
  const setItemApproved = useCallback((subId, subItems, idx, val) =>
    setApprovalDraft((prev) => {
      const base    = prev[subId] ?? (subItems || []).map((it) => ({ approved: it.userApproved ?? false, comment: it.userComment ?? '' }));
      const updated = [...base];
      updated[idx]  = { ...(updated[idx] || { approved: false, comment: '' }), approved: val };
      return { ...prev, [subId]: updated };
    }), []);

  /* Update one item's comment text */
  const setItemComment = useCallback((subId, subItems, idx, val) =>
    setApprovalDraft((prev) => {
      const base    = prev[subId] ?? (subItems || []).map((it) => ({ approved: it.userApproved ?? false, comment: it.userComment ?? '' }));
      const updated = [...base];
      updated[idx]  = { ...(updated[idx] || { approved: false, comment: '' }), comment: val };
      return { ...prev, [subId]: updated };
    }), []);

  /* Submit approval for a whole submission */
  const handleApprove = useCallback((sub) => {
    const draft = approvalDraft[sub.id] ?? (sub.items || []).map((it) => ({
      approved: it.userApproved ?? false,
      comment:  it.userComment  ?? '',
    }));
    approveSubmission(projectId, sub.id, draft, currentUser?.username || 'Project User');
    setApprovalDraft((prev) => { const n = { ...prev }; delete n[sub.id]; return n; });
  }, [approvalDraft, approveSubmission, projectId, currentUser]);

  /* ── Record stock used ── */
  const handleRecordUsed = useCallback(async (formData) => {
    await addStockUsed(projectId, formData);
  }, [addStockUsed, projectId]);

  /* ── Record stock returned ── */
  const handleRecordReturned = useCallback(async (formData) => {
    await addStockReturned(projectId, formData);
  }, [addStockReturned, projectId]);

  /* ── security guard: must own this project ── */
  if (!currentUser || (currentUser.role !== 'Admin' && currentUser.projectId !== projectId)) {
    return <Navigate to="/" replace />;
  }

  /* ── project not found ── */
  if (!project) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F1F5F9', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏭</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Project Not Found</div>
          <div style={{ fontSize: 13, color: '#94A3B8' }}>ID: {projectId}</div>
        </div>
      </div>
    );
  }

  const sc = STATUS_STYLE[project.status] || STATUS_STYLE.Active;

  /* ─────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: "'Inter', -apple-system, sans-serif", fontSize: 14, color: '#0F172A' }}>

      {/* ── Top Bar ── */}
      <div style={{ background: '#1E1B4B', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#818CF8,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            <MdRestaurant style={{ color: 'white' }} />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>{project.name}</div>
            <div style={{ color: 'rgba(199,210,254,0.55)', fontSize: 11 }}>{project.id} · {project.location}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Profile avatar button */}
          <button
            onClick={() => setProfileOpen(true)}
            title="My Profile"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: '50%', width: 40, height: 40, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
          >
            {currentUser?.avatar
              ? <img src={currentUser.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{(currentUser?.name || currentUser?.username || 'U').slice(0, 2).toUpperCase()}</span>}
          </button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(199,210,254,0.9)', fontSize: 13, fontWeight: 600 }}>{currentUser?.name || currentUser?.username}</div>
            <div style={{ color: 'rgba(199,210,254,0.45)', fontSize: 11 }}>Tap avatar to edit profile</div>
          </div>
          <button
            onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, color: 'rgba(252,165,165,0.9)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', marginLeft: 4 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          >
            <MdLogout /> Sign Out
          </button>
        </div>
      </div>

      {/* ── Page body ── */}
      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Project Info Card */}
        <div className="fsp-card" style={{ marginBottom: 20, padding: '22px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 62, height: 62, borderRadius: 16, background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>
              <MdWarehouse />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <span style={{ fontSize: 21, fontWeight: 800, color: '#0F172A' }}>{project.name}</span>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                  {project.status}
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: '#94A3B8' }}>ID: {project.id} · Created: {project.createdAt || '—'}</div>
              {project.description && (
                <div style={{ marginTop: 8, fontSize: 13, color: '#64748B', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <MdInfo style={{ marginTop: 1, flexShrink: 0, color: '#94A3B8' }} />
                  {project.description}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
              {[
                { label: 'Submissions', val: stockReceived.length, sub: `${stockReceived.reduce((s, r) => s + (r.items?.length || 0), 0)} items`, icon: '📥', color: '#4F46E5' },
                { label: 'Stock Used',  val: stockUsed.length,     sub: 'records', icon: '📤', color: '#F59E0B' },
                { label: 'Total Value', val: `₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, sub: 'received', icon: '💰', color: '#10B981' },
              ].map((k) => (
                <div key={k.label} style={{ padding: '12px 18px', borderRadius: 12, background: '#F8FAFF', border: '1px solid #E2E8F0', minWidth: 120, textAlign: 'center' }}>
                  <div style={{ fontSize: 22 }}>{k.icon}</div>
                  <div style={{ fontSize: typeof k.val === 'string' ? 15 : 22, fontWeight: 800, color: k.color, lineHeight: 1.2 }}>{k.val}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{k.label}</div>
                  <div style={{ fontSize: 10.5, color: '#CBD5E1' }}>{k.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14, marginTop: 20, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
            {[
              { icon: <MdLocationOn />, label: 'Location', value: project.location        },
              { icon: <MdWarehouse />,  label: 'Address',  value: project.address         },
              { icon: <MdPerson />,     label: 'Manager',  value: project.manager  || '—' },
              { icon: <MdPhone />,      label: 'Phone',    value: project.phone    || '—' },
              { icon: <MdEmail />,      label: 'Email',    value: project.email    || '—' },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
                  <div style={{ fontSize: 13, color: '#0F172A', fontWeight: 500, marginTop: 1 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="page-tabs">
          <button className={`page-tab ${activeTab === 'received' ? 'active' : ''}`} onClick={() => setActiveTab('received')}>
            <MdInbox /> Stock Received <span className="page-tab-count">{stockReceived.length}</span>
          </button>
          <button className={`page-tab ${activeTab === 'used' ? 'active' : ''}`} onClick={() => setActiveTab('used')}>
            <MdOutbox /> Stock Used <span className="page-tab-count">{stockUsed.length}</span>
          </button>
          <button className={`page-tab ${activeTab === 'inhouse' ? 'active' : ''}`} onClick={() => setActiveTab('inhouse')}>
            <MdInventory /> Stock Inhouse <span className="page-tab-count">{inhouseItems.length}</span>
          </button>
          <button className={`page-tab ${activeTab === 'returned' ? 'active' : ''}`} onClick={() => setActiveTab('returned')}>
            <MdUndo /> Stock Returned <span className="page-tab-count">{stockReturned.length}</span>
          </button>
        </div>

        {/* ══ STOCK RECEIVED — Accordion ══ */}
        {activeTab === 'received' && (
          <div className="fsp-card">
            {/* ── Filter bar ── */}
            {stockReceived.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap', background: '#FAFBFF' }}>
                <MdFilterList style={{ color: '#94A3B8', fontSize: 18, flexShrink: 0 }} />

                {/* Sort order */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MdSwapVert style={{ color: '#64748B', fontSize: 16 }} />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #E2E8F0', fontSize: 12.5, color: '#0F172A', background: '#fff', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>

                {/* Divider */}
                <div style={{ width: 1, height: 24, background: '#E2E8F0', flexShrink: 0 }} />

                {/* From date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>From</span>
                  <input
                    type="date"
                    value={filterFromDate}
                    max={filterToDate || undefined}
                    onChange={(e) => setFilterFromDate(e.target.value)}
                    style={{ padding: '5px 9px', borderRadius: 7, border: '1px solid #E2E8F0', fontSize: 12.5, color: '#0F172A', background: '#fff', outline: 'none', cursor: 'pointer' }}
                  />
                </div>

                {/* To date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>To</span>
                  <input
                    type="date"
                    value={filterToDate}
                    min={filterFromDate || undefined}
                    onChange={(e) => setFilterToDate(e.target.value)}
                    style={{ padding: '5px 9px', borderRadius: 7, border: '1px solid #E2E8F0', fontSize: 12.5, color: '#0F172A', background: '#fff', outline: 'none', cursor: 'pointer' }}
                  />
                </div>

                {/* Clear filters */}
                {(filterFromDate || filterToDate || sortOrder !== 'newest') && (
                  <button
                    onClick={() => { setFilterFromDate(''); setFilterToDate(''); setSortOrder('newest'); }}
                    title="Clear filters"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    <MdClose style={{ fontSize: 14 }} /> Clear
                  </button>
                )}

                {/* Result count */}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                  {filteredReceived.length} of {stockReceived.length} submissions
                </span>
              </div>
            )}

            {stockReceived.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 12, textAlign: 'center', color: '#94A3B8' }}>
                <MdInbox style={{ fontSize: 48 }} />
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>No Stock Received Yet</div>
                <div style={{ fontSize: 13 }}>The admin has not assigned any stock to this project yet.</div>
              </div>
            ) : filteredReceived.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px', gap: 12, textAlign: 'center', color: '#94A3B8' }}>
                <MdFilterList style={{ fontSize: 40 }} />
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>No results for selected filters</div>
                <div style={{ fontSize: 13 }}>Try adjusting the date range or sort order.</div>
              </div>
            ) : (
              <div style={{ padding: '12px 16px 16px' }}>
                {filteredReceived.map((sub, idx) => {
                  const isOpen      = expandedIds.has(sub.id);
                  const isApproved  = sub.approvalStatus === 'approved';
                  const subTotal    = Number(sub.totalValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  const draft       = getDraft(sub);
                  const approvedCnt = draft.filter((d) => d.approved).length;

                  return (
                    <div key={sub.id} style={{ marginBottom: 10, borderRadius: 12, border: `1.5px solid ${isApproved ? '#10B981' : isOpen ? '#4F46E5' : '#E2E8F0'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>

                      {/* ── Accordion Header ── */}
                      <div
                        onClick={() => toggleExpand(sub.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', cursor: 'pointer', background: isApproved ? '#F0FDF4' : isOpen ? '#EEF2FF' : '#fff', transition: 'background 0.2s', flexWrap: 'wrap' }}
                      >
                        <div style={{ color: isApproved ? '#10B981' : '#4F46E5', fontSize: 22, display: 'flex', alignItems: 'center' }}>
                          {isOpen ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: isApproved ? '#10B981' : isOpen ? '#4F46E5' : '#F1F5F9', color: isApproved || isOpen ? '#fff' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>Submission #{idx + 1}</div>
                          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                            👤 {sub.adminName} &nbsp;·&nbsp; 📅 {sub.date} &nbsp;·&nbsp; 🕐 {sub.time}
                          </div>
                          {isApproved && (
                            <div style={{ fontSize: 11, color: '#059669', marginTop: 2, fontWeight: 600 }}>
                              ✅ Approved by {sub.approvedBy} on {new Date(sub.approvedAt).toLocaleDateString('en-IN')}
                            </div>
                          )}
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: 20, background: '#EEF2FF', color: '#4F46E5', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {sub.items?.length || 0} items
                        </span>
                        <span style={{ padding: '3px 10px', borderRadius: 20, background: '#ECFDF5', color: '#10B981', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          ₹{subTotal}
                        </span>
                        {isApproved ? (
                          <span style={{ padding: '4px 11px', borderRadius: 20, background: '#ECFDF5', color: '#10B981', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                            <MdCheckCircle /> Approved
                          </span>
                        ) : (
                          <span style={{ padding: '4px 11px', borderRadius: 20, background: '#FFFBEB', color: '#D97706', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                            ⏳ Pending Review
                          </span>
                        )}
                      </div>

                      {/* ── Accordion Body ── */}
                      {isOpen && (
                        <div style={{ borderTop: '1px solid #F1F5F9' }}>

                          {/* Instruction banner — only for pending */}
                          {!isApproved && (
                            <div style={{ padding: '10px 16px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#92400E' }}>
                              <span style={{ fontSize: 16 }}>📋</span>
                              <span>
                                Tick <strong>✓</strong> next to each item you have received. Add a comment in the <strong>Issue / Comment</strong> column if anything is wrong or missing. Then click <strong>Submit Approval</strong>.
                              </span>
                            </div>
                          )}

                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                              <thead>
                                <tr style={{ background: '#F8FAFF' }}>
                                  {(isApproved
                                    ? ['#', 'Item Name', 'Category', 'Qty / Unit', 'Rate (₹)', 'Total (₹)', 'Supplier', 'Status', 'Your Comment']
                                    : ['✓', '#', 'Item Name', 'Category', 'Qty / Unit', 'Rate (₹)', 'Total (₹)', 'Supplier', 'Issue / Comment']
                                  ).map((h) => (
                                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(sub.items || []).map((it, i) => {
                                  const rowBg = i % 2 === 0 ? '#fff' : '#F8FAFF';
                                  return (
                                    <tr key={i} style={{ background: isApproved && it.userApproved ? '#F0FDF4' : rowBg }}>
                                      {isApproved ? (
                                        <>
                                          <td style={{ padding: '9px 14px', color: '#94A3B8', fontSize: 12 }}>{i + 1}</td>
                                          <td style={{ padding: '9px 14px', fontWeight: 700 }}>{it.itemName}</td>
                                          <td style={{ padding: '9px 14px' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11.5, background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>{it.category || '—'}</span>
                                          </td>
                                          <td style={{ padding: '9px 14px', fontWeight: 700, color: '#4F46E5' }}>{it.quantity} <span style={{ fontWeight: 400, fontSize: 11, color: '#94A3B8' }}>{it.unit}</span></td>
                                          <td style={{ padding: '9px 14px', color: '#475569' }}>{it.rate ? `₹${Number(it.rate).toFixed(2)}` : '—'}</td>
                                          <td style={{ padding: '9px 14px', fontWeight: 700, color: '#10B981' }}>{it.total ? `₹${Number(it.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}</td>
                                          <td style={{ padding: '9px 14px', fontSize: 12.5, color: '#475569' }}>{it.supplier || '—'}</td>
                                          <td style={{ padding: '9px 14px' }}>
                                            {it.userApproved
                                              ? <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12 }}><MdCheckCircle /> OK</span>
                                              : <span style={{ color: '#EF4444', fontWeight: 700, fontSize: 12 }}>✗ Issue</span>
                                            }
                                          </td>
                                          <td style={{ padding: '9px 14px', fontSize: 12, color: it.userComment ? '#DC2626' : '#94A3B8', fontStyle: it.userComment ? 'normal' : 'italic' }}>
                                            {it.userComment || 'No comment'}
                                          </td>
                                        </>
                                      ) : (
                                        <>
                                          <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                                            <input
                                              type="checkbox"
                                              checked={draft[i]?.approved ?? false}
                                              onChange={(e) => setItemApproved(sub.id, sub.items, i, e.target.checked)}
                                              style={{ width: 17, height: 17, cursor: 'pointer', accentColor: '#10B981' }}
                                            />
                                          </td>
                                          <td style={{ padding: '9px 14px', color: '#94A3B8', fontSize: 12 }}>{i + 1}</td>
                                          <td style={{ padding: '9px 14px', fontWeight: 700 }}>{it.itemName}</td>
                                          <td style={{ padding: '9px 14px' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11.5, background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>{it.category || '—'}</span>
                                          </td>
                                          <td style={{ padding: '9px 14px', fontWeight: 700, color: '#4F46E5' }}>{it.quantity} <span style={{ fontWeight: 400, fontSize: 11, color: '#94A3B8' }}>{it.unit}</span></td>
                                          <td style={{ padding: '9px 14px', color: '#475569' }}>{it.rate ? `₹${Number(it.rate).toFixed(2)}` : '—'}</td>
                                          <td style={{ padding: '9px 14px', fontWeight: 700, color: '#10B981' }}>{it.total ? `₹${Number(it.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}</td>
                                          <td style={{ padding: '9px 14px', fontSize: 12.5, color: '#475569' }}>{it.supplier || '—'}</td>
                                          <td style={{ padding: '6px 14px', minWidth: 210 }}>
                                            <input
                                              type="text"
                                              placeholder="Issue or comment (optional)..."
                                              value={draft[i]?.comment ?? ''}
                                              onChange={(e) => setItemComment(sub.id, sub.items, i, e.target.value)}
                                              style={{
                                                width: '100%', padding: '6px 9px',
                                                border: `1px solid ${draft[i]?.comment ? '#FCA5A5' : '#E2E8F0'}`,
                                                borderRadius: 6, fontSize: 12, outline: 'none',
                                                background: draft[i]?.comment ? '#FFF5F5' : '#FAFAFA',
                                                transition: 'border-color 0.2s',
                                              }}
                                            />
                                          </td>
                                        </>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr style={{ background: isApproved ? '#ECFDF5' : '#EEF2FF', fontWeight: 700 }}>
                                  <td colSpan={isApproved ? 5 : 6} style={{ padding: '9px 14px', fontSize: 13, color: '#475569' }}>
                                    {sub.items?.length} item{sub.items?.length !== 1 ? 's' : ''} in this submission
                                  </td>
                                  <td style={{ padding: '9px 14px', color: '#10B981', fontSize: 13 }}>₹{subTotal}</td>
                                  <td colSpan={isApproved ? 2 : 2} />
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          {/* ── Submit Approval bar — pending only ── */}
                          {!isApproved && (
                            <div style={{ padding: '12px 16px', borderTop: '1px solid #F1F5F9', background: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                              <div style={{ fontSize: 12.5, color: '#64748B' }}>
                                <span style={{ fontWeight: 700, color: approvedCnt > 0 ? '#10B981' : '#94A3B8' }}>
                                  {approvedCnt} of {sub.items?.length}
                                </span> items checked
                                {draft.some((d) => d.comment) && (
                                  <span style={{ marginLeft: 10, color: '#DC2626', fontWeight: 600 }}>
                                    · {draft.filter((d) => d.comment).length} issue{draft.filter((d) => d.comment).length !== 1 ? 's' : ''} noted
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleApprove(sub)}
                                disabled={approvedCnt === 0}
                                style={{
                                  padding: '9px 22px',
                                  background: approvedCnt > 0 ? '#10B981' : '#E2E8F0',
                                  color: approvedCnt > 0 ? '#fff' : '#94A3B8',
                                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
                                  cursor: approvedCnt > 0 ? 'pointer' : 'not-allowed',
                                  display: 'flex', alignItems: 'center', gap: 6,
                                  transition: 'background 0.2s',
                                }}
                              >
                                <MdCheckCircle /> Submit Approval
                              </button>
                            </div>
                          )}

                          {/* ── Approved lock footer ── */}
                          {isApproved && (
                            <div style={{ padding: '10px 16px', borderTop: '1px solid #BBF7D0', background: '#ECFDF5', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <MdLock style={{ color: '#10B981', fontSize: 15 }} />
                              <span style={{ fontSize: 12.5, color: '#059669', fontWeight: 600 }}>
                                Approved by {sub.approvedBy} · {new Date(sub.approvedAt).toLocaleString('en-IN')}
                              </span>
                              <span style={{ color: '#6EE7B7', marginLeft: 6, fontSize: 12 }}>
                                · {(sub.items || []).filter((it) => it.userApproved).length}/{sub.items?.length} items OK
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Grand total footer */}
                <div style={{ marginTop: 8, padding: '12px 16px', borderRadius: 10, background: '#F8FAFF', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ color: '#475569' }}>
                    {filteredReceived.length} submission{filteredReceived.length !== 1 ? 's' : ''}
                    {filteredReceived.length !== stockReceived.length && (
                      <span style={{ color: '#94A3B8' }}> (filtered from {stockReceived.length})</span>
                    )}
                    &nbsp;·&nbsp;
                    {filteredReceived.reduce((s, sub) => s + (sub.items?.length || 0), 0)} total items
                    {filteredReceived.filter((s) => s.approvalStatus === 'approved').length > 0 && (
                      <span style={{ marginLeft: 8, color: '#10B981', fontWeight: 600 }}>
                        · {filteredReceived.filter((s) => s.approvalStatus === 'approved').length} approved
                      </span>
                    )}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span style={{ fontWeight: 800, color: '#10B981', fontSize: 15 }}>
                      Total: ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {filteredReceived.length !== stockReceived.length && (
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>
                        All submissions: ₹{grandTotalAll.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ STOCK USED — Table ══ */}
        {activeTab === 'used' && (
          <div className="fsp-card">
            {/* Toolbar with Record button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F1F5F9', background: '#FAFBFF', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>Stock Used</span>
                {stockUsed.length > 0 && (
                  <span style={{ marginLeft: 8, padding: '2px 9px', borderRadius: 20, background: '#FFFBEB', color: '#D97706', fontSize: 12, fontWeight: 700 }}>
                    {stockUsed.length} record{stockUsed.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                onClick={() => setUsedModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#F59E0B', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(245,158,11,0.3)', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#D97706'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#F59E0B'; }}
              >
                <MdAdd style={{ fontSize: 18 }} /> Record Stock Used
              </button>
            </div>

            {stockUsed.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 20px', gap: 14, textAlign: 'center', color: '#94A3B8' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                  <MdOutbox style={{ color: '#F59E0B' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 4 }}>No Stock Used Records</div>
                  <div style={{ fontSize: 13 }}>Click <strong>Record Stock Used</strong> to log items you have consumed.</div>
                </div>
                <button
                  onClick={() => setUsedModalOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: '#F59E0B', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}
                >
                  <MdAdd style={{ fontSize: 17 }} /> Record Stock Used
                </button>
              </div>
            ) : (
              <>
                <div className="fsp-table-wrap">
                  <table className="fsp-table">
                    <thead>
                      <tr>
                        {['#', 'Item Name', 'Category', 'Quantity', 'Purpose / Used For', 'Date', 'Notes'].map((h) => <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {stockUsed.map((rec, idx) => (
                        <tr key={rec.id}>
                          <td style={{ color: '#94A3B8', fontSize: 12 }}>{idx + 1}</td>
                          <td style={{ fontWeight: 700 }}>{rec.itemName}</td>
                          <td>
                            {rec.category
                              ? <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11.5, background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>{rec.category}</span>
                              : <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>—</span>}
                          </td>
                          <td style={{ fontWeight: 700, color: '#F59E0B' }}>
                            {rec.quantity} <span style={{ fontWeight: 400, fontSize: 11, color: '#94A3B8' }}>{rec.unit}</span>
                          </td>
                          <td style={{ fontSize: 12.5, color: '#475569' }}>{rec.purpose || '—'}</td>
                          <td style={{ fontSize: 12.5, color: '#94A3B8' }}>{rec.date}</td>
                          <td style={{ fontSize: 12, color: '#94A3B8' }}>{rec.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '12px 20px', borderTop: '1px solid #F1F5F9', fontSize: 12.5, color: '#94A3B8' }}>
                  {stockUsed.length} record{stockUsed.length !== 1 ? 's' : ''} · {stockUsed.reduce((s, r) => s + Number(r.quantity || 0), 0)} units consumed
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ STOCK INHOUSE — Flat item table ══ */}
        {activeTab === 'inhouse' && (() => {
          const approvedCount = stockReceived.filter((s) => s.approvalStatus === 'approved').length;
          const totalInhouseValue = inhouseItems.reduce((s, it) => s + it.estValue, 0);
          const totalBalanceUnits = inhouseItems.reduce((s, it) => s + it.balance, 0);

          const thS = { padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap', background: '#F8FAFF' };
          const tdS = { padding: '10px 14px', borderBottom: '1px solid #F1F5F9', fontSize: 13 };

          return (
            <div className="fsp-card">
              {/* Summary bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F1F5F9', background: '#FAFBFF', flexWrap: 'wrap' }}>
                {[
                  { label: 'Item Types',       val: inhouseItems.length,         color: '#4F46E5', bg: '#EEF2FF' },
                  { label: 'Approved Batches', val: approvedCount,               color: '#10B981', bg: '#ECFDF5' },
                  { label: 'Total Units In',   val: inhouseItems.reduce((s, it) => s + it.totalReceived, 0), color: '#3B82F6', bg: '#EFF6FF' },
                  { label: 'Total Units Used', val: inhouseItems.reduce((s, it) => s + it.totalUsed, 0),     color: '#F59E0B', bg: '#FFFBEB' },
                  { label: 'Est. Inhouse Value', val: `₹${totalInhouseValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: '#10B981', bg: '#ECFDF5' },
                ].map((k) => (
                  <div key={k.label} style={{ padding: '8px 14px', borderRadius: 10, background: k.bg, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 120 }}>
                    <span style={{ fontSize: 17, fontWeight: 800, color: k.color }}>{k.val}</span>
                    <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{k.label}</span>
                  </div>
                ))}
              </div>

              {inhouseItems.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 12, textAlign: 'center', color: '#94A3B8' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                    <MdInventory style={{ color: '#4F46E5' }} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>No Inhouse Stock</div>
                  <div style={{ fontSize: 13 }}>
                    {stockReceived.length === 0
                      ? 'No stock has been received for this project yet.'
                      : 'Stock has been received but not yet approved. Approve submissions to see the inhouse balance.'}
                  </div>
                </div>
              ) : (
                <>
                  {/* Click-hint bar */}
                  <div style={{ padding: '8px 16px', background: '#EFF6FF', borderBottom: '1px solid #DBEAFE', fontSize: 12, color: '#3B82F6', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MdInfo style={{ fontSize: 15, flexShrink: 0 }} />
                    Click any row to view the full received and usage history for that item.
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr>
                          {['#', 'Item Name', 'Category', 'Total Received', 'Total Used', 'Inhouse Balance', 'Unit', 'Rate (₹)', 'Est. Value (₹)', 'Supplier'].map((h) => (
                            <th key={h} style={thS}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {inhouseItems.map((it, idx) => {
                          const balColor  = it.balance > 0 ? '#10B981' : it.balance < 0 ? '#EF4444' : '#94A3B8';
                          const balBg     = it.balance > 0 ? '#F0FDF4' : it.balance < 0 ? '#FFF5F5' : '#F8FAFF';
                          const rowBg     = idx % 2 === 0 ? '#fff' : '#FAFBFF';
                          return (
                            <tr
                              key={it.key}
                              onClick={() => setInhouseDetailItem(it)}
                              style={{ background: rowBg, cursor: 'pointer', transition: 'background 0.15s' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = rowBg; }}
                            >
                              <td style={{ ...tdS, color: '#94A3B8', fontSize: 12 }}>{idx + 1}</td>
                              <td style={{ ...tdS, fontWeight: 700 }}>{it.itemName}</td>
                              <td style={tdS}>
                                {it.category
                                  ? <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11.5, background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>{it.category}</span>
                                  : <span style={{ color: '#CBD5E1' }}>—</span>}
                              </td>
                              <td style={{ ...tdS, fontWeight: 700, color: '#3B82F6' }}>
                                {it.totalReceived}
                              </td>
                              <td style={{ ...tdS, color: it.totalUsed > 0 ? '#F59E0B' : '#CBD5E1', fontWeight: it.totalUsed > 0 ? 700 : 400 }}>
                                {it.totalUsed > 0 ? it.totalUsed : '—'}
                              </td>
                              <td style={tdS}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: balBg, color: balColor, fontWeight: 800, fontSize: 13 }}>
                                  {it.balance > 0 ? '▲' : it.balance < 0 ? '▼' : '●'} {it.balance}
                                </span>
                              </td>
                              <td style={{ ...tdS, color: '#64748B' }}>{it.unit || '—'}</td>
                              <td style={{ ...tdS, color: '#475569' }}>
                                {it.lastRate ? `₹${Number(it.lastRate).toFixed(2)}` : '—'}
                              </td>
                              <td style={{ ...tdS, fontWeight: 700, color: it.estValue > 0 ? '#10B981' : '#CBD5E1' }}>
                                {it.estValue > 0
                                  ? `₹${it.estValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : '—'}
                              </td>
                              <td style={{ ...tdS, fontSize: 12.5, color: '#64748B' }}>{it.supplier || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#F8FAFF', fontWeight: 700 }}>
                          <td colSpan={3} style={{ ...tdS, fontSize: 12, color: '#64748B' }}>
                            {inhouseItems.length} item type{inhouseItems.length !== 1 ? 's' : ''}
                          </td>
                          <td style={{ ...tdS, color: '#3B82F6' }}>{inhouseItems.reduce((s, it) => s + it.totalReceived, 0)}</td>
                          <td style={{ ...tdS, color: '#F59E0B' }}>{inhouseItems.reduce((s, it) => s + it.totalUsed, 0)}</td>
                          <td style={{ ...tdS, color: totalBalanceUnits > 0 ? '#10B981' : '#94A3B8', fontSize: 13 }}>
                            {totalBalanceUnits}
                          </td>
                          <td colSpan={2} />
                          <td style={{ ...tdS, color: '#10B981' }}>
                            ₹{totalInhouseValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div style={{ padding: '10px 20px', borderTop: '1px solid #F1F5F9', fontSize: 12, color: '#94A3B8' }}>
                    Showing items from {approvedCount} approved submission{approvedCount !== 1 ? 's' : ''}. Pending submissions are excluded until approved.
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* ══ STOCK RETURNED — Table ══ */}
        {activeTab === 'returned' && (() => {
          const thS = { padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap', background: '#F8FAFF' };
          const tdS = { padding: '10px 14px', borderBottom: '1px solid #F1F5F9', fontSize: 13 };
          const totalReturnedQty = stockReturned.reduce((s, r) => s + Number(r.quantity || 0), 0);

          return (
            <div className="fsp-card">
              {/* Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F1F5F9', background: '#FAFBFF', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>Stock Returned</span>
                  {stockReturned.length > 0 && (
                    <span style={{ marginLeft: 8, padding: '2px 9px', borderRadius: 20, background: '#F5F3FF', color: '#7C3AED', fontSize: 12, fontWeight: 700 }}>
                      {stockReturned.length} record{stockReturned.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setReturnedModalOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,58,237,0.3)', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#6D28D9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#7C3AED'; }}
                >
                  <MdUndo style={{ fontSize: 17 }} /> Record Stock Returned
                </button>
              </div>

              {stockReturned.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 20px', gap: 14, textAlign: 'center', color: '#94A3B8' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                    <MdUndo style={{ color: '#7C3AED' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 4 }}>No Stock Returned Yet</div>
                    <div style={{ fontSize: 13 }}>Click <strong>Record Stock Returned</strong> to log items sent back to the main store.</div>
                  </div>
                  <button
                    onClick={() => setReturnedModalOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}
                  >
                    <MdUndo style={{ fontSize: 17 }} /> Record Stock Returned
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr>
                          {['#', 'Item Name', 'Category', 'Qty Returned', 'Reason', 'Date', 'Returned By', 'Notes'].map((h) => (
                            <th key={h} style={thS}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stockReturned.map((rec, idx) => (
                          <tr key={rec.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                            <td style={{ ...tdS, color: '#94A3B8', fontSize: 12 }}>{idx + 1}</td>
                            <td style={{ ...tdS, fontWeight: 700 }}>{rec.itemName}</td>
                            <td style={tdS}>
                              {rec.category
                                ? <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11.5, background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>{rec.category}</span>
                                : <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>—</span>}
                            </td>
                            <td style={{ ...tdS, fontWeight: 700, color: '#7C3AED' }}>
                              {rec.quantity} <span style={{ fontWeight: 400, fontSize: 11, color: '#94A3B8' }}>{rec.unit}</span>
                            </td>
                            <td style={{ ...tdS, fontSize: 12.5, color: '#475569' }}>{rec.reason || '—'}</td>
                            <td style={{ ...tdS, fontSize: 12.5, color: '#94A3B8' }}>{rec.date}</td>
                            <td style={{ ...tdS, fontSize: 12.5, color: '#64748B' }}>{rec.returnedBy || '—'}</td>
                            <td style={{ ...tdS, fontSize: 12, color: '#94A3B8' }}>{rec.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding: '12px 20px', borderTop: '1px solid #F1F5F9', fontSize: 12.5, color: '#94A3B8' }}>
                    {stockReturned.length} record{stockReturned.length !== 1 ? 's' : ''} · {totalReturnedQty} units returned to store
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* ── Stock Used Modal ── */}
        {usedModalOpen && project && (
          <StockUsedModal
            project={project}
            stockReceived={stockReceived}
            stockUsed={stockUsed}
            onSave={handleRecordUsed}
            onClose={() => setUsedModalOpen(false)}
          />
        )}

        {/* ── Stock Returned Modal ── */}
        {returnedModalOpen && project && (
          <StockReturnedModal
            project={project}
            availablePool={inhouseItems.filter((it) => it.balance > 0)}
            onSave={handleRecordReturned}
            onClose={() => setReturnedModalOpen(false)}
          />
        )}

        {/* ── Inhouse Detail Modal ── */}
        {inhouseDetailItem && (
          <InhouseDetailModal
            item={inhouseDetailItem}
            stockReceived={stockReceived}
            stockUsed={stockUsed}
            stockReturned={stockReturned}
            onClose={() => setInhouseDetailItem(null)}
          />
        )}

      </div>

      {/* ── Profile Drawer ── */}
      {profileOpen && currentUser && (
        <ProfileDrawer
          user={currentUser}
          onClose={() => setProfileOpen(false)}
          onUpdate={(updated) => login(updated)}
        />
      )}

    </div>
  );
};

export default ProjectDetails;
