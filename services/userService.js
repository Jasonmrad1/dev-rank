const bcrypt = require("bcrypt");
const User = require("../models/mongo/User");
const Skill = require("../models/mongo/Skill");
const Badge = require("../models/mongo/Badge");
const userLogger = require("../loggers/userLogger");
const AppError = require("../utils/AppError");
const ERROR_CODES = require("../utils/errorCodes");

const Project = require("../models/mongo/Project");
const Review = require("../models/mongo/Review");
const CertificationRequest = require("../models/mongo/CertificationRequest");

exports.registerUser = async ({ name, email, password, role, bio, githubUrl, avatarUrl }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("A user with this email address already exists.", 409, ERROR_CODES.DUPLICATE);
  }
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({ name, email, passwordHash, role, bio, githubUrl, avatarUrl });

  userLogger.logUserRegistered(user._id.toString(), user.name, user.role);

  return user;
};

exports.getAllUsers = async () => {
  return await User.find().populate("skills");
};

exports.getUser = async (id) => {
  const user = await User.findById(id).populate("skills");
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }
  return user;
};

exports.getUserByName = async (name) => {
  const user = await User.findOne({ name }).populate("skills");
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }
  return user;
};

exports.updateUser = async (id, { name, bio, githubUrl, avatarUrl }) => {
  const user = await User.findByIdAndUpdate(
    id,
    { name, bio, githubUrl, avatarUrl },
    { returnDocument: "after", runValidators: true }
  ).populate("skills");

  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  userLogger.logUserUpdated(user._id.toString(), user.name);

  return user;
};


async function cleanupUserData(user) {
  // Delete projects and reviews
  await Project.deleteMany({ user: user._id });
  await Review.deleteMany({ reviewer: user._id });
  // Remove from skills
  await Skill.updateMany(
    { users: user._id },
    { $pull: { users: user._id } }
  );
  await CertificationRequest.deleteMany({ user: user._id });
  // Remove from followers/following relationships
  await User.updateMany(
    { followers: user._id },
    { $pull: { followers: user._id } }
  );
  await User.updateMany(
    { following: user._id },
    { $pull: { following: user._id } }
  );
}

exports.deleteUser = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  await cleanupUserData(user);
  await User.findByIdAndDelete(id);

  userLogger.logUserDeleted(user._id.toString(), user.name);

  return { message: "User deleted successfully." };
};

const resolveSkillIds = async (inputs) => {
  const arr = Array.isArray(inputs) ? inputs : [inputs];
  const skills = await Skill.find({
    $or: [
      { _id: { $in: arr.filter((v) => v.match && v.match(/^[a-f\d]{24}$/i)) } },
      { name: { $in: arr.filter((v) => !v.match || !v.match(/^[a-f\d]{24}$/i)) } },
    ],
  });
  if (skills.length !== arr.length) {
    throw new AppError("One or more skills were not found.", 404, ERROR_CODES.NOT_FOUND);
  }
  return skills.map((s) => s._id);
};

exports.addSkills = async (userId, skillInputs) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  const ids = await resolveSkillIds(skillInputs);

  const newIds = ids.filter((id) => !user.skills.map((s) => s.toString()).includes(id.toString()));
  if (newIds.length === 0) {
    throw new AppError("All provided skills are already assigned to this user.", 409, ERROR_CODES.DUPLICATE);
  }

  user.skills.push(...newIds);
  await user.save();
  await Skill.updateMany({ _id: { $in: newIds } }, { $addToSet: { users: user._id } });
  await user.populate("skills");

  userLogger.logUserSkillsAdded(user._id.toString(), Array.isArray(skillInputs) ? skillInputs : [skillInputs], newIds.length);

  return { user, count: newIds.length };
};

exports.removeSkill = async (userId, skillId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  const ids = await resolveSkillIds([skillId]);
  const idStrings = ids.map(String);

  const existingSkillStrings = user.skills.map((s) => s.toString());
  const removableIds = ids.filter((id) => existingSkillStrings.includes(id.toString()));

  if (removableIds.length === 0) {
    throw new AppError("This skill is not assigned to the user.", 404, ERROR_CODES.NOT_FOUND);
  }

  user.skills = user.skills.filter((s) => !idStrings.includes(s.toString()));
  await user.save();

  await Skill.updateMany(
    { _id: { $in: removableIds } },
    { $pull: { users: user._id } }
  );

  await user.populate("skills");

  userLogger.logUserSkillRemoved(user._id.toString(), skillId, removableIds.length);

  return { user, count: removableIds.length };
};

