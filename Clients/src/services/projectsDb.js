// =====================================================
//  Projects Database — MongoDB-backed via REST API
//  stockReceived is embedded inside each project doc.
// =====================================================
import api from './api';

/* ══════════════════════════════════════════════════
   PROJECTS
   ══════════════════════════════════════════════════ */

export async function getProjects() {
  return api.get('/projects');
}

export async function addProject(_projects, formData) {
  return api.post('/projects', formData);
}

export async function updateProject(_projects, id, formData) {
  return api.put(`/projects/${id}`, formData);
}

export async function deleteProject(_projects, id) {
  await api.delete(`/projects/${id}`);
}

export function saveProjects() { /* no-op */ }
export function nextProjectId() { return `PRJ-${Date.now()}`; }
export function nextRecordId(prefix) { return `${prefix}-${Date.now()}`; }

/* ══════════════════════════════════════════════════
   STOCK RECEIVED  —  embedded in project documents
   ══════════════════════════════════════════════════ */

/** Build { [projectId]: submissions[] } from the projects list. */
function buildStockMap(projects) {
  const map = {};
  (projects || []).forEach((p) => { map[p.id] = p.stockReceived || []; });
  return map;
}

export async function getAllStockReceived() {
  const projects = await getProjects();
  return buildStockMap(projects);
}

export async function addStockReceived(_all, projectId, submission) {
  await api.post(`/projects/${projectId}/stock-received`, submission);
  return getAllStockReceived();
}

export async function updateStockReceived(_all, projectId, submissionId, updatedSubmission) {
  await api.put(`/projects/${projectId}/stock-received/${submissionId}`, updatedSubmission);
  return getAllStockReceived();
}

export async function deleteStockReceived(_all, projectId, submissionId) {
  await api.delete(`/projects/${projectId}/stock-received/${submissionId}`);
  return getAllStockReceived();
}

export async function approveSubmission(_all, projectId, submissionId, approvalItems, approvedBy) {
  await api.post(`/projects/${projectId}/stock-received/${submissionId}/approve`, { approvalItems, approvedBy });
  return getAllStockReceived();
}

export async function clearProjectStockReceived(_all, projectId) {
  // stockReceived is embedded — deleting the project clears it automatically.
  // This is a no-op; just return the current map.
  return getAllStockReceived();
}

/* ══════════════════════════════════════════════════
   STOCK USED
   ══════════════════════════════════════════════════ */

export async function getAllStockUsed() {
  return api.get('/stock-used');
}

export async function getStockUsed(projectId) {
  return api.get(`/stock-used/${projectId}`);
}

export async function addStockUsed(_all, projectId, formData) {
  await api.post(`/stock-used/${projectId}`, formData);
  return getAllStockUsed();
}

export async function deleteStockUsed(_all, projectId, recordId) {
  await api.delete(`/stock-used/${projectId}/${recordId}`);
  return getAllStockUsed();
}

export async function clearProjectStockUsed(_all, projectId) {
  const records = await getStockUsed(projectId);
  await Promise.all(records.map((r) => api.delete(`/stock-used/${projectId}/${r.id}`)));
  return getAllStockUsed();
}

/* ══════════════════════════════════════════════════
   SNAPSHOT EXPORT
   ══════════════════════════════════════════════════ */

export async function exportSnapshot() {
  const [projects, stockUsed] = await Promise.all([
    getProjects(),
    getAllStockUsed(),
  ]);
  const snapshot = {
    _schema:   'adjmarine-projects-v2',
    _exported: new Date().toISOString(),
    projects,   // stockReceived is embedded here
    stockUsed,
  };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `projects-snapshot-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function clearAllProjectData() { /* no-op */ }
