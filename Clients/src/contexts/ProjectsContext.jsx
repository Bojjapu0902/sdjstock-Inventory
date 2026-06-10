import { createContext, useContext, useState, useCallback, useEffect } from 'react';
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

  /* ── Projects CRUD ──────────────────────────────── */

  const addProjectFn = useCallback(async (formData) => {
    const newProject = await addProject([], formData);
    setProjects((prev) => [...prev, newProject]);
    return newProject;
  }, []);

  const updateProjectFn = useCallback(async (id, formData) => {
    const updated = await updateProject([], id, formData);
    setProjects((prev) => prev.map((p) => p.id === id ? updated : p));
  }, []);

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

  /* ── Stock Received ────────────────────────────── */

  const addStockReceivedFn = useCallback(async (projectId, submission) => {
    const updated = await addStockReceived({}, projectId, submission);
    setStockReceived(updated);
  }, []);

  const updateStockReceivedFn = useCallback(async (projectId, submissionId, updated) => {
    const result = await updateStockReceived({}, projectId, submissionId, updated);
    setStockReceived(result);
  }, []);

  const deleteStockReceivedFn = useCallback(async (projectId, submissionId) => {
    const result = await deleteStockReceived({}, projectId, submissionId);
    setStockReceived(result);
  }, []);

  const approveSubmissionFn = useCallback(async (projectId, submissionId, approvalItems, approvedBy) => {
    const result = await approveSubmission({}, projectId, submissionId, approvalItems, approvedBy);
    setStockReceived(result);
  }, []);

  /* ── Users (admin panel) ───────────────────────── */

  const createUserFn = useCallback(async (userData) => {
    const { updated, error } = await createUser([], userData);
    if (!error && updated) {
      setUsers((prev) => [...prev, updated]);
    }
    return error;
  }, []);

  const deleteUserFn = useCallback(async (userId) => {
    await deleteUser([], userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

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

  const refreshUsers = useCallback(async () => {
    const u = await getUsers();
    setUsers(u);
  }, []);

  const value = {
    projects,
    users,
    stockReceived,
    stockUsed,
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

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjects must be used inside <ProjectsProvider>');
  return ctx;
}