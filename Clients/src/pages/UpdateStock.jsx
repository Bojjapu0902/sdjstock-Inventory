import './UpdateStock.css';
import React, { useState, useMemo, useEffect } from 'react';
import {
  MdFileDownload, MdCheckCircle, MdSystemUpdateAlt,
  MdTrendingDown, MdInventory2, MdRefresh, MdArrowUpward,
  MdArrowDownward,
} from 'react-icons/md';
import {
  categories,
  getStockPercent, getStockBarClass,
  formatCurrency, formatDate,
} from '../data/mockData';
import api from '../services/api';
import { useInventoryStock } from '../hooks/useInventoryStock';
import { useAuth } from '../contexts/AuthContext';

const TODAY = new Date().toISOString().split('T')[0];

/* ── CSV / Excel export helper ─────────────────────── */
const exportTransactions = (data, label = 'all') => {
  const headers = [
    'Date', 'Transaction ID', 'Type', 'Item', 'Category',
    'Quantity', 'Unit', 'Unit Cost (INR)', 'Total Value (INR)',
    'Supplier / Usage Type', 'Logged By', 'Notes',
  ];
  const rows = data.map((t) => [
    t.date,
    t.id,
    t.type === 'IN' ? 'Stock In' : 'Stock Out',
    t.item,
    t.category,
    t.type === 'IN' ? `+${t.qty}` : `-${t.qty}`,
    t.unit,
    t.unitCost.toFixed(2),
    t.totalCost.toFixed(2),
    t.supplier || t.usageType || '',
    t.loggedBy || '',
    t.notes || '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  // UTF-8 BOM makes Excel auto-detect encoding correctly
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `stock-transactions-${label}-${TODAY}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const USAGE_TYPES = ['Kitchen Use', 'Event', 'Daily Consumption', 'Wastage', 'Other'];

const RECEIVE_INIT = {
  itemId: '', category: '', supplier: '', unit: '',
  date: TODAY, quantity: '', rate: '', notes: '',
};

const USAGE_INIT = {
  itemId: '', category: '', unit: '',
  date: TODAY, quantity: '', usageType: 'Kitchen Use',
  loggedBy: '', notes: '',
};

/* ── Reusable stock level bar banner ───────────────── */
const StockBanner = ({ item, nextQty, mode }) => {
  const isOut = mode === 'usage';
  const next = item.currentStock + (isOut ? -(Number(nextQty) || 0) : (Number(nextQty) || 0));
  const clamped = Math.max(next, 0);
  const overStock = isOut && Number(nextQty) > item.currentStock;
  const pct = getStockPercent(item.currentStock, item.maxStock);

  return (
    <div style={{
      display: 'flex', gap: 10, marginBottom: 20, padding: '14px 18px',
      background: overStock ? 'var(--danger-bg)' : 'var(--primary-pale)',
      borderRadius: 12,
      border: `1px solid ${overStock ? 'rgba(239,68,68,0.2)' : 'rgba(79,70,229,0.15)'}`,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>
          Current Stock
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>
          {item.currentStock} <span style={{ fontSize: 14, fontWeight: 600 }}>{item.unit}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Min: {item.minStock} · Max: {item.maxStock} {item.unit}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 20, color: 'var(--text-muted)' }}>
        →
      </div>

      <div style={{ flex: 1, textAlign: 'right' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>
          After {isOut ? 'Usage' : 'Receiving'}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color: overStock ? 'var(--danger)' : isOut ? 'var(--warning)' : 'var(--success)' }}>
          {clamped} <span style={{ fontSize: 14, fontWeight: 600 }}>{item.unit}</span>
        </div>
        <div style={{ fontSize: 12, marginTop: 4, color: overStock ? 'var(--danger)' : nextQty ? (isOut ? 'var(--warning)' : 'var(--success)') : 'var(--text-muted)' }}>
          {overStock
            ? '⚠️ Exceeds available stock!'
            : nextQty
              ? `${isOut ? '-' : '+'}${nextQty} ${item.unit} ${isOut ? 'consumed' : 'incoming'}`
              : 'enter quantity below'}
        </div>
      </div>
    </div>
  );
};

/* ── Success splash ─────────────────────────────────── */
const SuccessSplash = ({ message }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 20px', gap: 16, textAlign: 'center' }}>
    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <MdCheckCircle style={{ color: 'var(--success)', fontSize: 42 }} />
    </div>
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Done!</div>
      <div style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>{message}</div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════
   UPDATE STOCK PAGE
   ════════════════════════════════════════════════════ */
const UpdateStock = () => {
  const { stockMap, adjustStock } = useInventoryStock();
  const { user: currentUser } = useAuth();

  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    api.get('/inventory').then(setItems).catch(console.error);
    api.get('/stock-history')
      .then((map) => {
        const flat = Object.values(map).flat().map((r) => ({
          id: r.id, date: r.timestamp ? r.timestamp.split('T')[0] : '', itemId: r.itemId,
          item: r.itemName || '', category: r.category || '', type: r.type || 'IN',
          qty: r.qty, unit: r.unit, unitCost: r.rate,
          totalCost: +(r.qty * r.rate).toFixed(2),
          supplier: r.supplier || '', usageType: r.usageType || '',
          loggedBy: r.loggedBy || '', notes: r.desc || '',
        }));
        setTransactions(flat.sort((a, b) => new Date(b.date) - new Date(a.date)));
      })
      .catch(console.error);
  }, []);
  const [activeTab, setActiveTab] = useState('receive');

  const [receiveForm, setReceiveForm] = useState(RECEIVE_INIT);
  const [receiveSuccess, setReceiveSuccess] = useState(false);

  const [usageForm, setUsageForm] = useState(USAGE_INIT);
  const [usageSuccess, setUsageSuccess] = useState(false);

  const [histSearch, setHistSearch] = useState('');
  const [histType, setHistType] = useState('All');
  const [histCat, setHistCat] = useState('All Categories');

  /* ── Summary stats (this month) ─────────────────── */
  const summary = useMemo(() => {
    const m = new Date().getMonth();
    const y = new Date().getFullYear();
    const mt = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === m && d.getFullYear() === y;
    });
    const totalIn  = mt.filter((t) => t.type === 'IN').reduce((s, t) => s + t.totalCost, 0);
    const totalOut = mt.filter((t) => t.type === 'OUT').reduce((s, t) => s + t.totalCost, 0);
    return {
      totalIn, totalOut,
      inCount:  mt.filter((t) => t.type === 'IN').length,
      outCount: mt.filter((t) => t.type === 'OUT').length,
      total: mt.length,
    };
  }, [transactions]);

  /* ── Receive handlers ───────────────────────────── */
  const handleReceiveItemChange = (itemId) => {
    const found = items.find((i) => i.id === itemId);
    setReceiveForm((f) => found
      ? { ...f, itemId, category: found.category, supplier: found.supplier, unit: found.unit, rate: String(found.unitCost) }
      : { ...f, itemId, category: '', supplier: '', unit: '', rate: '' });
  };

  const handleReceiveSave = async () => {
    const { itemId, supplier, date, quantity, rate, notes } = receiveForm;
    if (!itemId || !quantity || !rate) return;
    const qty = Number(quantity);
    const newRate = Number(rate);
    const item = items.find((i) => i.id === itemId);

    await adjustStock(itemId, qty);
    setItems((prev) => prev.map((it) => it.id === itemId
      ? { ...it, currentStock: (stockMap[itemId] ?? it.currentStock) + qty, unitCost: newRate, supplier: supplier || it.supplier }
      : it));

    let txnId = `TXN-${Date.now()}`;
    try {
      const saved = await api.post(`/stock-history/${itemId}`, {
        timestamp: new Date(date).toISOString(), qty, rate: newRate, unit: item.unit,
        desc: notes, type: 'IN', itemName: item.name, category: item.category,
        supplier: supplier || item.supplier, loggedBy: currentUser?.username || 'Admin',
      });
      txnId = saved.id;
    } catch (err) { console.error('History save failed:', err); }

    const txn = { id: txnId, date, itemId, item: item.name, category: item.category, type: 'IN', qty, unit: item.unit, unitCost: newRate, totalCost: +(qty * newRate).toFixed(2), supplier: supplier || item.supplier, usageType: null, loggedBy: currentUser?.username || 'Admin', notes };
    setTransactions((prev) => [txn, ...prev]);
    setReceiveSuccess(true);
    setTimeout(() => { setReceiveSuccess(false); setReceiveForm(RECEIVE_INIT); }, 1800);
  };

  /* ── Usage handlers ─────────────────────────────── */
  const handleUsageItemChange = (itemId) => {
    const found = items.find((i) => i.id === itemId);
    setUsageForm((f) => found
      ? { ...f, itemId, category: found.category, unit: found.unit }
      : { ...f, itemId, category: '', unit: '' });
  };

  const handleUsageSave = async () => {
    const { itemId, date, quantity, usageType, loggedBy, notes } = usageForm;
    if (!itemId || !quantity) return;
    const qty = Number(quantity);
    const item = items.find((i) => i.id === itemId);
    const currentStock = stockMap[itemId] ?? item?.currentStock ?? 0;
    if (!item || qty > currentStock) return;

    await adjustStock(itemId, -qty);
    setItems((prev) => prev.map((it) => it.id === itemId
      ? { ...it, currentStock: Math.max(currentStock - qty, 0) }
      : it));

    let txnId = `TXN-${Date.now()}`;
    try {
      const saved = await api.post(`/stock-history/${itemId}`, {
        timestamp: new Date(date).toISOString(), qty, rate: item.unitCost, unit: item.unit,
        desc: notes, type: 'OUT', itemName: item.name, category: item.category,
        usageType, loggedBy: loggedBy || currentUser?.username || 'Admin',
      });
      txnId = saved.id;
    } catch (err) { console.error('History save failed:', err); }

    const txn = { id: txnId, date, itemId, item: item.name, category: item.category, type: 'OUT', qty, unit: item.unit, unitCost: item.unitCost, totalCost: +(qty * item.unitCost).toFixed(2), supplier: null, usageType, loggedBy: loggedBy || currentUser?.username || 'Admin', notes };
    setTransactions((prev) => [txn, ...prev]);
    setUsageSuccess(true);
    setTimeout(() => { setUsageSuccess(false); setUsageForm(USAGE_INIT); }, 1800);
  };

  /* ── Filtered history ───────────────────────────── */
  const filteredHistory = useMemo(() => transactions.filter((t) => {
    const q = histSearch.toLowerCase();
    return (
      (!histSearch || t.item.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
        || (t.supplier || '').toLowerCase().includes(q) || (t.loggedBy || '').toLowerCase().includes(q))
      && (histType === 'All' || t.type === histType)
      && (histCat === 'All Categories' || t.category === histCat)
    );
  }), [transactions, histSearch, histType, histCat]);

  /* ── Derived values ─────────────────────────────── */
  const receiveItem = items.find((i) => i.id === receiveForm.itemId);
  const receiveItemLive = receiveItem ? { ...receiveItem, currentStock: stockMap[receiveItem.id] ?? receiveItem.currentStock } : null;
  const receiveTotal = receiveForm.quantity && receiveForm.rate
    ? (Number(receiveForm.quantity) * Number(receiveForm.rate)).toFixed(2) : null;

  const usageItem = items.find((i) => i.id === usageForm.itemId);
  const usageItemLive = usageItem ? { ...usageItem, currentStock: stockMap[usageItem.id] ?? usageItem.currentStock } : null;
  const usageCost = usageForm.quantity && usageItemLive
    ? (Number(usageForm.quantity) * usageItemLive.unitCost).toFixed(2) : null;
  const isOverStock = usageItemLive && usageForm.quantity && Number(usageForm.quantity) > usageItemLive.currentStock;

  /* ── Render ─────────────────────────────────────── */
  return (
    <div>

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Update Stock</h1>
          <p>Receive incoming goods from suppliers or record daily stock usage and consumption</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary-fsp" onClick={() => exportTransactions(transactions, 'all')}>
            <MdFileDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Stock Received (MTD)',  val: formatCurrency(summary.totalIn),              sub: `${summary.inCount} receipt${summary.inCount !== 1 ? 's' : ''}`,  color: 'var(--success)', icon: '📦' },
          { label: 'Stock Used (MTD)',       val: formatCurrency(summary.totalOut),             sub: `${summary.outCount} usage log${summary.outCount !== 1 ? 's' : ''}`, color: 'var(--danger)',  icon: '📉' },
          { label: 'Net Movement',           val: formatCurrency(summary.totalIn - summary.totalOut), sub: 'received minus consumed',              color: summary.totalIn >= summary.totalOut ? 'var(--success)' : 'var(--danger)', icon: '📊' },
          { label: 'Total Transactions',     val: summary.total,                               sub: 'this month',                                color: 'var(--primary)', icon: '🔢' },
        ].map((s) => (
          <div key={s.label} className="fsp-card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{s.sub}</div>
              </div>
              <span style={{ fontSize: 22, opacity: 0.65 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="page-tabs">
        <button className={`page-tab ${activeTab === 'receive' ? 'active' : ''}`} onClick={() => setActiveTab('receive')}>
          <MdArrowUpward /> Receive Stock
        </button>
        <button className={`page-tab ${activeTab === 'usage' ? 'active' : ''}`} onClick={() => setActiveTab('usage')}>
          <MdArrowDownward /> Log Usage
        </button>
        <button className={`page-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <MdInventory2 /> Transaction History
          <span className="page-tab-count">{transactions.length}</span>
        </button>
      </div>

      {/* ══ RECEIVE STOCK TAB ══════════════════════════════ */}
      {activeTab === 'receive' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' }}>

          {/* Left — Form */}
          <div className="fsp-card">
            <div className="fsp-card-header">
              <div>
                <div className="fsp-card-title">Receive Stock</div>
                <div className="fsp-card-subtitle">Record goods received from a supplier — updates inventory instantly</div>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              {receiveSuccess ? (
                <SuccessSplash message={`+${receiveForm.quantity} ${receiveForm.unit} of ${items.find((i) => i.id === receiveForm.itemId)?.name} added to inventory`} />
              ) : (
                <>
                  {/* Item selector */}
                  <div style={{ marginBottom: 18 }}>
                    <label className="fsp-label">Select Item *</label>
                    <select className="fsp-select" value={receiveForm.itemId} onChange={(e) => handleReceiveItemChange(e.target.value)} style={{ width: '100%', fontSize: 14 }}>
                      <option value="">— Choose an inventory item —</option>
                      {[...items].sort((a, b) => a.name.localeCompare(b.name)).map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.id}) — Stock: {item.currentStock} {item.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stock preview */}
                  {receiveItemLive && <StockBanner item={receiveItemLive} nextQty={receiveForm.quantity} mode="receive" />}

                  {/* Form grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px' }}>
                    <div>
                      <label className="fsp-label">Category</label>
                      <input className="fsp-input" value={receiveForm.category} readOnly
                        style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', cursor: 'default' }}
                        placeholder="Auto-filled" />
                    </div>
                    <div>
                      <label className="fsp-label">Supplier</label>
                      <input className="fsp-input" value={receiveForm.supplier}
                        onChange={(e) => setReceiveForm((f) => ({ ...f, supplier: e.target.value }))}
                        placeholder="Supplier name" />
                    </div>
                    <div>
                      <label className="fsp-label">Received Date *</label>
                      <input className="fsp-input" type="date" value={receiveForm.date}
                        onChange={(e) => setReceiveForm((f) => ({ ...f, date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="fsp-label">
                        Quantity Received *&nbsp;
                        {receiveForm.unit && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({receiveForm.unit})</span>}
                      </label>
                      <input className="fsp-input" type="number" min="0" step="0.01"
                        value={receiveForm.quantity}
                        onChange={(e) => setReceiveForm((f) => ({ ...f, quantity: e.target.value }))}
                        placeholder="e.g. 100" />
                    </div>
                    <div>
                      <label className="fsp-label">
                        Purchase Rate *&nbsp;
                        {receiveForm.unit && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(₹/{receiveForm.unit})</span>}
                      </label>
                      <input className="fsp-input" type="number" min="0" step="0.01"
                        value={receiveForm.rate}
                        onChange={(e) => setReceiveForm((f) => ({ ...f, rate: e.target.value }))}
                        placeholder="e.g. 1.80" />
                    </div>
                    <div>
                      <label className="fsp-label">Total Amount</label>
                      <div style={{ height: 42, display: 'flex', alignItems: 'center', padding: '0 14px', background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 15, fontWeight: 800, color: 'var(--success)' }}>
                        {receiveTotal
                          ? `₹${Number(receiveTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 13 }}>Enter qty & rate</span>}
                      </div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="fsp-label">Notes (optional)</label>
                      <input className="fsp-input" value={receiveForm.notes}
                        onChange={(e) => setReceiveForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="e.g. Monthly restock, PO reference…" />
                    </div>
                  </div>

                  {/* Summary line */}
                  {receiveForm.itemId && receiveForm.quantity && receiveForm.rate && (
                    <div style={{ marginTop: 16, padding: '11px 14px', background: 'var(--bg-main)', borderRadius: 10, border: '1px solid var(--border-color)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Summary: </span>
                      Receiving&nbsp;<strong style={{ color: 'var(--success)' }}>+{receiveForm.quantity} {receiveForm.unit}</strong> of&nbsp;
                      <strong>{items.find((i) => i.id === receiveForm.itemId)?.name}</strong> at&nbsp;
                      <strong>₹{Number(receiveForm.rate).toFixed(2)}/{receiveForm.unit}</strong> — Total:&nbsp;
                      <strong style={{ color: 'var(--success)' }}>{Number(receiveTotal).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })}</strong>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button className="btn-secondary-fsp" onClick={() => setReceiveForm(RECEIVE_INIT)}>Reset</button>
                    <button
                      className="btn-stock-update"
                      onClick={handleReceiveSave}
                      disabled={!receiveForm.itemId || !receiveForm.quantity || !receiveForm.rate}
                      style={{ opacity: (!receiveForm.itemId || !receiveForm.quantity || !receiveForm.rate) ? 0.5 : 1 }}
                    >
                      <MdSystemUpdateAlt /> Confirm Stock Received
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right — Guide panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="fsp-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>How to use</div>
              {[
                { step: '1', text: 'Select the item you received from the dropdown.' },
                { step: '2', text: 'Confirm or update the supplier name.' },
                { step: '3', text: 'Enter the quantity received and the purchase rate.' },
                { step: '4', text: 'Click Confirm — stock level updates immediately.' },
              ].map((s) => (
                <div key={s.step} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{s.step}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', paddingTop: 2 }}>{s.text}</div>
                </div>
              ))}
            </div>

            <div className="fsp-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Recent Receipts</div>
              {transactions.filter((t) => t.type === 'IN').slice(0, 5).map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{t.item}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(t.date)}</div>
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--success)' }}>+{t.qty} {t.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ LOG USAGE TAB ════════════════════════════════════ */}
      {activeTab === 'usage' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' }}>

          {/* Left — Form */}
          <div className="fsp-card">
            <div className="fsp-card-header">
              <div>
                <div className="fsp-card-title">Log Usage</div>
                <div className="fsp-card-subtitle">Record stock consumed in kitchen operations, events, or daily service</div>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              {usageSuccess ? (
                <SuccessSplash message={`-${usageForm.quantity} ${usageForm.unit} deducted from ${items.find((i) => i.id === usageForm.itemId)?.name}`} />
              ) : (
                <>
                  {/* Item selector — only in-stock items */}
                  <div style={{ marginBottom: 18 }}>
                    <label className="fsp-label">Select Item *</label>
                    <select className="fsp-select" value={usageForm.itemId} onChange={(e) => handleUsageItemChange(e.target.value)} style={{ width: '100%', fontSize: 14 }}>
                      <option value="">— Choose an inventory item —</option>
                      {[...items].sort((a, b) => a.name.localeCompare(b.name)).filter((i) => i.currentStock > 0).map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.id}) — Available: {item.currentStock} {item.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stock preview */}
                  {usageItemLive && <StockBanner item={usageItemLive} nextQty={usageForm.quantity} mode="usage" />}

                  {/* Form grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px' }}>
                    <div>
                      <label className="fsp-label">Category</label>
                      <input className="fsp-input" value={usageForm.category} readOnly
                        style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', cursor: 'default' }}
                        placeholder="Auto-filled" />
                    </div>
                    <div>
                      <label className="fsp-label">Date of Usage *</label>
                      <input className="fsp-input" type="date" value={usageForm.date}
                        onChange={(e) => setUsageForm((f) => ({ ...f, date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="fsp-label">
                        Quantity Used *&nbsp;
                        {usageForm.unit && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({usageForm.unit})</span>}
                      </label>
                      <input className="fsp-input" type="number" min="0" step="0.01"
                        value={usageForm.quantity}
                        onChange={(e) => setUsageForm((f) => ({ ...f, quantity: e.target.value }))}
                        placeholder="e.g. 10"
                        style={{ borderColor: isOverStock ? 'var(--danger)' : undefined }} />
                    </div>
                    <div>
                      <label className="fsp-label">Usage Type</label>
                      <select className="fsp-select" value={usageForm.usageType}
                        onChange={(e) => setUsageForm((f) => ({ ...f, usageType: e.target.value }))}>
                        {USAGE_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="fsp-label">Logged By</label>
                      <input className="fsp-input" value={usageForm.loggedBy}
                        onChange={(e) => setUsageForm((f) => ({ ...f, loggedBy: e.target.value }))}
                        placeholder="e.g. Chef Marco" />
                    </div>
                    <div>
                      <label className="fsp-label">Estimated Cost</label>
                      <div style={{ height: 42, display: 'flex', alignItems: 'center', padding: '0 14px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 15, fontWeight: 800, color: 'var(--danger)' }}>
                        {usageCost
                          ? `₹${Number(usageCost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 13 }}>Enter quantity</span>}
                      </div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="fsp-label">Notes (optional)</label>
                      <input className="fsp-input" value={usageForm.notes}
                        onChange={(e) => setUsageForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="e.g. Dinner service, event name, reason…" />
                    </div>
                  </div>

                  {/* Summary line */}
                  {usageForm.itemId && usageForm.quantity && !isOverStock && usageCost && (
                    <div style={{ marginTop: 16, padding: '11px 14px', background: 'var(--bg-main)', borderRadius: 10, border: '1px solid var(--border-color)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Summary: </span>
                      Consuming&nbsp;<strong style={{ color: 'var(--danger)' }}>-{usageForm.quantity} {usageForm.unit}</strong> of&nbsp;
                      <strong>{items.find((i) => i.id === usageForm.itemId)?.name}</strong> for&nbsp;
                      <strong>{usageForm.usageType}</strong> — Cost:&nbsp;
                      <strong style={{ color: 'var(--danger)' }}>{Number(usageCost).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })}</strong>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button className="btn-secondary-fsp" onClick={() => setUsageForm(USAGE_INIT)}>Reset</button>
                    <button
                      className="btn-danger-fsp"
                      onClick={handleUsageSave}
                      disabled={!usageForm.itemId || !usageForm.quantity || isOverStock}
                      style={{ opacity: (!usageForm.itemId || !usageForm.quantity || isOverStock) ? 0.5 : 1 }}
                    >
                      <MdTrendingDown /> Log Usage
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right — Guide panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="fsp-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>How to use</div>
              {[
                { step: '1', text: 'Select the item that was consumed or used.' },
                { step: '2', text: 'Enter the exact quantity used during the service.' },
                { step: '3', text: 'Choose the usage type and add the staff name.' },
                { step: '4', text: 'Click Log Usage — stock is deducted immediately.' },
              ].map((s) => (
                <div key={s.step} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--danger)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{s.step}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', paddingTop: 2 }}>{s.text}</div>
                </div>
              ))}
            </div>

            <div className="fsp-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Recent Usage</div>
              {transactions.filter((t) => t.type === 'OUT').slice(0, 5).map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{t.item}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.usageType} · {formatDate(t.date)}</div>
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--danger)' }}>-{t.qty} {t.unit}</span>
                </div>
              ))}
            </div>

            <div className="fsp-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Usage Types</div>
              {USAGE_TYPES.map((t) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ TRANSACTION HISTORY TAB ═════════════════════════ */}
      {activeTab === 'history' && (
        <div className="fsp-card">
          <div className="fsp-card-header">
            <div>
              <div className="fsp-card-title">Transaction History</div>
              <div className="fsp-card-subtitle">Complete log of all stock movements — incoming receipts and outgoing usage</div>
            </div>
          </div>

          {/* Filters */}
          <div className="filter-toolbar">
            <div className="filter-search">
              <svg className="filter-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 15, height: 15 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search item, supplier, logged by…"
                value={histSearch} onChange={(e) => setHistSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={histType} onChange={(e) => setHistType(e.target.value)}>
              <option value="All">All Types</option>
              <option value="IN">Stock In</option>
              <option value="OUT">Stock Out</option>
            </select>
            <select className="filter-select" value={histCat} onChange={(e) => setHistCat(e.target.value)}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className="btn-icon-sm" title="Reset filters"
              onClick={() => { setHistSearch(''); setHistType('All'); setHistCat('All Categories'); }}>
              <MdRefresh />
            </button>
            <button
              className="btn-secondary-fsp"
              style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
              onClick={() => {
                const label = [
                  histType !== 'All' ? histType.toLowerCase() : '',
                  histCat !== 'All Categories' ? histCat.toLowerCase().replace(/\s+/g, '-') : '',
                  histSearch ? 'filtered' : '',
                ].filter(Boolean).join('-') || 'all';
                exportTransactions(filteredHistory, label);
              }}
              title="Download filtered transactions as CSV (opens in Excel)"
            >
              <MdFileDownload /> Export {filteredHistory.length !== transactions.length ? `(${filteredHistory.length})` : 'CSV'}
            </button>
            <span className="filter-count">{filteredHistory.length} of {transactions.length}</span>
          </div>

          {/* Table */}
          <div className="fsp-table-wrap">
            <table className="fsp-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit Cost</th>
                  <th>Total Value</th>
                  <th>Supplier / Usage</th>
                  <th>Logged By</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                      No transactions match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((txn) => (
                    <tr key={txn.id} style={{ background: txn.type === 'IN' ? 'rgba(16,185,129,0.02)' : 'rgba(239,68,68,0.02)' }}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{formatDate(txn.date)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{txn.id}</div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700,
                          background: txn.type === 'IN' ? 'var(--success-bg)' : 'var(--danger-bg)',
                          color: txn.type === 'IN' ? 'var(--success)' : 'var(--danger)',
                          border: `1px solid ${txn.type === 'IN' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                          whiteSpace: 'nowrap',
                        }}>
                          {txn.type === 'IN' ? '↑' : '↓'}&nbsp;{txn.type === 'IN' ? 'Stock In' : 'Stock Out'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{txn.item}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{txn.category}</div>
                      </td>
                      <td style={{ fontWeight: 800, color: txn.type === 'IN' ? 'var(--success)' : 'var(--danger)', whiteSpace: 'nowrap', fontSize: 14 }}>
                        {txn.type === 'IN' ? '+' : '-'}{txn.qty} {txn.unit}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatCurrency(txn.unitCost)}</td>
                      <td style={{ fontWeight: 700, fontSize: 13.5 }}>{formatCurrency(txn.totalCost)}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{txn.supplier || txn.usageType || '—'}</td>
                      <td style={{ fontSize: 13 }}>{txn.loggedBy}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 160 }}>{txn.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-light)', fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Showing {filteredHistory.length} of {transactions.length} transactions</span>
            <div style={{ display: 'flex', gap: 20 }}>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>↑ {transactions.filter((t) => t.type === 'IN').length} Stock In</span>
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>↓ {transactions.filter((t) => t.type === 'OUT').length} Stock Out</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateStock;
