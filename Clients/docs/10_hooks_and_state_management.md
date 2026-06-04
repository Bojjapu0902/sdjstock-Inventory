# Hooks & State Management

## Overview

SDJ MARINE PVT. LTD uses **no Redux, no Zustand, no MobX, and no external state management library**. All state is managed through:

1. **React Context API** — for shared, cross-page state (3 contexts)
2. **React built-in hooks** — for local component state and side effects
3. **React Router hooks** — for URL and navigation awareness

---

## State Management Architecture

```
App.jsx
├── <AuthProvider>                  ← Auth context (user session)
│   └── <ProjectsProvider>          ← Projects + stock records context
│       └── <InventoryStockProvider> ← Live inventory stock context
│           └── <BrowserRouter>
│               └── all pages
```

All three providers wrap the component tree in `src/index.js` or `src/App.jsx` so every page can consume them without prop drilling.

---

## Custom Hooks / Context Providers

### 1. `useAuth` — Authentication Context

**File:** `src/contexts/AuthContext.jsx`  
**Provider:** `<AuthProvider>`

Manages who is currently logged in. Backed by `sessionStorage`.

#### Context Value

```js
{
  user:   UserObject | null,   // logged-in user, or null
  login:  (userData) => void,  // writes to sessionStorage + sets state
  logout: () => void           // clears sessionStorage + resets state
}
```

#### Internal Hooks Used

| Hook | Purpose |
|---|---|
| `useState` | Stores the current user object, seeded from `sessionStorage` on mount |
| `useCallback` | Memoises `login` and `logout` so they never cause unnecessary re-renders |
| `useContext` | Used inside `useAuth()` to read the context value |

#### Consumed By

| File | What it reads |
|---|---|
| `App.jsx` | `user`, `login` |
| `Header.jsx` | `user`, `logout` |
| `Sidebar.jsx` | `user`, `logout` |
| `ProjectDetails.jsx` | `logout` |

#### Usage

```jsx
import { useAuth } from '../contexts/AuthContext';

const { user, login, logout } = useAuth();
```

---

### 2. `useInventoryStock` — Live Stock Context

**File:** `src/hooks/useInventoryStock.js`  
**Provider:** `<InventoryStockProvider>`

Single source of truth for current stock quantities across all 93 inventory items. Changes from any page are immediately visible app-wide. Backed by `localStorage`.

#### Context Value

```js
{
  stockMap:     { [itemId: string]: number },  // current qty for all items
  deductStock:  (items) => void,               // subtract multiple items (project stock-in)
  restoreStock: (items) => void,               // restore multiple items (submission delete/edit)
  adjustStock:  (itemId, delta) => void        // single-item add or subtract
}
```

#### Internal Hooks Used

| Hook | Purpose |
|---|---|
| `useState` | Holds the `stockMap` object; seeded from `localStorage` on first render |
| `useCallback` | Memoises `deductStock`, `restoreStock`, `adjustStock` |
| `useContext` | Used inside `useInventoryStock()` to read the context value |
| `createContext` | Creates the `InventoryStockContext` |

#### Consumed By

| File | Operations Used |
|---|---|
| `Dashboard.jsx` | `stockMap` (reads current stock for KPIs) |
| `Inventory.jsx` | `stockMap` (renders live stock levels) |
| `AddItems.jsx` | `stockMap`, `adjustStock` (receive/use single item) |
| `UpdateStock.jsx` | `stockMap`, `adjustStock` (receive stock / log usage) |
| `Projects.jsx` | `deductStock`, `restoreStock` (project stock-in/undo) |
| `ProjectDetails.jsx` | `deductStock`, `restoreStock` |

#### Usage

```jsx
import { useInventoryStock } from '../hooks/useInventoryStock';

const { stockMap, adjustStock, deductStock, restoreStock } = useInventoryStock();

// Read live stock for an item
const qty = stockMap['INV-001'] ?? 0;

// Add 50 kg of Rice
adjustStock('INV-001', +50);

// Deduct for a project submission
deductStock([
  { itemId: 'INV-001', quantity: 30 },
  { itemId: 'INV-016', quantity: 10 },
]);
```

---

### 3. `useProjects` — Projects & Stock Records Context

**File:** `src/contexts/ProjectsContext.jsx`  
**Provider:** `<ProjectsProvider>`

