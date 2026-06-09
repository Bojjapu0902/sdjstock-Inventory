// =====================================================
//  Inventory Stock Database — MongoDB-backed via REST API
// =====================================================
import api from './api';

/**
 * Returns { [itemId]: currentStock } map from API.
 */
export async function getInventoryStockMap() {
  const items = await api.get('/inventory');
  const map = {};
  items.forEach((item) => { map[item.id] = item.currentStock; });
  return map;
}

/** Returns all items with live stock from API. */
export async function getInventoryItemsWithStock() {
  return api.get('/inventory');
}

/**
 * Subtract quantities for multiple items.
 * Returns updated { [itemId]: newQty } map.
 */
export async function deductMultipleStock(_map, items) {
  return api.post('/inventory/bulk-deduct', { items });
}

/**
 * Restore quantities for multiple items.
 * Returns updated { [itemId]: newQty } map.
 */
export async function restoreMultipleStock(_map, items) {
  return api.post('/inventory/bulk-restore', { items });
}

/** Update a single item's stock quantity. */
export async function updateItemStock(itemId, currentStock) {
  return api.put(`/inventory/${itemId}`, { currentStock });
}

/** no-op: API handles persistence */
export function persistMap() {}