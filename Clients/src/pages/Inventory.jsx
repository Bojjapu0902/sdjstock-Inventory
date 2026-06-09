import './Inventory.css';
import React, { useMemo } from 'react';
import { useInventoryStock } from '../hooks/useInventoryStock';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  getStockStatus, getStockBarClass,
  formatCurrency,
  getEnrichedItems,
} from '../services/mockData';

const URGENCY_CONFIG = {
  critical: { icon: '🔴', color: '#EF4444', bg: '#FEF2F2', border: 'rgba(239,68,68,0.2)'  },
  high:     { icon: '🟠', color: '#F59E0B', bg: '#FFFBEB', border: 'rgba(245,158,11,0.2)'  },
  medium:   { icon: '🔵', color: '#3B82F6', bg: '#EFF6FF', border: 'rgba(59,130,246,0.2)'  },
  low:      { icon: '🟢', color: '#10B981', bg: '#ECFDF5', border: 'rgba(16,185,129,0.2)'  },
};

const Inventory = () => {
  const { stockMap } = useInventoryStock();
  const items = useMemo(() =>
    getEnrichedItems().map((item) => ({
      ...item,
      currentStock: stockMap[item.id] ?? item.currentStock,
    })),
  [stockMap]);

  const summary = useMemo(() => {
    let inStock = 0, low = 0, out = 0, critical = 0;
    for (const i of items) {
      if (i.currentStock === 0)                                                              out++;
      else if (getStockStatus(i.currentStock, i.minStock, i.maxStock).label === 'Low Stock') low++;
      else                                                                                   inStock++;
      if (i.urgency === 'critical' || i.urgency === 'high') critical++;
    }
    return { total: items.length, inStock, low, out, critical };
  }, [items]);

  const topConsumers = useMemo(() =>
    [...items].sort((a, b) => (b.dailyUsage * b.unitCost) - (a.dailyUsage * a.unitCost)).slice(0, 8)
      .map((i) => ({ name: i.name.split(' ')[0], dailyCost: +(i.dailyUsage * i.unitCost).toFixed(2), dailyUsage: i.dailyUsage, unit: i.unit })),
    [items]);

  const criticalItems = useMemo(() =>
    items.filter((i) => i.urgency === 'critical' || i.urgency === 'high').sort((a, b) => a.daysRemaining - b.daysRemaining),
    [items]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Inventory</h1>
          <p>Monitor stock levels, usage analytics, and critical items across your inventory</p>
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

      {/* Critical Items */}
      {criticalItems.length > 0 && (
        <div className="fsp-card" style={{ marginBottom: 16 }}>
          <div className="fsp-card-header">
            <div>
              <div className="fsp-card-title" style={{ color: 'var(--danger)' }}>🚨 Items Needing Immediate Attention</div>
              <div className="fsp-card-subtitle">{criticalItems.length} item{criticalItems.length !== 1 ? 's' : ''} critical or high urgency</div>
            </div>
          </div>
          <div className="fsp-card-body" style={{ padding: '0 0 4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, padding: '4px 20px 16px' }}>
              {criticalItems.map((item) => {
                const conf = URGENCY_CONFIG[item.urgency];
                return (
                  <div key={item.id} style={{ padding: '14px', borderRadius: 10, background: conf.bg, border: `1px solid ${conf.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{item.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{item.category} · {item.id}</div>
                      </div>
                      <span style={{ fontSize: 18, fontWeight: 800, color: conf.color }}>{item.currentStock === 0 ? '⚠️' : `${item.daysRemaining}d`}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span>Stock: <strong>{item.currentStock} {item.unit}</strong></span>
                      <span>Usage: <strong>{item.dailyUsage} {item.unit}/day</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="fsp-card">
          <div className="fsp-card-header"><div><div className="fsp-card-title">Top Items by Daily Cost</div><div className="fsp-card-subtitle">Daily usage × unit cost</div></div></div>
          <div className="fsp-card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topConsumers} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v) => [`₹${v}`, 'Daily Cost']} />
                <Bar dataKey="dailyCost" fill="#4F46E5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="fsp-card">
          <div className="fsp-card-header"><div><div className="fsp-card-title">Top Items by Daily Volume</div><div className="fsp-card-subtitle">Units consumed per day</div></div></div>
          <div className="fsp-card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topConsumers} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v, _, p) => [`${v} ${p.payload.unit}`, 'Daily Usage']} />
                <Bar dataKey="dailyUsage" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Usage & Stock Summary Table */}
      <div className="fsp-card">
        <div className="fsp-card-header">
          <div>
            <div className="fsp-card-title">All Items — Usage & Stock Summary</div>
            <div className="fsp-card-subtitle">Sorted by days remaining</div>
          </div>
        </div>
        <div className="fsp-table-wrap">
          <table className="fsp-table">
            <thead>
              <tr><th>Item</th><th>Daily Usage</th><th>Weekly</th><th>Monthly</th><th>Stock Left</th><th>Days Left</th><th>Daily Cost</th><th>Urgency</th></tr>
            </thead>
            <tbody>
              {[...items].sort((a, b) => a.daysRemaining - b.daysRemaining).map((row) => {
                const conf = URGENCY_CONFIG[row.urgency];
                const dc = row.daysRemaining <= 3 ? 'var(--danger)' : row.daysRemaining <= 7 ? 'var(--warning)' : row.daysRemaining <= 14 ? 'var(--info)' : 'var(--success)';
                return (
                  <tr key={row.id}>
                    <td><div style={{ fontWeight: 600 }}>{row.name}</div><div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{row.category}</div></td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.dailyUsage} {row.unit}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{row.weeklyUsage} {row.unit}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{row.monthlyUsage} {row.unit}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{row.currentStock} {row.unit}</div>
                    </td>
                    <td><span style={{ fontSize: 16, fontWeight: 800, color: dc }}>{row.currentStock === 0 ? '—' : row.daysRemaining >= 999 ? '∞' : `${row.daysRemaining}d`}</span></td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(row.dailyUsage * row.unitCost)}</td>
                    <td>
                      <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: conf.bg, color: conf.color, border: `1px solid ${conf.border}` }}>
                        {conf.icon} {row.urgency.charAt(0).toUpperCase() + row.urgency.slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