Manages all project data, project user accounts, and per-project stock records. Backed by `localStorage`. Both `Projects.jsx` and `ProjectDetails.jsx` consume this context so they always share the same up-to-date state.

#### Context Value

```js
{
  // State
  projects:      Project[],
  users:         User[],
  stockReceived: { [projectId]: Submission[] },
  stockUsed:     { [projectId]: UsedRecord[] },

  // Projects CRUD
  addProject:    (formData) => void,
  updateProject: (id, formData) => void,
  deleteProject: (id) => void,           // cascades: removes user + all stock records

  // Stock Received
  addStockReceived:    (projectId, submission) => void,
  updateStockReceived: (projectId, submissionId, updated) => void,
  deleteStockReceived: (projectId, submissionId) => void,

  // Stock Used
  addStockUsed:    (projectId, formData) => void,
  deleteStockUsed: (projectId, recordId) => void,
}
```

#### Internal Hooks Used

| Hook | Purpose |
|---|---|
| `useState` (×4) | `projects`, `users`, `stockReceived`, `stockUsed` — all seeded from `localStorage` on mount |
| `useCallback` (×8) | All CRUD action functions memoised to prevent stale closures |
| `useContext` | Used inside `useProjects()` to read the context value |
| `createContext` | Creates the `ProjectsContext` |

#### Consumed By

| File | Operations Used |
|---|---|
| `Projects.jsx` | All — full CRUD + stock management |
| `ProjectDetails.jsx` | `projects`, `stockReceived`, `stockUsed` (read), plus stock received/used actions |

#### Usage

```jsx
import { useProjects } from '../contexts/ProjectsContext';

const {
  projects,
  addProject, updateProject, deleteProject,
  stockReceived, addStockReceived,
} = useProjects();
```

---

## React Built-in Hooks

### `useState`

Used in every component that has mutable UI state. Summary by file:

| File | State Variables |
|---|---|
| `Login.jsx` | `username`, `password`, `showPass`, `remember`, `loading`, `error`, `shake`, `fieldErr` |
| `AddItems.jsx` | `tab`, `baseItems`, `search`, `catFilter`, `statusFilter`, `selectedItem`, `showModal`, `editItem`, `form`, `deleteId`, `showStockModal`, `stockSuccess`, `stockChecked`, `stockQtys`, `stockPrices`, `stockDescs`, `stockSearch`, `stockClock`, `expandedIds`, `stockPreCheckId`, `stockUpdateMap` |
| `UpdateStock.jsx` | `items`, `transactions`, `activeTab`, `receiveForm`, `receiveSuccess`, `usageForm`, `usageSuccess`, `histSearch`, `histType`, `histCat` |
| `PurchaseOrders.jsx` | `orders`, `search`, `statusFilter`, `showModal`, `editPO`, `form`, `viewPO` |
| `Suppliers.jsx` | `items`, `search`, `statusFilter`, `showModal`, `editItem`, `form`, `viewItem`, `deleteId` |
| `Wastage.jsx` | `entries`, `search`, `catFilter`, `reasonFilter`, `showModal`, `form`, `deleteId` |
| `Projects.jsx` | 20+ state vars covering form, modal, checklist, submission editing, filters |
| `ProjectDetails.jsx` | `activeTab`, `expandedIds` |
| `Settings.jsx` | `biz`, `notifs`, `saved` |
| `Layout.jsx` | `collapsed`, `mobileVisible` |
| `Header.jsx` | `searchVal`, `dropdownOpen` |
| `Loader.jsx` | `progress`, `msgIndex`, `fadeOut` |
| `DataTable.jsx` | `page`, `pageSize`, `sortKey`, `sortDir`, `selected` |
| `AuthContext.jsx` | `user` |
| `ProjectsContext.jsx` | `projects`, `users`, `stockReceived`, `stockUsed` |
| `useInventoryStock.js` | `stockMap` |

---

### `useMemo`

Used to derive computed values without recalculating on every render. Only recalculates when listed dependencies change.

