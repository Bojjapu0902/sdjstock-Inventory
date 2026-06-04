import './AddItems.css';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useInventoryStock } from '../hooks/useInventoryStock';
import {
  MdAdd, MdFileDownload, MdEdit, MdDelete, MdClose,
  MdRefresh, MdShoppingCart, MdTrendingDown, MdInventory2,
  MdLocationOn, MdCategory, MdCalendarToday, MdPerson,
  MdAttachMoney, MdInfo, MdSystemUpdateAlt, MdKeyboardArrowDown,
  MdCheckCircle, MdSearch,
} from 'react-icons/md';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import StatusBadge from '../components/common/StatusBadge';
import Modal       from '../components/common/Modal';
import {
  categories,
  getStockStatus, getStockPercent, getStockBarClass,
  formatCurrency, formatDate, getDaysUntilExpiry,
  getEnrichedItems, itemUsageData,
} from '../data/mockData';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const URGENCY_CONFIG = {
  critical: { icon: '🔴', label: 'Critical — Reorder Immediately', color: '#EF4444', bg: '#FEF2F2', border: 'rgba(239,68,68,0.2)'  },
  high:     { icon: '🟠', label: 'High — Reorder Soon',            color: '#F59E0B', bg: '#FFFBEB', border: 'rgba(245,158,11,0.2)'  },
  medium:   { icon: '🔵', label: 'Medium — Plan Reorder',          color: '#3B82F6', bg: '#EFF6FF', border: 'rgba(59,130,246,0.2)'  },
  low:      { icon: '🟢', label: 'Healthy Stock Level',            color: '#10B981', bg: '#ECFDF5', border: 'rgba(16,185,129,0.2)'  },
};

