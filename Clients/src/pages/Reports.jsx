import './Reports.css';
import React, { useState, useEffect, useMemo } from 'react';
import {
  MdFileDownload, MdClose, MdSearch, MdRefresh,
  MdOpenInNew, MdInventory2, MdDeleteSweep,
  MdShoppingCart, MdPeople,
} from 'react-icons/md';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';
import api from '../services/api';

/* ── Helpers ──────────────────────────────────────────────── */
function downloadCSV(filename, headers, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const fmt    = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtN   = (n) => Number(n || 0).toLocaleString('en-IN');
const today  = () => new Date().toISOString().split('T')[0];
const COLORS = ['#4F46E5','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#EC4899','#14B8A6','#F97316'];

const STOCK_STATUS = {
  'In Stock':    { color: '#10B981', bg: '#ECFDF5' },
  'Low Stock':   { color: '#F59E0B', bg: '#FFFBEB' },
  'Out of Stock':{ color: '#EF4444', bg: '#FEF2F2' },
};
const PO_STATUS = {
  Draft:       { color: '#64748B', bg: '#F1F5F9' },
  Approved:    { color: '#3B82F6', bg: '#EFF6FF' },
  Processing:  { color: '#8B5CF6', bg: '#F5F3FF' },
  'In Transit':{ color: '#F59E0B', bg: '#FFFBEB' },
  Delivered:   { color: '#10B981', bg: '#ECFDF5' },
  Cancelled:   { color: '#EF4444', bg: '#FEF2F2' },
};
const PAY_STATUS = {
  Paid:    { color: '#10B981', bg: '#ECFDF5' },
  Unpaid:  { color: '#EF4444', bg: '#FEF2F2' },
  Partial: { color: '#F59E0B', bg: '#FFFBEB' },
};

/* ── Small components ─────────────────────────────────────── */
const Spinner = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 0', gap:12, color:'#94A3B8' }}>
    <div style={{ width:28, height:28, border:'3px solid #E2E8F0', borderTopColor:'#4F46E5', borderRadius:'50%', animation:'rep-spin 0.7s linear infinite' }} />
    Loading report data…
  </div>
);

