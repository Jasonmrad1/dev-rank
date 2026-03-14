const bcrypt = require("bcrypt");
const User = require("../models/mongo/User");
const Skill = require("../models/mongo/Skill");
const userLogger = require("../loggers/userLogger");
const AppError = require("../utils/AppError");

const Project = require("../models/mongo/Project");
const Review = require("../models/mongo/Review");
const CertificationRequest = require("../models/mongo/CertificationRequest");

exports.registerUser = async ({ name, email, password, role, bio, githubUrl, avatarUrl }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("A user with this email address already exists.", 409);
  }
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({ name, email, passwordHash, role, bio, githubUrl, avatarUrl });

  // activityLog
  userLogger.logUserRegistered(user._id.toString(), user.name, user.role);

  return user;
};

exports.getAllUsers = async () => {
  return await User.find().populate("skills");
};

exports.getUser = async (id) => {
  const user = await User.findById(id).populate("skills");
  if (!user) {
    throw new AppError("User not found.", 404);
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
    throw new AppError("User not found.", 404);
  }

  //Activity Log
  userLogger.logUserUpdated(user._id.toString(), user.name);

  return user;
};


async function cleanupUserData(user) {
  await Project.deleteMany({ owner: user._id });
  await Review.deleteMany({ reviewer: user._id });
  await Skill.updateMany(
    { users: user._id },
    { $pull: { users: user._id } }
  );
  await CertificationRequest.deleteMany({ user: user._id });
}

exports.deleteUser = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError("User not found.", 404);
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
    throw new AppError("One or more skills were not found.", 404);
  }
  return skills.map((s) => s._id);
};

exports.addSkills = async (userId, skillInputs) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const ids = await resolveSkillIds(skillInputs);

  const newIds = ids.filter((id) => !user.skills.map((s) => s.toString()).includes(id.toString()));
  if (newIds.length === 0) {
    throw new AppError("All provided skills are already assigned to this user.", 409);
  }

  user.skills.push(...newIds);
  await user.save();
  await Skill.updateMany({ _id: { $in: newIds } }, { $addToSet: { users: user._id } });
  await user.populate("skills");

  //Activity Log for addskill
  userLogger.logUserSkillsAdded(
    user._id.toString(),
    Array.isArray(skillInputs) ? skillInputs : [skillInputs],
    newIds.length
  );

  return { user, count: newIds.length };
};

exports.removeSkill = async (userId, skillId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const ids = await resolveSkillIds([skillId]);
  const idStrings = ids.map(String);

  const existingSkillStrings = user.skills.map((s) => s.toString());
  const removableIds = ids.filter((id) => existingSkillStrings.includes(id.toString()));

  if (removableIds.length === 0) {
    throw new AppError("This skill is not assigned to the user.", 404);
  }

  user.skills = user.skills.filter((s) => !idStrings.includes(s.toString()));
  await user.save();

  await Skill.updateMany(
    { _id: { $in: removableIds } },
    { $pull: { users: user._id } }
  );

  await user.populate("skills");

  // activity log
  userLogger.logUserSkillRemoved(user._id.toString(), skillId, removableIds.length);

  return { user, count: removableIds.length };
};

exports.removeSkills = async (userId, skills) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const inputs = Array.isArray(skills) ? skills : [skills];
  const ids = await resolveSkillIds(inputs);

  const existingSkillStr = user.skills.map((s) => s.toString());
  const removableIds = ids.filter((id) => existingSkillStr.includes(id.toString()));

  if (removableIds.length === 0) {
    throw new AppError("None of the provided skills are assigned to this user.", 404);
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