exports.followUser = async (userId, targetId) => {
  if (userId === targetId) {
    throw new AppError('Cannot follow yourself.', 400, ERROR_CODES.FORBIDDEN);
  }
  const user = await User.findById(userId);
  const target = await User.findById(targetId);

  if (!user || !target) {
    throw new AppError('User not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  if (user.following.includes(targetId)) {
    throw new AppError('Already following this user.', 409, ERROR_CODES.DUPLICATE);
  }
  
  user.following.push(targetId);
  target.followers.push(userId);

  await user.save();
  await target.save();

  userLogger.logUserFollowed(userId, targetId);
  return user;
};

exports.unfollowUser = async (userId, targetId) => {
  if (userId === targetId) {
    throw new AppError('Cannot unfollow yourself.', 400, ERROR_CODES.FORBIDDEN);
  }
  const user = await User.findById(userId);
  const target = await User.findById(targetId);
  if (!user || !target) {
    throw new AppError('User not found.', 404, ERROR_CODES.NOT_FOUND);
  }
  user.following = user.following.filter(id => id.toString() !== targetId);
  target.followers = target.followers.filter(id => id.toString() !== userId);
  
  await user.save();
  await target.save();

  userLogger.logUserUnfollowed(userId, targetId);
  return user;
};

exports.getFollowers = async (userId) => {
  const user = await User.findById(userId).populate('followers', 'name email avatarUrl githubUrl');
  if (!user) {
    throw new AppError('User not found.', 404, ERROR_CODES.NOT_FOUND);
  }
  return user.followers;
};

exports.getFollowing = async (userId) => {
  const user = await User.findById(userId).populate('following', 'name email avatarUrl githubUrl');
  if (!user) {
    throw new AppError('User not found.', 404, ERROR_CODES.NOT_FOUND);
  }
  return user.following;
};

exports.removeSkills = async (userId, skills) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  const inputs = Array.isArray(skills) ? skills : [skills];
  const ids = await resolveSkillIds(inputs);

  const existingSkillStr = user.skills.map((s) => s.toString());
  const removableIds = ids.filter((id) => existingSkillStr.includes(id.toString()));

  if (removableIds.length === 0) {
    throw new AppError("None of the provided skills are assigned to this user.", 404, ERROR_CODES.NOT_FOUND);
  }

  const removableStr = removableIds.map(String);

  user.skills = user.skills.filter((s) => !removableStr.includes(s.toString()));
  await user.save();

  await Skill.updateMany(
    { _id: { $in: removableIds } },
    { $pull: { users: user._id } }
  );

  await user.populate("skills");

  userLogger.logUserSkillsRemoved(user._id.toString(), inputs, removableIds.length);

  return { user, count: removableIds.length };
};

exports.awardBadge = async (userId, badgeId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  const badge = await Badge.findById(badgeId);
  if (!badge) {
    throw new AppError("Badge not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  if (user.badges && user.badges.includes(badgeId)) {
    throw new AppError("User already has this badge.", 409, ERROR_CODES.DUPLICATE);
  }

  user.badges.push(badgeId);
  await user.save();

  await Badge.findByIdAndUpdate(badgeId, { $addToSet: { users: user._id } });
  await user.populate("badges");

  return user;
};

exports.removeBadge = async (userId, badgeId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  const badge = await Badge.findById(badgeId);
  if (!badge) {
    throw new AppError("Badge not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  if (!user.badges || !user.badges.includes(badgeId)) {
    throw new AppError("User does not have this badge.", 404, ERROR_CODES.NOT_FOUND);
  }

  user.badges = user.badges.filter((b) => b.toString() !== badgeId.toString());
  await user.save();

  await Badge.findByIdAndUpdate(badgeId, { $pull: { users: user._id } });
  await user.populate("badges");

  return user;
};

exports.awardBadgeByName = async (userId, badgeName) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  const badge = await Badge.findOne({ name: { $regex: `^${badgeName}$`, $options: "i" } });
  if (!badge) {
    throw new AppError("Badge not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  if (user.badges && user.badges.includes(badge._id)) {
    throw new AppError("User already has this badge.", 409, ERROR_CODES.DUPLICATE);
  }

  user.badges.push(badge._id);
  await user.save();

  await Badge.findByIdAndUpdate(badge._id, { $addToSet: { users: user._id } });
  await user.populate("badges");

  return user;
};

exports.removeBadgeByName = async (userId, badgeName) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  const badge = await Badge.findOne({ name: { $regex: `^${badgeName}$`, $options: "i" } });
  if (!badge) {
    throw new AppError("Badge not found.", 404, ERROR_CODES.NOT_FOUND);
  }

  if (!user.badges || !user.badges.includes(badge._id)) {
    throw new AppError("User does not have this badge.", 404, ERROR_CODES.NOT_FOUND);
  }

  user.badges = user.badges.filter((b) => b.toString() !== badge._id.toString());
  await user.save();

  await Badge.findByIdAndUpdate(badge._id, { $pull: { users: user._id } });
  await user.populate("badges");

  return user;
};