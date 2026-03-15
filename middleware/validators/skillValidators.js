const { body, validationResult } = require("express-validator");

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      errorCode: "ERR_VALIDATION",
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// Create skill validator
exports.validateCreateSkill = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Skill name is required")
    .isLength({ min: 2 })
    .withMessage("Skill name must be at least 2 characters long"),
  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .isIn(["frontend", "backend", "devops", "database", "mobile", "other"])
    .withMessage("Category must be one of: frontend, backend, devops, database, mobile, other"),
  body("isPreset")
    .optional()
    .isBoolean()
    .withMessage("isPreset must be a boolean"),
  handleValidationErrors,
];

// Update skill validator
exports.validateUpdateSkill = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Skill name cannot be empty")
    .isLength({ min: 2 })
    .withMessage("Skill name must be at least 2 characters long"),
  body("category")
    .optional()
    .trim()
    .isIn(["frontend", "backend", "devops", "database", "mobile", "other"])
    .withMessage("Category must be one of: frontend, backend, devops, database, mobile, other"),
  body("isPreset")
    .optional()
    .isBoolean()
    .withMessage("isPreset must be a boolean"),
  handleValidationErrors,
];
