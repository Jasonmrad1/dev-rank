const bcrypt = require("bcrypt");
const User = require("../models/mongo/User");
const Skill = require("../models/mongo/Skill");
const activityLogService = require("./activityLogService");

const Project = require("../models/mongo/Project");
const Review = require("../models/mongo/Review");
const CertificationRequest = require("../models/mongo/CertificationRequest");

exports.registerUser = async ({ name, email, password, role, bio, githubUrl, avatarUrl }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error("A user with this email address already exists.");
    err.status = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({ name, email, passwordHash, role, bio, githubUrl, avatarUrl });

  // activityLog
  await activityLogService.createLog({
    userEmail: user.email,
    action: "REGISTER_USER",
    entity: "User",
    entityId: user._id.toString(),
    metadata: {
      name: user.name,
      role: user.role,
    },
  });

  return user;
};

exports.getAllUsers = async () => {
  return await User.find().populate("skills");
};

exports.getUser = async (id) => {
  const user = await User.findById(id).populate("skills");
  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
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
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  //Activity Log
  await activityLogService.createLog({
    userEmail: user.email,
    action: "UPDATE_USER",
    entity: "User",
    entityId: user._id.toString(),
    metadata: {
      name: user.name,
    },
  });

  return user;
};

exports.deleteUser = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  await Project.deleteMany({ owner: user._id });
  await Review.deleteMany({ reviewer: user._id });

  await Skill.updateMany(
    { users: user._id },
    { $pull: { users: user._id } }
  );

  await CertificationRequest.deleteMany({ user: user._id });

  await User.findByIdAndDelete(id);

  await activityLogService.createLog({
    userEmail: user.email,
    action: "DELETE_USER",
    entity: "User",
    entityId: user._id.toString(),
    metadata: {
      name: user.name,
    },
  });

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
    const err = new Error("One or more skills were not found.");
    err.status = 404;
    throw err;
  }
  return skills.map((s) => s._id);
};

exports.addSkills = async (userId, skillInputs) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const ids = await resolveSkillIds(skillInputs);

  const newIds = ids.filter((id) => !user.skills.map((s) => s.toString()).includes(id.toString()));
  if (newIds.length === 0) {
    const err = new Error("All provided skills are already assigned to this user.");
    err.status = 409;
    throw err;
  }

  user.skills.push(...newIds);
  await user.save();
  await Skill.updateMany({ _id: { $in: newIds } }, { $addToSet: { users: user._id } });
  await user.populate("skills");

  //Activity Log for addskill
  await activityLogService.createLog({
    userEmail: user.email,
    action: "ADD_USER_SKILLS",
    entity: "User",
    entityId: user._id.toString(),
    metadata: {
      skillsAdded: Array.isArray(skillInputs) ? skillInputs : [skillInputs],
      count: newIds.length,
    },
  });

  return { user, count: newIds.length };
};

exports.removeSkill = async (userId, skillId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const ids = await resolveSkillIds([skillId]);
  const idStrings = ids.map(String);

  const existingSkillStrings = user.skills.map((s) => s.toString());
  const removableIds = ids.filter((id) => existingSkillStrings.includes(id.toString()));

  if (removableIds.length === 0) {
    const err = new Error("This skill is not assigned to the user.");
    err.status = 404;
    throw err;
  }

  user.skills = user.skills.filter((s) => !idStrings.includes(s.toString()));
  await user.save();

  await Skill.updateMany(
    { _id: { $in: removableIds } },
    { $pull: { users: user._id } }
  );

  await user.populate("skills");

  // activity log
  await activityLogService.createLog({
    userEmail: user.email,
    action: "REMOVE_USER_SKILL",
    entity: "User",
    entityId: user._id.toString(),
    metadata: {
      removedSkill: skillId,
      count: removableIds.length,
    },
  });

  return { user, count: removableIds.length };
};

exports.removeSkills = async (userId, skills) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const inputs = Array.isArray(skills) ? skills : [skills];
  const ids = await resolveSkillIds(inputs);

  const existingSkillStr = user.skills.map((s) => s.toString());
  const removableIds = ids.filter((id) => existingSkillStr.includes(id.toString()));

  if (removableIds.length === 0) {
    const err = new Error("None of the provided skills are assigned to this user.");
    err.status = 404;
    throw err;
  }

  const removableStr = removableIds.map(String);

  user.skills = user.skills.filter((s) => !removableStr.includes(s.toString()));
  await user.save();

  await Skill.updateMany(
    { _id: { $in: removableIds } },
    { $pull: { users: user._id } }
  );

  await user.populate("skills");

  await activityLogService.createLog({
    userEmail: user.email,
    action: "REMOVE_USER_SKILLS",
    entity: "User",
    entityId: user._id.toString(),
    metadata: {
      skillsRemoved: inputs,
      count: removableIds.length,
    },
  });

  return { user, count: removableIds.length };
};



//Implemented Activity log
//cleaning related records after deleting a user