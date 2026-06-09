import './Items.css';
import React, { useState, useMemo } from 'react';
import {
  MdKeyboardArrowDown, MdKeyboardArrowUp, MdSearch,
  MdRefresh, MdFileDownload, MdWarning, MdCheckCircle,
  MdCancel, MdSchedule, MdInventory2, MdTrendingDown,
  MdTrendingUp, MdLocalFireDepartment, MdFilterList,
} from 'react-icons/md';
import StatusBadge from '../components/common/StatusBadge';
import {
  getEnrichedItems, categories,
  getStockBarClass, formatCurrency, formatDate,
  getDaysUntilExpiry, getUrgencyType, getUrgencyLabel,
} from '../services/mockData';

// ── Mini sparkline SVG ────────────────────────────────
const Sparkline = ({ data = [], color = '#4F46E5', height = 32, width = 80 }) => {
  if (!data.length) return null;
  const max  = Math.max(...data);
  const min  = Math.min(...data);
  const range = max - min || 1;
  const pts  = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Fill area */}
      <polyline
        points={`0,${height} ${pts} ${width},${height}`}
        fill={color}
        fillOpacity="0.08"
        stroke="none"
      />
      {/* Last point dot */}
      {data.length > 0 && (() => {
        const last = data[data.length - 1];
        const x    = width;
        const y    = height - ((last - min) / range) * (height - 4) - 2;
        return <circle cx={x} cy={y} r="3" fill={color} />;
      })()}
    </svg>
  );
};

// ── Radial stock gauge ────────────────────────────────
const StockGauge = ({ pct = 0, color = '#4F46E5', size = 56 }) => {
  const r   = 22;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border-color)" strokeWidth="5" />
      <circle
        cx="28" cy="28" r={r}
        fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="28" y="32" textAnchor="middle" fontSize="11" fontWeight="800" fill={color}
        style={{ fontFamily: 'Inter, sans-serif' }}>
        {pct}%
      </text>
    </svg>
  );
};

// ── Sub-tab configuration ────────────────────────────
const TABS = [
  { key: 'all',      label: 'All Items',      icon: <MdInventory2 />,  filter: () => true },
  { key: 'instock',  label: 'In Stock',       icon: <MdCheckCircle />, filter: (i) => i.currentStock > i.minStock },
  { key: 'low',      label: 'Low Stock',      icon: <MdWarning />,     filter: (i) => i.currentStock > 0 && i.currentStock <= i.minStock },
  { key: 'out',      label: 'Out of Stock',   icon: <MdCancel />,      filter: (i) => i.currentStock === 0 },
  { key: 'expiring', label: 'Expiring Soon',  icon: <MdSchedule />,    filter: (i) => { const d = getDaysUntilExpiry(i.expiryDate); return d >= 0 && d <= 10; } },
];

const URGENCY_COLOR = { critical: '#EF4444', high: '#F59E0B', medium: '#3B82F6', low: '#10B981' };

