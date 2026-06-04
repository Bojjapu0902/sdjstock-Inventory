# Data Layer Documentation

All data lives in `src/data/`. There is no backend. Static seed data comes from `mockData.js`; runtime mutations are persisted to `localStorage` via three purpose-built database modules.

---

## mockData.js — Static Seed Data

**Path:** `src/data/mockData.js`  
**Size:** 471 lines  
**Purpose:** Single source of truth for all initial/mock data — inventory items, suppliers, purchase orders, wastage, chart data, and KPIs.

### Inventory Items (93 items)

Each item has the following shape:

```js
{
  id:           'INV-001',          // Unique ID, format INV-NNN
  name:         'Rice Lalitha',
  category:     'Grains & Pulses',
  unit:         'kg',               // kg / L / g / pcs
  currentStock: 150,
  minStock:     50,
  maxStock:     300,
  unitCost:     48.00,              // INR
  location:     'Warehouse A',
  expiryDate:   '2027-06-01',
  supplier:     'Lalitha Stores'
}
```

#### Categories and Item Counts

| Category | Items |
|---|---|
| Spices & Masalas | 34 |
| Grains & Pulses | 15 |
| Flours & Cereals | 13 |
| Packaged Foods | 9 |
| Condiments | 8 |
| Pickles | 7 |
| Oils & Fats | 4 |
| Dry Fruits & Nuts | 3 |
| Beverages | 2 |
| **Total** | **93** |

#### Storage Locations

- `Warehouse A` — Bulk grains and rice
- `Dry Store` — Flours, spices, packaged goods, condiments
- `Spice Rack` — All spice items
- `Cold Room 1` — Pickles, ghee
- `Cold Room 2` — Fresh produce (mushrooms)

### Suppliers (10 records)

```js
{
  id:           'SUP-001',
  name:         'Lalitha Stores',
  category:     'Grains & Rice',
  contact:      'Lalitha Devi',
  email:        'lalitha@lalithastores.com',
  phone:        '+91-98490-11001',
  city:         'Hyderabad',
  country:      'India',
  rating:       4.8,               // out of 5
  totalOrders:  52,
  totalSpend:   94000,             // INR
  status:       'Active',          // Active | On Hold | Inactive
  since:        '2021-01-10',
  paymentTerms: 'Net 15'
}
```

All 10 suppliers are Active. Ratings range from 4.1 (Fresh Farms India) to 4.9 (Amul Distributors).

### Purchase Orders (10 records)

```js
{
  id:            'PO-2026-001',
  supplier:      'Lalitha Stores',
  date:          '2026-05-20',
  deliveryDate:  '2026-05-28',
  items:         2,
  totalValue:    12350.00,
  status:        'Delivered',      // Draft | Approved | Processing | In Transit | Delivered | Cancelled
  paymentStatus: 'Paid',           // Paid | Pending | Unpaid
  notes:         'Monthly rice restock'
}
```

#### PO Status Breakdown (seed data)

| Status | Count |
|---|---|
| Delivered | 4 |
| Approved | 2 |
| In Transit | 2 |
| Processing | 1 |
| Draft | 1 |

### Wastage Log (12 entries)

```js
{
  id:         'WST-001',
  date:       '2026-05-27',
  item:       'Mushrooms',
  category:   'Packaged Foods',
  qty:        1.5,
  unit:       'kg',
  reason:     'Spoilage',          // Spoilage | Expired | Contamination | Over-preparation | Spillage
  costImpact: 270.00,              // INR
  loggedBy:   'Chef Ravi',
  notes:      'Temperature issue in Cold Room 2'
}
```

Total seed wastage cost: **₹1,948.50** across 5 reason types.

### Chart / Analytics Data

| Export | Type | Description |
|---|---|---|
| `stockTrendData` | Array[7] | Daily in-stock/low-stock/out-of-stock counts Mon–Sun |
| `categoryDistribution` | Array[8] | Item count per category (pie chart data) |
| `monthlyWastageCost` | Array[6] | Monthly wastage cost Dec–May |
| `topItemsByValue` | Array[5] | Top 5 items by current stock value |
| `poStatusSummary` | Array[5] | PO count per status |
| `recentActivity` | Array[6] | Latest activity feed entries |
| `wastageByReason` | Array[5] | Count + cost grouped by waste reason |
| `wastageByCategory` | Array[7] | Wastage cost grouped by item category |
| `kpiData` | Object | Dashboard KPI values (6 metrics) |
| `itemUsageData` | Object map | Per-item daily usage + 7-day history (all 93 items) |

### Utility Functions

| Function | Signature | Returns |
|---|---|---|
| `getStockStatus` | `(current, min, max)` | `{ label, type }` — Out of Stock / Low Stock / Overstocked / In Stock |
| `getStockPercent` | `(current, max)` | `number` 0–100 |
| `getStockBarClass` | `(percent)` | `'low' \| 'medium' \| 'high'` |
| `getPOStatusType` | `(status)` | Badge type string |
| `getSupplierStatusType` | `(status)` | Badge type string |
| `formatCurrency` | `(value)` | INR formatted string (e.g. `₹1,24,380.00`) |
| `formatDate` | `(dateStr)` | Locale date (e.g. `Jun 1, 2027`) |
| `getDaysUntilExpiry` | `(dateStr)` | `number` (days from today) |

---

## inventoryDb.js — Live Stock Quantities

**Path:** `src/data/inventoryDb.js`  
**localStorage key:** `adjmarine_inventory_stock`  
**Shape:** `{ [itemId: string]: number }`

