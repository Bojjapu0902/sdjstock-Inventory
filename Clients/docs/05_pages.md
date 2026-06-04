# Pages Documentation

All pages are located in `src/pages/`. Each page manages its own local state using `useState`, `useMemo`, and `useCallback`. There is no global state library.

---

## Login (`src/pages/Login.jsx`)

**Route:** Rendered by App.jsx state machine before routing starts.

### Layout
Two-panel design:
- **Left panel** — brand panel with logo, tagline, and feature bullets.
- **Right panel** — login form.

### Features
- Username + password fields with validation.
- Password visibility toggle (show/hide).
- "Remember me" checkbox (UI only).
- Demo credentials hint displayed below the form.
- Shake animation on failed login.
- Error message display.

### Auth
On submit, calls `loginDb.authenticate(username, password)`. On success, calls `onLogin(user)` prop which transitions the App state machine to `'app'`.

---

## Dashboard (`src/pages/Dashboard.jsx`)

**Route:** Not directly routed — Admin lands on `/inventory`. Dashboard may be accessible if sidebar nav includes it.

### Sections
1. **KPI Strip** — 6 metric cards from `kpiData`:
   - Total Stock Items (93)
   - Low Stock Alerts (8)
   - Purchase Orders MTD (10)
   - Wastage This Month (₹1,949)
   - Total Inventory Value (₹1,24,380)
   - Active Suppliers (10)

2. **Stock Level Trend** — 7-day line chart (Mon–Sun) showing in-stock, low-stock, and out-of-stock counts. Data from `stockTrendData`.

3. **Category Distribution** — Donut/pie chart showing item count per category. Data from `categoryDistribution`.

4. **Top Items by Value** — Horizontal bar chart of top 5 items by current stock value. Data from `topItemsByValue`.

5. **Monthly Wastage Cost** — 6-month bar chart (Dec–May). Data from `monthlyWastageCost`.

6. **Low Stock Alerts** — List of items where `currentStock <= minStock`.

7. **Expiring Soon** — Items with expiry within 10 days.

8. **Recent Activity Feed** — 6 entries from `recentActivity` (orders, alerts, wastage, restocks).

---

## Inventory (`src/pages/Inventory.jsx`)

**Route:** `/inventory`

### Sections
1. **Summary Strip** — 5 stats: total items, in-stock count, low-stock count, out-of-stock count, critical items.

2. **Critical Items Alerts Grid** — Red alert cards for items at critical stock level.

3. **Charts Row:**
   - Top items by daily cost (bar chart)
   - Top items by daily volume (bar chart)

4. **All Items Table** — Sortable, paginated table of all 93 items, sorted by days remaining (most urgent first).

### Urgency Levels
Items are classified into 4 urgency tiers based on stock ratio:

| Level | Color | Threshold |
|---|---|---|
| Critical | Red | Stock ≤ min |
| High | Orange | Stock ≤ 1.5× min |
| Medium | Blue | Stock ≤ 2× min |
| Low | Green | Stock > 2× min |

### Table Columns
Item ID, Name, Category, Unit, Current Stock (with bar), Min/Max, Unit Cost, Location, Expiry Date, Urgency badge.

---

## AddItems (`src/pages/AddItems.jsx`)

**Route:** `/add-items`

### Layout
Real-time clock displayed in the header area. Items shown in an accordion list.

### Features

#### Item List (Accordion)
- All 93 items shown in expandable rows.
- Each item expands to show stock bar, usage stats, and quick action buttons.

#### Add / Edit / Delete Items
- **Add Item** button opens a modal form for creating a new item.
- **Edit** opens the same form pre-filled.
- **Delete** removes item from list (local state only).

#### Update Stock Modal (Multi-item)
- Checklist mode: select multiple items and enter quantities in one session.
- Single-item mode: update one item directly from its row.
- Logs the update with timestamp to per-item history.

