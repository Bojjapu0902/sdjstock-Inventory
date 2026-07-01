import api from './api';

/* ── Projects ─────────────────────────── */
export const getProjects     = ()         => api.get('/projects');
export const createProject   = (data)     => api.post('/projects', data);
export const updateProject   = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject   = (id)       => api.delete(`/projects/${id}`);

/* ── Stock Received ───────────────────── */
export const getStockReceived  = (pid) => api.get(`/stock-received/${pid}`);
export const addStockReceived  = (pid, data) => api.post(`/stock-received/${pid}`, data);
export const approveSubmission = (pid, sid, items, by) =>
  api.put(`/stock-received/${pid}/${sid}/approve`, { approvalItems: items, approvedBy: by });

/* ── Stock Used ───────────────────────── */
export const getStockUsed    = (pid)         => api.get(`/stock-used/${pid}`);
export const addStockUsed    = (pid, data)   => api.post(`/stock-used/${pid}`, data);
export const updateStockUsed = (pid, id, d)  => api.put(`/stock-used/${pid}/${id}`, d);
export const deleteStockUsed = (pid, id)     => api.delete(`/stock-used/${pid}/${id}`);

/* ── Stock Returned ───────────────────── */
export const getStockReturned    = (pid)         => api.get(`/stock-returned/${pid}`);
export const addStockReturned    = (pid, data)   => api.post(`/stock-returned/${pid}`, data);
export const updateStockReturned = (pid, id, d)  => api.put(`/stock-returned/${pid}/${id}`, d);
export const deleteStockReturned = (pid, id)     => api.delete(`/stock-returned/${pid}/${id}`);
