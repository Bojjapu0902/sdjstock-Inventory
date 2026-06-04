# Routing

Routing is handled by React Router DOM v6. All route configuration lives in `src/App.jsx`.

---

## Route Table

| Path | Component | Layout | Access |
|---|---|---|---|
| `/` | `<Navigate>` redirect | — | All authenticated |
| `/inventory` | `Inventory` | Layout (sidebar) | Admin |
| `/add-items` | `AddItems` | Layout (sidebar) | Admin |
| `/stock-update` | `UpdateStock` | Layout (sidebar) | Admin |
| `/orders` | `PurchaseOrders` | Layout (sidebar) | Admin |
| `/suppliers` | `Suppliers` | Layout (sidebar) | Admin |
| `/wastage` | `Wastage` | Layout (sidebar) | Admin |
| `/reports` | `Reports` | Layout (sidebar) | Admin |
| `/settings` | `Settings` | Layout (sidebar) | Admin |
| `/projects` | `Projects` | Layout (sidebar) | Admin |
| `/project/:projectId` | `ProjectDetails` | No sidebar (standalone) | User (project-scoped) |
| `*` (unmatched) | `<Navigate to="/">` | — | — |

---

## Root Redirect Logic

On `/`, the app redirects based on the logged-in user's role:

```js
const rootRedirect = user?.role === 'User' && user?.projectId
  ? `/project/${user.projectId}`
  : '/inventory';
```

- **Admin** → `/inventory`
- **Project User** → `/project/<their-project-id>`

---

## Layout Split

There are two top-level layout modes:

### 1. Admin Layout (`<Layout>`)

All admin routes are nested inside a wildcard `path="*"` route that renders `<Layout>`. The nested `<Routes>` inside `<Layout>` define the actual page routes.

```jsx
<Route path="*" element={
  <Layout user={user} onLogout={handleLogout}>
    <Routes>
      <Route path="/inventory" element={<Inventory />} />
      ...
    </Routes>
  </Layout>
} />
```

Layout provides:
- Fixed sidebar (collapsible)
- Fixed header with search + user menu
- Scrollable main content area

### 2. Project User Layout (standalone)

The `/project/:projectId` route renders `<ProjectDetails>` directly, bypassing `<Layout>`. This gives project users a focused view with no sidebar navigation.

```jsx
<Route
  path="/project/:projectId"
  element={<ProjectDetails onLogout={handleLogout} />}
/>
```

---

## Context Wrapping

The `<InventoryStockProvider>` wraps the entire `<BrowserRouter>` tree, so all pages share the same live stock state:

```jsx
<BrowserRouter>
  <InventoryStockProvider>
    <Routes>
      ...all routes...
    </Routes>
  </InventoryStockProvider>
</BrowserRouter>
```

---

## Navigation

Navigation between admin pages is driven by `<Sidebar>` — each nav link uses React Router's `<NavLink>` so the active page is visually highlighted.

There are no programmatic `navigate()` calls between pages outside of the root redirect. All transitions are user-driven link clicks.
