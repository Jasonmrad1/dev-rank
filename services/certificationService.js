const CertificationRequest = require("../models/mongo/CertificationRequest");
const User = require("../models/mongo/User");

exports.apply = async (data) => {
  const { user, cvUrl, experience, motivation, techExpertise } = data;

  const existingUser = await User.findById(user);
  if (!existingUser) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const existing = await CertificationRequest.findOne({ user, status: "pending" });
  if (existing) {
    const err = new Error("User already has a pending certification request.");
    err.status = 409;
    throw err;
  }

  const request = await CertificationRequest.create({
    user,
    cvUrl,
    experience,
    motivation,
    techExpertise,
  });

  await User.findByIdAndUpdate(user, { reviewerStatus: "pending" });

  return request;
};

exports.getAllRequests = async () => {
  return await CertificationRequest.find().populate("user", "name email role reviewerStatus isVerifiedReviewer");
};

exports.approve = async (id, adminNotes) => {
  const request = await CertificationRequest.findById(id);
  if (!request) {
    const err = new Error("Certification request not found.");
    err.status = 404;
    throw err;
  }

  request.status = "approved";
  request.adminNotes = adminNotes;
  request.reviewedAt = new Date();
  await request.save();

  await User.findByIdAndUpdate(request.user, {
    isVerifiedReviewer: true,
    reviewerStatus: "approved",
    role: "reviewer",
  });

  return request;
};

exports.reject = async (id, adminNotes) => {
  const request = await CertificationRequest.findById(id);
  if (!request) {
    const err = new Error("Certification request not found.");
    err.status = 404;
    throw err;
  }

  request.status = "rejected";
  request.adminNotes = adminNotes;
  request.reviewedAt = new Date();
  await request.save();

  await User.findByIdAndUpdate(request.user, { reviewerStatus: "rejected" });

  return request;
};
