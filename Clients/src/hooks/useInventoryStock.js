import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';

const InventoryStockContext = createContext(null);

export function InventoryStockProvider({ children }) {
  const [stockMap, setStockMap] = useState({});
  const [loading,  setLoading]  = useState(true);

  // Fetch live stock map from API on mount
  useEffect(() => {
    api.get('/inventory')
      .then((items) => {
        const map = {};
        items.forEach((item) => { map[item.id] = item.currentStock; });
        setStockMap(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /** Subtract quantities from inventory (project stock-in). */
  const deductStock = useCallback(async (items) => {
    try {
      const updated = await api.post('/inventory/bulk-deduct', { items });
      setStockMap((prev) => ({ ...prev, ...updated }));
    } catch (err) { console.error('deductStock error:', err); }
  }, []);

  /** Restore quantities to inventory (project submission edit / delete). */
  const restoreStock = useCallback(async (items) => {
    try {
      const updated = await api.post('/inventory/bulk-restore', { items });
      setStockMap((prev) => ({ ...prev, ...updated }));
    } catch (err) { console.error('restoreStock error:', err); }
  }, []);

  /**
   * Add stock for a single item (AddItems "Update Stock").
   * delta > 0 = add, delta < 0 = subtract.
   */
  const adjustStock = useCallback(async (itemId, delta) => {
    try {
      const current = Number(stockMap[itemId] ?? 0);
      const newQty  = Math.max(0, current + Number(delta));
      await api.put(`/inventory/${itemId}`, { currentStock: newQty });
      setStockMap((prev) => ({ ...prev, [itemId]: newQty }));
    } catch (err) { console.error('adjustStock error:', err); }
  }, [stockMap]);

  /** Re-fetch the full stock map from the server. */
  const refreshAll = useCallback(async () => {
    try {
      const items = await api.get('/inventory');
      const map = {};
      items.forEach((item) => { map[item.id] = item.currentStock; });
      setStockMap(map);
    } catch (err) { console.error('refreshAll error:', err); }
  }, []);

  /** Update a single item's stock in the map (no API call). */
  const syncItemStock = useCallback((itemId, newQty) => {
    setStockMap((prev) => ({ ...prev, [itemId]: newQty }));
  }, []);

  return (
    <InventoryStockContext.Provider value={{ stockMap, loading, deductStock, restoreStock, adjustStock, refreshAll, syncItemStock }}>
      {children}
    </InventoryStockContext.Provider>
  );
}

export function useInventoryStock() {
  const ctx = useContext(InventoryStockContext);
  if (!ctx) throw new Error('useInventoryStock must be used inside <InventoryStockProvider>');
  return ctx;
}