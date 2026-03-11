const bcrypt = require("bcrypt");
const User = require("../models/mongo/User");
const Skill = require("../models/mongo/Skill");

exports.registerUser = async ({ name, email, password, role, bio, githubUrl, avatarUrl }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error("A user with this email address already exists.");
    err.status = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  return await User.create({ name, email, passwordHash, role, bio, githubUrl, avatarUrl });
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
    { returnDocument: 'after', runValidators: true }
  ).populate("skills");
  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }
  return user;
};

exports.deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }
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
  await user.save().pop;
  await Skill.updateMany({ _id: { $in: newIds } }, { $addToSet: { users: user._id } });
  await user.populate("skills");
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

  user.skills = user.skills.filter((s) => !idStrings.includes(s.toString()));
  await user.save();
  await Skill.updateMany({ _id: { $in: ids } }, { $pull: { users: user._id } });

  return { user, count: ids.length };
};

exports.removeSkills = async (userId, skills) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const ids = await resolveSkillIds(Array.isArray(skills) ? skills : [skills]);
  const idStrings = ids.map(String);

  user.skills = user.skills.filter((s) => !idStrings.includes(s.toString()));
  await user.save();
  await Skill.updateMany({ _id: { $in: ids } }, { $pull: { users: user._id } });

  return { user, count: ids.length };
};
