# Features Documentation

A summary of every functional feature implemented in SDJ MARINE PVT. LTD.

---

## 1. Authentication & Session Management

- **Mock login** with username + password validation against `localStorage`.
- **Two roles:** Admin (full access) and User (project-scoped access).
- **Session persistence** via `sessionStorage` — login survives page refresh within the same tab.
- **Auto-redirect** on login based on role (Admin → `/inventory`, User → `/project/:id`).
- **Logout** from Header dropdown, Sidebar footer, or ProjectDetails header.
- **Seed admin account** auto-created on first load: `sdj` / `sdj123@`.

---

## 2. Startup Splash Screen

- Animated Loader component with rotating rings, gradient background, and floating orbs.
- Progress bar fills from 0 → 100% over ~2.8 seconds.
- Status messages cycle during load.
- Transitions to the Login page on completion.

---

## 3. Inventory Catalog

- **93 food items** across 10 categories.
- Each item has: ID, name, category, unit, current stock, min/max stock thresholds, unit cost, storage location, expiry date, and supplier.
- **4-level urgency classification:** Critical (red), High (orange), Medium (blue), Low (green) based on stock vs. threshold ratio.
- **Stock percentage bar** — color-coded visual indicator per item.
- **Days-until-expiry** computed at render time from `expiryDate`.
- **Summary statistics strip:** total items, in-stock, low-stock, out-of-stock, critical counts.

---

## 4. Live Stock Tracking

- Stock quantities tracked in `localStorage` separately from static item definitions.
- All pages read from the same React context (`InventoryStockContext`).
- Stock changes from any page are immediately visible everywhere.
- **Receive stock** — increments quantity.
- **Log usage** — decrements quantity, clamped at 0.
- **Project stock-in** — deducts quantities when a project receives stock.
- **Undo on delete/edit** — restores stock when a project submission is removed.

---

## 5. Add / Edit / Delete Items

- Admin can add new inventory items via a modal form.
- Edit existing items (all fields editable).
- Delete items from local state.
- Item detail drawer with 3 tabs: Overview, Usage, Details.
- Per-item stock update history log.
- Multi-item stock update modal (batch quantity entry).

---

## 6. Stock Update Operations

Two transaction types, tracked separately:

| Type | Trigger | Effect on Stock |
|---|---|---|
| IN (Receive) | `UpdateStock → Receive Stock` tab | `+ quantity` |
| OUT (Usage) | `UpdateStock → Log Usage` tab | `- quantity` (min 0) |

- Transaction history with date, type, item, quantity, reason.
- Filters: date range, type, item search.
- **CSV export** with UTF-8 BOM for Excel compatibility.

---

## 7. Purchase Order Management

- Create, edit, view purchase orders.
- 6 order statuses: Draft → Approved → Processing → In Transit → Delivered → Cancelled.
- 3 payment statuses: Paid, Pending, Unpaid.
- Visual pipeline showing count at each stage.
- Bar chart of order value by supplier.
- Filters by status and payment status.
- All data is local state — no real ordering.

---

## 8. Supplier Directory

- 10 seed suppliers with full contact details, ratings, and payment terms.
- Add / edit supplier via modal.
- Star rating display (1–5).
- Filter by status and category.
- Total spend and order count per supplier.
- View detail modal.

---

## 9. Wastage Tracking

- Log wastage events with item, quantity, reason, cost impact, and notes.
- 5 waste reasons: Spoilage, Expired, Contamination, Over-preparation, Spillage.
- Analytics: monthly trend, breakdown by reason (pie), breakdown by category (bar).
- Filters by date range, reason, category.

---

## 10. Reports Dashboard

- 6 report type tiles (Stock, Wastage, PO, Suppliers, Expiry, Valuation).
- Quick insight charts embedded in the page.
- Report card "Generate" buttons (UI scaffolded — no file export wired to cards).

---

## 11. Settings

- Business info panel (name, email, currency, timezone).
- Notification toggles (low stock, expiry, order updates, wastage).
- Inventory defaults (threshold %, page size, expiry warning days).
- Password change form (UI only — no backend persistence).

---

## 12. Multi-Project Management

### Admin Side (`/projects`)
- Create projects with name, location, address, manager, phone, email, status.
- Assign login credentials (username + password) for each project.
- Edit and delete projects (cascades to user account + stock records).
- Filter projects by status.
- Click row to navigate to project detail.

### Project User Side (`/project/:projectId`)
- Standalone page with no sidebar.
- View project info card.
- **Submit Stock Received** — multi-item checklist form. Each submission deducts from the main inventory.
- **Log Stock Used** — per-item usage form.
- View full history of received and used stock.
- Admin can approve, edit, or delete submissions.

---

## 13. Responsive Layout

- **Desktop (≥992px):** Full sidebar (260px), collapsible to icon-only (72px).
- **Mobile (<992px):** Sidebar becomes a drawer overlay; hamburger toggle in header.
- Bootstrap 5 grid for all page layouts.
- All modals, tables, and charts adapt to screen width.

---

## 14. Dashboard Analytics

Six charts across Dashboard, Inventory, Wastage, and Reports pages:

| Chart | Type | Location |
|---|---|---|
| Stock Level Trend (7-day) | LineChart | Dashboard |
| Category Distribution | PieChart | Dashboard |
| Top Items by Value | BarChart (horizontal) | Dashboard |
| Monthly Wastage Cost | BarChart | Dashboard + Reports |
| Top Items by Daily Cost | BarChart | Inventory |
| Wastage by Reason | PieChart | Wastage |
| Wastage by Category | BarChart | Wastage + Reports |
| Order Value by Supplier | BarChart | PurchaseOrders |

---

## 15. Data Export

- **Transaction history CSV** from UpdateStock page.
- UTF-8 BOM prepended for Excel compatibility.
- Filename: `stock_transactions.csv`.
- Filtered export — only rows matching current filters are exported.
