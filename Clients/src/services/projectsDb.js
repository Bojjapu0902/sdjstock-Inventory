// Projects Database — MongoDB-backed via REST API
import api from './api';

/* ══════════════════════════════════════════════════
   PROJECTS
   ══════════════════════════════════════════════════ */

export async function getProjects() {
  return api.get('/projects');
}

export async function addProject(formData) {
  return api.post('/projects', formData);
}

export async function updateProject(id, formData) {
  return api.put(`/projects/${id}`, formData);
}

export async function deleteProject(id) {
  await api.delete(`/projects/${id}`);
}

export function nextProjectId() { return `PRJ-${Date.now()}`; }

/* ══════════════════════════════════════════════════
   STOCK RECEIVED
   ══════════════════════════════════════════════════ */

export async function getAllStockReceived() {
  return api.get('/stock-received');
}

export async function addStockReceived(projectId, submission) {
  await api.post(`/stock-received/${projectId}`, submission);
  return getAllStockReceived();
}

export async function updateStockReceived(projectId, submissionId, updatedSubmission) {
  await api.put(`/stock-received/${projectId}/${submissionId}`, updatedSubmission);
  return getAllStockReceived();
}

export async function deleteStockReceived(projectId, submissionId) {
  await api.delete(`/stock-received/${projectId}/${submissionId}`);
  return getAllStockReceived();
}

export async function approveSubmission(projectId, submissionId, approvalItems, approvedBy) {
  await api.post(`/stock-received/${projectId}/${submissionId}/approve`, { approvalItems, approvedBy });
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

export async function addStockUsed(projectId, formData) {
  await api.post(`/stock-used/${projectId}`, formData);
  return getAllStockUsed();
}

export async function deleteStockUsed(projectId, recordId) {
  await api.delete(`/stock-used/${projectId}/${recordId}`);
  return getAllStockUsed();
}

export async function clearProjectStockUsed(projectId) {
  const records = await getStockUsed(projectId);
  await Promise.all(records.map((r) => api.delete(`/stock-used/${projectId}/${r.id}`)));
  return getAllStockUsed();
}

/* ══════════════════════════════════════════════════
   SNAPSHOT EXPORT
   ══════════════════════════════════════════════════ */

export async function exportSnapshot() {
  const [projects, stockUsed] = await Promise.all([getProjects(), getAllStockUsed()]);
  const snapshot = {
    _schema:   'adjmarine-projects-v2',
    _exported: new Date().toISOString(),
    projects,
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
