const Review = require("../models/mongo/Review");
const Project = require("../models/mongo/Project");
const User = require("../models/mongo/User");
const reviewLogger = require("../loggers/reviewLogger");
const {recalculateUserProfileScore}= require("./projectService");
const AppError = require("../utils/AppError");

const calculateAverage = (reviews, field) => {
    if (reviews.length === 0) return 0;

    const total = reviews.reduce((sum, review) => sum + review[field], 0);
    return Number((total / reviews.length).toFixed(2));
};

const recalculateProjectAggregates = async (projectId) => {
    const reviews = await Review.find({
        project: projectId,
        status: "published",
    });

    const totalReviews = reviews.length;

    const aggregateRating = calculateAverage(reviews, "overallRating");
    const aggregateCodeQuality = calculateAverage(reviews, "codeQualityScore");
    const aggregateCreativity = calculateAverage(reviews, "creativityScore");
    const aggregateCleanCode = calculateAverage(reviews, "cleanCodeScore");
    const hireVotes = reviews.filter((r) => r.wouldHire === true).length;


    await Project.findByIdAndUpdate(projectId, {
        aggregateRating,
        aggregateCodeQuality,
        aggregateCreativity,
        aggregateCleanCode,
        totalReviews,
        hireVotes,
        status: totalReviews > 0 ? "reviewed" : "seeking-review",
    });
};

exports.createReview = async (data) => {
    const {
        project,
        reviewer,
        overallRating,
        codeQualityScore,
        creativityScore,
        cleanCodeScore,
        wouldHire,
        generalFeedback,
        suggestions,
        status,
    } = data;

    const existingProject = await Project.findById(project);
    if (!existingProject) {
        throw new AppError("Project not found.", 404);
    }

    const existingReviewer = await User.findById(reviewer);
    if (!existingReviewer) {
        throw new AppError("Reviewer user not found.", 404);
    }

    if (!existingReviewer.isVerifiedReviewer || existingReviewer.role !== "reviewer") {
        throw new AppError("Only verified reviewers can submit reviews.", 403);
    }

    //prevent user from reviewing their own project
    if (existingProject.owner.toString() === reviewer.toString()) {
        throw new AppError("Project owners cannot review their own projects.", 403);
    }

    //Reviewer can review project once
    const alreadyReviewed = await Review.findOne({ project, reviewer });
    if (alreadyReviewed) {
        throw new AppError("This reviewer has already reviewed this project.", 409);
    }


    const review = await Review.create({
        project,
        reviewer,
        overallRating,
        codeQualityScore,
        creativityScore,
        cleanCodeScore,
        wouldHire,
        generalFeedback,
        suggestions,
        status,
    });

    await recalculateProjectAggregates(project);
    await recalculateUserProfileScore(existingProject.owner);

    //implement activityLog
    reviewLogger.logReviewCreated(
      existingReviewer._id.toString(),
      review._id.toString(),
      project.toString(),
      overallRating,
      status
    );

    return await review.populate([
        { path: "project", select: "title status" },
        { path: "reviewer", select: "name email role githubUrl" },
    ]);
};

exports.getAllReviews = async (filters = {}) => {
    const query = {};

    if (filters.project) query.project = filters.project;
    if (filters.reviewer) query.reviewer = filters.reviewer;
    if (filters.status) query.status = filters.status;

    return await Review.find(query)
        .populate("project", "title status")
        .populate("reviewer", "name email role githubUrl")
        .sort({ createdAt: -1 });
};

exports.getReview = async (id) => {
    const review = await Review.findById(id)
        .populate("project", "title status")
        .populate("reviewer", "name email role githubUrl");

    if (!review) {
        throw new AppError("Review not found.", 404);
    }

    return review;
};

exports.updateReview = async (id, data) => {
    const review = await Review.findByIdAndUpdate(
        id,
        {
            overallRating: data.overallRating,
            codeQualityScore: data.codeQualityScore,
            creativityScore: data.creativityScore,
            cleanCodeScore: data.cleanCodeScore,
            wouldHire: data.wouldHire,
            generalFeedback: data.generalFeedback,
            suggestions: data.suggestions,
            status: data.status,
        },
        { new: true, runValidators: true }
    )

    if (!review) {
        throw new AppError("Review not found.", 404);
    }

    await recalculateProjectAggregates(review.project);

    const updatedProject = await Project.findById(review.project);
    await recalculateUserProfileScore(updatedProject.owner);

    const populatedReview = await Review.findById(review._id)
        .populate("project", "title status")
        .populate("reviewer", "name email role githubUrl");

    //Implement log for update Review
    reviewLogger.logReviewUpdated(
      populatedReview.reviewer._id.toString(),
      review._id.toString(),
      review.project.toString(),
      review.status
    );

    return populatedReview;
};

exports.deleteReview = async (id) => {
    const review = await Review.findById(id).populate("reviewer", "email");

    if (!review) {
        throw new AppError("Review not found.", 404);
    }

    await Review.findByIdAndDelete(id);

    await recalculateProjectAggregates(review.project);

    const affectedProject = await Project.findById(review.project);
    if (affectedProject) {
        await recalculateUserProfileScore(affectedProject.owner);
    }

    reviewLogger.logReviewDeleted(
      review.reviewer._id.toString(),
      review._id.toString(),
      review.project.toString()
    );

    return { message: "Review deleted successfully." };
};