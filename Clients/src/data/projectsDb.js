// =====================================================
//  Projects Database — localStorage persistence layer
//  Seeded from projectsData.json on first run.
//  Keys are namespaced under "adjmarine_" to avoid
//  collisions with other apps on the same origin.
// =====================================================

import SEED from './projectsData.json';

const KEYS = {
  projects:  'adjmarine_projects',
  received:  'adjmarine_stock_received', // { [projectId]: StockReceivedRecord[] }
  used:      'adjmarine_stock_used',     // { [projectId]: StockUsedRecord[]     }
  seeded:    'adjmarine_seeded_v1',      // flag — prevents re-seeding on re-open
};

/* ── internal helpers ─────────────────────────────── */
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Seed localStorage from projectsData.json once per browser session
 * (or whenever the storage has been wiped).
 * Only runs when the seeded-flag key is absent.
 */
function seedIfEmpty() {
  if (localStorage.getItem(KEYS.seeded)) return;

  /* Only seed individual keys that are truly absent */
  if (!localStorage.getItem(KEYS.projects)) {
    persist(KEYS.projects, SEED.projects);
  }
  if (!localStorage.getItem(KEYS.received)) {
    persist(KEYS.received, SEED.stockAssignments);
  }
  if (!localStorage.getItem(KEYS.used)) {
    persist(KEYS.used, SEED.stockUsed);
  }

  localStorage.setItem(KEYS.seeded, '1');
}

/* Run once when the module is first imported */
seedIfEmpty();

function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[projectsDb] localStorage write failed:', e);
  }
}

/* ── ID generators ────────────────────────────────── */
export function nextProjectId(projects) {
  const max = projects.reduce((m, p) => {
    const n = parseInt((p.id || '').replace('PRJ-', ''), 10);
    return Math.max(m, isNaN(n) ? 0 : n);
  }, 0);
  return `PRJ-${String(max + 1).padStart(3, '0')}`;
}

export function nextRecordId(prefix) {
  return `${prefix}-${Date.now()}`;
}

/* ══════════════════════════════════════════════════
   PROJECTS
   ══════════════════════════════════════════════════ */

/** Read all projects from storage. */
export function getProjects() {
  return load(KEYS.projects, []);
}

/** Persist the full projects array. */
export function saveProjects(projects) {
  persist(KEYS.projects, projects);
}

/** Add a new project. Returns the updated array. */
export function addProject(projects, formData) {
  const id = nextProjectId(projects);
  const today = new Date().toISOString().split('T')[0];
  const newProject = { id, ...formData, createdAt: today };
  const updated = [...projects, newProject];
  saveProjects(updated);
  return updated;
}

/** Update an existing project by ID. Returns the updated array. */
export function updateProject(projects, id, formData) {
  const updated = projects.map((p) => p.id === id ? { ...p, ...formData } : p);
  saveProjects(updated);
  return updated;
}

/** Delete a project by ID. Returns the updated array. */
export function deleteProject(projects, id) {
  const updated = projects.filter((p) => p.id !== id);
  saveProjects(updated);
  return updated;
}

/* ══════════════════════════════════════════════════
   STOCK RECEIVED
   ══════════════════════════════════════════════════ */

/** Read the full received map { [projectId]: [] }. */
export function getAllStockReceived() {
  return load(KEYS.received, {});
}

/** Read received records for a specific project. */
export function getStockReceived(projectId) {
  const all = getAllStockReceived();
  return all[projectId] || [];
}

/**
 * Add a full submission (one entry = one "Add Stock Received" session).
 * The submission object is pre-built by the UI layer.
 * Returns the updated map.
 */
export function addStockReceived(allReceived, projectId, submission) {
  const current = allReceived[projectId] || [];
  const updated = { ...allReceived, [projectId]: [...current, submission] };
  persist(KEYS.received, updated);
  return updated;
}

/** Update an existing submission by ID. Returns the updated map. */
export function updateStockReceived(allReceived, projectId, submissionId, updatedSubmission) {
  const current = allReceived[projectId] || [];
  const updated = {
    ...allReceived,
    [projectId]: current.map((s) => s.id === submissionId ? updatedSubmission : s),
  };
  persist(KEYS.received, updated);
  return updated;
}