| File | What is Memoised | Dependencies |
|---|---|---|
| `Dashboard.jsx` | `liveItems` | `stockMap` |
| `Dashboard.jsx` | `lowStockItems` | `liveItems` |
| `Dashboard.jsx` | `expiringSoon` | `liveItems` |
| `Inventory.jsx` | `items` (enriched with live stock) | `stockMap` |
| `Inventory.jsx` | `summary` (counts per status) | `items` |
| `Inventory.jsx` | `topConsumers` (top daily cost items) | `items` |
| `Inventory.jsx` | `criticalItems` | `items` |
| `AddItems.jsx` | `liveItems` (merged stock) | `stockMap`, `baseItems` |
| `AddItems.jsx` | `filteredItems` | `liveItems`, `search`, `catFilter`, `statusFilter` |
| `AddItems.jsx` | `summary` (KPI counts) | `liveItems` |
| `AddItems.jsx` | `filteredStockItems` | `liveItems`, `stockSearch` |
| `UpdateStock.jsx` | `summary` (MTD totals) | `transactions` |
| `UpdateStock.jsx` | `filteredHistory` | `transactions`, `histSearch`, `histType`, `histCat` |
| `PurchaseOrders.jsx` | `filtered` (orders table) | `orders`, `search`, `statusFilter` |
| `Suppliers.jsx` | `filtered` (suppliers table) | `items`, `search`, `statusFilter` |
| `Wastage.jsx` | `filtered` (wastage table) | `entries`, `search`, `catFilter`, `reasonFilter` |
| `Projects.jsx` | `filteredInventory` | `liveItems`, `itemSearch` |
| `Projects.jsx` | `summary` (project KPIs) | `projects` |
| `Projects.jsx` | `filtered` (projects table) | `projects`, `search`, `statusFilter` |
| `Projects.jsx` | `viewingProject` | `selectedProject`, `projects` |
| `Projects.jsx` | `deletingProject` | `projects`, `deleteId` |
| `ProjectDetails.jsx` | `project` | `projects`, `projectId` |
| `DataTable.jsx` | `sorted` (sorted rows) | `data`, `sortKey`, `sortDir` |
| `Items.jsx` | `allItems`, `tabCounts`, `filtered` | Various |

---

### `useCallback`

Used to memoise event handlers and action functions so child components that receive them as props don't re-render unnecessarily.

| File | Memoised Functions |
|---|---|
| `App.jsx` | `handleLoaderDone`, `handleLogin`, `handleLogout` |
| `Layout.jsx` | `handleMenuClick`, `handleMobileClose` |
| `AuthContext.jsx` | `login`, `logout` |
| `useInventoryStock.js` | `deductStock`, `restoreStock`, `adjustStock` |
| `ProjectsContext.jsx` | `addProjectFn`, `updateProjectFn`, `deleteProjectFn`, `addStockReceivedFn`, `updateStockReceivedFn`, `deleteStockReceivedFn`, `addStockUsedFn`, `deleteStockUsedFn` |
| `AddItems.jsx` | `toggleExpand`, `openAdd`, `openEdit`, `closeModal`, `openStockModal` |
| `Projects.jsx` | `openAdd`, `openEdit`, `closeModal`, `handleSave`, `handleDelete`, `handleAddReceived`, `handleUpdateReceived`, `handleDeleteReceived`, `handleAddUsed`, `handleDeleteUsed` |
| `ProjectDetails.jsx` | `toggleExpand` |

---

### `useEffect`

Used for side effects: timers, DOM event listeners, and cleanup.

| File | Effect | Dependencies | Cleanup |
|---|---|---|---|
| `Loader.jsx` | Progress bar timer (`setInterval` every ~28ms, advances `progress` 0→100) | `[]` (runs once on mount) | `clearInterval` |
| `Loader.jsx` | Message cycling timer (changes `msgIndex` on a step schedule) | `[]` | `clearInterval` |
| `Loader.jsx` | Fade-out and `onComplete()` callback when progress hits 100 | `[progress]` | — |
| `Modal.jsx` | Listens for `keydown` → `Escape` to close the modal | `[show, onClose]` | `removeEventListener` |
| `Modal.jsx` | Locks body scroll (`overflow: hidden`) while modal is open | `[show]` | Restores `overflow: ''` |
| `Header.jsx` | Clicks outside the dropdown close it (`mousedown` listener on `document`) | `[dropdownOpen]` | `removeEventListener` |
| `AddItems.jsx` | Live clock in stock modal — ticks every second via `setInterval` | `[showStockModal]` | `clearInterval` |
| `Projects.jsx` | Live clock in received-stock modal — ticks every second | `[showReceivedModal]` | `clearInterval` |

---

### `useRef`

| File | Ref Variable | Purpose |
|---|---|---|
| `Header.jsx` | `dropdownRef` | Points to the dropdown DOM node so click-outside detection can check `contains(e.target)` |

