// =====================================================
//  Stock History Database — MongoDB-backed via REST API
// =====================================================
import api from '../services/api';

export async function getAllHistory() {
  return api.get('/stock-history');
}

export async function getItemHistory(itemId) {
  return api.get(`/stock-history/${itemId}`);
}

export async function addHistoryRecord(_all, itemId, record) {
  await api.post(`/stock-history/${itemId}`, record);
  return getAllHistory();
}

export async function updateHistoryRecord(_all, itemId, recordId, patch) {
  await api.put(`/stock-history/${itemId}/${recordId}`, patch);
  return getAllHistory();
}

export async function deleteHistoryRecord(_all, itemId, recordId) {
  await api.delete(`/stock-history/${itemId}/${recordId}`);
  return getAllHistory();
}

export async function exportHistorySnapshot() {
  const records = await getAllHistory();
  const snapshot = {
    _schema:   'adjmarine-stock-history-v1',
    _exported: new Date().toISOString(),
    records,
  };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `stock-history-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function clearAllHistory() { /* no-op */ }