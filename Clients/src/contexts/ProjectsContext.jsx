/**
 * ProjectsContext — Redux-backed.
 *
 * The `useProjects()` hook exposes the same API as before so all consumers
 * (Projects.jsx, ProjectDetails.jsx) work without changes.
 * The Provider simply bootstraps the initial data fetch.
 */
import { createContext, useContext, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  selectProjects,
  selectStockReceived,
  selectStockUsed,
  selectUsers,
  selectProjectsLoading,
  selectProjectsError,
  fetchAllProjectData,
  addProjectThunk,
  updateProjectThunk,
  deleteProjectThunk,
  addStockReceivedThunk,
  updateStockReceivedThunk,
  deleteStockReceivedThunk,
  approveSubmissionThunk,
  addStockUsedThunk,
  deleteStockUsedThunk,
  createUserThunk,
  deleteUserThunk,
  refreshUsersThunk,
} from '../store/projectsSlice';

const ProjectsContext = createContext(null);

/* ── Provider ── bootstraps the initial fetch ─────── */
export function ProjectsProvider({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchAllProjectData());
  }, [dispatch]);

  return (
    <ProjectsContext.Provider value={dispatch}>
      {children}
    </ProjectsContext.Provider>
  );
}

/* ── Hook ── same API as before ──────────────────── */
export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (ctx === null) throw new Error('useProjects must be used inside <ProjectsProvider>');

  const dispatch = ctx;

  const projects      = useSelector(selectProjects);
  const stockReceived = useSelector(selectStockReceived);
  const stockUsed     = useSelector(selectStockUsed);
  const users         = useSelector(selectUsers);
  const loading       = useSelector(selectProjectsLoading);
  const error         = useSelector(selectProjectsError);

  /* ── Projects ── */
  const addProject = useCallback(
    (data) => dispatch(addProjectThunk(data)).unwrap(),
    [dispatch],
  );

  const updateProject = useCallback(
    (id, formData) => dispatch(updateProjectThunk({ id, formData })).unwrap(),
    [dispatch],
  );

  const deleteProject = useCallback(
    (id) => dispatch(deleteProjectThunk(id)).unwrap(),
    [dispatch],
  );

  /* ── Stock Received ── */
  const addStockReceived = useCallback(
    (projectId, submission) =>
      dispatch(addStockReceivedThunk({ projectId, submission })).unwrap(),
    [dispatch],
  );

  const updateStockReceived = useCallback(
    (projectId, submissionId, updatedSubmission) =>
      dispatch(updateStockReceivedThunk({ projectId, submissionId, updatedSubmission })).unwrap(),
    [dispatch],
  );

  const deleteStockReceived = useCallback(
    (projectId, submissionId) =>
      dispatch(deleteStockReceivedThunk({ projectId, submissionId })).unwrap(),
    [dispatch],
  );

  const approveSubmission = useCallback(
    (projectId, submissionId, approvalItems, approvedBy) =>
      dispatch(approveSubmissionThunk({ projectId, submissionId, approvalItems, approvedBy })).unwrap(),
    [dispatch],
  );

  /* ── Stock Used ── */
  const addStockUsed = useCallback(
    (projectId, formData) =>
      dispatch(addStockUsedThunk({ projectId, formData })).unwrap(),
    [dispatch],
  );

  const deleteStockUsed = useCallback(
    (projectId, recordId) =>
      dispatch(deleteStockUsedThunk({ projectId, recordId })).unwrap(),
    [dispatch],
  );

  /* ── Users ── */
  const createUser = useCallback(
    async (userData) => {
      const result = await dispatch(createUserThunk(userData));
      if (createUserThunk.rejected.match(result)) return result.payload;
      return null;
    },
    [dispatch],
  );

  const deleteUser = useCallback(
    (userId) => dispatch(deleteUserThunk(userId)).unwrap(),
    [dispatch],
  );

  const refreshUsers = useCallback(
    () => dispatch(refreshUsersThunk()).unwrap(),
    [dispatch],
  );

  return {
    projects,
    users,
    stockReceived,
    stockUsed,
    loading,
    error,
    addProject,
    updateProject,
    deleteProject,
    addStockReceived,
    updateStockReceived,
    deleteStockReceived,
    approveSubmission,
    addStockUsed,
    deleteStockUsed,
    createUser,
    deleteUser,
    refreshUsers,
  };
}
