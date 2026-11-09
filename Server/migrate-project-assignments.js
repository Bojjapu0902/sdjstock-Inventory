// One-off migration: moves each user's old `projectId` onto the project's new
// `assignedUserId`, then removes `projectId` from the user. Safe to run twice.
//
//   node migrate-project-assignments.js          show what would change
//   node migrate-project-assignments.js --apply  make the changes
//
// If two users share a project, the first keeps it, the other is reported, and
// their `projectId` is left in place so nothing is lost until an admin decides.
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  const apply = process.argv.includes('--apply');
  await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB || 'sdjstock' });
  const users    = mongoose.connection.collection('users');
  const projects = mongoose.connection.collection('projects');

  const legacy = await users.find({ projectId: { $nin: [null, ''] } }).toArray();
  const claimed = new Map();
  const conflicts = [];
  let moved = 0;
  console.log(`${apply ? 'APPLYING' : 'DRY RUN'}: ${legacy.length} user(s) have an old projectId`);

  for (const user of legacy) {
    const clear = () => (apply ? users.updateOne({ _id: user._id }, { $unset: { projectId: '' } }) : null);

    if (user.role === 'Admin') { await clear(); continue; }

    const project = await projects.findOne({ id: user.projectId });
    if (!project) {
      console.log(`  ${user.username}: project ${user.projectId} no longer exists, clearing`);
      await clear();
      continue;
    }

    const owner = project.assignedUserId || claimed.get(project.id);
    if (owner && owner !== user.id) {
      conflicts.push(`${user.username} also has ${project.id} (${project.name}), already held by ${owner}`);
      continue;
    }

    console.log(`  ${user.username} -> ${project.id} (${project.name})`);
    claimed.set(project.id, user.id);
    moved++;
    if (apply) {
      await projects.updateOne({ _id: project._id }, { $set: { assignedUserId: user.id } });
      await clear();
    }
  }

  const noEmail = await users.countDocuments({ $or: [{ email: '' }, { email: null }, { email: { $exists: false } }] });

  console.log(`\n${apply ? 'Moved' : 'Would move'} ${moved} assignment(s).`);
  if (conflicts.length) {
    console.log(`\n${conflicts.length} conflict(s) to resolve in Users > Project Assignments:`);
    conflicts.forEach((c) => console.log(`  ${c}`));
  }
  if (noEmail) console.log(`\n${noEmail} user(s) have no email, so they cannot use OTP password changes until one is added.`);
  if (!apply) console.log('\nNothing was changed. Run again with --apply to make these changes.');

  await mongoose.disconnect();
})().catch((err) => { console.error(err); process.exit(1); });
