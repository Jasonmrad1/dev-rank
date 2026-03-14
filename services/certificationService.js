const CertificationRequest = require("../models/mongo/CertificationRequest");
const User = require("../models/mongo/User");
const certificationLogger = require("../loggers/certificationLogger");
const AppError = require("../utils/AppError");

exports.apply = async (data) => {
  const { user, cvUrl, experience, motivation, techExpertise } = data;

  const existingUser = await User.findById(user);
  if (!existingUser) {
    throw new AppError("User not found.", 404);
  }

  const existing = await CertificationRequest.findOne({ user, status: "pending" });
  if (existing) {
    throw new AppError("User already has a pending certification request.", 409);
  }

  const request = await CertificationRequest.create({
    user,
    cvUrl,
    experience,
    motivation,
    techExpertise,
  });

  await User.findByIdAndUpdate(user, { reviewerStatus: "pending" , isVerifiedReviewer: false});

  certificationLogger.logCertificationApplied(existingUser._id.toString(), request._id.toString(), techExpertise);

  return request;
};

exports.getAllRequests = async () => {
  return await CertificationRequest.find().populate("user", "name email role reviewerStatus isVerifiedReviewer");
};

//Approve certification request
exports.approve = async (id, adminNotes) => {
  const request = await CertificationRequest.findById(id);
  if (!request) {
    throw new AppError("Certification request not found.", 404);
  }

  //Only pending requests
  if (request.status !== "pending") {
    throw new AppError("Only pending certification requests can be approved.", 409);
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

  //activity log
  certificationLogger.logCertificationApproved("system", request._id.toString(), adminNotes);

  return request;
};

//Reject certification request
exports.reject = async (id, adminNotes) => {
  const request = await CertificationRequest.findById(id);
  if (!request) {
    throw new AppError("Certification request not found.", 404);
  }

  //Request must be pending
  if (request.status !== "pending") {
    throw new AppError("Only pending certification requests can be rejected.", 409);
  }

  request.status = "rejected";
  request.adminNotes = adminNotes;
  request.reviewedAt = new Date();
  await request.save();

  await User.findByIdAndUpdate(request.user, { reviewerStatus: "rejected", isVerifiedReviewer: false });

  certificationLogger.logCertificationRejected("system", request._id.toString(), adminNotes);

  return request;
};