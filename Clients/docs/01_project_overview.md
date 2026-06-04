# Project Overview — SDJ MARINE PVT. LTD

## Summary

SDJ MARINE PVT. LTD is a React 18 single-page application (SPA) for food and inventory management. It functions as an admin dashboard with no backend — all data is mocked client-side and persisted via browser `localStorage` / `sessionStorage`. It supports two user roles: **Admin** (full dashboard access) and **User** (project-scoped stock view).

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 18.2.0 |
| Routing | React Router DOM | 6.21.3 |
| CSS Framework | Bootstrap | 5.3.2 |
| Icon Library | react-icons | 5.0.1 |
| Charting | Recharts | 2.10.3 |
| Build Tool | Create React App (react-scripts) | 5.0.1 |
| Testing | Jest + React Testing Library | — |

---

## Commands

```bash
npm install          # Install all dependencies
npm start            # Dev server → http://localhost:3000
npm run build        # Production build → /build
npm test             # Run Jest + React Testing Library tests
```

---

## Directory Structure

```
adjmarine_stock/
├── package.json
├── public/
│   └── index.html
└── src/
    ├── index.js                   Entry point — mounts <App>
    ├── index.css                  Bootstrap import + base reset
    ├── App.jsx                    Root: auth state machine + router
    ├── contexts/
    │   └── AuthContext.jsx        React context for login/logout/user
    ├── hooks/
    │   └── useInventoryStock.js   React context for live stock quantities
    ├── data/
    │   ├── mockData.js            93 inventory items + chart/KPI data
    │   ├── inventoryDb.js         localStorage wrapper for stock quantities
    │   ├── loginDb.js             localStorage wrapper for users + session
    │   └── projectsDb.js         localStorage wrapper for projects + records
    ├── components/
    │   ├── common/
    │   │   ├── KPICard.jsx        Metric summary tile
    │   │   ├── StatusBadge.jsx    Colored status pill
    │   │   ├── DataTable.jsx      Sortable + paginated table
    │   │   ├── Modal.jsx          Reusable dialog wrapper
    │   │   └── Loader.jsx         Startup splash screen
    │   └── layout/
    │       ├── Layout.jsx         App shell (sidebar + header + content)
    │       ├── Header.jsx         Top bar with search + user menu
    │       └── Sidebar.jsx        Collapsible navigation sidebar
    ├── pages/
    │   ├── Login.jsx              Login form (mock auth)
    │   ├── Dashboard.jsx          KPI + charts home page
    │   ├── Inventory.jsx          Full item catalog with urgency levels
    │   ├── AddItems.jsx           Add / edit / delete items + stock update
    │   ├── UpdateStock.jsx        Receive stock / log usage / history
    │   ├── PurchaseOrders.jsx     PO creation and tracking
    │   ├── Suppliers.jsx          Supplier directory + management
    │   ├── Wastage.jsx            Wastage log + analytics
    │   ├── Reports.jsx            Report tiles + quick charts
    │   ├── Settings.jsx           Business settings + preferences
    │   ├── Projects.jsx           Multi-project management (admin)
    │   └── ProjectDetails.jsx     Per-project stock view (project user)
    └── styles/
        └── custom.css             Design tokens + all component CSS
```

---

## Application State Machine (App.jsx)

The root component drives three sequential states before rendering the main app:

```
loading  →  login  →  app
```

1. **loading** — `<Loader />` splash screen runs for ~2.8 seconds.
2. **login** — `<Login />` page. On successful auth, transitions to `app`.
3. **app** — Full `<BrowserRouter>` + `<InventoryStockProvider>` + routes rendered inside `<Layout />`.

Role-based redirect on `/`:
- Admin → `/inventory`
- User (with projectId) → `/project/:projectId`

---

## Data Persistence

| Data | Storage | Key |
|---|---|---|
| Live stock quantities | `localStorage` | `adjmarine_inventory_stock` |
| User accounts | `localStorage` | `adjmarine_users` |
| Projects | `localStorage` | `adjmarine_projects` |
| Stock received records | `localStorage` | `adjmarine_stock_received` |
| Stock used records | `localStorage` | `adjmarine_stock_used` |
| Current session user | `sessionStorage` | `adjmarine_current_user` |

All data resets on `localStorage.clear()` and re-seeds from `mockData.js` defaults on next load.

---

## Key Constraints

- **No backend** — all CRUD mutates local React state only; nothing persists to a server.
- **No global state library** — state lives in page components; lifted to `App.jsx` only when cross-page sharing is needed.
- **No CRA eject** — use `.env` files and CRA-supported config only.
- **No inline styles** — use CSS custom properties from `custom.css` or Bootstrap utilities.
