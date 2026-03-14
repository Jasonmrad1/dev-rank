const CertificationRequest = require("../models/mongo/CertificationRequest");
const User = require("../models/mongo/User");
const activityLogService = require("./activityLogService");

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

  await User.findByIdAndUpdate(user, { reviewerStatus: "pending" }, {isVerifiedReviewer: false});

  //implement activityLog
  await activityLogService.createLog({
    userEmail: existingUser.email,
    action: "APPLY_CERTIFICATION",
    entity: "CertificationRequest",
    entityId: request._id.toString(),
    metadata: {
      techExpertise,
    },
  });

  return request;
};

exports.getAllRequests = async () => {
  return await CertificationRequest.find().populate("user", "name email role reviewerStatus isVerifiedReviewer");
};

//Only admin can approve
exports.approve = async (id, adminNotes, adminUserId) => {
  const adminUser = await User.findById(adminUserId);
  if (!adminUser) {
    const err = new Error("Admin user not found!");
    err.status = 404;
    throw err;
  }

  if (adminUser.role !== "admin") {
    const err = new Error("Only admins can approve certification requests.");
    err.status = 403;
    throw err;
  }

  const request = await CertificationRequest.findById(id);
  if (!request) {
    const err = new Error("Certification request not found.");
    err.status = 404;
    throw err;
  }

  //Only pending requests
  if (request.status !== "pending") {
    const err = new Error("Only pending certification requests can be approved.");
    err.status = 409;
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

  const approvedUser = await User.findById(request.user);

  //activity log
  await activityLogService.createLog({
    userEmail: approvedUser.email,
    action: "APPROVE_CERTIFICATION",
    entity: "CertificationRequest",
    entityId: request._id.toString(),
    metadata: {
      adminNotes,
    },
  });


  return request;
};

//Only admin can reject
exports.reject = async (id, adminNotes) => {

  const adminUser = await User.findById(adminUserId);
  if (!adminUser) {
    const err = new Error("Admin user not found.");
    err.status = 404;
    throw err;
  }

  if (adminUser.role !== "admin") {
    const err = new Error("Only admins can reject certification requests.");
    err.status = 403;
    throw err;
  }

  const request = await CertificationRequest.findById(id);
  if (!request) {
    const err = new Error("Certification request not found.");
    err.status = 404;
    throw err;
  }

  //Request must be pending 
  if (request.status !== "pending") {
    const err = new Error("Only pending certification requests can be rejected.");
    err.status = 409;
    throw err;
  }

  request.status = "rejected";
  request.adminNotes = adminNotes;
  request.reviewedAt = new Date();
  await request.save();

  await User.findByIdAndUpdate(request.user, { reviewerStatus: "rejected" , isVerifiedReviewer:false});

  const rejectedUser = await User.findById(request.user);

  await activityLogService.createLog({
    userEmail: rejectedUser.email,
    action: "REJECT_CERTIFICATION",
    entity: "CertificationRequest",
    entityId: request._id.toString(),
    metadata: {
      adminNotes,
    },
  });

  return request;
};


//Made admin only can approve or reject 
//Req must be pending