const express = require("express");
const router = express.Router();
const certificationController = require("../controllers/certificationController");
const {validateCreateCertificationRequest, validateUpdateCertificationRequest} = require("../middleware/validators/certificationValidators");

// POST /api/certifications/apply - Apply for certification
router.post("/apply", validateCreateCertificationRequest, certificationController.apply);

// GET /api/certifications - Get all certification requests
router.get("/", certificationController.getAllRequests);
// PATCH /api/certifications/:certificationRequestId/approve - Approve certification
router.patch("/:certificationRequestId/approve", validateUpdateCertificationRequest, certificationController.approve);

// PATCH /api/certifications/:certificationRequestId/reject - Reject certification
router.patch("/:certificationRequestId/reject", validateUpdateCertificationRequest, certificationController.reject);

//TODO add to routes in openApi
// GET /api/certifications/:certificationId - Get certification by ID 
router.get("/:certificationId", require("../controllers/certificationController").getById);

module.exports = router;
