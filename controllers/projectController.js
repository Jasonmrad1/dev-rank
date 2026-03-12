const projectService = require("../services/projectService");

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const project = await projectService.createProject(req.body);
    res.status(201).json(project);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await projectService.getAllProjects(req.query);
    res.status(200).json(projects);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Get project by ID
exports.getProject = async (req, res) => {
  try {
    const project = await projectService.getProject(req.params.id);
    res.status(200).json(project);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body);
    res.status(200).json(project);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const result = await projectService.deleteProject(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Get reviews for a project
exports.getProjectReviews = async (req, res) => {
  try {
    const reviews = await projectService.getProjectReviews(req.params.id);
    res.status(200).json(reviews);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};