// ── Expanded Detail Panel ────────────────────────────
const ItemDetailPanel = ({ item }) => {
  const urgencyColor = URGENCY_COLOR[item.urgency] || '#4F46E5';
  const expiryDays   = getDaysUntilExpiry(item.expiryDate);
  const expiryColor  = expiryDays <= 3 ? '#EF4444' : expiryDays <= 10 ? '#F59E0B' : 'var(--text-muted)';

  const DataCell = ({ label, value, sub, accent }) => (
    <div style={{
      background: 'var(--bg-main)', borderRadius: 10, padding: '12px 14px',
      border: '1px solid var(--border-light)',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: accent || 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
    </div>
  );

  return (
    <tr>
      <td colSpan={9} style={{ padding: 0, background: 'transparent' }}>
        <div style={{
          margin: '0 0 2px',
          background: 'linear-gradient(135deg, #F8FAFF 0%, #EEF2FF 100%)',
          borderBottom: '2px solid var(--primary-lighter)',
          padding: '20px 24px 24px',
          animation: 'expand-in 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {/* Panel header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 8, height: 28, borderRadius: 4,
                background: urgencyColor,
              }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {item.name} — Detail View
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {item.id} · {item.category} · {item.location}
                </div>
              </div>
            </div>
            <StatusBadge
              label={getUrgencyLabel(item.urgency, item.daysRemaining, item.currentStock)}
              type={getUrgencyType(item.urgency)}
            />
          </div>

          {/* Three-column panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

            {/* ── Panel 1: Inventory Data ─────────── */}
            <div style={{
              background: 'white', borderRadius: 12, padding: '16px 18px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: 'var(--primary)',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <MdInventory2 /> Inventory Data
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <DataCell label="Current Stock"  value={`${item.currentStock} ${item.unit}`} accent="var(--primary)" />
                <DataCell label="Min Threshold"  value={`${item.minStock} ${item.unit}`}     accent="var(--warning)" />
                <DataCell label="Max Capacity"   value={`${item.maxStock} ${item.unit}`}     />
                <DataCell label="Unit Cost"       value={formatCurrency(item.unitCost)}       />
                <DataCell label="Total Value"     value={formatCurrency(item.totalValue)}     accent="var(--success)" />
                <DataCell label="Last Restocked"  value={formatDate(item.lastRestocked)}      sub={`+${item.restockQty} ${item.unit}`} />
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 5 }}>
                  <span>Stock Level</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.stockLeftPct}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 10,
                    width: `${item.stockLeftPct}%`,
                    background: item.stockLeftPct <= 25
                      ? 'linear-gradient(90deg, #FCA5A5, #EF4444)'
                      : item.stockLeftPct <= 50
                      ? 'linear-gradient(90deg, #FCD34D, #F59E0B)'
                      : 'linear-gradient(90deg, #6EE7B7, #10B981)',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>0</span>
                  <span>Min: {item.minStock}</span>
                  <span>Max: {item.maxStock}</span>
                </div>
              </div>
              {/* Expiry */}
              <div style={{
                marginTop: 12, padding: '8px 12px', borderRadius: 8,
                background: expiryDays <= 10 ? '#FEF2F2' : 'var(--bg-main)',
                border: `1px solid ${expiryDays <= 10 ? 'rgba(239,68,68,0.15)' : 'var(--border-light)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                  Expiry Date
                </span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: expiryColor }}>
                    {formatDate(item.expiryDate)}
                  </div>
                  <div style={{ fontSize: 10.5, color: expiryColor }}>
                    {expiryDays < 0 ? 'Expired' : expiryDays === 0 ? 'Expires today' : `${expiryDays} days left`}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Panel 2: Usage & Consumption ───── */}
            <div style={{
              background: 'white', borderRadius: 12, padding: '16px 18px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: '#F59E0B',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <MdTrendingDown /> Usage & Consumption
              </div>

              {/* Daily / Weekly / Monthly */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Per Day',   val: item.dailyUsage,   color: '#EF4444' },
                  { label: 'Per Week',  val: item.weeklyUsage,  color: '#F59E0B' },
                  { label: 'Per Month', val: item.monthlyUsage, color: '#10B981' },
                ].map((r) => (
                  <div key={r.label} style={{
                    background: 'var(--bg-main)', borderRadius: 10,
                    padding: '10px 10px 8px',
                    border: '1px solid var(--border-light)',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: r.color, lineHeight: 1 }}>
                      {r.val}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>
                      {item.unit}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>
                      {r.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* 7-day sparkline */}
              <div style={{
                background: 'var(--bg-main)', borderRadius: 10, padding: '12px 14px',
                border: '1px solid var(--border-light)', marginBottom: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    7-Day Trend
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>
                    Avg {item.dailyUsage} {item.unit}/day
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3 }}>
                  {item.history.map((val, i) => {
                    const max = Math.max(...item.history);
                    const h   = max > 0 ? Math.max(Math.round((val / max) * 40), 4) : 4;
                    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    return (
                      <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                        <div
                          title={`${days[i]}: ${val} ${item.unit}`}
                          style={{
                            height: h, background: 'linear-gradient(180deg, #818CF8, #4F46E5)',
                            borderRadius: '3px 3px 0 0', margin: '0 1px',
                            opacity: i === item.history.length - 1 ? 1 : 0.6,
                            transition: 'height 0.4s ease',
                            cursor: 'default',
                          }}
                        />
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>
                          {days[i]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Peak day + total consumed */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{
                  background: 'var(--warning-bg)', borderRadius: 10, padding: '10px 12px',
                  border: '1px solid rgba(245,158,11,0.15)',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Peak Day
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#B45309', marginTop: 3 }}>
                    {item.peakDay}
                  </div>
                </div>
                <div style={{
                  background: 'var(--danger-bg)', borderRadius: 10, padding: '10px 12px',
                  border: '1px solid rgba(239,68,68,0.15)',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    30-Day Total
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#DC2626', marginTop: 3 }}>
                    {item.totalConsumed} {item.unit}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Panel 3: Stock Analysis ──────────── */}
            <div style={{
              background: 'white', borderRadius: 12, padding: '16px 18px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: '#10B981',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <MdLocalFireDepartment /> Stock Analysis
              </div>

              {/* Gauge + days remaining */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <StockGauge
                  pct={item.stockLeftPct}
                  color={
                    item.stockLeftPct <= 25 ? '#EF4444' :
                    item.stockLeftPct <= 50 ? '#F59E0B' : '#10B981'
                  }
                  size={72}
                />
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: urgencyColor, lineHeight: 1 }}>
                    {item.currentStock === 0 ? '—' : item.daysRemaining}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Days of stock left
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                    at {item.dailyUsage} {item.unit}/day usage
                  </div>
                </div>
              </div>

              {/* Urgency timeline */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Reorder Timeline
                </div>
                {[
                  { label: 'Critical — Reorder now',  threshold: 3,  color: '#EF4444', bg: '#FEF2F2' },
                  { label: 'High — Reorder this week', threshold: 7,  color: '#F59E0B', bg: '#FFFBEB' },
                  { label: 'Medium — Plan ahead',      threshold: 14, color: '#3B82F6', bg: '#EFF6FF' },
                  { label: 'Healthy stock level',      threshold: 999,color: '#10B981', bg: '#ECFDF5' },
                ].map((zone) => {
                  const active =
                    zone.threshold === 3   ? item.urgency === 'critical' :
                    zone.threshold === 7   ? item.urgency === 'high'     :
                    zone.threshold === 14  ? item.urgency === 'medium'   :
                    item.urgency === 'low';
                  return (
                    <div key={zone.label} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 10px', borderRadius: 7, marginBottom: 4,
                      background: active ? zone.bg : 'transparent',
                      border: `1px solid ${active ? zone.color + '30' : 'transparent'}`,
                      transition: 'all 0.2s',
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: active ? zone.color : 'var(--border-color)',
                        flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: 12, fontWeight: active ? 700 : 400,
                        color: active ? zone.color : 'var(--text-muted)',
                      }}>
                        {zone.label}
                      </span>
                      {active && (
                        <span style={{
                          marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                          padding: '1px 7px', borderRadius: 10,
                          background: zone.color, color: 'white',
                        }}>
                          NOW
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reorder suggestion */}
              <div style={{
                background: 'var(--primary-pale)', borderRadius: 10, padding: '10px 14px',
                border: '1px solid var(--primary-lighter)',
              }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                  Suggested Reorder
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--primary-dark)' }}>
                  {item.currentStock === 0
                    ? `${item.maxStock} ${item.unit} (full restock)`
                    : item.urgency !== 'low'
                    ? `${Math.round(item.monthlyUsage)} ${item.unit} (1-month supply)`
                    : 'No reorder needed'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Supplier: {item.supplier}
                </div>
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes expand-in {
            from { opacity: 0; transform: translateY(-8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </td>
    </tr>
  );
};

// ── Main Items Page ──────────────────────────────────
const Items = () => {
  const allItems              = useMemo(() => getEnrichedItems(), []);
  const [activeTab, setTab]   = useState('all');
  const [expandedId, setExp]  = useState(null);
  const [search, setSearch]   = useState('');
  const [catFilter, setCat]   = useState('All Categories');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  // Tab counts
  const tabCounts = useMemo(() => ({
    all:      allItems.length,
    instock:  allItems.filter(TABS[1].filter).length,
    low:      allItems.filter(TABS[2].filter).length,
    out:      allItems.filter(TABS[3].filter).length,
    expiring: allItems.filter(TABS[4].filter).length,
  }), [allItems]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    const tab    = TABS.find((t) => t.key === activeTab) || TABS[0];
    let list     = allItems.filter(tab.filter);
    if (search)   list = list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()) || i.supplier.toLowerCase().includes(search.toLowerCase()));
    if (catFilter !== 'All Categories') list = list.filter((i) => i.category === catFilter);
    return [...list].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [allItems, activeTab, search, catFilter, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const toggleExpand = (id) => setExp((prev) => prev === id ? null : id);

  const SortArrow = ({ col }) => {
    if (sortKey !== col) return <span style={{ opacity: 0.3, fontSize: 10 }}>↕</span>;
    return <span style={{ fontSize: 10, color: 'var(--primary)' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>;
  };

  const TAB_COLORS = {
    all: 'var(--primary)', instock: 'var(--success)',
    low: 'var(--warning)', out: 'var(--danger)', expiring: '#8B5CF6',
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Items</h1>
          <p>Complete item catalog with inventory, usage, and consumption analytics per item</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary-fsp"><MdFileDownload /> Export</button>
        </div>
      </div>

      {/* ── Main tab strip ──────────────────────────── */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-card)',
        marginBottom: 16,
        overflow: 'hidden',
      }}>
        {/* Tab nav */}
        <div style={{
          display: 'flex', alignItems: 'stretch',
          borderBottom: '2px solid var(--border-light)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            const color  = TAB_COLORS[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => { setTab(tab.key); setExp(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '14px 22px', border: 'none', background: 'none',
                  cursor: 'pointer', whiteSpace: 'nowrap', position: 'relative',
                  color: active ? color : 'var(--text-muted)',
                  fontWeight: active ? 700 : 500, fontSize: 13.5,
                  transition: 'all 0.2s ease',
                  fontFamily: "'Inter', sans-serif",
                  borderBottom: active ? `2.5px solid ${color}` : '2.5px solid transparent',
                  marginBottom: '-2px',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = color; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <span style={{
                  fontSize: 16,
                  color: active ? color : 'var(--text-muted)',
                }}>
                  {tab.icon}
                </span>
                {tab.label}
                <span style={{
                  minWidth: 22, height: 22, borderRadius: 20,
                  background: active ? color : 'var(--border-light)',
                  color: active ? 'white' : 'var(--text-muted)',
                  fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 6px',
                  transition: 'all 0.2s ease',
                }}>
                  {tabCounts[tab.key]}
                </span>
              </button>
            );
          })}

          {/* Push filters to the right */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, flexShrink: 0 }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <MdSearch style={{
                position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: 16, pointerEvents: 'none',
              }} />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setExp(null); }}
                placeholder="Search items…"
                style={{
                  height: 34, border: '1px solid var(--border-color)',
                  borderRadius: 8, padding: '0 10px 0 32px', fontSize: 13,
                  outline: 'none', background: 'var(--bg-main)',
                  color: 'var(--text-primary)', width: 180,
                  transition: 'all 0.2s',
                }}
              />
            </div>
            {/* Category */}
            <select
              value={catFilter}
              onChange={(e) => { setCat(e.target.value); setExp(null); }}
              style={{
                height: 34, border: '1px solid var(--border-color)',
                borderRadius: 8, padding: '0 10px', fontSize: 13,
                background: 'var(--bg-main)', color: 'var(--text-secondary)',
                outline: 'none', cursor: 'pointer', minWidth: 140,
              }}
            >
              {['All Categories', 'Grains', 'Oils & Fats', 'Meat', 'Produce', 'Baking', 'Seafood', 'Dairy', 'Spices', 'Condiments'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {/* Reset */}
            <button
              className="btn-icon-sm"
              onClick={() => { setSearch(''); setCat('All Categories'); setSortKey('name'); setSortDir('asc'); setExp(null); }}
              title="Reset filters"
            >
              <MdRefresh />
            </button>
          </div>
        </div>

        {/* Result count bar */}
        <div style={{
          padding: '8px 20px', background: 'var(--bg-main)',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> item{filtered.length !== 1 ? 's' : ''} shown
            {expandedId && <span style={{ marginLeft: 8, color: 'var(--primary)' }}>· 1 row expanded</span>}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
            <MdFilterList style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Click any row to expand full detail
          </span>
        </div>

        {/* ── Items Table ──────────────────────────── */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)' }}>
                <th style={{ width: 36 }} />
                {[
                  { key: 'id',            label: 'ID' },
                  { key: 'name',          label: 'Item Name' },
                  { key: 'currentStock',  label: 'Stock Left' },
                  { key: 'dailyUsage',    label: 'Used / Day' },
                  { key: 'weeklyUsage',   label: 'Used / Week' },
                  { key: 'totalConsumed', label: '30-Day Total' },
                  { key: 'daysRemaining', label: 'Days Left' },
                  { key: 'urgency',       label: 'Reorder Status' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.7px',
                      cursor: 'pointer', whiteSpace: 'nowrap',
                      userSelect: 'none', borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    {col.label} <SortArrow col={col.key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📦</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>No items found</div>
                    <div style={{ fontSize: 13 }}>Try adjusting your search or filters</div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isOpen    = expandedId === item.id;
                  const urgColor  = URGENCY_COLOR[item.urgency] || '#10B981';
                  const daysColor =
                    item.currentStock === 0   ? '#EF4444' :
                    item.daysRemaining <= 3   ? '#EF4444' :
                    item.daysRemaining <= 7   ? '#F59E0B' :
                    item.daysRemaining <= 14  ? '#3B82F6' : '#10B981';

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        onClick={() => toggleExpand(item.id)}
                        style={{
                          cursor: 'pointer',
                          background: isOpen ? '#F0F4FF' : 'transparent',
                          borderBottom: isOpen ? 'none' : '1px solid var(--border-light)',
                          transition: 'background 0.15s ease',
                          borderLeft: isOpen ? `3px solid ${urgColor}` : '3px solid transparent',
                        }}
                        onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.background = '#F8FAFF'; }}
                        onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {/* Expand chevron */}
                        <td style={{ padding: '0 4px 0 12px', textAlign: 'center' }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: 6,
                            background: isOpen ? 'var(--primary)' : 'var(--border-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isOpen ? 'white' : 'var(--text-muted)',
                            fontSize: 16, transition: 'all 0.2s ease',
                          }}>
                            {isOpen ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
                          </div>
                        </td>

                        {/* ID */}
                        <td style={{ padding: '13px 14px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                            {item.id}
                          </span>
                        </td>

                        {/* Name + category */}
                        <td style={{ padding: '13px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                              background: `hsl(${item.id.replace(/\D/g, '') * 37 % 360}, 70%, 94%)`,
                              color: `hsl(${item.id.replace(/\D/g, '') * 37 % 360}, 55%, 40%)`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, fontSize: 13,
                            }}>
                              {item.name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                                {item.category} · {item.location}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Stock left */}
                        <td style={{ padding: '13px 14px' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                              {item.currentStock} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>{item.unit}</span>
                            </div>
                            <div style={{ marginTop: 5, height: 5, width: 100, background: 'var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: 10,
                                width: `${item.stockLeftPct}%`,
                                background: item.stockLeftPct <= 25 ? '#EF4444' : item.stockLeftPct <= 55 ? '#F59E0B' : '#10B981',
                                transition: 'width 0.5s ease',
                              }} />
                            </div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
                              {item.stockLeftPct}% of {item.maxStock} {item.unit}
                            </div>
                          </div>
                        </td>

                        {/* Used / day */}
                        <td style={{ padding: '13px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div>
                              <span style={{ fontSize: 15, fontWeight: 800, color: '#EF4444' }}>
                                {item.dailyUsage}
                              </span>
                              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginLeft: 3 }}>
                                {item.unit}
                              </span>
                            </div>
                            <Sparkline data={item.history} color="#EF4444" height={28} width={60} />
                          </div>
                        </td>

                        {/* Used / week */}
                        <td style={{ padding: '13px 14px' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#F59E0B' }}>
                            {item.weeklyUsage}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 3 }}>{item.unit}</span>
                        </td>

                        {/* 30-day total */}
                        <td style={{ padding: '13px 14px' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {item.totalConsumed}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 3 }}>{item.unit}</span>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                            ≈ {formatCurrency(item.totalConsumed * item.unitCost)} cost
                          </div>
                        </td>

                        {/* Days left */}
                        <td style={{ padding: '13px 14px' }}>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '5px 12px', borderRadius: 20,
                            background: daysColor + '15',
                            border: `1px solid ${daysColor}30`,
                          }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: daysColor }} />
                            <span style={{ fontSize: 13, fontWeight: 800, color: daysColor }}>
                              {item.currentStock === 0 ? '—' : `${item.daysRemaining}d`}
                            </span>
                          </div>
                          {item.currentStock > 0 && (
                            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>
                              runs out {item.daysRemaining <= 0 ? 'today' : `in ${item.daysRemaining} days`}
                            </div>
                          )}
                        </td>

                        {/* Reorder Status */}
                        <td style={{ padding: '13px 14px' }}>
                          <StatusBadge
                            label={
                              item.currentStock === 0     ? 'Out of Stock'    :
                              item.urgency === 'critical' ? 'Reorder Now'     :
                              item.urgency === 'high'     ? 'Reorder Soon'    :
                              item.urgency === 'medium'   ? 'Monitor Stock'   :
                              'Healthy'
                            }
                            type={getUrgencyType(item.urgency)}
                          />
                        </td>
                      </tr>

                      {/* Expandable detail row */}
                      {isOpen && <ItemDetailPanel item={item} />}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--border-light)',
          background: 'var(--bg-main)', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          fontSize: 12.5, color: 'var(--text-muted)',
        }}>
          <span>Showing <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> items · Click a row to view full inventory, usage & stock analysis</span>
          <span style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => setExp(null)}>
            Collapse all
          </span>
        </div>
      </div>
    </div>
  );
};

export default Items;
