# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm start            # Dev server at http://localhost:3000
npm run build        # Production build → /build
npm test             # Jest + React Testing Library
```

## Architecture

**React 18 SPA** (Create React App) — a food/inventory management admin dashboard with no backend. All data is mocked client-side in `src/data/mockData.js` (93 food items + utility functions).

### App State Machine (`src/App.jsx`)

Three sequential states drive the top-level render:
1. `loading` → `<Loader />` splash screen
2. `login` → `<Login />` (mock auth, no real backend)
3. `app` → `<Layout />` wrapping React Router v6 routes

### Layout Shell (`src/components/layout/`)

- `Layout.jsx` — app shell; manages `sidebarOpen` state, passes it to Sidebar + Header
- `Sidebar.jsx` — collapsible nav (260px expanded, icon-only collapsed); mobile drawer at breakpoint 992px
- `Header.jsx` — top bar with search input and user/logout menu

### Pages (`src/pages/`)

Eight routed pages: Dashboard, Inventory, UpdateStock, PurchaseOrders, Suppliers, Wastage, Reports, Settings. All read from `mockData.js` and manage their own local state via `useState`/`useMemo`/`useCallback`.

### Shared Components (`src/components/common/`)

| Component | Purpose |
|---|---|
| `KPICard` | Metric summary tile |
| `DataTable` | Sortable, paginated table |
| `StatusBadge` | Color-coded status pill |
| `Modal` | Reusable dialog |
| `Loader` | Splash screen |

### Styling

- Bootstrap 5.3.2 for grid/utilities + `src/styles/custom.css` for the design system
- CSS custom properties define the full token set: primary indigo `#4F46E5`, sidebar dark `#1E1B4B`, semantic colors, spacing, and transitions (0.22s cubic-bezier)
- Do not inline styles; use CSS variables from `custom.css` or Bootstrap utilities

### Charts

Recharts (`recharts` 2.10.3) is used throughout Dashboard and Wastage for LineChart, BarChart, and PieChart. Data is derived from `mockData.js` at render time.

## Key Constraints

- **No backend** — all CRUD operations mutate local React state only; nothing persists across page refreshes
- **No global state library** — state lives in individual page components; lift state only to `App.jsx` when cross-page sharing is needed
- **CRA / react-scripts** — do not eject; use `.env` files for environment variables and CRA's supported config approach
