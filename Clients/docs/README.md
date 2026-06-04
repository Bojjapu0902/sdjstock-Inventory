# SDJ MARINE PVT. LTD — Documentation Index

Complete documentation for the SDJ MARINE PVT. LTD inventory management application.

---

## Files

| File | Covers |
|---|---|
| [01_project_overview.md](01_project_overview.md) | Tech stack, directory structure, commands, state machine, data persistence keys |
| [02_database.md](02_database.md) | mockData.js (93 items, suppliers, POs, wastage), inventoryDb.js, loginDb.js, projectsDb.js — all schemas and exported functions |
| [03_authentication.md](03_authentication.md) | AuthContext, login/logout flow, roles, session storage, seed credentials, project user accounts |
| [04_routing.md](04_routing.md) | All routes, role-based redirect, layout split (admin vs project user), context wrapping |
| [05_pages.md](05_pages.md) | All 12 pages — Login, Dashboard, Inventory, AddItems, UpdateStock, PurchaseOrders, Suppliers, Wastage, Reports, Settings, Projects, ProjectDetails |
| [06_components.md](06_components.md) | KPICard, StatusBadge, DataTable, Modal, Loader, Layout, Header, Sidebar — props and behaviour |
| [07_inventory_stock_context.md](07_inventory_stock_context.md) | InventoryStockProvider, useInventoryStock hook, deductStock / restoreStock / adjustStock, data flow diagram |
| [08_design_system.md](08_design_system.md) | CSS custom properties, color palette, spacing, shadows, component CSS classes, Recharts integration |
| [09_features.md](09_features.md) | All 15 implemented features — auth, splash, inventory, stock tracking, CRUD, analytics, projects, export |
| [10_hooks_and_state_management.md](10_hooks_and_state_management.md) | Every hook used (useState, useEffect, useMemo, useCallback, useRef, useParams, useLocation), all 3 Context providers, why no Redux, per-file hook usage table |

---

## Quick Reference

### Credentials
- Admin: `sdj` / `sdj123@`

### Key Routes
- `/inventory` — main admin landing page
- `/project/:id` — project-user view (no sidebar)

### localStorage Keys
| Key | Contents |
|---|---|
| `adjmarine_inventory_stock` | `{ [itemId]: qty }` for all 93 items |
| `adjmarine_users` | All user accounts |
| `adjmarine_projects` | All projects |
| `adjmarine_stock_received` | Per-project received submissions |
| `adjmarine_stock_used` | Per-project usage records |

### sessionStorage Key
| Key | Contents |
|---|---|
| `adjmarine_current_user` | Currently logged-in user object |