/** Delete a submission by ID. Returns the updated map. */
export function deleteStockReceived(allReceived, projectId, submissionId) {
  const current = allReceived[projectId] || [];
  const updated = {
    ...allReceived,
    [projectId]: current.filter((s) => s.id !== submissionId),
  };
  persist(KEYS.received, updated);
  return updated;
}

/* ══════════════════════════════════════════════════
   STOCK USED
   ══════════════════════════════════════════════════ */

/** Read the full used map { [projectId]: [] }. */
export function getAllStockUsed() {
  return load(KEYS.used, {});
}

/** Read used records for a specific project. */
export function getStockUsed(projectId) {
  const all = getAllStockUsed();
  return all[projectId] || [];
}

/** Add a used record for a project. Returns the updated map. */
export function addStockUsed(allUsed, projectId, formData) {
  const id     = nextRecordId('SU');
  const record = { id, ...formData };
  const current = allUsed[projectId] || [];
  const updated = { ...allUsed, [projectId]: [...current, record] };
  persist(KEYS.used, updated);
  return updated;
}

/** Delete a used record. Returns the updated map. */
export function deleteStockUsed(allUsed, projectId, recordId) {
  const current = allUsed[projectId] || [];
  const updated = {
    ...allUsed,
    [projectId]: current.filter((r) => r.id !== recordId),
  };
  persist(KEYS.used, updated);
  return updated;
}

/* ══════════════════════════════════════════════════
   APPROVAL
   ══════════════════════════════════════════════════ */

/**
 * Approve a submission — records per-item approval status and user comments.
 * Once approved the submission is locked; admin can no longer edit it.
 * approvalItems: [{ approved: boolean, comment: string }, ...]  (one entry per item, same order)
 */
export function approveSubmission(allReceived, projectId, submissionId, approvalItems, approvedBy) {
  const current = allReceived[projectId] || [];
  const updated = {
    ...allReceived,
    [projectId]: current.map((s) => {
      if (s.id !== submissionId) return s;
      return {
        ...s,
        approvalStatus: 'approved',
        approvedAt:     new Date().toISOString(),
        approvedBy,
        items: (s.items || []).map((item, idx) => ({
          ...item,
          userApproved: approvalItems[idx]?.approved ?? false,
          userComment:  approvalItems[idx]?.comment  ?? '',
        })),
      };
    }),
  };
  persist(KEYS.received, updated);
  return updated;
}

/* ══════════════════════════════════════════════════
   PER-PROJECT CLEANUP
   ══════════════════════════════════════════════════ */

/** Remove all stock-received records for one project. Returns the updated map. */
export function clearProjectStockReceived(allReceived, projectId) {
  const updated = { ...allReceived };
  delete updated[projectId];
  persist(KEYS.received, updated);
  return updated;
}

/** Remove all stock-used records for one project. Returns the updated map. */
export function clearProjectStockUsed(allUsed, projectId) {
  const updated = { ...allUsed };
  delete updated[projectId];
  persist(KEYS.used, updated);
  return updated;
}

/* ══════════════════════════════════════════════════
   SNAPSHOT EXPORT
   ══════════════════════════════════════════════════ */

/**
 * Build a complete snapshot of the current database state and
 * trigger a browser download as `projects-snapshot-<date>.json`.
 * The downloaded file matches the projectsData.json schema exactly,
 * so it can be used as a future seed.
 */
export function exportSnapshot() {
  const snapshot = {
    _schema:  'adjmarine-projects-v1',
    _exported: new Date().toISOString(),
    projects:         load(KEYS.projects, []),
    stockAssignments: load(KEYS.received, {}),
    stockUsed:        load(KEYS.used,     {}),
  };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `projects-snapshot-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════
   PURGE  (dev / admin use)
   ══════════════════════════════════════════════════ */

/** Clear all project data from storage (also clears the seed flag). */
export function clearAllProjectData() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}
