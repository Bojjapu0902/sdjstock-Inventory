import { createContext, useContext, useState, useCallback } from 'react';
import {
  getProjects, addProject, updateProject, deleteProject,
  getAllStockReceived, addStockReceived, updateStockReceived, deleteStockReceived, approveSubmission,
  getAllStockUsed, addStockUsed, deleteStockUsed,
  clearProjectStockReceived, clearProjectStockUsed,
} from '../data/projectsDb';
import {
  getUsers, deleteProjectUser,
  createUser, deleteUser,
} from '../data/loginDb';

const ProjectsContext = createContext(null);

/**
 * Single source of truth for all project data.
 * Backed by localStorage — every mutation persists immediately.
 * Both Projects.jsx and ProjectDetails.jsx consume this context
 * so they always see the same, up-to-date state.
 */
export function ProjectsProvider({ children }) {
  const [projects,      setProjects]      = useState(() => getProjects());
  const [users,         setUsers]         = useState(() => getUsers());
  const [stockReceived, setStockReceived] = useState(() => getAllStockReceived());
  const [stockUsed,     setStockUsed]     = useState(() => getAllStockUsed());

  /* ── Projects CRUD ──────────────────────────────── */

  const addProjectFn = useCallback((formData) => {
    setProjects((prev) => addProject(prev, formData));
  }, []);

  const updateProjectFn = useCallback((id, formData) => {
    setProjects((prev) => updateProject(prev, id, formData));
  }, []);

  const deleteProjectFn = useCallback((id) => {
    setProjects((prev)         => deleteProject(prev, id));
    setUsers((prev)            => deleteProjectUser(prev, id));
    setStockReceived((prev)    => clearProjectStockReceived(prev, id));
    setStockUsed((prev)        => clearProjectStockUsed(prev, id));
  }, []);

  /* ── Stock Received ────────────────────────────── */

  const addStockReceivedFn = useCallback((projectId, submission) => {
    setStockReceived((prev) => addStockReceived(prev, projectId, submission));
  }, []);

  const updateStockReceivedFn = useCallback((projectId, submissionId, updated) => {
    setStockReceived((prev) => updateStockReceived(prev, projectId, submissionId, updated));
  }, []);

  const deleteStockReceivedFn = useCallback((projectId, submissionId) => {
    setStockReceived((prev) => deleteStockReceived(prev, projectId, submissionId));
  }, []);

  const approveSubmissionFn = useCallback((projectId, submissionId, approvalItems, approvedBy) => {
    setStockReceived((prev) => approveSubmission(prev, projectId, submissionId, approvalItems, approvedBy));
  }, []);

  /* ── Users (admin panel) ───────────────────────── */

  /** Returns { error: string|null }. Updates users state on success. */
  const createUserFn = useCallback((userData) => {
    let result;
    setUsers((prev) => {
      result = createUser(prev, userData);
      return result.updated;
    });
    return result?.error ?? null;
  }, []);

  const deleteUserFn = useCallback((userId) => {
    setUsers((prev) => deleteUser(prev, userId));
  }, []);

  /* ── Stock Used ────────────────────────────────── */

  const addStockUsedFn = useCallback((projectId, formData) => {
    setStockUsed((prev) => addStockUsed(prev, projectId, formData));
  }, []);

  const deleteStockUsedFn = useCallback((projectId, recordId) => {
    setStockUsed((prev) => deleteStockUsed(prev, projectId, recordId));
  }, []);

  /* ─────────────────────────────────────────────── */

  const value = {
    projects,
    users,
    stockReceived,
    stockUsed,
    addProject:          addProjectFn,
    updateProject:       updateProjectFn,
    deleteProject:       deleteProjectFn,
    addStockReceived:    addStockReceivedFn,
    updateStockReceived: updateStockReceivedFn,
    deleteStockReceived: deleteStockReceivedFn,
    approveSubmission:   approveSubmissionFn,
    addStockUsed:        addStockUsedFn,
    deleteStockUsed:     deleteStockUsedFn,
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
