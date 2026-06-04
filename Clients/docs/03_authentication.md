# Authentication System

Authentication is entirely client-side. Credentials are stored in `localStorage`. Sessions are tracked in `sessionStorage`. There is no JWT, no server, and no HTTPS requirement for development.

---

## Files Involved

| File | Role |
|---|---|
| `src/contexts/AuthContext.jsx` | React context providing `user`, `login()`, `logout()` app-wide |
| `src/data/loginDb.js` | localStorage read/write + session management |
| `src/pages/Login.jsx` | Login form UI |
| `src/App.jsx` | Top-level auth state machine |

---

## AuthContext (`src/contexts/AuthContext.jsx`)

Wraps the entire app. Any component can call `useAuth()` to get the current user and auth actions.

### Provider: `<AuthProvider>`

```jsx
<AuthProvider>
  {children}
</AuthProvider>
```

Initialises `user` state from `sessionStorage` on mount so the session survives a page refresh.

### Context Value

```js
{
  user:   UserObject | null,   // currently logged-in user, or null
  login:  (userData) => void,  // persist to sessionStorage + set state
  logout: () => void           // clear session + redirect to "/"
}
```

### `useAuth()` Hook

```jsx
import { useAuth } from '../contexts/AuthContext';

const { user, login, logout } = useAuth();
```

Throws if called outside `<AuthProvider>`.

---

## Login Flow

```
User opens app
  → App.jsx: appState = 'loading'  → <Loader> (2.8s)
  → App.jsx: appState = 'login'    → <Login>
      ↓ form submit
      loginDb.authenticate(username, password)
      ↓ match found
      loginDb.setCurrentUser(user)   → sessionStorage
      App.jsx: handleLogin(user)     → appState = 'app'
      ↓ role check
      Admin  → redirect /inventory
      User   → redirect /project/:projectId
```

---

## Logout Flow

```
User clicks logout (Header or Sidebar or ProjectDetails)
  → loginDb.clearCurrentUser()    → sessionStorage cleared
  → window.history.replaceState('/') → URL reset
  → App.jsx: setUser(null) + setAppState('login')
  → <Login> rendered
```

---

## User Roles

| Role | Home Route | Access |
|---|---|---|
| `Admin` | `/inventory` | All pages: Dashboard, Inventory, AddItems, UpdateStock, PurchaseOrders, Suppliers, Wastage, Reports, Settings, Projects |
| `User` | `/project/:projectId` | Project-specific view only (`ProjectDetails.jsx`) — no sidebar, no admin pages |

---

## Seed Credentials

| Field | Value |
|---|---|
| Username | `sdj` |
| Password | `sdj123@` |
| Role | Admin |

Auto-created on first `getUsers()` call if `localStorage` is empty.

---

## Project User Accounts

Each project can have one login credential pair. When a project is created or edited in `Projects.jsx` with a username + password:

1. `loginDb.addProjectUser()` or `updateProjectUser()` is called.
2. The user is saved with `role: 'User'` and `projectId` linking them to the project.
3. On login, the project user is routed to `/project/:projectId` — the stripped-down `ProjectDetails` view with no sidebar.

When a project is deleted:
- `loginDb.deleteProjectUser()` removes the associated user account.

---

## Session Storage Schema

```js
// sessionStorage key: "adjmarine_current_user"
{
  id:        'USR-000',
  username:  'sdj',
  password:  'sdj123@',
  role:      'Admin',
  name:      'System Admin',
  projectId: null,
  createdAt: '2026-01-01'
}
```

Session clears when the browser tab is closed (sessionStorage behaviour) or on logout.

---

## Security Notes

- Passwords are stored in plain text in `localStorage` — this is intentional for a no-backend demo.
- There is no token expiry; session lasts until tab close or logout.
- No route guards — `App.jsx` controls rendering based on `appState`; direct URL access is blocked by the state machine.
