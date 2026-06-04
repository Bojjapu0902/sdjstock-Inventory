import { createContext, useContext, useState, useCallback } from 'react';
import {
  getInventoryStockMap,
  deductMultipleStock as dbDeduct,
  restoreMultipleStock as dbRestore,
} from '../data/inventoryDb';

/* ── persist a single-item delta (used by AddItems Update Stock) ── */
import { persistMap } from '../data/inventoryDb';

const InventoryStockContext = createContext(null);

/**
 * Wrap your app with this provider so every page shares the same
 * live stock state backed by localStorage.
 */
export function InventoryStockProvider({ children }) {
  const [stockMap, setStockMap] = useState(() => getInventoryStockMap());

  /** Subtract quantities from inventory (project stock-in). */
  const deductStock = useCallback((items) => {
    setStockMap((prev) => dbDeduct(prev, items));
  }, []);

  /** Restore quantities to inventory (project submission edit / delete). */
  const restoreStock = useCallback((items) => {
    setStockMap((prev) => dbRestore(prev, items));
  }, []);

  /**
   * Add stock for a single item (AddItems "Update Stock").
   * delta > 0 = add, delta < 0 = subtract.
   */
  const adjustStock = useCallback((itemId, delta) => {
    setStockMap((prev) => {
      const current = Number(prev[itemId] ?? 0);
      const updated  = { ...prev, [itemId]: Math.max(0, current + Number(delta)) };
      persistMap(updated);
      return updated;
    });
  }, []);

  return (
    <InventoryStockContext.Provider value={{ stockMap, deductStock, restoreStock, adjustStock }}>
      {children}
    </InventoryStockContext.Provider>
  );
}

/** Consume live inventory stock anywhere in the component tree. */
export function useInventoryStock() {
  const ctx = useContext(InventoryStockContext);
  if (!ctx) throw new Error('useInventoryStock must be used inside <InventoryStockProvider>');
  return ctx;
}
