const express = require("express");
const router = express.Router();
const skillController = require("../controllers/skillController");

// POST /api/skills - Create a new skill
router.post("/", skillController.createSkill);

// GET /api/skills - Get all skills
router.get("/", skillController.getAllSkills);

// GET /api/skills/:id - Get skill by ID
router.get("/:id", skillController.getSkill);

// PUT /api/skills/:id - Update skill
router.put("/:id", skillController.updateSkill);

// DELETE /api/skills/:id - Delete skill
router.delete("/:id", skillController.deleteSkill);

module.exports = router;
