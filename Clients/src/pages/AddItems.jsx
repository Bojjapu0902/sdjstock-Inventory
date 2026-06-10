import './AddItems.css';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useInventoryStock } from '../hooks/useInventoryStock';
import {
  MdFileDownload, MdClose,
  MdRefresh, MdInventory2,
  MdCategory, MdPerson,
  MdInfo,
  MdKeyboardArrowDown, MdAdd, MdEdit, MdDelete,
  MdPrint, MdEmail, MdSwapVert, MdLayersClear,
} from 'react-icons/md';
import AddItemModal from './AddItemModal';
import AddStockModal from './AddStockModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import StatusBadge from '../components/common/StatusBadge';
import {
  categories,
  getStockStatus,
  getEnrichedItems, itemUsageData,
} from '../services/mockData';
import api from '../services/api';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SORT_STATUS_ORDER = { 'Out of Stock': 0, 'Low Stock': 1, 'In Stock': 2 };

const URGENCY_CONFIG = {
  critical: { icon: '🔴', label: 'Critical — Reorder Immediately', color: '#EF4444', bg: '#FEF2F2', border: 'rgba(239,68,68,0.2)'  },
  high:     { icon: '🟠', label: 'High — Reorder Soon',            color: '#F59E0B', bg: '#FFFBEB', border: 'rgba(245,158,11,0.2)'  },
  medium:   { icon: '🔵', label: 'Medium — Plan Reorder',          color: '#3B82F6', bg: '#EFF6FF', border: 'rgba(59,130,246,0.2)'  },
  low:      { icon: '🟢', label: 'Healthy Stock Level',            color: '#10B981', bg: '#ECFDF5', border: 'rgba(16,185,129,0.2)'  },
};