const KPI = ({ label, value, sub, color = '#4F46E5' }) => (
  <div style={{ flex:1, minWidth:110, padding:'14px 16px', borderRadius:12, background:'#F8FAFF', border:'1px solid #E2E8F0' }}>
    <div style={{ fontSize:10.5, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>{label}</div>
    <div style={{ fontSize:20, fontWeight:800, color, lineHeight:1.2 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:'#94A3B8', marginTop:3 }}>{sub}</div>}
  </div>
);

const Badge = ({ label, map }) => {
  const cfg = map?.[label] || { color:'#64748B', bg:'#F1F5F9' };
  return (
    <span style={{ padding:'2px 9px', borderRadius:20, fontSize:11.5, fontWeight:700, color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.color}33`, whiteSpace:'nowrap' }}>
      {label}
    </span>
  );
};

const Stars = ({ rating }) => {
  const r = Math.round(Number(rating) * 2) / 2;
  return (
    <span style={{ color:'#F59E0B', fontSize:13, letterSpacing:1 }}>
      {[1,2,3,4,5].map((n) => (
        <span key={n} style={{ opacity: n <= r ? 1 : 0.25 }}>★</span>
      ))}
      <span style={{ fontSize:11.5, color:'#94A3B8', marginLeft:4 }}>{Number(rating).toFixed(1)}</span>
    </span>
  );
};

/* ── Report Modal wrapper ─────────────────────────────────── */
const ReportModal = ({ title, icon, color, bg, kpis, search, onSearch, onDownload, onClose, children }) => (
  <>
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:400 }} onClick={onClose} />
    <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'min(1080px,97vw)', maxHeight:'92vh', background:'#fff', borderRadius:16, overflow:'hidden', display:'flex', flexDirection:'column', zIndex:401, boxShadow:'0 24px 80px rgba(0,0,0,0.3)', fontFamily:"'Inter',sans-serif" }}>

      {/* Header */}
      <div style={{ background:'#1E1B4B', padding:'16px 24px', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{icon}</div>
        <div style={{ flex:1 }}>
          <div style={{ color:'#fff', fontWeight:800, fontSize:15 }}>{title}</div>
          <div style={{ color:'rgba(199,210,254,0.6)', fontSize:11.5 }}>Live data from all sources · Generated {today()}</div>
        </div>
        <button onClick={onDownload} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#fff', fontSize:12.5, fontWeight:700, cursor:'pointer' }}>
          <MdFileDownload style={{ fontSize:16 }} /> Download CSV
        </button>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', fontSize:20, marginLeft:4 }}>
          <MdClose />
        </button>
      </div>

      {/* KPI strip */}
      {kpis && (
        <div style={{ display:'flex', gap:12, padding:'14px 24px', borderBottom:'1px solid #F1F5F9', background:'#FAFBFF', flexShrink:0, flexWrap:'wrap' }}>
          {kpis.map((k) => <KPI key={k.label} {...k} />)}
        </div>
      )}

      {/* Search */}
      {onSearch && (
        <div style={{ padding:'10px 24px', borderBottom:'1px solid #F1F5F9', background:'#FAFBFF', flexShrink:0 }}>
          <div style={{ position:'relative', maxWidth:320 }}>
            <MdSearch style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94A3B8', fontSize:18 }} />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Filter rows…"
              style={{ width:'100%', padding:'7px 10px 7px 34px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, outline:'none', background:'#fff', boxSizing:'border-box' }}
            />
          </div>
        </div>
      )}

      {/* Scrollable body */}
      <div style={{ flex:1, overflowY:'auto' }}>{children}</div>
    </div>
    <style>{`@keyframes rep-spin { to { transform:rotate(360deg); } }`}</style>
  </>
);

/* ── Table helper ─────────────────────────────────────────── */
const RTable = ({ headers, rows, footer }) => (
  <div style={{ overflowX:'auto' }}>
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
      <thead>
        <tr style={{ background:'#F8FAFF' }}>
          {headers.map((h) => (
            <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.4px', borderBottom:'1px solid #E2E8F0', whiteSpace:'nowrap' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={headers.length} style={{ padding:'40px 20px', textAlign:'center', color:'#94A3B8', fontStyle:'italic' }}>No data found</td></tr>
        ) : rows.map((row, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFF', borderBottom:'1px solid #F1F5F9' }}>{row}</tr>
        ))}
      </tbody>
      {footer && (
        <tfoot>
          <tr style={{ background:'#EEF2FF', fontWeight:700 }}>{footer}</tr>
        </tfoot>
      )}
    </table>
  </div>
);

const td = (content, extra = {}) => (
  <td style={{ padding:'9px 14px', ...extra }}>{content}</td>
);

/* ════════════════════════════════════════════════════════════
   MAIN REPORTS COMPONENT
   ════════════════════════════════════════════════════════════ */
const Reports = () => {
  /* ── Raw data state ── */
  const [inventory,  setInventory]  = useState([]);
  const [wastage,    setWastage]    = useState([]);
  const [orders,     setOrders]     = useState([]);
  const [suppliers,  setSuppliers]  = useState([]);
  const [stockUsed,  setStockUsed]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeRpt,  setActiveRpt]  = useState(null);
  const [search,     setSearch]     = useState('');

  /* ── Fetch all data ── */
  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/inventory'),
      api.get('/wastage'),
      api.get('/purchase-orders'),
      api.get('/suppliers'),
      api.get('/stock-used'),
    ]).then(([inv, was, po, sup, su]) => {
      setInventory(inv  || []);
      setWastage(was    || []);
      setOrders(po      || []);
      setSuppliers(sup  || []);
      setStockUsed(Object.values(su || {}).flat());
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, []);

  const openRpt = (key) => { setActiveRpt(key); setSearch(''); };
  const closeRpt = () => setActiveRpt(null);

  /* ════════════════════════════════════════════════════════
     DERIVED DATA
     ════════════════════════════════════════════════════════ */

  /* ── 1. Enriched Inventory ── */
  const enrichedInv = useMemo(() => inventory.map((item) => {
    const inRec   = (item.stockRecords || []).filter((r) => r.direction !== 'out');
    const lastIn  = [...inRec].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
    const unitCost = lastIn?.rate || 0;
    const status  = item.currentStock === 0 ? 'Out of Stock' : item.currentStock <= 5 ? 'Low Stock' : 'In Stock';
    const daysSince = lastIn?.date ? Math.floor((Date.now() - new Date(lastIn.date).getTime()) / 86400000) : null;
    return { ...item, unitCost, totalValue: item.currentStock * unitCost, status, lastRestocked: lastIn?.date || '—', restockCount: inRec.length, daysSince };
  }), [inventory]);

  /* ── 2. Wastage aggregations ── */
  const wastageByMonth = useMemo(() => {
    const map = {};
    wastage.forEach((w) => {
      const m = (w.date || '').slice(0, 7);
      if (!m) return;
      if (!map[m]) map[m] = { month: m, cost: 0, qty: 0, count: 0 };
      map[m].cost  += Number(w.costImpact || 0);
      map[m].qty   += Number(w.qty || 0);
      map[m].count++;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-12)
      .map((d) => ({ ...d, month: d.month.replace('-', '/') }));
  }, [wastage]);

  const wastageByCategory = useMemo(() => {
    const map = {};
    wastage.forEach((w) => {
      const c = w.category || 'Uncategorised';
      if (!map[c]) map[c] = { category: c, cost: 0, qty: 0, count: 0 };
      map[c].cost  += Number(w.costImpact || 0);
      map[c].qty   += Number(w.qty || 0);
      map[c].count++;
    });
    return Object.values(map).sort((a, b) => b.cost - a.cost);
  }, [wastage]);

  /* ── 3. PO aggregations ── */
  const poByStatus = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const s = o.status || 'Draft';
      if (!map[s]) map[s] = { status: s, count: 0, value: 0 };
      map[s].count++; map[s].value += Number(o.totalValue || 0);
    });
    return Object.values(map);
  }, [orders]);

  /* ── 4. Valuation by category ── */
  const valuationByCategory = useMemo(() => {
    const map = {};
    enrichedInv.forEach((item) => {
      const c = item.category || 'Uncategorised';
      if (!map[c]) map[c] = { category: c, items: 0, value: 0 };
      map[c].items++;
      map[c].value += item.totalValue;
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [enrichedInv]);

  /* ── Top-level KPIs ── */
  const totalInvValue  = enrichedInv.reduce((s, i) => s + i.totalValue, 0);
  const totalWasteCost = wastage.reduce((s, w) => s + Number(w.costImpact || 0), 0);
  const openOrders     = orders.filter((o) => !['Delivered','Cancelled'].includes(o.status)).length;
  const activeSuppliers = suppliers.filter((s) => s.status === 'Active').length;

  /* ── Filtered rows per report ── */
  const q = search.toLowerCase();

  const filteredStock = enrichedInv.filter((i) =>
    !q || i.name?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q) || i.supplier?.toLowerCase().includes(q)
  );

  const filteredWastage = wastage.filter((w) =>
    !q || w.item?.toLowerCase().includes(q) || w.category?.toLowerCase().includes(q) || w.reason?.toLowerCase().includes(q)
  );

  const filteredOrders = orders.filter((o) =>
    !q || o.id?.toLowerCase().includes(q) || o.supplier?.toLowerCase().includes(q) || o.status?.toLowerCase().includes(q)
  );

  const filteredSuppliers = suppliers.filter((s) =>
    !q || s.name?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q)
  );

  const filteredValuation = enrichedInv.filter((i) =>
    !q || i.name?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q)
  );

  const filteredMovement = enrichedInv.filter((i) =>
    !q || i.name?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q) || i.status?.toLowerCase().includes(q)
  );

  /* ── CSV exports ── */
  const csvStock = () => downloadCSV(
    `stock-summary-${today()}.csv`,
    ['#','Item Name','Category','Unit','Current Stock','Status','Supplier'],
    filteredStock.map((i, n) => [n+1, i.name, i.category, i.unit, i.currentStock, i.status, i.supplier || ''])
  );

  const csvWastage = () => downloadCSV(
    `wastage-analysis-${today()}.csv`,
    ['#','Date','Item','Category','Qty','Unit','Reason','Cost Impact (₹)','Logged By','Notes'],
    filteredWastage.map((w, n) => [n+1, w.date, w.item, w.category, w.qty, w.unit, w.reason, w.costImpact, w.loggedBy, w.notes || ''])
  );

  const csvOrders = () => downloadCSV(
    `purchase-orders-${today()}.csv`,
    ['#','PO ID','Supplier','Date','Delivery Date','Items','Total Value (₹)','Status','Payment'],
    filteredOrders.map((o, n) => [n+1, o.id, o.supplier, o.date, o.deliveryDate || '', o.items, o.totalValue, o.status, o.paymentStatus])
  );

  const csvSuppliers = () => downloadCSV(
    `supplier-performance-${today()}.csv`,
    ['#','Supplier','Category','City','Rating','Total Orders','Total Spend (₹)','Status','Payment Terms'],
    filteredSuppliers.map((s, n) => [n+1, s.name, s.category, s.city, s.rating, s.totalOrders, s.totalSpend, s.status, s.paymentTerms])
  );

  const csvValuation = () => downloadCSV(
    `inventory-valuation-${today()}.csv`,
    ['#','Item','Category','Current Stock','Unit','Unit Cost (₹)','Total Value (₹)','Supplier'],
    filteredValuation.map((i, n) => [n+1, i.name, i.category, i.currentStock, i.unit, i.unitCost.toFixed(2), i.totalValue.toFixed(2), i.supplier || ''])
  );

  const csvMovement = () => downloadCSV(
    `stock-activity-${today()}.csv`,
    ['#','Item','Category','Current Stock','Unit','Status','Last Restocked','Days Since Restock','Times Restocked','Supplier'],
    filteredMovement.map((i, n) => [n+1, i.name, i.category, i.currentStock, i.unit, i.status, i.lastRestocked, i.daysSince ?? 'Never', i.restockCount, i.supplier || ''])
  );

  const exportAll = () => {
    csvStock(); setTimeout(csvWastage, 200); setTimeout(csvOrders, 400);
    setTimeout(csvSuppliers, 600); setTimeout(csvValuation, 800); setTimeout(csvMovement, 1000);
  };

  /* ── Report card definitions ── */
  const reportCards = [
    { key:'stock',     title:'Stock Summary Report',   desc:'Current levels, low stock & out-of-stock items',   icon:'📦', color:'#4F46E5', bg:'#EEF2FF' },
    { key:'wastage',   title:'Wastage Analysis',       desc:'Monthly wastage by reason, category & cost',       icon:'🗑️', color:'#EF4444', bg:'#FEF2F2' },
    { key:'po',        title:'Purchase Order Report',  desc:'PO history, spend analysis & delivery rates',      icon:'🛒', color:'#3B82F6', bg:'#EFF6FF' },
    { key:'supplier',  title:'Supplier Performance',   desc:'Ratings, on-time delivery & spend by supplier',    icon:'🏭', color:'#10B981', bg:'#ECFDF5' },
    { key:'movement',  title:'Stock Activity Report',  desc:'Last restock dates, movement history & health',    icon:'📅', color:'#F59E0B', bg:'#FFFBEB' },
    { key:'valuation', title:'Inventory Valuation',    desc:'Total value by category, stock cost & unit rates', icon:'💰', color:'#8B5CF6', bg:'#F5F3FF' },
  ];

  /* ═══════════════════════════════════════════════════════ */
  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reports &amp; Analytics</h1>
          <p>Live data reports — click any card to view details and download CSV</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-secondary-fsp" onClick={fetchAll} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <MdRefresh style={{ fontSize:17 }} /> Refresh
          </button>
          <button className="btn-primary-fsp" onClick={exportAll} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <MdFileDownload style={{ fontSize:17 }} /> Export All
          </button>
        </div>
      </div>

      {/* Top-level KPI strip */}
      <div className="reports-kpi-strip" style={{ marginBottom:20 }}>
        {[
          { label:'Total Inventory Value', value: loading ? '…' : fmt(totalInvValue),  color:'#4F46E5', icon:<MdInventory2 /> },
          { label:'Total Wastage Cost',    value: loading ? '…' : fmt(totalWasteCost), color:'#EF4444', icon:<MdDeleteSweep /> },
          { label:'Open Purchase Orders',  value: loading ? '…' : openOrders,          color:'#3B82F6', icon:<MdShoppingCart /> },
          { label:'Active Suppliers',      value: loading ? '…' : activeSuppliers,     color:'#10B981', icon:<MdPeople /> },
        ].map((k) => (
          <div key={k.label} className="fsp-card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ fontSize:28, color:k.color, opacity:0.8 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize:10.5, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>{k.label}</div>
              <div style={{ fontSize:20, fontWeight:800, color:k.color }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Report Cards grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:16, marginBottom:24 }}>
        {reportCards.map((r) => (
          <div key={r.key} className="fsp-card" style={{ padding:20, cursor:'pointer', transition:'var(--transition)' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=''; }}
          >
            <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{ width:46, height:46, borderRadius:12, background:r.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{r.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)', marginBottom:4 }}>{r.title}</div>
                <div style={{ fontSize:12.5, color:'var(--text-muted)', lineHeight:1.4 }}>{r.desc}</div>
              </div>
              <MdOpenInNew style={{ color:'var(--text-muted)', marginTop:2, flexShrink:0 }} />
            </div>
            <div style={{ marginTop:16, display:'flex', gap:8 }}>
              <button
                className="btn-secondary-fsp"
                style={{ flex:1, padding:'7px 12px', fontSize:12.5, justifyContent:'center' }}
                onClick={() => openRpt(r.key)}
              >
                View Report
              </button>
              <button
                className="btn-icon-sm"
                title="Download CSV"
                onClick={() => { openRpt(r.key); }}
              >
                <MdFileDownload />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Overview Charts (real data) */}
      <div className="reports-charts-grid">
        <div className="fsp-card">
          <div className="reports-chart-card-header">
            <div>
              <div className="reports-chart-title">Wastage Cost — Monthly Trend</div>
              <div className="reports-chart-sub">
                {loading ? 'Loading…' : `${wastageByMonth.length} months · Total ${fmt(totalWasteCost)}`}
              </div>
            </div>
          </div>
          <div className="reports-chart-body">
            {loading ? <Spinner /> : wastageByMonth.length === 0 ? (
              <div style={{ textAlign:'center', color:'#94A3B8', padding:'40px 0', fontSize:13 }}>No wastage data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={wastageByMonth} margin={{ top:4, right:8, left:-12, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="month" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(v) => [fmt(v), 'Wastage Cost']} />
                  <Line type="monotone" dataKey="cost" stroke="#EF4444" strokeWidth={2.5} dot={{ r:4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="fsp-card">
          <div className="reports-chart-card-header">
            <div>
              <div className="reports-chart-title">Purchase Order Status</div>
              <div className="reports-chart-sub">
                {loading ? 'Loading…' : `${orders.length} total POs · ${fmt(orders.reduce((s,o)=>s+Number(o.totalValue||0),0))} spend`}
              </div>
            </div>
          </div>
          <div className="reports-chart-body">
            {loading ? <Spinner /> : poByStatus.length === 0 ? (
              <div style={{ textAlign:'center', color:'#94A3B8', padding:'40px 0', fontSize:13 }}>No purchase order data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={poByStatus} margin={{ top:4, right:8, left:-12, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="status" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:11 }} />
                  <Tooltip formatter={(v, n) => [n === 'value' ? fmt(v) : v, n === 'value' ? 'Spend' : 'Orders']} />
                  <Legend />
                  <Bar dataKey="count" fill="#3B82F6" name="Orders" radius={[4,4,0,0]}>
                    {poByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="fsp-card">
          <div className="reports-chart-card-header">
            <div>
              <div className="reports-chart-title">Wastage by Category</div>
              <div className="reports-chart-sub">Cost impact per category</div>
            </div>
          </div>
          <div className="reports-chart-body">
            {loading ? <Spinner /> : wastageByCategory.length === 0 ? (
              <div style={{ textAlign:'center', color:'#94A3B8', padding:'40px 0', fontSize:13 }}>No wastage data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={wastageByCategory.slice(0,8)} margin={{ top:4, right:8, left:-12, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="category" tick={{ fontSize:10 }} />
                  <YAxis tick={{ fontSize:11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(v) => [fmt(v), 'Cost']} />
                  <Bar dataKey="cost" fill="#F59E0B" radius={[4,4,0,0]}>
                    {wastageByCategory.slice(0,8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="fsp-card">
          <div className="reports-chart-card-header">
            <div>
              <div className="reports-chart-title">Inventory Valuation by Category</div>
              <div className="reports-chart-sub">{loading ? 'Loading…' : `Total: ${fmt(totalInvValue)}`}</div>
            </div>
          </div>
          <div className="reports-chart-body">
            {loading ? <Spinner /> : valuationByCategory.length === 0 ? (
              <div style={{ textAlign:'center', color:'#94A3B8', padding:'40px 0', fontSize:13 }}>No inventory data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={valuationByCategory.slice(0,8)} margin={{ top:4, right:8, left:-12, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="category" tick={{ fontSize:10 }} />
                  <YAxis tick={{ fontSize:11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(v) => [fmt(v), 'Value']} />
                  <Bar dataKey="value" fill="#8B5CF6" radius={[4,4,0,0]}>
                    {valuationByCategory.slice(0,8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          REPORT MODALS
          ════════════════════════════════════════════════════ */}

      {/* 1. STOCK SUMMARY */}
      {activeRpt === 'stock' && (
        <ReportModal
          title="Stock Summary Report" icon="📦" color="#4F46E5" bg="#EEF2FF"
          kpis={[
            { label:'Total Items',    value: enrichedInv.length, color:'#4F46E5' },
            { label:'In Stock',       value: enrichedInv.filter(i=>i.status==='In Stock').length,    color:'#10B981' },
            { label:'Low Stock',      value: enrichedInv.filter(i=>i.status==='Low Stock').length,   color:'#F59E0B', sub:'≤5 units' },
            { label:'Out of Stock',   value: enrichedInv.filter(i=>i.status==='Out of Stock').length, color:'#EF4444' },
          ]}
          search={search} onSearch={setSearch}
          onDownload={csvStock} onClose={closeRpt}
        >
          {loading ? <Spinner /> : (
            <>
              <RTable
                headers={['#','Item Name','Category','Unit','Current Stock','Status','Supplier']}
                rows={filteredStock.map((item, i) => [
                  td(i+1, { color:'#94A3B8', fontSize:12 }),
                  td(<span style={{ fontWeight:700 }}>{item.name}</span>),
                  td(<span style={{ padding:'2px 8px', borderRadius:20, fontSize:11.5, background:'#F1F5F9', color:'#475569', fontWeight:600 }}>{item.category}</span>),
                  td(item.unit, { color:'#64748B' }),
                  td(<span style={{ fontWeight:800, color: item.currentStock===0?'#EF4444':item.currentStock<=5?'#F59E0B':'#10B981', fontSize:14 }}>{fmtN(item.currentStock)}</span>),
                  td(<Badge label={item.status} map={STOCK_STATUS} />),
                  td(item.supplier || <span style={{color:'#94A3B8',fontStyle:'italic'}}>—</span>),
                ])}
              />
              <div style={{ padding:'12px 20px', borderTop:'1px solid #F1F5F9', fontSize:12.5, color:'#94A3B8' }}>
                {filteredStock.length} items · {filteredStock.filter(i=>i.status==='Out of Stock').length} out of stock · {filteredStock.filter(i=>i.status==='Low Stock').length} low stock
              </div>
            </>
          )}
        </ReportModal>
      )}

      {/* 2. WASTAGE ANALYSIS */}
      {activeRpt === 'wastage' && (
        <ReportModal
          title="Wastage Analysis" icon="🗑️" color="#EF4444" bg="#FEF2F2"
          kpis={[
            { label:'Total Entries',   value: wastage.length,                                                    color:'#EF4444' },
            { label:'Total Qty Lost',  value: `${fmtN(wastage.reduce((s,w)=>s+Number(w.qty||0),0))} units`,    color:'#F59E0B' },
            { label:'Total Cost',      value: fmt(totalWasteCost),                                               color:'#DC2626' },
            { label:'Top Category',    value: wastageByCategory[0]?.category || '—',                            color:'#64748B', sub: wastageByCategory[0] ? fmt(wastageByCategory[0].cost) : '' },
          ]}
          search={search} onSearch={setSearch}
          onDownload={csvWastage} onClose={closeRpt}
        >
          {loading ? <Spinner /> : (
            <>
              {/* Category chart */}
              {wastageByCategory.length > 0 && (
                <div style={{ padding:'16px 20px', borderBottom:'1px solid #F1F5F9' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', marginBottom:10 }}>Cost Impact by Category</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={wastageByCategory.slice(0,10)} margin={{ top:4, right:8, left:-12, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                      <XAxis dataKey="category" tick={{ fontSize:10 }} />
                      <YAxis tick={{ fontSize:11 }} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip formatter={(v) => [fmt(v), 'Cost']} />
                      <Bar dataKey="cost" fill="#EF4444" radius={[4,4,0,0]}>
                        {wastageByCategory.slice(0,10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <RTable
                headers={['#','Date','Item','Category','Qty','Unit','Reason','Cost Impact','Logged By']}
                rows={filteredWastage.sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map((w, i) => [
                  td(i+1, { color:'#94A3B8', fontSize:12 }),
                  td(w.date, { fontSize:12.5, color:'#64748B', whiteSpace:'nowrap' }),
                  td(<span style={{ fontWeight:700 }}>{w.item}</span>),
                  td(<span style={{ padding:'2px 8px', borderRadius:20, fontSize:11.5, background:'#F1F5F9', color:'#475569', fontWeight:600 }}>{w.category || '—'}</span>),
                  td(<span style={{ fontWeight:700, color:'#EF4444' }}>{w.qty}</span>),
                  td(w.unit, { color:'#94A3B8', fontSize:12 }),
                  td(w.reason),
                  td(<span style={{ fontWeight:700, color:'#DC2626' }}>{fmt(w.costImpact)}</span>),
                  td(w.loggedBy || '—', { fontSize:12, color:'#64748B' }),
                ])}
                footer={[
                  <td key="f1" colSpan={6} style={{ padding:'9px 14px', color:'#475569', fontSize:13 }}>{filteredWastage.length} entries</td>,
                  <td key="f2" style={{ padding:'9px 14px', color:'#DC2626', fontSize:13, fontWeight:800 }}>
                    {fmt(filteredWastage.reduce((s,w)=>s+Number(w.costImpact||0),0))}
                  </td>,
                  <td key="f3" colSpan={2} />,
                ]}
              />
            </>
          )}
        </ReportModal>
      )}

      {/* 3. PURCHASE ORDER REPORT */}
      {activeRpt === 'po' && (
        <ReportModal
          title="Purchase Order Report" icon="🛒" color="#3B82F6" bg="#EFF6FF"
          kpis={[
            { label:'Total POs',     value: orders.length,                                                                                  color:'#3B82F6' },
            { label:'Total Spend',   value: fmt(orders.reduce((s,o)=>s+Number(o.totalValue||0),0)),                                        color:'#4F46E5' },
            { label:'Delivered',     value: orders.filter(o=>o.status==='Delivered').length,                                               color:'#10B981' },
            { label:'Pending/Open',  value: orders.filter(o=>!['Delivered','Cancelled'].includes(o.status)).length,                        color:'#F59E0B' },
          ]}
          search={search} onSearch={setSearch}
          onDownload={csvOrders} onClose={closeRpt}
        >
          {loading ? <Spinner /> : (
            <>
              {poByStatus.length > 0 && (
                <div style={{ padding:'16px 20px', borderBottom:'1px solid #F1F5F9' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', marginBottom:10 }}>Orders by Status</div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={poByStatus} margin={{ top:4, right:8, left:-12, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                      <XAxis dataKey="status" tick={{ fontSize:11 }} />
                      <YAxis tick={{ fontSize:11 }} />
                      <Tooltip formatter={(v, n) => [n==='value'?fmt(v):v, n==='value'?'Total Spend':'Count']} />
                      <Bar dataKey="count" fill="#3B82F6" name="count" radius={[4,4,0,0]}>
                        {poByStatus.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <RTable
                headers={['#','PO ID','Supplier','Order Date','Delivery Date','Items','Total Value','Status','Payment']}
                rows={filteredOrders.sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map((o, i) => [
                  td(i+1, { color:'#94A3B8', fontSize:12 }),
                  td(<span style={{ fontFamily:'monospace', fontSize:12, color:'#4F46E5' }}>{o.id}</span>),
                  td(<span style={{ fontWeight:700 }}>{o.supplier}</span>),
                  td(o.date, { fontSize:12.5, color:'#64748B', whiteSpace:'nowrap' }),
                  td(o.deliveryDate || <span style={{color:'#94A3B8',fontStyle:'italic'}}>Not set</span>, { fontSize:12.5, color:'#64748B', whiteSpace:'nowrap' }),
                  td(o.items, { textAlign:'center', fontWeight:700, color:'#4F46E5' }),
                  td(<span style={{ fontWeight:700, color:'#10B981' }}>{fmt(o.totalValue)}</span>),
                  td(<Badge label={o.status || 'Draft'} map={PO_STATUS} />),
                  td(<Badge label={o.paymentStatus || 'Unpaid'} map={PAY_STATUS} />),
                ])}
                footer={[
                  <td key="f1" colSpan={5} style={{ padding:'9px 14px', color:'#475569', fontSize:13 }}>{filteredOrders.length} orders</td>,
                  <td key="f2" style={{ padding:'9px 14px', color:'#10B981', fontSize:13, fontWeight:800 }}>
                    {fmt(filteredOrders.reduce((s,o)=>s+Number(o.totalValue||0),0))}
                  </td>,
                  <td key="f3" colSpan={3} />,
                ]}
              />
            </>
          )}
        </ReportModal>
      )}

      {/* 4. SUPPLIER PERFORMANCE */}
      {activeRpt === 'supplier' && (
        <ReportModal
          title="Supplier Performance" icon="🏭" color="#10B981" bg="#ECFDF5"
          kpis={[
            { label:'Total Suppliers', value: suppliers.length,                                                                          color:'#10B981' },
            { label:'Active',          value: suppliers.filter(s=>s.status==='Active').length,                                          color:'#10B981' },
            { label:'Avg Rating',      value: suppliers.length ? (suppliers.reduce((s,sup)=>s+Number(sup.rating||0),0)/suppliers.length).toFixed(1)+'★' : '—', color:'#F59E0B' },
            { label:'Total Spend',     value: fmt(suppliers.reduce((s,sup)=>s+Number(sup.totalSpend||0),0)),                           color:'#4F46E5' },
          ]}
          search={search} onSearch={setSearch}
          onDownload={csvSuppliers} onClose={closeRpt}
        >
          {loading ? <Spinner /> : (
            <>
              <RTable
                headers={['#','Supplier','Category','City / Country','Rating','Orders','Total Spend','Status','Payment Terms']}
                rows={[...filteredSuppliers].sort((a,b)=>Number(b.totalSpend||0)-Number(a.totalSpend||0)).map((s, i) => [
                  td(i+1, { color:'#94A3B8', fontSize:12 }),
                  td(
                    <div>
                      <div style={{ fontWeight:700 }}>{s.name}</div>
                      {s.email && <div style={{ fontSize:11.5, color:'#94A3B8' }}>{s.email}</div>}
                    </div>
                  ),
                  td(<span style={{ padding:'2px 8px', borderRadius:20, fontSize:11.5, background:'#F1F5F9', color:'#475569', fontWeight:600 }}>{s.category || '—'}</span>),
                  td(<span style={{ fontSize:12.5, color:'#64748B' }}>{[s.city, s.country].filter(Boolean).join(', ') || '—'}</span>),
                  td(<Stars rating={s.rating || 0} />),
                  td(<span style={{ fontWeight:700, color:'#4F46E5' }}>{fmtN(s.totalOrders)}</span>, { textAlign:'center' }),
                  td(<span style={{ fontWeight:700, color:'#10B981' }}>{fmt(s.totalSpend)}</span>),
                  td(<Badge label={s.status || 'Active'} map={{ Active:{ color:'#10B981', bg:'#ECFDF5' }, Inactive:{ color:'#EF4444', bg:'#FEF2F2' } }} />),
                  td(<span style={{ fontSize:12, color:'#64748B' }}>{s.paymentTerms || '—'}</span>),
                ])}
              />
              <div style={{ padding:'12px 20px', borderTop:'1px solid #F1F5F9', fontSize:12.5, color:'#94A3B8' }}>
                {filteredSuppliers.length} suppliers · Total spend: {fmt(filteredSuppliers.reduce((s,sup)=>s+Number(sup.totalSpend||0),0))}
              </div>
            </>
          )}
        </ReportModal>
      )}

      {/* 5. STOCK ACTIVITY */}
      {activeRpt === 'movement' && (
        <ReportModal
          title="Stock Activity Report" icon="📅" color="#F59E0B" bg="#FFFBEB"
          kpis={[
            { label:'Total Items',      value: enrichedInv.length,                                        color:'#F59E0B' },
            { label:'Never Restocked',  value: enrichedInv.filter(i=>i.restockCount===0).length,          color:'#EF4444' },
            { label:'Out of Stock',     value: enrichedInv.filter(i=>i.status==='Out of Stock').length,   color:'#EF4444' },
            { label:'Restocked > 30d',  value: enrichedInv.filter(i=>i.daysSince!==null&&i.daysSince>30).length, color:'#64748B', sub:'days since restock' },
          ]}
          search={search} onSearch={setSearch}
          onDownload={csvMovement} onClose={closeRpt}
        >
          {loading ? <Spinner /> : (
            <>
              <RTable
                headers={['#','Item','Category','Stock','Unit','Status','Last Restocked','Days Since','Restock Count','Supplier']}
                rows={[...filteredMovement].sort((a,b)=>(a.daysSince??9999)-(b.daysSince??9999)).reverse().map((item, i) => [
                  td(i+1, { color:'#94A3B8', fontSize:12 }),
                  td(<span style={{ fontWeight:700 }}>{item.name}</span>),
                  td(<span style={{ padding:'2px 8px', borderRadius:20, fontSize:11.5, background:'#F1F5F9', color:'#475569', fontWeight:600 }}>{item.category}</span>),
                  td(<span style={{ fontWeight:800, color: item.currentStock===0?'#EF4444':item.currentStock<=5?'#F59E0B':'#10B981', fontSize:14 }}>{fmtN(item.currentStock)}</span>),
                  td(item.unit, { color:'#94A3B8', fontSize:12 }),
                  td(<Badge label={item.status} map={STOCK_STATUS} />),
                  td(item.lastRestocked === '—' ? <span style={{color:'#94A3B8',fontStyle:'italic'}}>Never</span> : item.lastRestocked, { fontSize:12.5, color:'#64748B', whiteSpace:'nowrap' }),
                  td(
                    item.daysSince === null
                      ? <span style={{color:'#EF4444',fontWeight:700}}>Never</span>
                      : item.daysSince > 30
                        ? <span style={{color:'#F59E0B',fontWeight:700}}>{item.daysSince}d ago</span>
                        : <span style={{color:'#10B981',fontWeight:700}}>{item.daysSince}d ago</span>
                  ),
                  td(<span style={{ fontWeight:700, color:'#4F46E5' }}>{item.restockCount}</span>, { textAlign:'center' }),
                  td(item.supplier || <span style={{color:'#94A3B8',fontStyle:'italic'}}>—</span>),
                ])}
              />
              <div style={{ padding:'12px 20px', borderTop:'1px solid #F1F5F9', fontSize:12.5, color:'#94A3B8' }}>
                {filteredMovement.length} items · {filteredMovement.filter(i=>i.restockCount===0).length} never restocked · {filteredMovement.filter(i=>i.daysSince!==null&&i.daysSince>30).length} stale ({'>'}30 days)
              </div>
            </>
          )}
        </ReportModal>
      )}

      {/* 6. INVENTORY VALUATION */}
      {activeRpt === 'valuation' && (
        <ReportModal
          title="Inventory Valuation" icon="💰" color="#8B5CF6" bg="#F5F3FF"
          kpis={[
            { label:'Total Items',     value: enrichedInv.length,                                                                             color:'#8B5CF6' },
            { label:'Active Items',    value: enrichedInv.filter(i=>i.active!==false).length,                                                color:'#10B981' },
            { label:'Total Valuation', value: fmt(totalInvValue),                                                                            color:'#8B5CF6' },
            { label:'Avg Unit Cost',   value: enrichedInv.filter(i=>i.unitCost>0).length ? fmt(enrichedInv.filter(i=>i.unitCost>0).reduce((s,i)=>s+i.unitCost,0)/enrichedInv.filter(i=>i.unitCost>0).length) : '—', color:'#4F46E5' },
          ]}
          search={search} onSearch={setSearch}
          onDownload={csvValuation} onClose={closeRpt}
        >
          {loading ? <Spinner /> : (
            <>
              {valuationByCategory.length > 0 && (
                <div style={{ padding:'16px 20px', borderBottom:'1px solid #F1F5F9' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', marginBottom:10 }}>Valuation by Category</div>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={valuationByCategory.slice(0,10)} margin={{ top:4, right:8, left:-12, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                      <XAxis dataKey="category" tick={{ fontSize:10 }} />
                      <YAxis tick={{ fontSize:11 }} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip formatter={(v) => [fmt(v), 'Value']} />
                      <Bar dataKey="value" fill="#8B5CF6" radius={[4,4,0,0]}>
                        {valuationByCategory.slice(0,10).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <RTable
                headers={['#','Item Name','Category','Current Stock','Unit','Unit Cost','Total Value','Supplier']}
                rows={[...filteredValuation].sort((a,b)=>b.totalValue-a.totalValue).map((item, i) => [
                  td(i+1, { color:'#94A3B8', fontSize:12 }),
                  td(<span style={{ fontWeight:700 }}>{item.name}</span>),
                  td(<span style={{ padding:'2px 8px', borderRadius:20, fontSize:11.5, background:'#F1F5F9', color:'#475569', fontWeight:600 }}>{item.category}</span>),
                  td(<span style={{ fontWeight:800, color:'#4F46E5', fontSize:14 }}>{fmtN(item.currentStock)}</span>),
                  td(item.unit, { color:'#94A3B8', fontSize:12 }),
                  td(item.unitCost > 0 ? fmt(item.unitCost) : <span style={{color:'#94A3B8',fontStyle:'italic'}}>Not set</span>),
                  td(
                    item.totalValue > 0
                      ? <span style={{ fontWeight:800, color:'#8B5CF6', fontSize:14 }}>{fmt(item.totalValue)}</span>
                      : <span style={{ color:'#94A3B8' }}>—</span>
                  ),
                  td(item.supplier || <span style={{color:'#94A3B8',fontStyle:'italic'}}>—</span>),
                ])}
                footer={[
                  <td key="f1" colSpan={5} style={{ padding:'9px 14px', color:'#475569', fontSize:13 }}>{filteredValuation.length} items</td>,
                  <td key="f2" />,
                  <td key="f3" style={{ padding:'9px 14px', color:'#8B5CF6', fontSize:14, fontWeight:800 }}>
                    {fmt(filteredValuation.reduce((s,i)=>s+i.totalValue,0))}
                  </td>,
                  <td key="f4" />,
                ]}
              />
            </>
          )}
        </ReportModal>
      )}

      <style>{`@keyframes rep-spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
};

export default Reports;
