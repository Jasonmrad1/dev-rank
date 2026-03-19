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

// Create badge validator
exports.validateCreateBadge = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Badge name is required")
    .isLength({ min: 2 })
    .withMessage("Badge name must be at least 2 characters long"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters long"),
  body("icon")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Icon must not be empty"),
  body("category")
    .optional()
    .trim()
    .isIn(["achievement", "skill-master", "reviewer", "contributor", "other"])
    .withMessage("Category must be one of: achievement, skill-master, reviewer, contributor, other"),
  body("criteria")
    .optional()
    .trim()
    .isLength({ min: 5 })
    .withMessage("Criteria must be at least 5 characters long"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

// Update badge validator
exports.validateUpdateBadge = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Badge name must be at least 2 characters long"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters long"),
  body("icon")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Icon must not be empty"),
  body("category")
    .optional()
    .trim()
    .isIn(["achievement", "skill-master", "reviewer", "contributor", "other"])
    .withMessage("Category must be one of: achievement, skill-master, reviewer, contributor, other"),
  body("criteria")
    .optional()
    .trim()
    .isLength({ min: 5 })
    .withMessage("Criteria must be at least 5 characters long"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];
