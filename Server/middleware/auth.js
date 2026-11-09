const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// The token only proves who is calling. Role and active status are read from the
// database on every request, so a deactivation or role change applies straight
// away instead of when the 7-day token expires.
module.exports = async function (req, res, next) {
  const header = req.headers['authorization'];
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token, authorisation denied' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token is not valid' });
  }

  try {
    const user = await User.findByAnyId(payload.id).select('id username role name isActive').lean();
    if (!user) return res.status(401).json({ error: 'Token is not valid' });
    if (user.isActive === false) {
      return res.status(401).json({ error: 'This account has been deactivated. Contact an admin.' });
    }
    req.user = {
      id:       String(user._id), // Mongo _id, as carried in the token
      userId:   user.id,          // the app's "USR-..." id, as stored on projects
      username: user.username,
      role:     user.role,
      name:     user.name,
    };
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
