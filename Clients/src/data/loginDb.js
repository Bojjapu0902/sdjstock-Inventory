// =====================================================
//  Login Authentication Database — localStorage layer
//  Stores admin + all project-level users.
//  Key: "adjmarine_users"
// =====================================================

const KEY         = 'adjmarine_users';
const SESSION_KEY = 'adjmarine_current_user';

const SEED_ADMIN = {
  id:        'USR-000',
  username:  'sdj',
  password:  'sdj123@',
  role:      'Admin',
  name:      'System Admin',
  projectId: null,
  createdAt: '2026-01-01',
};

/* ── internal helpers ─────────────────────────────── */
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persist(users) {
  try {
    localStorage.setItem(KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('[loginDb] localStorage write failed:', e);
  }
}

/* ══════════════════════════════════════════════════
   READ
   ══════════════════════════════════════════════════ */

/**
 * Load all users. Seeds the admin account on first run.
 */
export function getUsers() {
  const stored = load();
  if (!stored) {
    persist([SEED_ADMIN]);
    return [SEED_ADMIN];
  }
  return stored;
}

/* ══════════════════════════════════════════════════
   AUTHENTICATION
   ══════════════════════════════════════════════════ */

/**
 * Validate credentials. Returns the matched user object or null.
 */
export function authenticate(username, password) {
  if (!username || !password) return null;
  const u = username.trim().toLowerCase();
  const p = password.trim();
  if (!u || !p) return null;
  const users = getUsers();
  return users.find(
    (user) => user.username.toLowerCase() === u && user.password.trim() === p
  ) || null;
}

/* ══════════════════════════════════════════════════
   PROJECT USER MANAGEMENT
   Called from Projects.jsx whenever a project with
   credentials is created, updated, or deleted.
   ══════════════════════════════════════════════════ */

/**
 * Register a new project user.
 * If the project already has a user, it is replaced.
 * Returns the updated users array.
 */
export function addProjectUser(users, { projectId, projectName, username, password }) {
  if (!username || !password) return users;
  const id      = `USR-${Date.now()}`;
  const newUser = {
    id,
    username:  username.trim().toLowerCase(),
    password:  password.trim(),
    role:      'User',
    name:      projectName,
    projectId,
    createdAt: new Date().toISOString().split('T')[0],
  };
  const updated = [
    ...users.filter((u) => u.projectId !== projectId),
    newUser,
  ];
  persist(updated);
  return updated;
}

/**
 * Update the credentials of an existing project user.
 * If username/password are both blank the user is removed.
 * Returns the updated users array.
 */
export function updateProjectUser(users, { projectId, projectName, username, password }) {
  const existing = users.find((u) => u.projectId === projectId);

  if (!username && !password) {
    const updated = users.filter((u) => u.projectId !== projectId);
    persist(updated);
    return updated;
  }

  if (existing) {
    const updated = users.map((u) =>
      u.projectId === projectId
        ? { ...u, username: (username.trim().toLowerCase()) || u.username, password: (password.trim()) || u.password, name: projectName, role: 'User' }
        : u
    );
    persist(updated);
    return updated;
  }

  return addProjectUser(users, { projectId, projectName, username, password });
}

/**
 * Remove the user linked to a project.
 * Returns the updated users array.
 */
export function deleteProjectUser(users, projectId) {
  const updated = users.filter((u) => u.projectId !== projectId);
  persist(updated);
  return updated;
}

/* ══════════════════════════════════════════════════
   GENERAL USER CREATION  (admin panel)
   ══════════════════════════════════════════════════ */

/**
 * Create any user (Admin or project User) from the admin panel.
 * Returns null and an error message if the username is already taken.
 * Otherwise returns { updated: User[], error: null }.
 */
export function createUser(users, { username, password, role, name, projectId, email, phone }) {
  const uname = username?.trim().toLowerCase();
  const pass  = password?.trim();
  if (!uname || !pass) return { updated: users, error: 'Username and password are required.' };

  const duplicate = users.find((u) => u.username.toLowerCase() === uname);
  if (duplicate) return { updated: users, error: `Username "${uname}" is already taken.` };

  const id = `USR-${Date.now()}`;
  const newUser = {
    id,
    username:  uname,
    password:  pass,
    role:      role  || 'User',
    name:      name?.trim() || uname,
    projectId: role === 'Admin' ? null : (projectId?.trim() || null),
    email:     email?.trim() || '',
    phone:     phone?.trim() || '',
    createdAt: new Date().toISOString().split('T')[0],
  };

  const updated = [...users, newUser];
  persist(updated);
  return { updated, error: null };
}

/** Delete a user by ID. Returns the updated users array. */
export function deleteUser(users, userId) {
  const updated = users.filter((u) => u.id !== userId);
  persist(updated);
  return updated;
}

/* ══════════════════════════════════════════════════
   ADMIN UTILITIES
   ══════════════════════════════════════════════════ */

/** Save the full users array (admin use). */
export function saveUsers(users) {
  persist(users);
}

/** Wipe the user store (dev use). */
export function clearUsers() {
  localStorage.removeItem(KEY);
}

/* ══════════════════════════════════════════════════
   SESSION  —  who is currently logged in
   ══════════════════════════════════════════════════ */

/** Persist the logged-in user to sessionStorage. */
export function setCurrentUser(user) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch (e) { /* noop */ }
}

/** Read the logged-in user from sessionStorage. Returns null if not found. */
export function getCurrentUser() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/** Clear session on logout. */
export function clearCurrentUser() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* noop */ }
}
