const skillService = require("../services/skillService");

// Create a new skill
exports.createSkill = async (req, res) => {
  try {
    const skill = await skillService.createSkill(req.body);
    res.status(201).json({ message: "Skill created successfully.", skill });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, skill: err.skill });
  }
};

// Get all skills
exports.getAllSkills = async (req, res) => {
  try {
    const skills = await skillService.getAllSkills(req.query);
    res.status(200).json({ skills });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Get skill by ID
exports.getSkill = async (req, res) => {
  try {
    const skill = await skillService.getSkill(req.params.id);
    res.status(200).json({ skill });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Get skill by name
exports.getSkillByName = async (req, res) => {
  try {
    const skill = await skillService.getSkillByName(req.params.name);
    res.status(200).json({ skill });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Update skill
exports.updateSkill = async (req, res) => {
  try {
    const skill = await skillService.updateSkill(req.params.id, req.body);
    res.status(200).json({ message: "Skill updated successfully.", skill });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Delete skill
exports.deleteSkill = async (req, res) => {
  try {
    await skillService.deleteSkill(req.params.id);
    res.status(200).json({ message: "Skill deleted successfully." });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Update skill by name
exports.updateSkillByName = async (req, res) => {
  try {
    const skill = await skillService.updateSkillByName(req.params.name, req.body);
    res.status(200).json({ message: "Skill updated successfully.", skill });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Delete skill by name
exports.deleteSkillByName = async (req, res) => {
  try {
    await skillService.deleteSkillByName(req.params.name);
    res.status(200).json({ message: "Skill deleted successfully." });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
