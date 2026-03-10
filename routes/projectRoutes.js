const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");

// POST /api/projects - Create a new project
router.post("/", projectController.createProject);

// GET /api/projects - Get all projects
router.get("/", projectController.getAllProjects);

// GET /api/projects/:id - Get project by ID
router.get("/:id", projectController.getProject);

// PUT /api/projects/:id - Update project
router.put("/:id", projectController.updateProject);

// DELETE /api/projects/:id - Delete project
router.delete("/:id", projectController.deleteProject);

// GET /api/projects/:id/reviews - Get reviews for a project
router.get("/:id/reviews", projectController.getProjectReviews);

module.exports = router;
