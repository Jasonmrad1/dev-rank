const Skill = require("../models/mongo/Skill");
const User = require("../models/mongo/User");

exports.createSkill = async ({ name, category, isPreset }) => {
  const existing = await Skill.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
  if (existing) {
    const err = new Error("A skill with this name already exists.");
    err.status = 409;
    err.skill = existing;
    throw err;
  }
  return await Skill.create({ name, category, isPreset: isPreset || false });
};

exports.getAllSkills = async ({ category, preset }) => {
  const filter = {};
  if (category) filter.category = { $in: Array.isArray(category) ? category : [category] };
  if (preset !== undefined) filter.isPreset = preset === "true";
  return await Skill.find(filter).sort({ isPreset: -1, name: 1 });
};

exports.getSkill = async (id) => {
  const skill = await Skill.findById(id).populate("users", "name email avatarUrl");
  if (!skill) {
    const err = new Error("Skill not found.");
    err.status = 404;
    throw err;
  }
  return skill;
};

exports.getSkillByName = async (name) => {
  const skill = await Skill.findOne({
    name: { $regex: `^${name}$`, $options: "i" }
  }).populate("users", "name email avatarUrl");

  if (!skill) {
    const err = new Error("Skill not found.");
    err.status = 404;
    throw err;
  }

  return skill;
};

exports.updateSkill = async (id, { name, category, isPreset }) => {
  const skill = await Skill.findByIdAndUpdate(
    id,
    { name, category, isPreset },
    { returnDocument: "after", runValidators: true }
  );

  if (!skill) {
    const err = new Error("Skill not found.");
    err.status = 404;
    throw err;
  }

  return skill;
};

exports.deleteSkill = async (id) => {
  const skill = await Skill.findByIdAndDelete(id);
  if (!skill) {
    const err = new Error("Skill not found.");
    err.status = 404;
    throw err;
  }

  await User.updateMany(
    { skills: skill._id },
    { $pull: { skills: skill._id } }
  );
};

exports.updateSkillByName = async (name, { name: newName, category, isPreset }) => {
  const skill = await Skill.findOneAndUpdate(
    { name: { $regex: `^${name}$`, $options: "i" } },
    { name: newName, category, isPreset },
    { returnDocument: "after", runValidators: true }
  );

  if (!skill) {
    const err = new Error("Skill not found.");
    err.status = 404;
    throw err;
  }

  return skill;
};

exports.deleteSkillByName = async (name) => {
  const skill = await Skill.findOneAndDelete({
    name: { $regex: `^${name}$`, $options: "i" }
  });

  if (!skill) {
    const err = new Error("Skill not found.");
    err.status = 404;
    throw err;
  }

  await User.updateMany(
    { skills: skill._id },
    { $pull: { skills: skill._id } }
  );
};