#### Item Detail Drawer (3 tabs)
1. **Overview** — Stock bar, KPIs, quick stats.
2. **Usage** — 7-day usage history sparkline chart.
3. **Details** — Full item metadata (cost, location, expiry, supplier).

#### Stock Update History
- Per-item log of all stock updates (date, qty change, reason).

---

## UpdateStock (`src/pages/UpdateStock.jsx`)

**Route:** `/stock-update`

### Tabs

#### 1. Receive Stock
- Form: select item from dropdown, enter quantity received, date, supplier, notes.
- Guide panel explaining how to use the form.
- Recent Receipts list showing last 10 receive operations.
- Increments item stock via `adjustStock()` from the inventory context.

#### 2. Log Usage
- Form: select item, enter quantity used, date, purpose, logged-by.
- Guide panel.
- Recent Usage list showing last 10 usage entries.
- Decrements item stock via `adjustStock()`.

#### 3. Transaction History
- Full table of all IN (receive) and OUT (usage) transactions.
- Filters: date range, transaction type (all/in/out), item search.
- **CSV Export** — Downloads filtered transactions as `stock_transactions.csv` with UTF-8 BOM (for Excel compatibility).

### Summary Stats
Month-to-date totals: total received, total used, net change, transaction count.

---

## PurchaseOrders (`src/pages/PurchaseOrders.jsx`)

**Route:** `/orders`

### Sections

1. **KPI Strip** — Total POs, active POs, delivered POs, total spend.

2. **Order Pipeline** — Visual status flow (Draft → Approved → Processing → In Transit → Delivered) with count badges.

3. **Order Value by Supplier** — Bar chart showing spend per supplier.

4. **Orders Table** — Filterable, sortable `<DataTable>` with columns: PO ID, Supplier, Date, Delivery Date, Items, Value, Status badge, Payment status badge, Notes.

### Modals

#### Create / Edit PO Modal
Fields: Supplier (dropdown), Order Date, Expected Delivery, Items count, Total Value, Status, Payment Status, Notes.

#### View PO Modal
Read-only detail view of the selected order.

### Filters
- Search by PO ID or supplier name.
- Filter by status.
- Filter by payment status.

---

## Suppliers (`src/pages/Suppliers.jsx`)

**Route:** `/suppliers`

### Sections

1. **KPI Strip** — Total suppliers, active, on hold, total spend.

2. **Suppliers Table** — Filterable `<DataTable>` with columns: ID, Name, Category, Contact, Email, Phone, City, Rating (stars), Total Orders, Total Spend, Status badge, Since date, Payment Terms.

### Modals

#### Add / Edit Supplier Modal
Fields: Name, Category, Contact person, Email, Phone, City, Country, Rating, Status, Since date, Payment Terms.

#### View Supplier Detail Modal
Full read-only view of supplier details.

### Filters
- Search by name or contact.
- Filter by status.
- Filter by category.

---

## Wastage (`src/pages/Wastage.jsx`)

**Route:** `/wastage`

### Sections

1. **KPI Strip** — Total entries, total cost, this week's cost, top waste reason.

2. **Monthly Wastage Trend** — 6-month bar chart (data from `monthlyWastageCost`).

3. **Wastage by Reason** — Pie chart (data from `wastageByReason`).

4. **Wastage by Category** — Bar chart (data from `wastageByCategory`).

5. **Wastage Log Table** — Filterable `<DataTable>` with columns: ID, Date, Item, Category, Quantity + unit, Reason, Cost Impact, Logged By, Notes.

### Log Wastage Modal
Fields: Date, Item (dropdown from inventory), Quantity, Unit, Reason (dropdown), Cost Impact, Logged By, Notes.

### Filters
- Date range filter.
- Reason filter.
- Category filter.
- Item search.

---

## Reports (`src/pages/Reports.jsx`)

**Route:** `/reports`

### Layout
Six report card tiles in a grid, each representing a report type.

