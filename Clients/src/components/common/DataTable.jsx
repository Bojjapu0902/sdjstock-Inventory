import React, { useState, useMemo } from 'react';
import './DataTable.css';
import { MdChevronLeft, MdChevronRight, MdArrowUpward, MdArrowDownward, MdUnfoldMore } from 'react-icons/md';

const PAGE_SIZES = [10, 20, 50];

const DataTable = ({
  columns,       // [{ key, label, sortable, render, width }]
  data,          // raw array
  pageSize: defaultPageSize = 10,
  selectable = false,
  emptyMessage = 'No records found.',
}) => {
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState(defaultPageSize);
  const [sortKey, setSortKey]         = useState(null);
  const [sortDir, setSortDir]         = useState('asc');
  const [selected, setSelected]       = useState(new Set());

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (va === undefined || vb === undefined) return 0;
      const cmp = typeof va === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated  = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  // Selection
  const allSelected = paginated.length > 0 && paginated.every((r) => selected.has(r.id));

  const toggleAll = () => {
    const ids = paginated.map((r) => r.id);
    if (allSelected) {
      setSelected((s) => { const n = new Set(s); ids.forEach((id) => n.delete(id)); return n; });
    } else {
      setSelected((s) => { const n = new Set(s); ids.forEach((id) => n.add(id)); return n; });
    }
  };

  const toggleRow = (id) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const SortIcon = ({ col }) => {
    if (!col.sortable) return null;
    if (sortKey !== col.key) return <MdUnfoldMore style={{ opacity: 0.4 }} />;
    return sortDir === 'asc' ? <MdArrowUpward /> : <MdArrowDownward />;
  };

  const startRow = sorted.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow   = Math.min(page * pageSize, sorted.length);

  return (
    <div>
      <div className="fsp-table-wrap">
        <table className="fsp-table">
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    className="table-checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {col.label}
                    <SortIcon col={col} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row) => (
                <tr key={row.id}>
                  {selectable && (
                    <td>
                      <input
                        type="checkbox"
                        className="table-checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={col.tdClass || ''}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="table-pagination">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="pagination-info">
            {sorted.length === 0 ? 'No records' : `Showing ${startRow}–${endRow} of ${sorted.length}`}
          </span>
          <select
            className="filter-select"
            style={{ width: 'auto', minWidth: 80, height: 30, fontSize: 12 }}
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s} / page</option>
            ))}
          </select>
        </div>
        <div className="pagination-controls">
          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <MdChevronLeft />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              p === '...' ? (
                <span key={`ellipsis-${idx}`} className="page-btn" style={{ border: 'none', cursor: 'default' }}>…</span>
              ) : (
                <button
                  key={p}
                  className={`page-btn ${page === p ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )
            )}
          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <MdChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
