// =====================================================
//  Inventory Stock Database — localStorage layer
//  Tracks current stock quantities separately from
//  the static mockData definitions.
//  Key: "adjmarine_inventory_stock"  →  { [itemId]: number }
// =====================================================

import { inventoryItems } from './mockData';

const KEY = 'adjmarine_inventory_stock';

/* ── internal helpers ─────────────────────────────── */
function loadMap() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function persistMap(map) {
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch (e) {
    console.warn('[inventoryDb] localStorage write failed:', e);
  }
}

/**
 * Return the stock map { [itemId]: currentStock }.
 * Seeds from mockData on first run.
 */
function getStockMap() {
  const stored = loadMap();
  if (stored) return stored;
  const map = {};
  inventoryItems.forEach((item) => { map[item.id] = item.currentStock; });
  persistMap(map);
  return map;
}

/* ══════════════════════════════════════════════════
   READ
   ══════════════════════════════════════════════════ */

/** Returns the full { [itemId]: quantity } map. */
export function getInventoryStockMap() {
  return getStockMap();
}

/** Returns current stock for a single item. */
export function getItemStock(itemId) {
  return getStockMap()[itemId] ?? 0;
}

/**
 * Returns all inventory items merged with live stock quantities.
 * Use this wherever you need the full item list with up-to-date stock.
 */
export function getInventoryItemsWithStock() {
  const map = getStockMap();
  return inventoryItems.map((item) => ({
    ...item,
    currentStock: map[item.id] ?? item.currentStock,
  }));
}

/* ══════════════════════════════════════════════════
   WRITE — bulk operations (used by Projects page)
   ══════════════════════════════════════════════════ */

/**
 * Subtract quantities for multiple items (project stock-in).
 * Clamps to 0 — stock cannot go negative.
 * Returns the updated map.
 */
export function deductMultipleStock(stockMap, items) {
  const updated = { ...stockMap };
  items.forEach(({ itemId, quantity }) => {
    const current = Number(updated[itemId] ?? 0);
    updated[itemId] = Math.max(0, current - Number(quantity));
  });
  persistMap(updated);
  return updated;
}

/**
 * Restore quantities for multiple items (on submission edit / delete).
 * Returns the updated map.
 */
export function restoreMultipleStock(stockMap, items) {
  const updated = { ...stockMap };
  items.forEach(({ itemId, quantity }) => {
    const current = Number(updated[itemId] ?? 0);
    updated[itemId] = current + Number(quantity);
  });
  persistMap(updated);
  return updated;
}

/** Reset all stock back to the mockData defaults. */
export function resetInventoryStock() {
  const map = {};
  inventoryItems.forEach((item) => { map[item.id] = item.currentStock; });
  persistMap(map);
  return map;
}
