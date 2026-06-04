// =====================================================
//  Stock History Database — localStorage persistence layer
//  Stores per-item stock update records produced by the
//  "Update Stock" flow in AddItems.
//
//  Schema  (localStorage key: "adjmarine_stock_history"):
//    { [itemId]: StockRecord[] }
//
//  StockRecord {
//    id        : string   — unique record ID (SH-<timestamp>-<random>)
//    timestamp : ISO 8601 — when the update was submitted
//    qty       : number   — quantity received
//    rate      : number   — purchase rate per unit
//    unit      : string   — unit of measure (kg, L, …)
//    desc      : string   — optional notes / delivery reference
//  }
// =====================================================

import SEED from './stockHistory.json';

const KEY          = 'adjmarine_stock_history';
const SEEDED_FLAG  = 'adjmarine_stock_history_seeded_v1';

/* ── internal helpers ─────────────────────────────── */

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persist(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('[stockHistoryDb] localStorage write failed:', e);
  }
}

function seedIfEmpty() {
  if (localStorage.getItem(SEEDED_FLAG)) return;
  if (!localStorage.getItem(KEY)) {
    persist(SEED.records);
  }
  localStorage.setItem(SEEDED_FLAG, '1');
}

/* Run once when this module is first imported */
seedIfEmpty();

function nextId() {
  return `SH-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ══════════════════════════════════════════════════
   READ
   ══════════════════════════════════════════════════ */

/** Returns the full history map  { [itemId]: StockRecord[] }. */
export function getAllHistory() {
  return load() ?? { ...SEED.records };
}

/** Returns the record array for a single item. */
export function getItemHistory(itemId) {
  return getAllHistory()[itemId] ?? [];
}

/* ══════════════════════════════════════════════════
   CREATE
   ══════════════════════════════════════════════════ */

/**
 * Prepend a new record for itemId.
 * Generates a unique id and merges into the map.
 * Returns the updated full map (also persists it).
 */
export function addHistoryRecord(allHistory, itemId, record) {
  const newRecord = { id: nextId(), ...record };
  const updated   = {
    ...allHistory,
    [itemId]: [newRecord, ...(allHistory[itemId] ?? [])],
  };
  persist(updated);
  return updated;
}

/* ══════════════════════════════════════════════════
   UPDATE
   ══════════════════════════════════════════════════ */

/**
 * Patch an existing record by id.
 * Only the supplied fields are overwritten; id and timestamp are preserved.
 * Returns the updated full map (also persists it).
 */
export function updateHistoryRecord(allHistory, itemId, recordId, patch) {
  const updated = {
    ...allHistory,
    [itemId]: (allHistory[itemId] ?? []).map((r) =>
      r.id === recordId ? { ...r, ...patch } : r
    ),
  };
  persist(updated);
  return updated;
}

/* ══════════════════════════════════════════════════
   DELETE
   ══════════════════════════════════════════════════ */

/**
 * Remove a single record by id.
 * Returns the updated full map (also persists it).
 */
export function deleteHistoryRecord(allHistory, itemId, recordId) {
  const updated = {
    ...allHistory,
    [itemId]: (allHistory[itemId] ?? []).filter((r) => r.id !== recordId),
  };
  persist(updated);
  return updated;
}

/* ══════════════════════════════════════════════════
   EXPORT SNAPSHOT
   ══════════════════════════════════════════════════ */

/**
 * Download the current database as a JSON file.
 * The file matches the stockHistory.json seed schema exactly,
 * so it can be used as a future seed.
 */
export function exportHistorySnapshot() {
  const snapshot = {
    _schema:   'adjmarine-stock-history-v1',
    _exported: new Date().toISOString(),
    records:   getAllHistory(),
  };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `stock-history-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════
   PURGE  (dev / admin use)
   ══════════════════════════════════════════════════ */

/** Wipe all history from storage and reset the seed flag. */
export function clearAllHistory() {
  persist({});
  localStorage.removeItem(SEEDED_FLAG);
}