| Report | Description |
|---|---|
| Stock Status Report | Current stock levels, low stock, out-of-stock |
| Wastage Analysis | Waste by reason, category, and trend |
| Purchase Order Report | PO pipeline, spend, delivery performance |
| Supplier Performance | Ratings, orders, spend per supplier |
| Expiry Tracking | Items expiring in next 30/60/90 days |
| Inventory Valuation | Stock value by category and item |

### Quick Insight Charts
- 6-month wastage cost trend bar chart.
- Wastage by category bar chart.

Report cards show a "Generate" action — currently UI only (no file export wired to report cards).

---

## Settings (`src/pages/Settings.jsx`)

**Route:** `/settings`

### Sections

1. **Business Information**
   - Business name, email, currency (INR), timezone.
   - Save button (updates local state only).

2. **Notification Preferences**
   - Toggle switches: Low stock alerts, Expiry warnings, Order updates, Wastage alerts.

3. **Inventory Defaults**
   - Default low-stock threshold percentage.
   - Default page size for tables.
   - Default expiry warning days.

4. **Security**
   - Change password form: current password, new password, confirm new password.
   - No real password update (no backend).

All settings persist in component local state only — reset on page refresh.

---

## Projects (`src/pages/Projects.jsx`)

**Route:** `/projects`

### Purpose
Admin creates and manages projects. Each project can represent a site, store, or vessel. Each project can have its own user credential for the project-scoped login.

### Sections

1. **KPI Strip** — Active projects, inactive, maintenance.

2. **Search and Filter Bar** — Search by name, filter by status (All / Active / Inactive / Maintenance).

3. **Projects Table / Card List** — Each row shows: Project ID, Name, Location, Manager, Phone, Status badge. Click row → opens `ProjectDetails` page.

### Add Project Modal
Fields:
- Project Name
- Location
- Address
- Manager Name
- Phone
- Email
- Status (Active / Inactive / Maintenance)
- Username (for project user login)
- Password (for project user login)

On save:
1. `projectsDb.addProject()` creates the project record.
2. `loginDb.addProjectUser()` creates a matching user account.

### Edit Project
Same modal pre-filled. On save:
1. `projectsDb.updateProject()` updates the record.
2. `loginDb.updateProjectUser()` updates credentials.

### Delete Project
On confirm:
1. `projectsDb.deleteProject()` removes the project.
2. `loginDb.deleteProjectUser()` removes the linked user.
3. `projectsDb.clearProjectStockReceived()` + `clearProjectStockUsed()` clean up records.

---

## ProjectDetails (`src/pages/ProjectDetails.jsx`)

**Route:** `/project/:projectId`

**Access:** Project users (no sidebar). Also reachable by admin clicking a project row in Projects page.

### Layout
Standalone page — no Layout shell. Has its own header with project name, status badge, and a logout button.

### Sections

1. **Project Info Card** — Name, location, manager, phone, status.

2. **Stock Received Accordion** — List of all submission sessions for this project. Each accordion item expands to show the multi-item checklist submitted in that session. Submission shows date, items list, quantities, and notes.

3. **Stock Used Table** — All stock-used records for this project: date, item, quantity, purpose, logged-by.

### Actions (Admin view)
When accessed by an Admin:
- **Approve / Edit submission** — Edit items or quantities in a stock-received submission.
- **Delete submission** — Removes submission and restores stock quantities.

### Actions (Project User view)
- **Add Stock Received** — Opens a multi-item checklist modal to submit a new stock delivery. Selecting items and quantities deducts them from the main inventory via `deductStock()`.
- **Log Stock Used** — Form to record usage of an item.

### Stock Deduction on Submission
When a project user submits received stock:
1. `projectsDb.addStockReceived()` saves the submission.
2. `inventoryDb.deductMultipleStock()` (via context `deductStock()`) reduces main inventory quantities.

When a submission is deleted or edited:
1. Old quantities are restored via `restoreStock()`.
2. New quantities are deducted (on edit).
