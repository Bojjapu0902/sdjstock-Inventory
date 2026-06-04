# Components Documentation

## Common Components (`src/components/common/`)

These are shared, reusable building blocks used across multiple pages.

---

### KPICard (`src/components/common/KPICard.jsx`)

A metric summary tile used on Dashboard, Inventory, Suppliers, PurchaseOrders, and Wastage pages.

#### Props

| Prop | Type | Description |
|---|---|---|
| `icon` | ReactNode | Icon element (from react-icons) |
| `iconBg` | string | CSS background color for icon circle |
| `iconColor` | string | CSS color for icon |
| `accent` | string | Left-border accent color (CSS color) |
| `value` | string \| number | Main metric value |
| `label` | string | Label below the value |
| `trend` | number | Trend value (positive or negative) |
| `trendType` | `'up' \| 'down' \| 'neutral'` | Direction indicator |
| `trendText` | string | Trend label (e.g. "vs last month") |

#### Rendered Structure
```
┌─────────────────────────────────┐
│ [Icon]   VALUE                  │
│          Label                  │
│          ▲ +12 vs last month    │
└─────────────────────────────────┘
```

---

### StatusBadge (`src/components/common/StatusBadge.jsx`)

A colored pill badge for status indicators.

#### Props

| Prop | Type | Description |
|---|---|---|
| `type` | string | `success \| warning \| danger \| info \| neutral \| primary` |
| `label` | string | Text displayed in the badge |
| `dot` | boolean | Show a small colored dot before label |

#### Type → Color Mapping

| Type | Color |
|---|---|
| `success` | Green |
| `warning` | Amber |
| `danger` | Red |
| `info` | Blue |
| `primary` | Indigo |
| `neutral` | Grey |

#### Usage Examples
- PO Status: Draft→neutral, Approved→primary, In Transit→info, Delivered→success, Cancelled→danger
- Supplier Status: Active→success, On Hold→warning, Inactive→danger
- Stock Status: In Stock→success, Low Stock→warning, Out of Stock→danger, Overstocked→info

---

### DataTable (`src/components/common/DataTable.jsx`)

A sortable, paginated table component.

#### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns` | `Column[]` | required | Column definitions |
| `data` | `object[]` | required | Row data array |
| `pageSize` | number | 10 | Rows per page |
| `selectable` | boolean | false | Show row checkboxes |
| `emptyMessage` | string | 'No data found' | Message when data is empty |

#### Column Definition Shape

```js
{
  key:      'supplier',       // data key to access from row
  label:    'Supplier',       // column header text
  sortable: true,             // enable click-to-sort
  render:   (value, row) => ReactNode  // optional custom cell renderer
}
```

#### Features
- Click column header to toggle ascending / descending sort.
- Pagination controls at the bottom (page numbers + prev/next).
- Page size options: 10, 20, 50.
- Optional row selection with checkboxes.
- Empty state message when `data` is an empty array.

---

### Modal (`src/components/common/Modal.jsx`)

A reusable dialog overlay.

#### Props

| Prop | Type | Description |
|---|---|---|
| `show` | boolean | Controls visibility |
| `onClose` | function | Called on backdrop click or Escape key |
| `title` | string | Modal header title |
| `children` | ReactNode | Modal body content |
| `footer` | ReactNode | Optional footer slot (buttons) |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | Width preset |

#### Behaviour
- Backdrop click closes the modal (calls `onClose`).
- `Escape` key closes the modal.
- Scrollable body if content is tall.
- Renders a close (×) button in the header.

---

### Loader (`src/components/common/Loader.jsx`)

The startup splash screen shown during the `loading` state (first ~2.8 seconds).

#### Props

| Prop | Type | Description |
|---|---|---|
| `onComplete` | function | Called after animation completes |

#### Animations
- Gradient background with floating decorative orbs.
- Rotating rings around the logo mark.
- Progress bar filling from 0% to 100%.
- Status messages cycling:
  1. "Loading inventory data…"
  2. "Connecting to stock database…"
  3. "Preparing your dashboard…"
  4. "Almost ready…"

Duration: ~2.8 seconds total.

---

## Layout Components (`src/components/layout/`)

---

### Layout (`src/components/layout/Layout.jsx`)

The main app shell that wraps all admin pages.

#### Props

| Prop | Type | Description |
|---|---|---|
| `user` | object | Current user (passed from App.jsx) |
| `onLogout` | function | Logout callback |
| `children` | ReactNode | Page content rendered in the main area |

#### Structure
```
┌────────────────────────────────────────────┐
│  <Header>  (fixed top, full width)         │
├──────────┬─────────────────────────────────┤
│          │                                 │
│ <Sidebar>│  children (scrollable)          │
│          │                                 │
│          │                                 │
└──────────┴─────────────────────────────────┘
```

#### State
- `sidebarOpen: boolean` — toggles sidebar between expanded (260px) and collapsed (72px icon-only mode).

#### Responsive Behaviour
- **Desktop (≥992px):** Sidebar pushes content; collapse toggles width.
- **Mobile (<992px):** Sidebar becomes a drawer overlay; toggled by hamburger menu in Header.

---

### Header (`src/components/layout/Header.jsx`)

Top navigation bar.

#### Props

| Prop | Type | Description |
|---|---|---|
| `user` | object | Current logged-in user |
| `onLogout` | function | Logout callback |
| `onMenuToggle` | function | Toggles sidebar open/closed |
| `sidebarOpen` | boolean | Current sidebar state |

#### Sections (left to right)
1. **Hamburger / menu toggle** — calls `onMenuToggle`.
2. **Page title** — dynamically derived from current route.
3. **Search input** — text field (UI only, no search logic wired globally).
4. **Notification bell** — icon button (UI only).
5. **User avatar dropdown:**
   - User name + role label.
   - Profile link.
   - Settings link.
   - Logout button → calls `onLogout`.

---

### Sidebar (`src/components/layout/Sidebar.jsx`)

Collapsible navigation sidebar with dark theme.

#### Props

| Prop | Type | Description |
|---|---|---|
| `open` | boolean | Expanded (true) or icon-only (false) |
| `user` | object | Current user for footer display |
| `onLogout` | function | Logout callback |

#### Dimensions
- Expanded: 260px wide
- Collapsed: 72px wide (icons only, tooltips on hover)
- Transition: 0.22s cubic-bezier

#### Navigation Sections

**Main**
| Label | Route | Badge |
|---|---|---|
| Inventory | `/inventory` | 5 (low stock indicator) |
| Add Items | `/add-items` | — |
| Update Stock | `/stock-update` | — |

**Analytics**
| Label | Route |
|---|---|
| Purchase Orders | `/orders` |
| Suppliers | `/suppliers` |
| Wastage | `/wastage` |
| Reports | `/reports` |

**System**
| Label | Route |
|---|---|
| Projects | `/projects` |
| Settings | `/settings` |

#### Footer
Shows user avatar, name, and role when expanded. Logout button always visible.

#### Active State
Uses React Router's `<NavLink>` — active route gets the `active` CSS class for visual highlight.