Seeds from `mockData.js` on first load. All subsequent reads and writes go to `localStorage`.

### Exported Functions

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `getInventoryStockMap()` | — | `{ [id]: qty }` | Full stock map. Seeds from mockData on first call. |
| `getItemStock(itemId)` | `string` | `number` | Current stock for one item. |
| `getInventoryItemsWithStock()` | — | `Item[]` | All 93 items merged with live stock quantities. |
| `deductMultipleStock(stockMap, items)` | `map, [{itemId, quantity}]` | updated map | Subtract quantities (project stock-in). Clamps to 0. |
| `restoreMultipleStock(stockMap, items)` | `map, [{itemId, quantity}]` | updated map | Restore quantities (project edit/delete). |
| `resetInventoryStock()` | — | updated map | Resets all quantities to mockData defaults. |
| `persistMap(map)` | `map` | — | Write map to localStorage (internal, also exported for hook). |

---

## loginDb.js — User Authentication

**Path:** `src/data/loginDb.js`  
**localStorage key:** `adjmarine_users`  
**sessionStorage key:** `adjmarine_current_user`

### User Schema

```js
{
  id:        'USR-000',
  username:  'sdj',
  password:  'sdj123@',          // plain text (no backend, no hashing)
  role:      'Admin',            // 'Admin' | 'User'
  name:      'System Admin',
  projectId: null,               // null for Admin; project ID string for User
  createdAt: '2026-01-01'
}
```

### Seed Admin Account

- **Username:** `sdj`
- **Password:** `sdj123@`
- **Role:** Admin
- Auto-seeded on first `getUsers()` call if storage is empty.

### Exported Functions

| Function | Description |
|---|---|
| `getUsers()` | Load all users. Seeds admin on first run. |
| `authenticate(username, password)` | Returns matched user object or `null`. |
| `addProjectUser(users, { projectId, projectName, username, password })` | Register a project-scoped user. Replaces existing if same projectId. |
| `updateProjectUser(users, { projectId, projectName, username, password })` | Update or remove project user credentials. |
| `deleteProjectUser(users, projectId)` | Remove user linked to a project. |
| `saveUsers(users)` | Persist full users array. |
| `clearUsers()` | Wipe user store (dev use). |
| `setCurrentUser(user)` | Persist logged-in user to sessionStorage. |
| `getCurrentUser()` | Read logged-in user from sessionStorage. |
| `clearCurrentUser()` | Clear session on logout. |

---

## projectsDb.js — Projects and Stock Records

**Path:** `src/data/projectsDb.js`

### localStorage Keys

| Key | Shape | Description |
|---|---|---|
| `adjmarine_projects` | `Project[]` | All project records |
| `adjmarine_stock_received` | `{ [projectId]: Submission[] }` | Stock-received submissions per project |
| `adjmarine_stock_used` | `{ [projectId]: UsedRecord[] }` | Stock-used entries per project |

### Project Schema

```js
{
  id:        'PRJ-001',
  name:      'Main Store',
  location:  'Mumbai',
  address:   '...',
  manager:   'John',
  phone:     '...',
  email:     '...',
  status:    'Active',            // Active | Inactive | Maintenance
  username:  'proj_manager',     // login credential for project user
  password:  'password123',
  createdAt: '2026-06-01'
}
```

### Stock Received Submission Schema

```js
{
  id:        'SR-1717000000000',
  date:      '2026-06-01',
  items: [
    { itemId: 'INV-001', name: 'Rice Lalitha', quantity: 50, unit: 'kg' },
    ...
  ],
  notes:     'Weekly delivery',
  submittedBy: 'proj_manager'
}
```

### Stock Used Record Schema

```js
{
  id:        'SU-1717000000000',
  date:      '2026-06-01',
  itemId:    'INV-001',
  itemName:  'Rice Lalitha',
  quantity:  10,
  unit:      'kg',
  purpose:   'Daily cooking',
  loggedBy:  'proj_manager'
}
```

### Exported Functions

#### Projects CRUD

| Function | Description |
|---|---|
| `getProjects()` | Read all projects from storage. |
| `saveProjects(projects)` | Persist full projects array. |
| `addProject(projects, formData)` | Add new project; auto-generates ID (`PRJ-NNN`). |
| `updateProject(projects, id, formData)` | Update project by ID. |
| `deleteProject(projects, id)` | Delete project by ID. |
| `nextProjectId(projects)` | Generate next sequential `PRJ-NNN` ID. |

#### Stock Received

| Function | Description |
|---|---|
| `getAllStockReceived()` | Read full `{ [projectId]: [] }` map. |
| `getStockReceived(projectId)` | Records for one project. |
| `addStockReceived(allReceived, projectId, submission)` | Append new submission. |
| `updateStockReceived(allReceived, projectId, submissionId, updated)` | Edit existing submission. |
| `deleteStockReceived(allReceived, projectId, submissionId)` | Remove submission. |
| `clearProjectStockReceived(allReceived, projectId)` | Delete all records for a project. |

#### Stock Used

| Function | Description |
|---|---|
| `getAllStockUsed()` | Read full `{ [projectId]: [] }` map. |
| `getStockUsed(projectId)` | Records for one project. |
| `addStockUsed(allUsed, projectId, formData)` | Append new used record. |
| `deleteStockUsed(allUsed, projectId, recordId)` | Remove used record. |
| `clearProjectStockUsed(allUsed, projectId)` | Delete all used records for a project. |
| `clearAllProjectData()` | Wipe all project data from storage (dev use). |
