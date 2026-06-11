import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

/* ── Selectors ───────────────────────────────────────── */
export const selectInventoryItems  = (s) => s.inventory.items;
export const selectInventoryStatus = (s) => s.inventory.status;
export const selectInventoryError  = (s) => s.inventory.error;

/* ── Thunk — only fetches when not already loaded ────── */
export const fetchInventoryItems = createAsyncThunk(
  'inventory/fetchItems',
  async () => {
    const data = await api.get('/inventory');
    return (data || []).filter((i) => i.active !== false);
  },
  {
    condition: (_, { getState }) => {
      const { status } = getState().inventory;
      return status === 'idle' || status === 'failed';
    },
  },
);

/* ── Slice ───────────────────────────────────────────── */

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {
    invalidateInventory: (state) => { state.status = 'idle'; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventoryItems.pending,   (state) => { state.status = 'loading'; })
      .addCase(fetchInventoryItems.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        state.items  = payload;
      })
      .addCase(fetchInventoryItems.rejected,  (state, action) => {
        state.status = 'failed';
        state.error  = action.error.message;
      });
  },
});

export const { invalidateInventory } = inventorySlice.actions;
export default inventorySlice.reducer;
