import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MdWarehouse, MdLocationOn, MdArrowForward } from 'react-icons/md';
import { useProjects } from '../contexts/ProjectsContext';
import './MyProjects.css';

const MyProjects = () => {
  const { projects, loading, refreshProjects } = useProjects();

  // Pick up assignments an admin has changed since this user signed in.
  useEffect(() => { refreshProjects().catch(console.error); }, [refreshProjects]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Projects</h1>
          <p>Projects assigned to you by an admin</p>
        </div>
      </div>

      {!loading && projects.length === 0 && (
        <div className="fsp-card my-projects-empty">
          <MdWarehouse />
          <div className="my-projects-empty-title">No projects assigned yet</div>
          <div>Ask an admin to assign a project to your account.</div>
        </div>
      )}

      <div className="my-projects-grid">
        {projects.map((project) => {
          const inactive = project.status === 'Inactive';
          const body = (
            <>
              <div className="my-project-top">
                <div className="my-project-icon"><MdWarehouse /></div>
                <span className={`users-status-badge ${inactive ? 'inactive' : 'active'}`}>
                  <span className="users-status-dot" />
                  {project.status || 'Active'}
                </span>
              </div>
              <div className="my-project-name">{project.name}</div>
              <div className="my-project-id">{project.id}</div>
              {project.location && (
                <div className="my-project-location"><MdLocationOn /> {project.location}</div>
              )}
              <div className="my-project-foot">
                {inactive ? 'Deactivated by an admin' : <>Open project <MdArrowForward /></>}
              </div>
            </>
          );
          return inactive
            ? <div key={project.id} className="fsp-card my-project-card disabled">{body}</div>
            : <Link key={project.id} to={`/project/${project.id}`} className="fsp-card my-project-card">{body}</Link>;
        })}
      </div>
    </div>
  );
};

export default MyProjects;
