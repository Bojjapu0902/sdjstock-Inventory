# Inventory Stock Context

The live stock quantity system spans two files: the React context provider and the underlying localStorage database.

---

## Files

| File | Role |
|---|---|
| `src/hooks/useInventoryStock.js` | React context: `InventoryStockProvider` + `useInventoryStock()` hook |
| `src/data/inventoryDb.js` | localStorage read/write layer for stock quantities |

> Note: Despite the filename `useInventoryStock.js`, this file exports both a Provider and a hook — it is effectively a context module, not a custom hook-only module.

---

## Provider: `<InventoryStockProvider>`

Wrap your component tree with this provider so all pages share the same live stock state:

```jsx
// App.jsx
<InventoryStockProvider>
  <Routes>...</Routes>
</InventoryStockProvider>
```

On mount, initialises `stockMap` state from `localStorage` via `getInventoryStockMap()`. If no stored data exists, seeds from `mockData.js`.

### Context Value

```js
{
  stockMap:     { [itemId: string]: number },  // current qty for all 93 items
  deductStock:  (items) => void,               // subtract multiple item quantities
  restoreStock: (items) => void,               // restore multiple item quantities
  adjustStock:  (itemId, delta) => void        // add or subtract one item's qty
}
```

---

## Hook: `useInventoryStock()`

```jsx
import { useInventoryStock } from '../hooks/useInventoryStock';

const { stockMap, deductStock, restoreStock, adjustStock } = useInventoryStock();
```

Throws `Error` if called outside `<InventoryStockProvider>`.

---

## Methods

### `deductStock(items)`

Used when a project user submits a stock-received session. Subtracts each item's quantity from the main inventory.

```js
deductStock([
  { itemId: 'INV-001', quantity: 50 },
  { itemId: 'INV-016', quantity: 10 },
]);
```

- Calls `inventoryDb.deductMultipleStock(prevMap, items)` under the hood.
- Stock is clamped at 0 — never goes negative.

---

### `restoreStock(items)`

Used when a project submission is deleted or edited (to undo the deduction).

```js
restoreStock([
  { itemId: 'INV-001', quantity: 50 },
]);
```

- Calls `inventoryDb.restoreMultipleStock(prevMap, items)`.

---

### `adjustStock(itemId, delta)`

Used by `AddItems` and `UpdateStock` for single-item stock operations:

```js
adjustStock('INV-001', +100);   // receive 100 kg
adjustStock('INV-001', -20);    // consume 20 kg
```

- `delta > 0` — adds stock (receive operation).
- `delta < 0` — subtracts stock (usage operation).
- Stock is clamped at 0.
- Calls `inventoryDb.persistMap()` directly to write to localStorage.

---

## Read Pattern

Any page that needs current stock quantities reads from `stockMap`:

```jsx
const { stockMap } = useInventoryStock();

// Get live qty for INV-001
const currentQty = stockMap['INV-001'] ?? 0;

// Merge live quantities into item definitions
const itemsWithStock = inventoryItems.map(item => ({
  ...item,
  currentStock: stockMap[item.id] ?? item.currentStock,
}));
```

---

## Data Flow Diagram

```
mockData.js (seed)
       │  (first load only)
       ▼
inventoryDb.js ←──── localStorage: adjmarine_inventory_stock
       │
       ▼
InventoryStockProvider (React state: stockMap)
       │
       ├──▶ Inventory.jsx     (reads stockMap)
       ├──▶ AddItems.jsx      (calls adjustStock)
       ├──▶ UpdateStock.jsx   (calls adjustStock)
       ├──▶ ProjectDetails.jsx (calls deductStock / restoreStock)
       └──▶ Projects.jsx      (passes to ProjectDetails)
```

---

## Persistence Guarantee

Every mutation (`deductStock`, `restoreStock`, `adjustStock`) synchronously writes the updated map to `localStorage` before returning. This means stock quantities survive page refreshes.
