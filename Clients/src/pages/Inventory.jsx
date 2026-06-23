import './Inventory.css';
import React, { useMemo, useState } from 'react';
import { useInventoryStock } from '../hooks/useInventoryStock';
import { getEnrichedItems, getStockStatus } from '../services/mockData';

const PAGE_SIZE = 24;

function paginate(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

const CATEGORY_COLORS = [
  '#4F46E5', '#0EA5E9', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6',
  '#F97316', '#6366F1',
];
const categoryColorMap = {};
let colorIdx = 0;
function getCategoryColor(cat) {
  if (!categoryColorMap[cat]) {
    categoryColorMap[cat] = CATEGORY_COLORS[colorIdx % CATEGORY_COLORS.length];
    colorIdx++;
  }
  return categoryColorMap[cat];
}

function getStockMeta(item) {
  if (item.currentStock === 0)
    return { label: 'Out of Stock', color: '#EF4444', bg: '#FEF2F2', pct: 0 };
  const status = getStockStatus(item.currentStock, item.minStock, item.maxStock);
  const pct = item.maxStock > 0
    ? Math.min(100, Math.round((item.currentStock / item.maxStock) * 100))
    : 100;
  if (status.label === 'Low Stock')
    return { label: 'Low Stock', color: '#F59E0B', bg: '#FFFBEB', pct };
  return { label: 'In Stock', color: '#10B981', bg: '#ECFDF5', pct };
}

const Inventory = () => {
  const { stockMap, loading } = useInventoryStock();
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  const items = useMemo(() =>
    getEnrichedItems().map((item) => ({
      ...item,
      currentStock: stockMap[item.id] ?? item.currentStock,
    })),
  [stockMap]);

  const summary = useMemo(() => {
    let inStock = 0, low = 0, out = 0, critical = 0;
    for (const i of items) {
      if (i.currentStock === 0)                                                               out++;
      else if (getStockStatus(i.currentStock, i.minStock, i.maxStock).label === 'Low Stock') low++;
      else                                                                                    inStock++;
      if (i.urgency === 'critical' || i.urgency === 'high') critical++;
    }
    return { total: items.length, inStock, low, out, critical };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...items]
      .filter((i) => !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  const summaryCards = [
    { label: 'Total Items',   val: summary.total,    color: 'var(--primary)', icon: '📦' },
    { label: 'In Stock',      val: summary.inStock,  color: '#10B981',        icon: '✅' },
    { label: 'Low Stock',     val: summary.low,      color: '#F59E0B',        icon: '⚠️' },
    { label: 'Out of Stock',  val: summary.out,      color: '#EF4444',        icon: '❌' },
    { label: 'Needs Reorder', val: summary.critical, color: '#EF4444',        icon: '🔄' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Inventory</h1>
          <p>Monitor stock levels across your inventory</p>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="inv-summary-strip">
        {summaryCards.map((s) => (
          <div key={s.label} className="inv-summary-card">
            <div className="inv-summary-icon">{s.icon}</div>
            <div>
              <div className="inv-summary-val" style={{ color: s.color }}>{s.val}</div>
              <div className="inv-summary-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* All Items Section */}
      <div className="fsp-card" style={{ padding: 0, overflow: 'hidden' }}>

        {/* Section Header */}
        <div className="inv-section-header">
          <div className="inv-section-header-left">
            <div className="inv-section-title">All Items</div>
            <div className="inv-section-sub">
              {filtered.length} items &nbsp;·&nbsp; sorted A–Z
              {search && <span className="inv-search-tag">"{search}"</span>}
            </div>
          </div>
          <div className="inv-search-wrap">
            <svg className="inv-search-icon" viewBox="0 0 20 20" fill="none">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search items or category…"
              value={search}
              onChange={handleSearch}
              className="inv-search-input"
            />
            {search && (
              <button className="inv-search-clear" onClick={() => { setSearch(''); setPage(1); }}>✕</button>
            )}
          </div>
        </div>

        {/* Showing X–Y of N */}
        {!loading && filtered.length > 0 && (
          <div className="inv-page-info">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} items
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="inv-state-placeholder">
            <div className="inv-spinner" />
            <span>Loading stock data…</span>
          </div>
        ) : paged.length === 0 ? (
          <div className="inv-state-placeholder">
            <div style={{ fontSize: 36 }}>🔍</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 8 }}>No items found</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Try a different search term</div>
          </div>
        ) : (
          <div className="inv-grid-wrap">
            <div className="inv-card-grid">
              {paged.map((item) => {
                const meta     = getStockMeta(item);
                const catColor = getCategoryColor(item.category);
                const initials = item.name.slice(0, 2).toUpperCase();

                return (
                  <div
                    key={item.id}
                    className="inv-item-card"
                    style={{ '--accent-color': meta.color }}
                  >
                    {/* Colored left accent bar */}
                    <div className="inv-card-accent" style={{ background: meta.color }} />

                    <div className="inv-card-body">
                      {/* Top row — avatar + category */}
                      <div className="inv-card-top">
                        <div
                          className="inv-card-avatar"
                          style={{ background: `${catColor}18`, color: catColor }}
                        >
                          {initials}
                        </div>
                        <span
                          className="inv-card-category"
                          style={{ color: catColor, background: `${catColor}12` }}
                        >
                          {item.category}
                        </span>
                      </div>

                      {/* Item name */}
                      <div className="inv-card-name" title={item.name}>{item.name}</div>

                      {/* Divider */}
                      <div className="inv-card-divider" />

                      {/* Quantity */}
                      <div className="inv-card-qty-row">
                        <span className="inv-qty-num" style={{ color: meta.color }}>
                          {item.currentStock}
                        </span>
                        <span className="inv-qty-unit">{item.unit}</span>
                      </div>

                      {/* Progress bar */}
                      <div className="inv-bar-row">
                        <div className="inv-bar-track">
                          <div
                            className="inv-bar-fill"
                            style={{ width: `${meta.pct}%`, background: meta.color }}
                          />
                        </div>
                        <span className="inv-bar-pct">{meta.pct}%</span>
                      </div>

                      {/* Status badge */}
                      <div className="inv-card-status-row">
                        <span
                          className="inv-status-badge"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          <span className="inv-status-dot" style={{ background: meta.color }} />
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="inv-pagination">
                <button
                  className="inv-page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  title="Previous page"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {paginate(page, totalPages).map((n, i) =>
                  n === '…' ? (
                    <span key={`e${i}`} className="inv-page-ellipsis">…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`inv-page-btn inv-page-num${n === page ? ' active' : ''}`}
                    >{n}</button>
                  )
                )}

                <button
                  className="inv-page-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  title="Next page"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
