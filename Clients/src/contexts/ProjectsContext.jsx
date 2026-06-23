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
  getProjects, addProject, updateProject, deleteProject,
  getAllStockReceived, addStockReceived, updateStockReceived,
  deleteStockReceived, approveSubmission,
  getAllStockUsed, addStockUsed, deleteStockUsed,
  clearProjectStockUsed,
} from '../services/projectsDb';
import {
  getUsers, deleteProjectUser, createUser, deleteUser,
} from '../services/loginDb';

const ProjectsContext = createContext(null);

/* ── Provider ── bootstraps the initial fetch ─────── */
export function ProjectsProvider({ children }) {
  const [projects,      setProjects]      = useState([]);
  const [users,         setUsers]         = useState([]);
  const [stockReceived, setStockReceived] = useState({});
  const [stockUsed,     setStockUsed]     = useState({});
  const [loading,       setLoading]       = useState(true);

  // Load all data on mount.
  // stockReceived is embedded in each project document — no separate fetch needed.
  useEffect(() => {
    Promise.all([
      getProjects(),
      getUsers(),
      getAllStockUsed(),
      getAllStockReceived(),
    ]).then(([p, u, su, sr]) => {
      setProjects(p);
      setUsers(u);
      setStockReceived(sr);
      setStockUsed(su);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ── Projects ── */
  const addProject = useCallback(
    (data) => dispatch(addProjectThunk(data)).unwrap(),
    [dispatch],
  );

  const updateProject = useCallback(
    (id, formData) => dispatch(updateProjectThunk({ id, formData })).unwrap(),
    [dispatch],
  );

  const deleteProjectFn = useCallback(async (id) => {
    await deleteProject([], id);
    await deleteProjectUser([], id);
    // stockReceived is embedded — deleting the project removes it automatically.
    const su = await clearProjectStockUsed({}, id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setUsers((prev)    => prev.filter((u) => u.projectId !== id));
    setStockReceived((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setStockUsed(su);
  }, []);

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

  /* ── Stock Used ────────────────────────────────── */

  const addStockUsedFn = useCallback(async (projectId, formData) => {
    const result = await addStockUsed({}, projectId, formData);
    setStockUsed(result);
  }, []);

  const deleteStockUsedFn = useCallback(async (projectId, recordId) => {
    const result = await deleteStockUsed({}, projectId, recordId);
    setStockUsed(result);
  }, []);

  /* ── Expose users refresh ─────────────────────── */

  const refreshUsers = useCallback(
    () => dispatch(refreshUsersThunk()).unwrap(),
    [dispatch],
  );

  return {
    projects,
    users,
    stockReceived,
    stockUsed,
    stockReturned,
    loading,
    addProject:          addProjectFn,
    updateProject:       updateProjectFn,
    deleteProject:       deleteProjectFn,
    addStockReceived:    addStockReceivedFn,
    updateStockReceived: updateStockReceivedFn,
    deleteStockReceived: deleteStockReceivedFn,
    approveSubmission:   approveSubmissionFn,
    addStockUsed:        addStockUsedFn,
    deleteStockUsed:     deleteStockUsedFn,
    createUser:          createUserFn,
    deleteUser:          deleteUserFn,
    refreshUsers,
  };
}