/* ── Inline Sparkline ─────────────────────────────────── */
const Sparkline = ({ data, unit, color = '#4F46E5' }) => {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data, 0.001);
  return (
    <div className="sparkline-row">
      {data.map((val, i) => (
        <div key={i} className="sparkline-bar-wrap">
          <div
            className="sparkline-bar"
            title={`${DAY_LABELS[i]}: ${val} ${unit}`}
            style={{
              height: `${Math.max((val / maxVal) * 44, 4)}px`,
              background: i === data.length - 1 ? color : `${color}55`,
            }}
          />
          <span className="sparkline-day">{DAY_LABELS[i]?.slice(0, 1)}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Item Detail Drawer (read-only) ───────────────────── */
const ItemDrawer = ({ item, onClose }) => {
  const [tab, setTab] = useState('overview');
  if (!item) return null;

  const usage         = itemUsageData[item.id] || {};
  const daysRemaining = item.dailyUsage > 0 ? Math.floor(item.currentStock / item.dailyUsage) : 999;
  const urgConf       = URGENCY_CONFIG[item.urgency] || URGENCY_CONFIG.low;
  const { label: stockLabel, type: stockType } = getStockStatus(item.currentStock);

  const weeklyData = (item.history || []).map((v, i) => ({ day: DAY_LABELS[i], consumed: v }));

  const miniKpis = [
    { label: 'Current Stock',  value: `${item.currentStock} ${item.unit}`, icon: '📦', accent: stockType === 'danger' ? '#EF4444' : stockType === 'warning' ? '#F59E0B' : '#10B981' },
    { label: 'Daily Usage',    value: `${item.dailyUsage} ${item.unit}`,   icon: '📊', accent: '#4F46E5' },
    { label: 'Days of Stock',  value: item.currentStock === 0 ? '0d' : daysRemaining >= 999 ? '∞' : `${daysRemaining}d`, icon: '⏱️', accent: daysRemaining <= 3 ? '#EF4444' : daysRemaining <= 7 ? '#F59E0B' : '#10B981' },
  ];

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="item-drawer">

        {/* Header */}
        <div className="drawer-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-pale)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
                {item.name.charAt(0)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                  {item.id} · {item.category}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <StatusBadge label={stockLabel} type={stockType} />
              <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: urgConf.bg, color: urgConf.color, border: `1px solid ${urgConf.border}` }}>
                {urgConf.icon} {item.urgency.charAt(0).toUpperCase() + item.urgency.slice(1)}
              </span>
            </div>
          </div>
          <button className="drawer-close-btn" onClick={onClose} title="Close"><MdClose /></button>
        </div>

        {/* Sub-tabs */}
        <div className="drawer-sub-tabs">
          {[{ key: 'overview', label: 'Overview' }, { key: 'usage', label: 'Usage' }, { key: 'details', label: 'Details' }].map((t) => (
            <button key={t.key} className={`drawer-sub-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="drawer-body">

          {/* ══ OVERVIEW ══ */}
          {tab === 'overview' && (
            <>
              <div className="drawer-section">
                <div className="urgency-banner" style={{ background: urgConf.bg, color: urgConf.color, border: `1px solid ${urgConf.border}` }}>
                  <span style={{ fontSize: 20 }}>{urgConf.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{urgConf.label}</div>
                    <div style={{ fontSize: 11.5, opacity: 0.8, marginTop: 2 }}>
                      {item.currentStock === 0 ? 'Out of stock — reorder immediately' : `Stock lasts ${daysRemaining} more day${daysRemaining !== 1 ? 's' : ''} at current rate`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="drawer-section">
                <div className="drawer-section-title">Stock Overview</div>
                <div className="mini-kpi-grid">
                  {miniKpis.map((k) => (
                    <div key={k.label} className="mini-kpi" style={{ '--mini-kpi-accent': k.accent }}>
                      <div className="mini-kpi-icon">{k.icon}</div>
                      <div className="mini-kpi-value">{k.value}</div>
                      <div className="mini-kpi-label">{k.label}</div>
                    </div>
                  ))}
                </div>
              </div>

            </>
          )}

          {/* ══ USAGE ══ */}
          {tab === 'usage' && (
            <>
              <div className="drawer-section">
                <div className="drawer-section-title">Consumption Metrics</div>
                <div className="mini-kpi-grid">
                  {[
                    { label: 'Per Day',      value: `${item.dailyUsage} ${item.unit}`,   icon: '📅', accent: '#4F46E5' },
                    { label: 'Per Week',     value: `${item.weeklyUsage} ${item.unit}`,  icon: '📆', accent: '#3B82F6' },
                    { label: 'Per Month',    value: `${item.monthlyUsage} ${item.unit}`, icon: '🗓️', accent: '#8B5CF6' },
                    { label: '30-Day Total', value: `${item.totalConsumed} ${item.unit}`,icon: '📉', accent: '#EF4444' },
                  ].map((k) => (
                    <div key={k.label} className="mini-kpi" style={{ '--mini-kpi-accent': k.accent }}>
                      <div className="mini-kpi-icon">{k.icon}</div>
                      <div className="mini-kpi-value" style={{ fontSize: 17 }}>{k.value}</div>
                      <div className="mini-kpi-label">{k.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="drawer-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div className="drawer-section-title" style={{ marginBottom: 0 }}>7-Day Consumption History</div>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{item.unit}/day</span>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v} ${item.unit}`, 'Consumed']} contentStyle={{ borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 12 }} />
                    <ReferenceLine y={item.dailyUsage} stroke="#4F46E5" strokeDasharray="4 3" label={{ value: 'Avg', position: 'right', fontSize: 10, fill: '#4F46E5' }} />
                    <Bar dataKey="consumed" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '8px 12px', background: 'var(--primary-pale)', borderRadius: 8, fontSize: 12 }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>📊 Daily avg:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.dailyUsage} {item.unit}/day · Peak: <strong>{item.peakDay}</strong></span>
                </div>
              </div>

              <div className="drawer-section">
                <div className="drawer-section-title">Stock Runway Projection</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'At current rate',   days: daysRemaining, desc: `${item.dailyUsage} ${item.unit}/day` },
                    { label: '+20% demand surge', days: Math.floor(item.currentStock / (item.dailyUsage * 1.2)), desc: `${(item.dailyUsage * 1.2).toFixed(1)} ${item.unit}/day` },
                    { label: '-20% reduced use',  days: Math.floor(item.currentStock / (item.dailyUsage * 0.8)), desc: `${(item.dailyUsage * 0.8).toFixed(1)} ${item.unit}/day` },
                  ].map((row) => {
                    const col = row.days <= 3 ? '#EF4444' : row.days <= 7 ? '#F59E0B' : row.days <= 14 ? '#3B82F6' : '#10B981';
                    return (
                      <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{row.label}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{row.desc}</div>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: col, minWidth: 52, textAlign: 'right' }}>
                          {item.currentStock === 0 ? '0d' : row.days >= 999 ? '∞' : `${row.days}d`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </>
          )}

          {/* ══ DETAILS ══ */}
          {tab === 'details' && (
            <>
              <div className="drawer-section">
                <div className="drawer-section-title">Item Information</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[
                    { icon: <MdInventory2 />, label: 'Item ID',  value: item.id },
                    { icon: <MdCategory />,   label: 'Category', value: item.category },
                    { icon: <MdInfo />,       label: 'Unit',     value: item.unit },
                    { icon: <MdPerson />,     label: 'Supplier', value: item.supplier },
                  ].map(({ icon, label, value }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-pale)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                        {icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginTop: 1 }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="drawer-section">
                <div className="drawer-section-title">Last Restock</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', background: 'var(--bg-main)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>+{usage.restockQty} {item.unit} received</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{usage.lastRestocked || 'N/A'} · {item.supplier}</div>
                  </div>
                </div>
              </div>

            </>
          )}

        </div>
      </aside>
    </>
  );
};


/* ── Stock-record action helpers ───────────────────── */
const fmtTotal = (qty, rate) =>
  (qty * rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const handlePrintRecord = (rec, item) => {
  const win = window.open('', '_blank', 'width=620,height=560');
  win.document.write(`<!DOCTYPE html><html><head><title>Stock Record — ${item.name}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;padding:36px 40px;color:#111;background:#fff}
    .brand{font-size:11px;font-weight:700;letter-spacing:1px;color:#4F46E5;text-transform:uppercase;margin-bottom:18px}
    h2{font-size:20px;font-weight:800;color:#1E1B4B;margin-bottom:3px}
    .sub{font-size:12px;color:#888;margin-bottom:24px}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    tr{border-bottom:1px solid #eee}
    td{padding:10px 14px;font-size:13.5px}
    td:first-child{color:#666;width:170px;font-weight:600}
    td:last-child{font-weight:600;color:#111}
    .total td:last-child{color:#4F46E5;font-size:15px}
    .footer{margin-top:28px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:12px}
    @media print{body{padding:20px}}
  </style></head><body>
  <div class="brand">SDJ Stock — Inventory</div>
  <h2>${item.name}</h2>
  <div class="sub">${item.id} &nbsp;·&nbsp; ${item.category}</div>
  <table>
    <tr><td>Date &amp; Time</td><td>${rec.date}${rec.time ? ' &nbsp;·&nbsp; ' + rec.time : ''}</td></tr>
    <tr><td>Quantity Received</td><td>+${rec.qty} ${item.unit}</td></tr>
    <tr><td>Unit Price</td><td>&#8377;${rec.rate} / ${item.unit}</td></tr>
    <tr><td>Supplier</td><td>${rec.supplier || '—'}</td></tr>
    ${rec.loggedBy ? `<tr><td>Logged By</td><td>${rec.loggedBy}</td></tr>` : ''}
    ${rec.notes    ? `<tr><td>Notes</td><td>${rec.notes}</td></tr>` : ''}
    <tr class="total"><td>Total Cost</td><td>&#8377;${fmtTotal(rec.qty, rec.rate)}</td></tr>
  </table>
  <div class="footer">Printed on ${new Date().toLocaleString('en-IN')}</div>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
};

const handleMailRecord = (rec, item) => {
  const total = fmtTotal(rec.qty, rec.rate);
  const subject = encodeURIComponent(`Stock Record — ${item.name} (${rec.date})`);
  const body = encodeURIComponent(
    `Stock Record Details\n${'─'.repeat(30)}\n` +
    `Item       : ${item.name} (${item.id})\n` +
    `Category   : ${item.category}\n` +
    `Date       : ${rec.date}${rec.time ? ' · ' + rec.time : ''}\n` +
    `Quantity   : +${rec.qty} ${item.unit}\n` +
    `Unit Price : ₹${rec.rate} / ${item.unit}\n` +
    `Total Cost : ₹${total}\n` +
    `Supplier   : ${rec.supplier || '—'}\n` +
    (rec.loggedBy ? `Logged By  : ${rec.loggedBy}\n` : '') +
    (rec.notes    ? `Notes      : ${rec.notes}\n`    : '')
  );
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
};

const handleDownloadRecord = (rec, item) => {
  const rows = [
    ['Field', 'Value'],
    ['Item',           item.name],
    ['Item ID',        item.id],
    ['Category',       item.category],
    ['Date',           rec.date],
    ['Time',           rec.time || ''],
    ['Quantity',       `${rec.qty} ${item.unit}`],
    ['Unit Price (INR)', rec.rate],
    ['Total Cost (INR)', (rec.qty * rec.rate).toFixed(2)],
    ['Supplier',       rec.supplier || ''],
    ['Logged By',      rec.loggedBy || ''],
    ['Notes',          rec.notes    || ''],
  ];
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url, download: `stock-record-${item.id}-${rec.date}.csv`,
  });
  a.click();
  URL.revokeObjectURL(url);
};

/* ══════════════════════════════════════════════════════
   ADD ITEMS PAGE  —  read-only catalog view
   ══════════════════════════════════════════════════════ */
const AddItems = () => {
  const { stockMap, refreshAll, syncItemStock } = useInventoryStock();

  const [baseItems, setBaseItems] = useState([]);

  const liveItems = useMemo(() =>
    baseItems.map((item) => ({
      ...item,
      currentStock: stockMap[item.id] ?? item.currentStock,
    })),
  [baseItems, stockMap]);

  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('All Categories');
  const [statusFilter, setStatus]   = useState('All');
  const [sortBy, setSortBy]         = useState('default');
  const [selectedItem, setSelected] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [modalOpen, setModalOpen]   = useState(false);
  const [modalMode, setModalMode]   = useState('add');
  const [modalItem, setModalItem]   = useState(null);

  const openAdd  = ()     => { setModalMode('add');  setModalItem(null); setModalOpen(true); };
  const openEdit = (item) => { setModalMode('edit'); setModalItem(item); setModalOpen(true); };
  const closeModal = ()   => setModalOpen(false);

  const handleSave = async (payload) => {
    if (modalMode === 'add') {
      const body = { currentStock: 0, ...payload };
      const created = await api.post('/inventory', body);
      setBaseItems((prev) => [...prev, created]);
    } else {
      const updated = await api.put(`/inventory/${payload.id}`, payload);
      setBaseItems((prev) => prev.map((i) => i.id === updated.id ? { ...i, ...updated } : i));
    }
    closeModal();
  };

  const [deleteConfirm, setDeleteConfirm] = useState(null); // { title, message, onConfirm }

  const handleDelete = (item) => {
    setDeleteConfirm({
      title:   'Delete Item',
      message: `"${item.name}" will be permanently removed from inventory.`,
      onConfirm: async () => {
        await api.delete(`/inventory/${item.id}`);
        setBaseItems((prev) => prev.filter((i) => i.id !== item.id));
      },
    });
  };

  const [stockItem,       setStockItem]       = useState(null);
  const [stockEditRecord, setStockEditRecord] = useState(null); // { record, item }

  /* replaces the matching item in baseItems AND syncs stockMap so liveItems updates immediately */
  const syncItem = (updated) => {
    setBaseItems((prev) => prev.map((i) => i.id === updated.id ? { ...i, ...updated } : i));
    syncItemStock(updated.id, updated.currentStock);
  };

  const handleAddStock = async ({ qty, rate, timestamp, supplier, date, time }) => {
    const updated = await api.post(`/inventory/${stockItem.id}/stock-records`, {
      qty, rate, supplier, timestamp, date, time,
    });
    syncItem(updated);
    setStockItem(null);
  };

  const handleEditStockRecord = async ({ qty, rate, timestamp, supplier, date, time }) => {
    const { record, item } = stockEditRecord;
    const updated = await api.put(`/inventory/${item.id}/stock-records/${record.id}`, {
      qty, rate, supplier, timestamp, date, time,
    });
    syncItem(updated);
    setStockEditRecord(null);
  };

  const handleToggleRecordActive = async (rec, rowItem) => {
    const newType = rec.type === false ? true : false;
    const updated = await api.patch(`/inventory/${rowItem.id}/stock-records/${rec.id}/type`, { type: newType });
    syncItem(updated);
  };

  const handleDeleteStockRecord = (rec, rowItem) => {
    setDeleteConfirm({
      title:   'Delete Stock Record',
      message: `Remove the entry of +${rec.qty} ${rowItem.unit} received on ${rec.date}${rec.supplier ? ` from ${rec.supplier}` : ''}? The stock count will be reduced by ${rec.qty} ${rowItem.unit}.`,
      onConfirm: async () => {
        const updated = await api.delete(`/inventory/${rowItem.id}/stock-records/${rec.id}`);
        syncItem(updated);
      },
    });
  };

  const handleToggleActive = async (item) => {
    const newActive = item.active === false ? true : false;
    const updated = await api.put(`/inventory/${item.id}`, { active: newActive });
    setBaseItems((prev) => prev.map((i) => i.id === item.id ? { ...i, active: updated.active ?? newActive } : i));
  };

  const loadItems = useCallback(() => {
    const enrichedMap = Object.fromEntries(getEnrichedItems().map((e) => [e.id, e]));
    api.get('/inventory')
      .then((items) => setBaseItems(items.map((item) => ({
        ...(enrichedMap[item.id] || { urgency: 'low', history: [0,0,0,0,0,0,0], dailyUsage: 0, weeklyUsage: 0, monthlyUsage: 0, totalConsumed: 0, daysRemaining: 999, peakDay: 'N/A' }),
        ...item,
      }))))
      .catch(console.error);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleResetAllStock = () => {
    setDeleteConfirm({
      title:   'Reset All Stock to Zero',
      message: `This will set currentStock = 0 for all ${baseItems.length} inventory items. Stock records are kept but the running total resets. This cannot be undone.`,
      onConfirm: async () => {
        await api.patch('/inventory/reset-all-stock', {});
        await Promise.all([loadItems(), refreshAll()]);
      },
    });
  };

  const toggleExpand = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const filteredItems = useMemo(() => {
    const filtered = liveItems.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch = !search || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.supplier.toLowerCase().includes(q);
      const matchCat    = catFilter === 'All Categories' || item.category === catFilter;
      const { label }   = getStockStatus(item.currentStock);
      const matchStatus = statusFilter === 'All' || label === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });

    if (sortBy === 'default') return filtered;

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-az':    return a.name.localeCompare(b.name);
        case 'name-za':    return b.name.localeCompare(a.name);
        case 'cat-az':     return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
        case 'cat-za':     return b.category.localeCompare(a.category) || a.name.localeCompare(b.name);
        case 'stock-hi':   return b.currentStock - a.currentStock;
        case 'stock-lo':   return a.currentStock - b.currentStock;
        case 'status':     return (SORT_STATUS_ORDER[getStockStatus(a.currentStock).label] ?? 3) - (SORT_STATUS_ORDER[getStockStatus(b.currentStock).label] ?? 3);
        default:           return 0;
      }
    });
  }, [liveItems, search, catFilter, statusFilter, sortBy]);

  const summary = useMemo(() => {
    let inStock = 0, low = 0, out = 0, critical = 0;
    for (const i of liveItems) {
      if (i.currentStock === 0)                                                              out++;
      else if (getStockStatus(i.currentStock).label === 'Low Stock') low++;
      else                                                                                   inStock++;
      if (i.urgency === 'critical' || i.urgency === 'high') critical++;
    }
    return { total: liveItems.length, inStock, low, out, critical };
  }, [liveItems]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Items</h1>
          <p>View your full food item catalog and track individual stock levels</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary-fsp"><MdFileDownload /> Export CSV</button>
          <button
            className="btn-secondary-fsp"
            onClick={handleResetAllStock}
            title="Set currentStock = 0 for all items"
            style={{ color: '#DC2626', borderColor: 'rgba(220,38,38,0.35)', background: '#FEF2F2' }}
          >
            <MdLayersClear /> Reset All Stock
          </button>
          <button className="btn-primary-fsp" onClick={openAdd}><MdAdd /> Add Item</button>
        </div>
      </div>

      {/* Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Items',   val: summary.total,    color: 'var(--primary)' },
          { label: 'In Stock',      val: summary.inStock,  color: 'var(--success)' },
          { label: 'Low Stock',     val: summary.low,      color: 'var(--warning)' },
          { label: 'Out of Stock',  val: summary.out,      color: 'var(--danger)'  },
          { label: 'Needs Reorder', val: summary.critical, color: '#EF4444'        },
        ].map((s) => (
          <div key={s.label} className="fsp-card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Items Accordion Card */}
      <div className="fsp-card">
        {/* Filters */}
        <div className="filter-toolbar">
          <div className="filter-search">
            <svg className="filter-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 15, height: 15 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search by name, category, supplier…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
            {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <option value="default">Sort: Default</option>
            <option value="name-az">Name A → Z</option>
            <option value="name-za">Name Z → A</option>
            <option value="cat-az">Category A → Z</option>
            <option value="cat-za">Category Z → A</option>
            <option value="stock-hi">Stock: High → Low</option>
            <option value="stock-lo">Stock: Low → High</option>
            <option value="status">Status: Critical first</option>
          </select>
          <button className="btn-icon-sm" title="Reset filters" onClick={() => { setSearch(''); setCatFilter('All Categories'); setStatus('All'); setSortBy('default'); }}>
            <MdRefresh />
          </button>
          <span className="filter-count">{filteredItems.length} of {baseItems.length} items</span>
        </div>

        {/* Accordion List */}
        {filteredItems.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 20px', gap: 12, textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--primary-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              <MdInventory2 style={{ color: 'var(--primary)' }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>No items match your filters</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Try adjusting your search or filter settings.</div>
          </div>
        ) : (
          <div style={{ padding: '8px 16px 16px' }}>
            {filteredItems.map((row) => {
              const isOpen = expandedIds.has(row.id);
              const { label: stockLabel, type: stockType } = getStockStatus(row.currentStock);
              const conf       = URGENCY_CONFIG[row.urgency] || URGENCY_CONFIG.low;
              const rowHistory = [...(row.stockRecords || [])]
                .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));
              const lastUp = rowHistory[0]?.date;

              return (
                <div
                  key={row.id}
                  style={{
                    marginBottom: 8,
                    borderRadius: 12,
                    border: `1.5px solid ${row.active === false ? 'rgba(156,163,175,0.35)' : isOpen ? 'var(--primary)' : lastUp ? 'rgba(16,185,129,0.35)' : 'var(--border-color)'}`,
                    overflow: 'hidden',
                    opacity: row.active === false ? 0.65 : 1,
                    background: row.active === false ? '#F3F4F6' : 'transparent',
                    transition: 'border-color 0.2s, opacity 0.2s',
                  }}
                >
                  {/* ── Header (always visible) ── */}
                  <div
                    onClick={() => toggleExpand(row.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 16px', cursor: 'pointer',
                      background: row.active === false ? '#F3F4F6' : isOpen ? 'var(--primary-pale)' : '#fff',
                      transition: 'background 0.2s',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: isOpen ? 'var(--primary)' : 'var(--primary-pale)', color: isOpen ? '#fff' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0, transition: 'all 0.2s' }}>
                      {row.name.charAt(0)}
                    </div>

                    {/* Name + meta */}
                    <div style={{ flex: '0 0 200px', minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{row.id} · {row.category}</div>
                    </div>

                    {/* Stock Level */}
                    <div style={{ flex: 1, minWidth: 80 }}>
                      <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>{row.currentStock} {row.unit}</strong>
                    </div>

                    {/* Status badge */}
                    <StatusBadge label={stockLabel} type={stockType} />

                    {/* Last Updated */}
                    <div style={{ flex: '0 0 118px', textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Last Updated</div>
                      <div style={{ fontSize: 12, color: lastUp ? 'var(--success)' : 'var(--text-muted)', fontWeight: lastUp ? 700 : 400, marginTop: 1 }}>
                        {lastUp ? new Date(lastUp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                      </div>
                    </div>

                    {/* Row actions */}
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-icon-sm"
                        onClick={() => setSelected(row)}
                        title="View details"
                        style={{ color: 'var(--primary)' }}
                      >
                        <MdInfo />
                      </button>
                      <button
                        className="btn-icon-sm"
                        onClick={() => openEdit(row)}
                        title="Edit item"
                        style={{ color: 'var(--warning)' }}
                      >
                        <MdEdit />
                      </button>
                      <button
                        className="btn-icon-sm danger"
                        onClick={() => handleDelete(row)}
                        title="Delete item"
                      >
                        <MdDelete />
                      </button>
                      {/* Active / Inactive toggle */}
                      <button
                        onClick={() => handleToggleActive(row)}
                        title={row.active === false ? 'Activate item' : 'Deactivate item'}
                        style={{
                          height: 30, padding: '0 10px', borderRadius: 7,
                          border: `1.5px solid ${row.active === false ? 'rgba(156,163,175,0.4)' : 'rgba(16,185,129,0.35)'}`,
                          background: row.active === false ? '#F3F4F6' : 'var(--success-bg, #ECFDF5)',
                          color: row.active === false ? '#6B7280' : 'var(--success, #10B981)',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 5,
                          transition: 'all 0.18s',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: row.active === false ? '#9CA3AF' : '#10B981',
                          display: 'inline-block', flexShrink: 0,
                        }} />
                        {row.active === false ? 'Inactive' : 'Active'}
                      </button>
                      <button
                        onClick={() => setStockItem(row)}
                        title="Add stock"
                        style={{
                          height: 30, padding: '0 11px', borderRadius: 7,
                          border: '1.5px solid rgba(16,185,129,0.35)',
                          background: 'var(--success-bg, #ECFDF5)',
                          color: 'var(--success, #10B981)',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4,
                          transition: 'background 0.18s, border-color 0.18s',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#D1FAE5'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.6)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--success-bg, #ECFDF5)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.35)'; }}
                      >
                        <MdAdd style={{ fontSize: 14 }} /> Add Stock
                      </button>
                    </div>

                    {/* Chevron */}
                    <div style={{ color: 'var(--primary)', fontSize: 20, flexShrink: 0, display: 'flex', alignItems: 'center', transition: 'transform 0.22s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      <MdKeyboardArrowDown />
                    </div>
                  </div>

                  {/* ── Expanded body ── */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--border-light)', padding: '14px 18px', background: row.active === false ? '#EBEBEB' : '#F8FAFF' }}>
                      {/* Urgency banner */}
                      <span style={{ padding: '4px 11px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: conf.bg, color: conf.color, border: `1px solid ${conf.border}` }}>
                        {conf.icon} {row.urgency.charAt(0).toUpperCase() + row.urgency.slice(1)} — {conf.label}
                      </span>

                      {/* Stock update history */}
                      {rowHistory.length > 0 && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-light)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Stock Update History
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rowHistory.length} record{rowHistory.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {rowHistory.map((rec, i) => {
                              const isOut = rec.direction === 'out';
                              return (
                                <div key={rec.id} style={{
                                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                                  background: rec.type === false ? '#F3F4F6' : isOut ? '#FFF5F5' : row.active === false ? '#F3F4F6' : '#fff',
                                  borderRadius: 8,
                                  border: `1px solid ${rec.type === false ? 'rgba(156,163,175,0.3)' : isOut ? 'rgba(239,68,68,0.2)' : 'var(--border-light)'}`,
                                  fontSize: 12.5, opacity: rec.type === false ? 0.65 : 1, transition: 'opacity 0.2s, background 0.2s',
                                }}>
                                  {/* Index badge */}
                                  <span style={{ width: 20, height: 20, borderRadius: 6, background: isOut ? '#FEE2E2' : 'var(--primary-pale)', color: isOut ? '#DC2626' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                                    {rowHistory.length - i}
                                  </span>
                                  {/* Date + Time */}
                                  <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>📅 {rec.date}{rec.time ? ` · ${rec.time}` : ''}</span>

                                  {isOut ? (
                                    <>
                                      {/* Project chip */}
                                      <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 700, padding: '2px 8px', background: '#FEE2E2', borderRadius: 20, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        📤 {rec.projectName || rec.projectId}
                                      </span>
                                      {/* Qty (outgoing — red, negative sign) */}
                                      <span style={{ fontWeight: 700, color: '#DC2626', whiteSpace: 'nowrap' }}>−{rec.qty} {row.unit}</span>
                                      {/* Assigned by */}
                                      {rec.loggedBy && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>assigned by {rec.loggedBy}</span>}
                                    </>
                                  ) : (
                                    <>
                                      {/* Supplier */}
                                      {rec.supplier && <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, padding: '1px 7px', background: 'var(--primary-pale)', borderRadius: 20, whiteSpace: 'nowrap' }}>{rec.supplier}</span>}
                                      {/* Qty */}
                                      <span style={{ fontWeight: 700, color: 'var(--success)', whiteSpace: 'nowrap' }}>+{rec.qty} {row.unit}</span>
                                      {/* Rate */}
                                      <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>@ ₹{rec.rate}/{row.unit}</span>
                                      {/* Total */}
                                      <span style={{ fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>₹{(rec.qty * rec.rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      {rec.loggedBy && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>by {rec.loggedBy}</span>}
                                      {rec.notes && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 11.5, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.notes}</span>}
                                    </>
                                  )}

                                  {/* Spacer */}
                                  <div style={{ flex: 1 }} />

                                  {/* Record actions — only for incoming records */}
                                  {!isOut && (
                                    <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                                      <button
                                        onClick={() => handleToggleRecordActive(rec, row)}
                                        title={rec.type === false ? 'Activate record' : 'Deactivate record'}
                                        style={{
                                          height: 22, padding: '0 8px', borderRadius: 6,
                                          border: `1px solid ${rec.type === false ? 'rgba(156,163,175,0.4)' : 'rgba(16,185,129,0.35)'}`,
                                          background: rec.type === false ? '#F3F4F6' : 'var(--success-bg, #ECFDF5)',
                                          color: rec.type === false ? '#6B7280' : 'var(--success, #10B981)',
                                          fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', gap: 4,
                                          transition: 'all 0.18s', whiteSpace: 'nowrap',
                                        }}
                                      >
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: rec.type === false ? '#9CA3AF' : '#10B981', display: 'inline-block', flexShrink: 0 }} />
                                        {rec.type === false ? 'Inactive' : 'Active'}
                                      </button>
                                      <button className="btn-icon-sm" title="Print record" onClick={() => handlePrintRecord(rec, row)} style={{ width: 26, height: 26, fontSize: 13, color: 'var(--text-secondary)' }}><MdPrint /></button>
                                      <button className="btn-icon-sm" title="Send by email" onClick={() => handleMailRecord(rec, row)} style={{ width: 26, height: 26, fontSize: 13, color: '#3B82F6' }}><MdEmail /></button>
                                      <button className="btn-icon-sm" title="Download as CSV" onClick={() => handleDownloadRecord(rec, row)} style={{ width: 26, height: 26, fontSize: 13, color: 'var(--success)' }}><MdFileDownload /></button>
                                      <button className="btn-icon-sm" title="Edit record" onClick={() => setStockEditRecord({ record: rec, item: row })} style={{ width: 26, height: 26, fontSize: 13, color: 'var(--warning)' }}><MdEdit /></button>
                                      <button className="btn-icon-sm danger" title="Delete record" onClick={() => handleDeleteStockRecord(rec, row)} style={{ width: 26, height: 26, fontSize: 13 }}><MdDelete /></button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-light)', fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Showing {filteredItems.length} of {baseItems.length} items</span>
          <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 12 }}>💡 Expand any item to see stock history · Click ℹ️ for full details</span>
        </div>
      </div>

      {/* Item Detail Drawer */}
      {selectedItem && (
        <ItemDrawer item={selectedItem} onClose={() => setSelected(null)} />
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <AddItemModal
          mode={modalMode}
          item={modalItem}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {/* Add Stock Modal */}
      {stockItem && (
        <AddStockModal
          item={stockItem}
          onSave={handleAddStock}
          onClose={() => setStockItem(null)}
        />
      )}

      {/* Edit Stock Record Modal */}
      {stockEditRecord && (
        <AddStockModal
          item={stockEditRecord.item}
          record={stockEditRecord.record}
          onSave={handleEditStockRecord}
          onClose={() => setStockEditRecord(null)}
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
    </div>
  );
};

export default AddItems;