---

## React Router Hooks

### `useParams`

**Used in:** `ProjectDetails.jsx`

```jsx
const { projectId } = useParams();
```

Extracts the `:projectId` segment from the URL path `/project/:projectId`.

---

### `useLocation`

**Used in:** `Header.jsx`, `Sidebar.jsx`

```jsx
const location = useLocation();
```

Reads `location.pathname` to:
- **Header.jsx** — Derive and display the current page title from the active route.
- **Sidebar.jsx** — Highlight the active nav item matching the current path.

---

### `NavLink` (React Router component)

**Used in:** `Sidebar.jsx`

Not a hook, but used declaratively in JSX. React Router automatically applies an `active` class to the matching `<NavLink>`, enabling the active sidebar highlight without manual `location.pathname` comparison.

---

### `Navigate` (React Router component)

**Used in:** `App.jsx`, `ProjectDetails.jsx`

Declarative redirect — renders nothing but immediately navigates to the target route. Used for:
- Root `/` redirect based on user role.
- Security guard in `ProjectDetails.jsx` when the user doesn't own the project.

---

## Why No Redux?

Redux (or any flux-pattern library) was deliberately not used. The justification:

| Concern | How it's handled without Redux |
|---|---|
| Cross-page shared state | React Context API (3 providers) |
| Persistence | `localStorage` / `sessionStorage` direct writes in context actions |
| Derived/computed data | `useMemo` at the point of use |
| Action memoisation | `useCallback` inside context providers |
| No prop drilling | Contexts consumed directly via hooks anywhere in the tree |

The three contexts effectively serve the same role as a Redux store split into three slices:

| Context | Equivalent Redux slice |
|---|---|
| `AuthContext` | `auth` slice |
| `ProjectsContext` | `projects` + `stockReceived` + `stockUsed` slice |
| `InventoryStockContext` | `inventory` slice |

---

## Hook Usage Summary Per File

| File | useState | useMemo | useCallback | useEffect | useRef | useParams | useLocation | useContext |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `App.jsx` | ✓ | — | ✓ | — | — | — | — | ✓ (useAuth) |
| `Login.jsx` | ✓ | — | — | — | — | — | — | — |
| `Dashboard.jsx` | — | ✓ | — | — | — | — | — | ✓ (useInventoryStock) |
| `Inventory.jsx` | — | ✓ | — | — | — | — | — | ✓ (useInventoryStock) |
| `AddItems.jsx` | ✓ | ✓ | ✓ | ✓ | — | — | — | ✓ (useInventoryStock) |
| `UpdateStock.jsx` | ✓ | ✓ | — | — | — | — | — | ✓ (useInventoryStock) |
| `PurchaseOrders.jsx` | ✓ | ✓ | — | — | — | — | — | — |
| `Suppliers.jsx` | ✓ | ✓ | — | — | — | — | — | — |
| `Wastage.jsx` | ✓ | ✓ | — | — | — | — | — | — |
| `Reports.jsx` | — | — | — | — | — | — | — | — |
| `Settings.jsx` | ✓ | — | — | — | — | — | — | — |
| `Projects.jsx` | ✓ | ✓ | ✓ | ✓ | — | — | — | ✓ (useProjects, useInventoryStock) |
| `ProjectDetails.jsx` | ✓ | ✓ | ✓ | — | — | ✓ | — | ✓ (useAuth, useProjects) |
| `Items.jsx` | ✓ | ✓ | — | — | — | — | — | — |
| `Layout.jsx` | ✓ | — | ✓ | — | — | — | — | — |
| `Header.jsx` | ✓ | — | — | ✓ | ✓ | — | ✓ | ✓ (useAuth) |
| `Sidebar.jsx` | — | — | — | — | — | — | ✓ | ✓ (useAuth) |
| `Loader.jsx` | ✓ | — | — | ✓ | — | — | — | — |
| `Modal.jsx` | — | — | — | ✓ | — | — | — | — |
| `DataTable.jsx` | ✓ | ✓ | — | — | — | — | — | — |
| `AuthContext.jsx` | ✓ | — | ✓ | — | — | — | — | ✓ (internal) |
| `ProjectsContext.jsx` | ✓ | — | ✓ | — | — | — | — | ✓ (internal) |
| `useInventoryStock.js` | ✓ | — | ✓ | — | — | — | — | ✓ (internal) |
