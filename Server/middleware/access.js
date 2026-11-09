const Project = require('../models/Project');

const isAdmin = (req) => req.user.role === 'Admin';

const requireAdmin = (req, res, next) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' });
  next();
};

// For routes with :projectId or :id. Admins can reach every project; a user can
// only reach an active project assigned to them.
const requireProjectAccess = async (req, res, next) => {
  if (isAdmin(req)) return next();
  try {
    const project = await Project.findOne({
      id: req.params.projectId || req.params.id,
      assignedUserId: req.user.userId,
    }).select('status').lean();
    if (!project) return res.status(403).json({ error: 'This project is not assigned to you.' });
    if (project.status === 'Inactive') return res.status(403).json({ error: 'This project has been deactivated.' });
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mongo filter for stock collections: everything for admins, own projects otherwise.
const ownStockFilter = async (req) => {
  if (isAdmin(req)) return {};
  const projects = await Project.find({ assignedUserId: req.user.userId }).select('id').lean();
  return { projectId: { $in: projects.map((p) => p.id) } };
};

module.exports = { requireAdmin, requireProjectAccess, ownStockFilter };
