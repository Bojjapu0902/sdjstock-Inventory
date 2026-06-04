import './Dashboard.css';
import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  MdInventory2, MdWarning, MdShoppingCart, MdDeleteSweep,
  MdAttachMoney, MdPeople, MdTrendingUp,
} from 'react-icons/md';
import KPICard    from '../components/common/KPICard';
import StatusBadge from '../components/common/StatusBadge';
import {
  stockTrendData, categoryDistribution, monthlyWastageCost,
  topItemsByValue, recentActivity, kpiData,
  inventoryItems, getDaysUntilExpiry, formatDate, formatCurrency,
} from '../data/mockData';
import { useInventoryStock } from '../hooks/useInventoryStock';

// Custom Tooltip
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border-color)',
      borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-md)',
      fontSize: 12,
    }}>
      <p style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}: </span>
          <strong style={{ color: 'var(--text-primary)' }}>
            {p.name === 'cost' ? `$${p.value}` : p.value}
          </strong>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { stockMap } = useInventoryStock();

  /* Overlay live stock quantities so alerts reflect real-time updates */
  const liveItems = useMemo(() =>
    inventoryItems.map((i) => ({ ...i, currentStock: stockMap[i.id] ?? i.currentStock })),
  [stockMap]);

  const lowStockItems = useMemo(() =>
    liveItems.filter((i) => i.currentStock <= i.minStock).slice(0, 5),
  [liveItems]);

  const expiringSoon = useMemo(() =>
    liveItems
      .filter((i) => { const d = getDaysUntilExpiry(i.expiryDate); return d >= 0 && d <= 10; })
      .sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate))
      .slice(0, 4),
  [liveItems]);

  return (
    <div>
      {/* ── KPI Cards ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPICard
          icon={<MdInventory2 />}
          iconBg="#E0E7FF" iconColor="#4F46E5" accent="#4F46E5"
          value={kpiData.totalItems.value}
          label="Total Stock Items"
          trend={kpiData.totalItems.trend}
          trendType="up"
          trendText="new items"
        />
        <KPICard
          icon={<MdWarning />}
          iconBg="#FEF2F2" iconColor="#EF4444" accent="#EF4444"
          value={kpiData.lowStockAlerts.value}
          label="Low Stock Alerts"
          trend={kpiData.lowStockAlerts.trend}
          trendType="down"
          trendText="vs last week"
        />
        
        <KPICard
          icon={<MdShoppingCart />}
          iconBg="#EFF6FF" iconColor="#3B82F6" accent="#3B82F6"
          value={kpiData.purchaseOrders.value}
          label="Orders (MTD)"
          trend={kpiData.purchaseOrders.trend}
          trendType="up"
          trendText="vs last month"
        />
        <KPICard
          icon={<MdDeleteSweep />}
          iconBg="#FFFBEB" iconColor="#F59E0B" accent="#F59E0B"
          value={kpiData.wastageThisMonth.value}
          trend={-18}
          trendType="down"
          label="Wastage (MTD)"
          trendText="vs last month"
        />
        <KPICard
          icon={<MdAttachMoney />}
          iconBg="#ECFDF5" iconColor="#10B981" accent="#10B981"
          value={kpiData.totalInventoryValue.value}
          label="Inventory Value"
          trend={kpiData.totalInventoryValue.trend}
          trendType="up"
          trendText="% growth"
        />
        <KPICard
          icon={<MdPeople />}
          iconBg="#F5F3FF" iconColor="#8B5CF6" accent="#8B5CF6"
          value={kpiData.activeSuppliers.value}
          label="Active Suppliers"
          trend={0}
          trendType="neutral"
          trendText="no change"
        />
      </div>

      {/* ── Row 1: Stock Trend + Category Donut ───── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 16 }}>

        {/* Stock Level Trend */}
        <div className="fsp-card">
          <div className="fsp-card-header">
            <div>
              <div className="fsp-card-title">Stock Level Trend</div>
              <div className="fsp-card-subtitle">Last 7 days — In Stock vs Low Stock vs Out of Stock</div>
            </div>
            <span className="status-badge success"><span className="dot" />Live</span>
          </div>
          <div className="fsp-card-body">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stockTrendData} margin={{ top: 4, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="inStock"    name="In Stock"     stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} />
                <Line type="monotone" dataKey="lowStock"   name="Low Stock"    stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4, fill: '#F59E0B' }} />
                <Line type="monotone" dataKey="outOfStock" name="Out of Stock" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4, fill: '#EF4444' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="fsp-card">
          <div className="fsp-card-header">
            <div>
              <div className="fsp-card-title">By Category</div>
              <div className="fsp-card-subtitle">Item count per category</div>
            </div>
          </div>
          <div className="fsp-card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%" cy="50%"
                  innerRadius={46} outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ width: '100%', marginTop: 8 }}>
              {categoryDistribution.map((c) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.name}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Top Items + Wastage Trend ──────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Top Items by Value */}
        <div className="fsp-card">
          <div className="fsp-card-header">
            <div>
              <div className="fsp-card-title">Top Items by Stock Value</div>
              <div className="fsp-card-subtitle">Current inventory value by item</div>
            </div>
          </div>
          <div className="fsp-card-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topItemsByValue} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                <Tooltip formatter={(v) => [`$${v}`, 'Value']} />
                <Bar dataKey="value" name="Value" fill="#4F46E5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Wastage Cost */}
        <div className="fsp-card">
          <div className="fsp-card-header">
            <div>
              <div className="fsp-card-title">Monthly Wastage Cost</div>
              <div className="fsp-card-subtitle">6-month wastage cost trend (₹)</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
              <MdTrendingUp /> Down 18%
            </div>
          </div>
          <div className="fsp-card-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyWastageCost} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="cost" name="cost" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 3: Alerts + Expiry + Activity ─────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        {/* Low Stock Alerts */}
        <div className="fsp-card">
          <div className="fsp-card-header">
            <div>
              <div className="fsp-card-title">Low Stock Alerts</div>
              <div className="fsp-card-subtitle">Items requiring reorder</div>
            </div>
            <span className="status-badge danger" style={{ fontSize: 11 }}>
              <span className="dot" />{lowStockItems.length} items
            </span>
          </div>
          <div className="fsp-card-body" style={{ padding: '12px 20px' }}>
            {lowStockItems.map((item) => {
              const pct  = Math.round((item.currentStock / item.maxStock) * 100);
              const type = item.currentStock === 0 ? 'danger' : 'warning';
              return (
                <div key={item.id} className="alert-item" style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-light)', borderRadius: 0, padding: '11px 0', marginBottom: 0 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
                      <StatusBadge
                        label={item.currentStock === 0 ? 'Out of Stock' : 'Low Stock'}
                        type={type}
                      />
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6 }}>
                      {item.currentStock} {item.unit} of {item.maxStock} {item.unit} max
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="fsp-card">
          <div className="fsp-card-header">
            <div>
              <div className="fsp-card-title">Expiring Soon</div>
              <div className="fsp-card-subtitle">Items expiring within 10 days</div>
            </div>
            <span className="status-badge warning" style={{ fontSize: 11 }}>
              <span className="dot" />{expiringSoon.length} items
            </span>
          </div>
          <div className="fsp-card-body" style={{ padding: '12px 20px' }}>
            {expiringSoon.map((item) => {
              const days = getDaysUntilExpiry(item.expiryDate);
              const type = days <= 3 ? 'danger' : days <= 7 ? 'warning' : 'info';
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: type === 'danger' ? 'var(--danger-bg)' : type === 'warning' ? 'var(--warning-bg)' : 'var(--info-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, flexShrink: 0,
                    }}
                  >
                    {type === 'danger' ? '🔴' : type === 'warning' ? '🟡' : '🔵'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{formatDate(item.expiryDate)}</div>
                  </div>
                  <StatusBadge
                    label={days === 0 ? 'Today' : `${days}d`}
                    type={type}
                  />
                </div>
              );
            })}
            {expiringSoon.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                ✅ No items expiring in the next 10 days
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="fsp-card">
          <div className="fsp-card-header">
            <div>
              <div className="fsp-card-title">Recent Activity</div>
              <div className="fsp-card-subtitle">Latest system events</div>
            </div>
          </div>
          <div className="fsp-card-body" style={{ padding: '4px 20px' }}>
            <div className="activity-feed">
              {recentActivity.map((item) => (
                <div key={item.id} className="activity-item">
                  <div
                    className="activity-dot"
                    style={{ background: item.color, color: item.textColor }}
                  >
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">{item.title}</div>
                    <div className="activity-meta">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