const INITIAL_FORM = {
  name: '', category: 'Grains', unit: 'kg',
  currentStock: '', minStock: '', maxStock: '', unitCost: '',
  location: '', expiryDate: '', supplier: '',
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

/* ── Item Detail Drawer ───────────────────────────────── */
const ItemDrawer = ({ item, onClose, onEdit }) => {
  const [tab, setTab] = useState('overview');
  if (!item) return null;

  const usage         = itemUsageData[item.id] || {};
  const daysRemaining = item.dailyUsage > 0 ? Math.floor(item.currentStock / item.dailyUsage) : 999;
  const daysToExpiry  = getDaysUntilExpiry(item.expiryDate);
  const stockPct      = getStockPercent(item.currentStock, item.maxStock);
  const barClass      = getStockBarClass(stockPct);
  const urgConf       = URGENCY_CONFIG[item.urgency] || URGENCY_CONFIG.low;
  const { label: stockLabel, type: stockType } = getStockStatus(item.currentStock, item.minStock, item.maxStock);

  const weeklyData = (item.history || []).map((v, i) => ({ day: DAY_LABELS[i], consumed: v }));

  const miniKpis = [
    { label: 'Current Stock',  value: `${item.currentStock} ${item.unit}`, icon: '📦', accent: stockType === 'danger' ? '#EF4444' : stockType === 'warning' ? '#F59E0B' : '#10B981' },
    { label: 'Daily Usage',    value: `${item.dailyUsage} ${item.unit}`,   icon: '📊', accent: '#4F46E5' },
    { label: 'Days of Stock',  value: item.currentStock === 0 ? '0d' : daysRemaining >= 999 ? '∞' : `${daysRemaining}d`, icon: '⏱️', accent: daysRemaining <= 3 ? '#EF4444' : daysRemaining <= 7 ? '#F59E0B' : '#10B981' },
    { label: 'Stock Value',    value: formatCurrency(item.currentStock * item.unitCost), icon: '💰', accent: '#8B5CF6' },
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

              <div className="drawer-section">
                <div className="drawer-section-title">Stock Level</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{item.currentStock} {item.unit} remaining</span>
                  <span style={{ color: 'var(--text-muted)' }}>{stockPct}% of {item.maxStock} {item.unit}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  <span>Min: {item.minStock} {item.unit}</span>
                  <span>Reorder point</span>
                  <span>Max: {item.maxStock} {item.unit}</span>
                </div>
              </div>

              <div className="drawer-section">
                <div className="drawer-section-title">Consumed vs Remaining (30-day)</div>
                <div style={{ height: 22, borderRadius: 8, overflow: 'hidden', background: 'var(--border-color)', display: 'flex' }}>
                  <div style={{ width: `${Math.min(item.consumedPct, 100)}%`, background: 'linear-gradient(90deg,#EF4444,#F97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>
                    {item.consumedPct > 12 ? `${item.consumedPct}%` : ''}
                  </div>
                  <div style={{ flex: 1, background: 'linear-gradient(90deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>
                    {100 - item.consumedPct > 12 ? `${100 - item.consumedPct}%` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: '#EF4444' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Consumed: <strong>{item.totalConsumed} {item.unit}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: '#10B981' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Remaining: <strong>{item.currentStock} {item.unit}</strong></span>
                  </div>
                </div>
              </div>

              <div className="drawer-section">
                <div className="drawer-section-title">Expiry Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: daysToExpiry <= 7 ? 'var(--danger-bg)' : daysToExpiry <= 14 ? 'var(--warning-bg)' : 'var(--success-bg)', border: `1px solid ${daysToExpiry <= 7 ? 'rgba(239,68,68,0.15)' : daysToExpiry <= 14 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'}` }}>
                  <span style={{ fontSize: 24 }}>{daysToExpiry <= 0 ? '💀' : daysToExpiry <= 7 ? '⚠️' : daysToExpiry <= 14 ? '🕐' : '✅'}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: daysToExpiry <= 7 ? '#991B1B' : daysToExpiry <= 14 ? '#92400E' : '#065F46' }}>
                      {daysToExpiry <= 0 ? 'Expired — remove from stock' : `Expires in ${daysToExpiry} day${daysToExpiry !== 1 ? 's' : ''}`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Expiry Date: {formatDate(item.expiryDate)}</div>
                  </div>
                </div>
              </div>

              <div className="drawer-section">
                <div className="drawer-section-title">Quick Actions</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn-primary-fsp" style={{ fontSize: 12.5, padding: '8px 14px' }} onClick={() => onEdit(item)}>
                    <MdEdit /> Edit Item
                  </button>
                  <button className="btn-secondary-fsp" style={{ fontSize: 12.5, padding: '8px 14px' }}>
                    <MdShoppingCart /> Create PO
                  </button>
                  <button className="btn-secondary-fsp" style={{ fontSize: 12.5, padding: '8px 14px' }}>
                    <MdTrendingDown /> Log Wastage
                  </button>
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

              <div className="drawer-section">
                <div className="drawer-section-title">Cost Analysis</div>
                <div className="info-grid">
                  {[
                    { label: 'Cost per Day',   value: formatCurrency(item.dailyUsage    * item.unitCost) },
                    { label: 'Cost per Week',  value: formatCurrency(item.weeklyUsage   * item.unitCost) },
                    { label: 'Cost per Month', value: formatCurrency(item.monthlyUsage  * item.unitCost) },
                    { label: '30-Day Spend',   value: formatCurrency(item.totalConsumed * item.unitCost) },
                  ].map((c) => (
                    <div key={c.label} className="info-cell">
                      <span className="info-cell-label">{c.label}</span>
                      <span className="info-cell-value" style={{ color: 'var(--primary)' }}>{c.value}</span>
                    </div>
                  ))}
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
                    { icon: <MdInventory2 />,   label: 'Item ID',          value: item.id },
                    { icon: <MdCategory />,     label: 'Category',         value: item.category },
                    { icon: <MdInfo />,         label: 'Unit',             value: item.unit },
                    { icon: <MdLocationOn />,   label: 'Storage Location', value: item.location },
                    { icon: <MdPerson />,       label: 'Supplier',         value: item.supplier },
                    { icon: <MdCalendarToday />,label: 'Expiry Date',      value: formatDate(item.expiryDate) },
                    { icon: <MdAttachMoney />,  label: 'Unit Cost',        value: formatCurrency(item.unitCost) },
                    { icon: <MdAttachMoney />,  label: 'Total Value',      value: formatCurrency(item.currentStock * item.unitCost) },
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
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{usage.lastRestocked ? formatDate(usage.lastRestocked) : 'N/A'} · {item.supplier}</div>
                  </div>
                </div>
              </div>

              <div className="drawer-section">
                <div className="drawer-section-title">Stock Thresholds</div>
                <div className="info-grid">
                  {[
                    { label: 'Min / Reorder Point', value: `${item.minStock} ${item.unit}` },
                    { label: 'Max Capacity',         value: `${item.maxStock} ${item.unit}` },
                    { label: 'Current Level',        value: `${item.currentStock} ${item.unit}` },
                    { label: 'Utilisation',          value: `${stockPct}%` },
                  ].map((c) => (
                    <div key={c.label} className="info-cell">
                      <span className="info-cell-label">{c.label}</span>
                      <span className="info-cell-value">{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
      </aside>
    </>
  );
};


/* ══════════════════════════════════════════════════════
   ADD ITEMS PAGE
   ══════════════════════════════════════════════════════ */
const AddItems = () => {
  const { stockMap, adjustStock } = useInventoryStock();
  const { user: currentUser } = useAuth();

  const [baseItems, setBaseItems] = useState([]);

  const liveItems = useMemo(() =>
    baseItems.map((item) => ({
      ...item,
      currentStock: stockMap[item.id] ?? item.currentStock,
    })),
  [baseItems, stockMap]);
  const [search, setSearch]             = useState('');
  const [catFilter, setCatFilter]       = useState('All Categories');
  const [statusFilter, setStatus]       = useState('All');
  const [selectedItem, setSelected]     = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [form, setForm]                 = useState(INITIAL_FORM);
  const [deleteId, setDeleteId]         = useState(null);

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockSuccess, setStockSuccess]     = useState(false);
  const [stockChecked, setStockChecked]     = useState({});
  const [stockQtys, setStockQtys]           = useState({});
  const [stockPrices, setStockPrices]       = useState({});
  const [stockDescs, setStockDescs]         = useState({});
  const [stockSearch, setStockSearch]       = useState('');
  const [stockClock, setStockClock]         = useState(() => new Date().toLocaleTimeString());
  const [expandedIds, setExpandedIds]       = useState(new Set());
  const [stockPreCheckId, setStockPreCheckId] = useState(null);
  const [transactions, setTransactions]           = useState([]);
  const [editHistoryRecord, setEditHistoryRecord] = useState(null); // { itemId, recordId }
  const [editHistoryForm, setEditHistoryForm]     = useState({ qty: '', rate: '', desc: '' });
  const [deleteHistoryRecord, setDeleteHistoryRecord] = useState(null); // { itemId, recordId, qty }

  useEffect(() => {
    const enrichedMap = Object.fromEntries(getEnrichedItems().map((e) => [e.id, e]));
    api.get('/inventory')
      .then((items) => setBaseItems(items.map((item) => ({
        ...(enrichedMap[item.id] || { urgency: 'low', history: [0,0,0,0,0,0,0], dailyUsage: 0, weeklyUsage: 0, monthlyUsage: 0, totalConsumed: 0, stockLeftPct: 100, consumedPct: 0, totalValue: 0, daysRemaining: 999, peakDay: 'N/A' }),
        ...item,
      }))))
      .catch(console.error);
    api.get('/stock-history')
      .then((map) => {
        const flat = Object.values(map).flat().map((r) => ({
          id: r.id, date: r.timestamp ? r.timestamp.split('T')[0] : '', itemId: r.itemId,
          item: r.itemName || '', category: r.category || '', type: r.type || 'IN',
          qty: r.qty, unit: r.unit, unitCost: r.rate,
          totalCost: +(r.qty * r.rate).toFixed(2),
          supplier: r.supplier || '', loggedBy: r.loggedBy || '', notes: r.desc || '',
        }));
        setTransactions(flat);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!showStockModal) return;
    const timer = setInterval(() => setStockClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, [showStockModal]);

  const toggleExpand = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const filteredItems = useMemo(() => liveItems.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch = !search || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.supplier.toLowerCase().includes(q);
    const matchCat    = catFilter === 'All Categories' || item.category === catFilter;
    const { label }   = getStockStatus(item.currentStock, item.minStock, item.maxStock);
    const matchStatus = statusFilter === 'All' || label === statusFilter;
    return matchSearch && matchCat && matchStatus;
  }), [liveItems, search, catFilter, statusFilter]);

  const summary = useMemo(() => {
    let inStock = 0, low = 0, out = 0, critical = 0;
    for (const i of liveItems) {
      if (i.currentStock === 0)                                                              out++;
      else if (getStockStatus(i.currentStock, i.minStock, i.maxStock).label === 'Low Stock') low++;
      else                                                                                   inStock++;
      if (i.urgency === 'critical' || i.urgency === 'high') critical++;
    }
    return { total: liveItems.length, inStock, low, out, critical };
  }, [liveItems]);

  const openAdd    = useCallback(() => { setEditItem(null); setForm(INITIAL_FORM); setShowModal(true); }, []);
  const openEdit   = useCallback((item) => { setEditItem(item); setForm({ ...item }); setShowModal(true); }, []);
  const closeModal = useCallback(() => { setShowModal(false); setEditItem(null); }, []);

  const handleSave = async () => {
    try {
      if (editItem) {
        const oldStock = stockMap[editItem.id] ?? editItem.currentStock;
        const newStock = Number(form.currentStock);
        const delta    = newStock - oldStock;
        await api.put(`/inventory/${editItem.id}`, form);
        setBaseItems((prev) => prev.map((i) => i.id === editItem.id ? { ...i, ...form } : i));
        if (delta !== 0) adjustStock(editItem.id, delta);
      } else {
        const newId = `INV-${String(baseItems.length + 1).padStart(3, '0')}`;
        const payload = { id: newId, ...form };
        await api.post('/inventory', payload);
        setBaseItems((prev) => [...prev, { ...payload, urgency: 'low', history: [0,0,0,0,0,0,0], dailyUsage: 0, weeklyUsage: 0, monthlyUsage: 0, totalConsumed: 0, stockLeftPct: 100, consumedPct: 0, totalValue: 0, daysRemaining: 999, peakDay: 'N/A', lastRestocked: 'N/A', restockQty: 0 }]);
      }
    } catch (err) { console.error('Save failed:', err); }
    closeModal();
    setSelected(null);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/inventory/${id}`);
      setBaseItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) { console.error('Delete failed:', err); }
    setDeleteId(null);
    if (selectedItem?.id === id) setSelected(null);
  };

  const openStockModal = useCallback((preCheckId) => {
    setStockPreCheckId(preCheckId || null);
    if (preCheckId) {
      const found = liveItems.find((i) => i.id === preCheckId);
      if (found) {
        setStockChecked({ [preCheckId]: true });
        setStockPrices({ [preCheckId]: String(found.unitCost) });
      }
    }
    setShowStockModal(true);
  }, [liveItems]);

  const handleStockSave = async () => {
    const toSave = liveItems.filter((item) => stockChecked[item.id] && Number(stockQtys[item.id] || 0) > 0);
    if (toSave.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    const newTxns = [];
    for (const item of toSave) {
      const qty  = Number(stockQtys[item.id]);
      const rate = Number(stockPrices[item.id] || item.unitCost);
      setBaseItems((prev) => prev.map((i) => {
        if (i.id !== item.id) return i;
        const newStock   = (stockMap[i.id] ?? i.currentStock) + qty;
        const newDays    = i.dailyUsage > 0 ? Math.floor(newStock / i.dailyUsage) : 999;
        const newUrgency = newDays <= 3 ? 'critical' : newDays <= 7 ? 'high' : newDays <= 14 ? 'medium' : 'low';
        return { ...i, unitCost: rate, urgency: newUrgency, daysRemaining: newDays };
      }));
      adjustStock(item.id, qty);
      if (selectedItem?.id === item.id)
        setSelected((prev) => ({ ...prev, currentStock: (stockMap[prev.id] ?? prev.currentStock) + qty, unitCost: rate }));
      try {
        const saved = await api.post(`/stock-history/${item.id}`, {
          timestamp: new Date().toISOString(), qty, rate, unit: item.unit,
          desc: stockDescs[item.id] || '', type: 'IN',
          itemName: item.name, category: item.category,
          supplier: item.supplier || '', loggedBy: currentUser?.username || 'Admin',
        });
        newTxns.push({ id: saved.id, date: today, itemId: item.id, item: item.name, category: item.category, type: 'IN', qty, unit: item.unit, unitCost: rate, totalCost: +(qty * rate).toFixed(2), supplier: item.supplier || '', loggedBy: currentUser?.username || 'Admin', notes: stockDescs[item.id] || '' });
      } catch {
        newTxns.push({ id: `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, date: today, itemId: item.id, item: item.name, category: item.category, type: 'IN', qty, unit: item.unit, unitCost: rate, totalCost: +(qty * rate).toFixed(2), supplier: item.supplier || '', loggedBy: currentUser?.username || 'Admin', notes: stockDescs[item.id] || '' });
      }
    }
    setTransactions((prev) => [...newTxns, ...prev]);
    setExpandedIds((prev) => { const n = new Set(prev); toSave.forEach((i) => n.add(i.id)); return n; });
    setStockSuccess(true);
    setTimeout(() => {
      setShowStockModal(false);
      setStockSuccess(false);
      setStockChecked({});
      setStockQtys({});
      setStockPrices({});
      setStockDescs({});
      setStockSearch('');
    }, 1400);
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setStockSuccess(false);
    setStockPreCheckId(null);
    setStockChecked({});
    setStockQtys({});
    setStockPrices({});
    setStockDescs({});
    setStockSearch('');
  };

  const openHistoryEdit = useCallback((itemId, recordId, rec) => {
    setEditHistoryRecord({ itemId, recordId });
    setEditHistoryForm({ qty: String(rec.qty), rate: String(rec.unitCost), desc: rec.notes || '' });
  }, []);

  const handleHistoryEditSave = async () => {
    const { itemId, recordId } = editHistoryRecord;
    const oldRecord = transactions.find((t) => t.id === recordId);
    if (!oldRecord) { setEditHistoryRecord(null); return; }

    const oldQty  = Number(oldRecord.qty);
    const newQty  = Number(editHistoryForm.qty);
    const newRate = Number(editHistoryForm.rate);
    const delta   = newQty - oldQty;

    try {
      await api.put(`/stock-history/${itemId}/${recordId}`, { qty: newQty, rate: newRate, desc: editHistoryForm.desc });
    } catch (err) { console.error('History edit failed:', err); }
    setTransactions((prev) => prev.map((t) =>
      t.id === recordId
        ? { ...t, qty: newQty, unitCost: newRate, totalCost: +(newQty * newRate).toFixed(2), notes: editHistoryForm.desc }
        : t
    ));
    if (delta !== 0) adjustStock(itemId, delta);
    setEditHistoryRecord(null);
  };

  const handleHistoryDelete = useCallback(async (itemId, recordId, qty) => {
    try {
      await api.delete(`/stock-history/${itemId}/${recordId}`);
    } catch (err) { console.error('History delete failed:', err); }
    setTransactions((prev) => prev.filter((t) => t.id !== recordId));
    adjustStock(itemId, -Number(qty));
    setDeleteHistoryRecord(null);
  }, [adjustStock]);

  const filteredStockItems = useMemo(() => {
    const q = stockSearch.toLowerCase();
    return !q ? liveItems : liveItems.filter(
      (i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)
    );
  }, [liveItems, stockSearch]);

  const stockSelectedCount = Object.values(stockChecked).filter(Boolean).length;

  const columns = [
    {
      key: 'name', label: 'Item Name',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--primary-pale)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
            {v.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.id} · {row.location}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category', label: 'Category',
      render: (v) => (
        <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11.5, background: 'var(--bg-main)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 600 }}>{v}</span>
      ),
    },
    {
      key: 'currentStock', label: 'Stock Level',
      render: (v, row) => {
        const pct = getStockPercent(v, row.maxStock);
        return (
          <div>
            <strong style={{ fontSize: 13.5 }}>{v} {row.unit}</strong>
          </div>
        );
      },
    },
    {
      key: 'dailyUsage', label: 'Daily Usage',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--primary)' }}>{v} {row.unit}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>per day</div>
        </div>
      ),
    },
    {
      key: 'daysRemaining', label: 'Days Left',
      render: (v, row) => {
        const color = v <= 3 ? 'var(--danger)' : v <= 7 ? 'var(--warning)' : v <= 14 ? 'var(--info)' : 'var(--success)';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color }}>{row.currentStock === 0 ? '—' : v >= 999 ? '∞' : `${v}d`}</span>
            <Sparkline data={row.history || []} unit={row.unit} color={v <= 7 ? '#EF4444' : '#4F46E5'} />
          </div>
        );
      },
    },
    {
      key: 'urgency', label: 'Urgency',
      render: (v) => {
        const conf = URGENCY_CONFIG[v] || URGENCY_CONFIG.low;
        return (
          <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: conf.bg, color: conf.color, border: `1px solid ${conf.border}`, whiteSpace: 'nowrap' }}>
            {conf.icon} {v.charAt(0).toUpperCase() + v.slice(1)}
          </span>
        );
      },
    },
    {
      key: 'expiryDate', label: 'Expiry',
      render: (v) => {
        const d = getDaysUntilExpiry(v);
        return (
          <div>
            <div style={{ fontSize: 12.5 }}>{formatDate(v)}</div>
            <div style={{ fontSize: 11, color: d <= 3 ? 'var(--danger)' : d <= 10 ? 'var(--warning)' : 'var(--text-muted)' }}>
              {d < 0 ? 'Expired' : d === 0 ? 'Today!' : `${d}d`}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status', label: 'Status',
      render: (_, row) => {
        const { label, type } = getStockStatus(row.currentStock, row.minStock, row.maxStock);
        return <StatusBadge label={label} type={type} />;
      },
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 5 }}>
          <button className="btn-icon-sm" onClick={(e) => { e.stopPropagation(); openEdit(row); }} title="Edit"><MdEdit /></button>
          <button className="btn-icon-sm danger" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }} title="Delete"><MdDelete /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Add Items</h1>
          <p>Manage your full food item catalog — add, edit, update stock, and track individual items</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary-fsp"><MdFileDownload /> Export CSV</button>
          <button className="btn-stock-update" onClick={() => openStockModal(null)} title="Record stock received from supplier">
            <MdSystemUpdateAlt /> Update Stock
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
          <button className="btn-icon-sm" title="Reset filters" onClick={() => { setSearch(''); setCatFilter('All Categories'); setStatus('All'); }}>
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
              const pct    = getStockPercent(row.currentStock, row.maxStock);
              const barCls = getStockBarClass(pct);
              const { label: stockLabel, type: stockType } = getStockStatus(row.currentStock, row.minStock, row.maxStock);
              const conf   = URGENCY_CONFIG[row.urgency] || URGENCY_CONFIG.low;
              const rowHistory = transactions.filter((t) => t.itemId === row.id && t.type === 'IN')
                .sort((a, b) => new Date(b.date) - new Date(a.date));
              const lastUp    = rowHistory[0]?.date;

              return (
                <div
                  key={row.id}
                  style={{
                    marginBottom: 8,
                    borderRadius: 12,
                    border: `1.5px solid ${isOpen ? 'var(--primary)' : lastUp ? 'rgba(16,185,129,0.35)' : 'var(--border-color)'}`,
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {/* ── Header (always visible) ── */}
                  <div
                    onClick={() => toggleExpand(row.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 16px', cursor: 'pointer',
                      background: isOpen ? 'var(--primary-pale)' : '#fff',
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

                    {/* Inline actions */}
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      <button className="btn-icon-sm" onClick={() => openEdit(row)} title="Edit"><MdEdit /></button>
                      <button className="btn-icon-sm danger" onClick={() => setDeleteId(row.id)} title="Delete"><MdDelete /></button>
                    </div>

                    {/* Chevron */}
                    <div style={{ color: 'var(--primary)', fontSize: 20, flexShrink: 0, display: 'flex', alignItems: 'center', transition: 'transform 0.22s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      <MdKeyboardArrowDown />
                    </div>
                  </div>

                  {/* ── Expanded body ── */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--border-light)', padding: '14px 18px', background: '#F8FAFF' }}>
                      {/* Urgency + action row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                        <span style={{ padding: '4px 11px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: conf.bg, color: conf.color, border: `1px solid ${conf.border}` }}>
                          {conf.icon} {row.urgency.charAt(0).toUpperCase() + row.urgency.slice(1)} — {conf.label}
                        </span>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {/* <button className="btn-secondary-fsp" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => setSelected(row)}>
                            <MdInfo /> View Details
                          </button> */}
                          <button className="btn-stock-update" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => openStockModal(row.id)}>
                            <MdSystemUpdateAlt /> Update Stock
                          </button>
                          {/* <button className="btn-primary-fsp" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => openEdit(row)}>
                            <MdEdit /> Edit
                          </button> */}
                          {/* <button className="btn-danger-fsp" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => setDeleteId(row.id)}>
                            <MdDelete /> Delete
                          </button> */}
                        </div>
                      </div>

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
                            {rowHistory.map((rec, i) => (
                              <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', background: '#fff', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 12.5 }}>
                                <span style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--primary-pale)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{rowHistory.length - i}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>📅 {rec.date}</span>
                                {rec.supplier && <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, padding: '1px 7px', background: 'var(--primary-pale)', borderRadius: 20 }}>{rec.supplier}</span>}
                                <span style={{ fontWeight: 700, color: 'var(--success)' }}>+{rec.qty} {rec.unit}</span>
                                <span style={{ color: 'var(--text-muted)' }}>@ ₹{rec.unitCost}/{rec.unit}</span>
                                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{rec.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                {rec.loggedBy && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>by {rec.loggedBy}</span>}
                                {rec.notes && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 11.5, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.notes}</span>}
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                                  <button className="btn-icon-sm" onClick={() => openHistoryEdit(row.id, rec.id, rec)} title="Edit record"><MdEdit /></button>
                                  <button className="btn-icon-sm danger" onClick={() => setDeleteHistoryRecord({ itemId: row.id, recordId: rec.id, qty: rec.qty })} title="Delete record"><MdDelete /></button>
                                </div>
                              </div>
                            ))}
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
          <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 12 }}>💡 Expand any item to see full details and update stock</span>
        </div>
      </div>

      {/* Item Detail Drawer */}
      {selectedItem && (
        <ItemDrawer item={selectedItem} onClose={() => setSelected(null)} onEdit={(item) => { setSelected(null); openEdit(item); }} />
      )}

      {/* Add / Edit Modal */}
      <Modal show={showModal} onClose={closeModal} title={editItem ? `Edit — ${editItem.name}` : 'Add New Item'} size="lg"
        footer={<><button className="btn-secondary-fsp" onClick={closeModal}>Cancel</button><button className="btn-primary-fsp" onClick={handleSave}>{editItem ? 'Save Changes' : 'Add Item'}</button></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="fsp-label">Item Name *</label>
            <input className="fsp-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Basmati Rice" />
          </div>
          <div>
            <label className="fsp-label">Category</label>
            <select className="fsp-select" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {categories.filter((c) => c !== 'All Categories').map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="fsp-label">Unit</label>
            <select className="fsp-select" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
              {['kg', 'g', 'L', 'mL', 'doz', 'pcs', 'ctn', 'bag', 'box'].map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div><label className="fsp-label">Current Stock</label><input className="fsp-input" type="number" value={form.currentStock} onChange={(e) => setForm((f) => ({ ...f, currentStock: Number(e.target.value) }))} /></div>
          <div><label className="fsp-label">Min Stock (Reorder Point)</label><input className="fsp-input" type="number" value={form.minStock} onChange={(e) => setForm((f) => ({ ...f, minStock: Number(e.target.value) }))} /></div>
          <div><label className="fsp-label">Max Stock Capacity</label><input className="fsp-input" type="number" value={form.maxStock} onChange={(e) => setForm((f) => ({ ...f, maxStock: Number(e.target.value) }))} /></div>
          <div><label className="fsp-label">Unit Cost (₹)</label><input className="fsp-input" type="number" step="0.01" value={form.unitCost} onChange={(e) => setForm((f) => ({ ...f, unitCost: Number(e.target.value) }))} /></div>
          <div><label className="fsp-label">Expiry Date</label><input className="fsp-input" type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} /></div>
          <div><label className="fsp-label">Storage Location</label><input className="fsp-input" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} /></div>
          <div style={{ gridColumn: 'span 2' }}><label className="fsp-label">Supplier</label><input className="fsp-input" value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} /></div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal show={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete" size="sm"
        footer={<><button className="btn-secondary-fsp" onClick={() => setDeleteId(null)}>Cancel</button><button className="btn-danger-fsp" onClick={() => handleDelete(deleteId)}>Delete Item</button></>}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Are you sure you want to delete this inventory item? This action cannot be undone.</p>
      </Modal>

      {/* Update Stock Modal */}
      {(() => {
        const singleItem   = stockPreCheckId ? liveItems.find((i) => i.id === stockPreCheckId) : null;
        const singleQty    = Number(stockQtys[stockPreCheckId]    || 0);
        const singlePrice  = stockPrices[stockPreCheckId] ?? '';
        const canSubmit    = stockPreCheckId
          ? singleQty > 0 && singlePrice !== ''
          : stockSelectedCount > 0;
        return (
      <Modal
        show={showStockModal}
        onClose={closeStockModal}
        title={stockPreCheckId && singleItem ? `Update Stock — ${singleItem.name}` : 'Update Stock — Record Received Goods'}
        size={stockPreCheckId ? 'lg' : 'xl'}
        footer={stockSuccess ? null : (
          <>
            {!stockPreCheckId && (
              <span style={{ fontSize: 13, color: 'var(--text-muted)', marginRight: 'auto' }}>
                {stockSelectedCount > 0
                  ? <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{stockSelectedCount} item{stockSelectedCount !== 1 ? 's' : ''} selected</span>
                  : 'Check items below to select them'}
              </span>
            )}
            <button className="btn-secondary-fsp" onClick={closeStockModal}>Cancel</button>
            <button
              className="btn-stock-update"
              onClick={handleStockSave}
              disabled={!canSubmit}
              style={{ opacity: !canSubmit ? 0.5 : 1 }}
            >
              <MdSystemUpdateAlt /> {stockPreCheckId ? 'Confirm Update' : 'Submit Stock Received'}
            </button>
          </>
        )}
      >
        {stockSuccess ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: 14, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdCheckCircle style={{ color: 'var(--success)', fontSize: 38 }} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>Stock Updated!</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {singleItem ? `+${singleQty} ${singleItem.unit} added to ${singleItem.name}` : `${stockSelectedCount} item${stockSelectedCount !== 1 ? 's' : ''} updated successfully.`}
            </div>
          </div>
        ) : (
          <div>
            {/* Admin / Date / Time strip */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 18, padding: '14px 18px', background: 'var(--primary-pale)', borderRadius: 12, border: '1px solid rgba(79,70,229,0.15)' }}>
              {[
                { label: 'Admin Name', value: currentUser?.username || 'Unknown',  icon: <MdPerson style={{ color: 'var(--primary)' }} /> },
                { label: 'Date',       value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), icon: <MdCalendarToday style={{ color: 'var(--primary)' }} /> },
                { label: 'Time',       value: stockClock, live: true,              icon: <MdInfo style={{ color: 'var(--primary)' }} /> },
              ].map(({ label, value, icon, live }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, boxShadow: '0 1px 4px rgba(79,70,229,0.12)' }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: live ? 'var(--primary)' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── SINGLE-ITEM MODE ── */}
            {singleItem ? (
              <div>
                {/* Item info card (read-only) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', marginBottom: 20, background: '#fff', borderRadius: 12, border: '1.5px solid var(--primary)', position: 'relative' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, flexShrink: 0 }}>
                    {singleItem.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{singleItem.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{singleItem.id} · {singleItem.category} · {singleItem.location}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>Current: {singleItem.currentStock} {singleItem.unit}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Max: {singleItem.maxStock} {singleItem.unit}</span>
                    </div>
                  </div>
                  {singleQty > 0 && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>After Update</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)', lineHeight: 1.2 }}>{singleItem.currentStock + singleQty} {singleItem.unit}</div>
                    </div>
                  )}
                  <span style={{ position: 'absolute', top: 10, right: 14, fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>read-only</span>
                </div>

                {/* Editable fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
                  <div>
                    <label className="fsp-label">Quantity Received * <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({singleItem.unit})</span></label>
                    <input
                      className="fsp-input" type="number" min="0" step="0.01" autoFocus
                      value={stockQtys[singleItem.id] || ''}
                      onChange={(e) => setStockQtys((prev) => ({ ...prev, [singleItem.id]: e.target.value }))}
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div>
                    <label className="fsp-label">Purchase Rate * <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(₹ per {singleItem.unit})</span></label>
                    <input
                      className="fsp-input" type="number" min="0" step="0.01"
                      value={stockPrices[singleItem.id] ?? ''}
                      onChange={(e) => setStockPrices((prev) => ({ ...prev, [singleItem.id]: e.target.value }))}
                      placeholder={String(singleItem.unitCost)}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="fsp-label">Description / Notes</label>
                    <input
                      className="fsp-input"
                      value={stockDescs[singleItem.id] || ''}
                      onChange={(e) => setStockDescs((prev) => ({ ...prev, [singleItem.id]: e.target.value }))}
                      placeholder="e.g. Received from supplier on delivery note #123"
                    />
                  </div>
                </div>

                {/* Total */}
                {singleQty > 0 && singlePrice !== '' && (
                  <div style={{ marginTop: 16, padding: '12px 18px', background: 'var(--success-bg)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Purchase Amount</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>
                      ₹{(singleQty * Number(singlePrice)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* ── MULTI-ITEM CHECKLIST MODE ── */
              <div>
                <div className="filter-search" style={{ marginBottom: 12 }}>
                  <MdSearch className="filter-search-icon" style={{ width: 15, height: 15 }} />
                  <input type="text" placeholder="Search items by name, category or ID…" value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} />
                </div>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 140px 110px 110px 180px', padding: '9px 14px', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    <div /><div>Item</div><div style={{ textAlign: 'center' }}>Qty / Unit</div><div style={{ textAlign: 'center' }}>Price (₹)</div><div style={{ textAlign: 'right' }}>Total (₹)</div><div>Description</div>
                  </div>
                  <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                    {filteredStockItems.map((item, idx) => {
                      const checked = !!stockChecked[item.id];
                      const toggle  = () => {
                        const next = !stockChecked[item.id];
                        setStockChecked((prev) => ({ ...prev, [item.id]: next }));
                        if (next && !stockPrices[item.id]) setStockPrices((prev) => ({ ...prev, [item.id]: String(item.unitCost) }));
                      };
                      const qty   = Number(stockQtys[item.id]   || 0);
                      const price = Number(stockPrices[item.id] ?? item.unitCost);
                      const total = qty && price ? qty * price : null;
                      return (
                        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 140px 110px 110px 180px', alignItems: 'center', padding: '10px 14px', borderBottom: idx < filteredStockItems.length - 1 ? '1px solid var(--border-light)' : 'none', background: checked ? 'var(--primary-pale)' : idx % 2 === 0 ? '#fff' : 'var(--bg-main)', transition: 'background 0.15s', cursor: 'pointer' }}>
                          <div onClick={toggle} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? 'var(--primary)' : 'var(--border-color)'}`, background: checked ? 'var(--primary)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                            {checked && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </div>
                          <div onClick={toggle} style={{ paddingLeft: 10 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{item.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{item.id} · {item.category} · <span style={{ color: (stockMap[item.id] ?? item.currentStock) <= item.minStock ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>Avail: {stockMap[item.id] ?? item.currentStock} {item.unit}</span></div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <input type="number" min="0" step="0.01" value={stockQtys[item.id] || ''} onChange={(e) => { const val = e.target.value; setStockQtys((prev) => ({ ...prev, [item.id]: val })); if (val) { setStockChecked((prev) => ({ ...prev, [item.id]: true })); if (!stockPrices[item.id]) setStockPrices((prev) => ({ ...prev, [item.id]: String(item.unitCost) })); } }} onClick={(e) => e.stopPropagation()} placeholder="0" style={{ width: 70, height: 34, border: '1.5px solid var(--border-color)', borderRadius: 8, padding: '0 6px', fontSize: 13, fontWeight: 600, textAlign: 'center', outline: 'none', background: checked ? '#fff' : 'var(--bg-main)' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', padding: '2px 7px', background: 'var(--primary-pale)', borderRadius: 20, whiteSpace: 'nowrap' }}>{item.unit}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <input type="number" min="0" step="0.01" value={stockPrices[item.id] ?? ''} onChange={(e) => { setStockPrices((prev) => ({ ...prev, [item.id]: e.target.value })); if (e.target.value) setStockChecked((prev) => ({ ...prev, [item.id]: true })); }} onClick={(e) => e.stopPropagation()} placeholder={String(item.unitCost)} style={{ width: 90, height: 34, border: '1.5px solid var(--border-color)', borderRadius: 8, padding: '0 8px', fontSize: 13, fontWeight: 600, textAlign: 'center', outline: 'none', background: checked ? '#fff' : 'var(--bg-main)' }} />
                          </div>
                          <div style={{ textAlign: 'right', paddingRight: 6 }}>
                            {total !== null ? <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--success)' }}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                          </div>
                          <input type="text" value={stockDescs[item.id] || ''} onChange={(e) => { setStockDescs((prev) => ({ ...prev, [item.id]: e.target.value })); if (e.target.value) setStockChecked((prev) => ({ ...prev, [item.id]: true })); }} onClick={(e) => e.stopPropagation()} placeholder="Add note…" style={{ width: '100%', height: 34, border: '1.5px solid var(--border-color)', borderRadius: 8, padding: '0 10px', fontSize: 12, outline: 'none', background: checked ? '#fff' : 'var(--bg-main)' }} />
                        </div>
                      );
                    })}
                    {filteredStockItems.length === 0 && <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No items match your search.</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
        );
      })()}

      {/* Edit History Record Modal */}
      {editHistoryRecord && (() => {
        const histItem = liveItems.find((i) => i.id === editHistoryRecord.itemId);
        const rec      = transactions.find((t) => t.id === editHistoryRecord.recordId);
        if (!histItem || !rec) return null;
        const canSave  = editHistoryForm.qty !== '' && Number(editHistoryForm.qty) > 0 && editHistoryForm.rate !== '' && Number(editHistoryForm.rate) >= 0;
        return (
          <Modal
            show={!!editHistoryRecord}
            onClose={() => setEditHistoryRecord(null)}
            title={`Edit Stock Record — ${histItem.name}`}
            size="sm"
            footer={
              <>
                <button className="btn-secondary-fsp" onClick={() => setEditHistoryRecord(null)}>Cancel</button>
                <button className="btn-primary-fsp" onClick={handleHistoryEditSave} disabled={!canSave} style={{ opacity: !canSave ? 0.5 : 1 }}>
                  <MdCheckCircle /> Save Changes
                </button>
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '10px 14px', background: 'var(--primary-pale)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', border: '1px solid rgba(79,70,229,0.15)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{histItem.name}</span>
                <span style={{ color: 'var(--text-muted)' }}>Date: {rec.date}</span>
              </div>
              <div>
                <label className="fsp-label">Quantity Received * <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({histItem.unit})</span></label>
                <input className="fsp-input" type="number" min="0" step="0.01" autoFocus value={editHistoryForm.qty} onChange={(e) => setEditHistoryForm((f) => ({ ...f, qty: e.target.value }))} />
              </div>
              <div>
                <label className="fsp-label">Purchase Rate * <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(₹ per {histItem.unit})</span></label>
                <input className="fsp-input" type="number" min="0" step="0.01" value={editHistoryForm.rate} onChange={(e) => setEditHistoryForm((f) => ({ ...f, rate: e.target.value }))} />
              </div>
              <div>
                <label className="fsp-label">Description / Notes</label>
                <input className="fsp-input" value={editHistoryForm.desc} onChange={(e) => setEditHistoryForm((f) => ({ ...f, desc: e.target.value }))} placeholder="Add note…" />
              </div>
              {editHistoryForm.qty && editHistoryForm.rate && (
                <div style={{ padding: '10px 14px', background: 'var(--success-bg)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Total Purchase Amount</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--success)' }}>
                    ₹{(Number(editHistoryForm.qty) * Number(editHistoryForm.rate)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* Delete History Record Confirm Modal */}
      <Modal
        show={!!deleteHistoryRecord}
        onClose={() => setDeleteHistoryRecord(null)}
        title="Delete Stock Record"
        size="sm"
        footer={
          <>
            <button className="btn-secondary-fsp" onClick={() => setDeleteHistoryRecord(null)}>Cancel</button>
            <button className="btn-danger-fsp" onClick={() => handleHistoryDelete(deleteHistoryRecord.itemId, deleteHistoryRecord.recordId, deleteHistoryRecord.qty)}>Delete Record</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Are you sure you want to delete this stock update record? The quantity will be deducted from live stock.</p>
      </Modal>
    </div>
  );
};

export default AddItems;
