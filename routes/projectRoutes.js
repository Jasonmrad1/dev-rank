const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const {
  validateCreateProject,
  validateUpdateProject,
} = require("../middleware/validators/projectValidators");

// POST /api/projects - Create a new project
router.post("/", validateCreateProject, projectController.createProject);

// GET /api/projects/title/:title - Get project by title
router.get("/title/:title", projectController.getProjectByTitle);

// GET /api/projects/user/:userId - Get all projects by a specific user
router.get("/user/:userId", projectController.getProjectsByUser);

// GET /api/projects/:id/reviews - Get reviews for a project
router.get("/:id/reviews", projectController.getProjectReviews);

// GET /api/projects/:id - Get project by ID
router.get("/:id", projectController.getProject);

// PUT /api/projects/:id - Update project
router.put("/:id", validateUpdateProject, projectController.updateProject);

// DELETE /api/projects/:id - Delete project
router.delete("/:id", projectController.deleteProject);

// GET /api/projects - Get all projects
router.get("/", projectController.getAllProjects);



module.exports = router;
