import './Reports.css';
import React from 'react';
import { MdBarChart, MdFileDownload, MdOpenInNew } from 'react-icons/md';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { monthlyWastageCost, stockTrendData, wastageByCategory, formatCurrency } from '../data/mockData';

const reportCards = [
  { title: 'Stock Summary Report',   desc: 'Current levels, low stock, overstocked items', icon: '📦', color: '#4F46E5', bg: '#EEF2FF' },
  { title: 'Wastage Analysis',       desc: 'Monthly wastage by reason, category & cost',   icon: '🗑️', color: '#EF4444', bg: '#FEF2F2' },
  { title: 'Purchase Order Report',  desc: 'PO history, spend analysis, delivery rates',   icon: '🛒', color: '#3B82F6', bg: '#EFF6FF' },
  { title: 'Supplier Performance',   desc: 'Ratings, on-time delivery, spend by supplier', icon: '🏭', color: '#10B981', bg: '#ECFDF5' },
  { title: 'Expiry Tracking Report', desc: 'Items expiring within 7, 14, 30 days',         icon: '📅', color: '#F59E0B', bg: '#FFFBEB' },
  { title: 'Inventory Valuation',    desc: 'Total value by category, location & date',     icon: '💰', color: '#8B5CF6', bg: '#F5F3FF' },
];

const Reports = () => (
  <div>
    <div className="page-header">
      <div className="page-header-left">
        <h1>Reports & Analytics</h1>
        <p>Generate and download detailed reports for your inventory operations</p>
      </div>
      <button className="btn-primary-fsp"><MdFileDownload /> Export All</button>
    </div>

    {/* Report Cards */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
      {reportCards.map((r) => (
        <div key={r.title} className="fsp-card" style={{ padding: '20px', cursor: 'pointer', transition: 'var(--transition)' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12,
              background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>
              {r.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{r.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>{r.desc}</div>
            </div>
            <MdOpenInNew style={{ color: 'var(--text-muted)', marginTop: 2 }} />
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button className="btn-secondary-fsp" style={{ flex: 1, padding: '7px 12px', fontSize: 12.5, justifyContent: 'center' }}>
              View Report
            </button>
            <button className="btn-icon-sm" title="Download">
              <MdFileDownload />
            </button>
          </div>
        </div>
      ))}
    </div>

    {/* Quick Insight Charts */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div className="fsp-card">
        <div className="fsp-card-header">
          <div>
            <div className="fsp-card-title">Wastage Cost — 6 Months</div>
            <div className="fsp-card-subtitle">Monthly food loss cost trend</div>
          </div>
        </div>
        <div className="fsp-card-body">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyWastageCost} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => [`$${v}`, 'Wastage Cost']} />
              <Line type="monotone" dataKey="cost" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="fsp-card">
        <div className="fsp-card-header">
          <div>
            <div className="fsp-card-title">Wastage by Category</div>
            <div className="fsp-card-subtitle">Total cost impact per category</div>
          </div>
        </div>
        <div className="fsp-card-body">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={wastageByCategory} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => [formatCurrency(v), 'Cost']} />
              <Bar dataKey="cost" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
);

export default Reports;
