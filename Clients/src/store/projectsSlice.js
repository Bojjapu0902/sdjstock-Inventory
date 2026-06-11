import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getProjects, addProject, updateProject, deleteProject,
  getAllStockReceived, addStockReceived, updateStockReceived,
  deleteStockReceived, approveSubmission,
  getAllStockUsed, addStockUsed, deleteStockUsed,
  clearProjectStockUsed,
} from '../services/projectsDb';
import { getUsers, deleteProjectUser, createUser, deleteUser } from '../services/loginDb';

/* ── Selectors ───────────────────────────────────────── */
export const selectProjects        = (s) => s.projects.projects;
export const selectStockReceived   = (s) => s.projects.stockReceived;
export const selectStockUsed       = (s) => s.projects.stockUsed;
export const selectUsers           = (s) => s.projects.users;
export const selectProjectsLoading = (s) => s.projects.loading;
export const selectProjectsError   = (s) => s.projects.error;

/* ── Async Thunks ────────────────────────────────────── */

export const fetchAllProjectData = createAsyncThunk(
  'projects/fetchAll',
  async () => {
    const [projects, users, stockUsed, stockReceived] = await Promise.all([
      getProjects(),
      getUsers(),
      getAllStockUsed(),
      getAllStockReceived(),
    ]);
    return { projects, users, stockUsed, stockReceived };
  },
);

export const addProjectThunk = createAsyncThunk(
  'projects/add',
  async (formData) => addProject(formData),
);

export const updateProjectThunk = createAsyncThunk(
  'projects/update',
  async ({ id, formData }) => updateProject(id, formData),
);

export const deleteProjectThunk = createAsyncThunk(
  'projects/delete',
  async (id) => {
    await deleteProject(id);
    await deleteProjectUser([], id);
    const [stockReceived, stockUsed] = await Promise.all([
      getAllStockReceived(),
      clearProjectStockUsed(id),
    ]);
    return { id, stockReceived, stockUsed };
  },
);

/* Stock Received */

export const addStockReceivedThunk = createAsyncThunk(
  'projects/stockReceived/add',
  async ({ projectId, submission }) => addStockReceived(projectId, submission),
);

export const updateStockReceivedThunk = createAsyncThunk(
  'projects/stockReceived/update',
  async ({ projectId, submissionId, updatedSubmission }) =>
    updateStockReceived(projectId, submissionId, updatedSubmission),
);

export const deleteStockReceivedThunk = createAsyncThunk(
  'projects/stockReceived/delete',
  async ({ projectId, submissionId }) => deleteStockReceived(projectId, submissionId),
);

export const approveSubmissionThunk = createAsyncThunk(
  'projects/stockReceived/approve',
  async ({ projectId, submissionId, approvalItems, approvedBy }) =>
    approveSubmission(projectId, submissionId, approvalItems, approvedBy),
);

/* Stock Used */

export const addStockUsedThunk = createAsyncThunk(
  'projects/stockUsed/add',
  async ({ projectId, formData }) => addStockUsed(projectId, formData),
);

export const deleteStockUsedThunk = createAsyncThunk(
  'projects/stockUsed/delete',
  async ({ projectId, recordId }) => deleteStockUsed(projectId, recordId),
);

/* Users */

export const createUserThunk = createAsyncThunk(
  'projects/users/create',
  async (userData, { rejectWithValue }) => {
    const { updated, error } = await createUser([], userData);
    if (error) return rejectWithValue(error);
    return updated;
  },
);

export const deleteUserThunk = createAsyncThunk(
  'projects/users/delete',
  async (userId) => {
    await deleteUser([], userId);
    return userId;
  },
);

export const refreshUsersThunk = createAsyncThunk(
  'projects/users/refresh',
  async () => getUsers(),
);

/* ── Slice ───────────────────────────────────────────── */

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    projects:      [],
    users:         [],
    stockReceived: {},
    stockUsed:     {},
    loading:       true,
    error:         null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* fetchAll */
      .addCase(fetchAllProjectData.fulfilled, (state, { payload }) => {
        state.projects      = payload.projects;
        state.users         = payload.users;
        state.stockReceived = payload.stockReceived;
        state.stockUsed     = payload.stockUsed;
        state.loading       = false;
      })
      .addCase(fetchAllProjectData.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.error.message;
      })

      /* addProject */
      .addCase(addProjectThunk.fulfilled, (state, { payload }) => {
        state.projects.push(payload);
      })

      /* updateProject */
      .addCase(updateProjectThunk.fulfilled, (state, { payload }) => {
        const idx = state.projects.findIndex((p) => p.id === payload.id);
        if (idx !== -1) state.projects[idx] = payload;
      })

      /* deleteProject */
      .addCase(deleteProjectThunk.fulfilled, (state, { payload }) => {
        state.projects      = state.projects.filter((p) => p.id !== payload.id);
        state.users         = state.users.filter((u) => u.projectId !== payload.id);
        state.stockReceived = payload.stockReceived;
        state.stockUsed     = payload.stockUsed;
      })

      /* stockReceived mutations — server returns full updated map */
      .addCase(addStockReceivedThunk.fulfilled,    (state, { payload }) => { state.stockReceived = payload; })
      .addCase(updateStockReceivedThunk.fulfilled, (state, { payload }) => { state.stockReceived = payload; })
      .addCase(deleteStockReceivedThunk.fulfilled, (state, { payload }) => { state.stockReceived = payload; })
      .addCase(approveSubmissionThunk.fulfilled,   (state, { payload }) => { state.stockReceived = payload; })

      /* stockUsed mutations */
      .addCase(addStockUsedThunk.fulfilled,    (state, { payload }) => { state.stockUsed = payload; })
      .addCase(deleteStockUsedThunk.fulfilled, (state, { payload }) => { state.stockUsed = payload; })

      /* users */
      .addCase(createUserThunk.fulfilled, (state, { payload }) => {
        if (payload) state.users.push(payload);
      })
      .addCase(deleteUserThunk.fulfilled, (state, { payload }) => {
        state.users = state.users.filter((u) => u.id !== payload);
      })
      .addCase(refreshUsersThunk.fulfilled, (state, { payload }) => {
        state.users = payload;
      });
  },
});

export default projectsSlice.reducer;
