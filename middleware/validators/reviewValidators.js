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

// Create review validator
exports.validateCreateReview = [
  body("project")
    .trim()
    .notEmpty()
    .withMessage("Project ID is required")
    .isMongoId()
    .withMessage("Project must be a valid MongoDB ID"),
  body("reviewer")
    .trim()
    .notEmpty()
    .withMessage("Reviewer ID is required")
    .isMongoId()
    .withMessage("Reviewer must be a valid MongoDB ID"),
  body("overallRating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Overall rating must be between 1 and 5"),
  body("codeQualityScore")
    .isInt({ min: 1, max: 5 })
    .withMessage("Code quality score must be between 1 and 5"),
  body("creativityScore")
    .isInt({ min: 1, max: 5 })
    .withMessage("Creativity score must be between 1 and 5"),
  body("cleanCodeScore")
    .isInt({ min: 1, max: 5 })
    .withMessage("Clean code score must be between 1 and 5"),
  body("wouldHire")
    .optional()
    .isBoolean()
    .withMessage("wouldHire must be a boolean"),
  body("generalFeedback")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("General feedback must not exceed 1000 characters"),
  body("suggestions")
    .optional()
    .isArray()
    .withMessage("Suggestions must be an array"),
  body("suggestions.*")
    .trim()
    .notEmpty()
    .withMessage("Each suggestion must be a non-empty string"),
  handleValidationErrors,
];

// Update review validator
exports.validateUpdateReview = [
  body("overallRating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Overall rating must be between 1 and 5"),
  body("codeQualityScore")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Code quality score must be between 1 and 5"),
  body("creativityScore")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Creativity score must be between 1 and 5"),
  body("cleanCodeScore")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Clean code score must be between 1 and 5"),
  body("wouldHire")
    .optional()
    .isBoolean()
    .withMessage("wouldHire must be a boolean"),
  body("generalFeedback")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("General feedback must not exceed 1000 characters"),
  body("suggestions")
    .optional()
    .isArray()
    .withMessage("Suggestions must be an array"),
  body("suggestions.*")
    .trim()
    .notEmpty()
    .withMessage("Each suggestion must be a non-empty string"),
  handleValidationErrors,
];
