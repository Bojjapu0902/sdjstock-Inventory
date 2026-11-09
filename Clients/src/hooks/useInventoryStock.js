import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';

const InventoryStockContext = createContext(null);

export function InventoryStockProvider({ children }) {
  const [items,    setItems]    = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);

  const applyItems = useCallback((list) => {
    const map = {};
    list.forEach((item) => { map[item.id] = item.currentStock; });
    setItems(list);
    setStockMap(map);
    setError(false);
  }, []);

  // Fetch live items and stock from the API on mount
  useEffect(() => {
    api.get('/inventory')
      .then(applyItems)
      .catch((err) => { console.error(err); setError(true); })
      .finally(() => setLoading(false));
  }, [applyItems]);

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

  /** Re-fetch all items and stock from the server. */
  const refreshAll = useCallback(async () => {
    try {
      applyItems(await api.get('/inventory'));
    } catch (err) {
      console.error('refreshAll error:', err);
      setError(true);
    }
  }, [applyItems]);

  /** Update a single item's stock in the map (no API call). */
  const syncItemStock = useCallback((itemId, newQty) => {
    setStockMap((prev) => ({ ...prev, [itemId]: newQty }));
  }, []);

  return (
    <InventoryStockContext.Provider value={{ items, stockMap, loading, error, deductStock, restoreStock, adjustStock, refreshAll, syncItemStock }}>
      {children}
    </InventoryStockContext.Provider>
  );
}

export function useInventoryStock() {
  const ctx = useContext(InventoryStockContext);
  if (!ctx) throw new Error('useInventoryStock must be used inside <InventoryStockProvider>');
  return ctx;
}