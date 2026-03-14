const certificationService = require("../services/certificationService");

// Apply for certification
exports.apply = async (req, res) => {
  try {
    const request = await certificationService.apply(req.body);
    res.status(201).json(request);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Get all certification requests
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await certificationService.getAllRequests();
    res.status(200).json(requests);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Approve certification
exports.approve = async (req, res) => {
  try {
    const request = await certificationService.approve(req.params.id, req.body.adminNotes, req.body.adminUserId);
    res.status(200).json(request);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// Reject certification
exports.reject = async (req, res) => {
  try {
    const request = await certificationService.reject(req.params.id, req.body.adminNotes, req.body.adminUserId);
    res.status(200).json(request);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};


//Send adminUserId to verify its an admin