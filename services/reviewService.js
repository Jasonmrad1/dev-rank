const Review = require("../models/mongo/Review");
const Project = require("../models/mongo/Project");
const User = require("../models/mongo/User");
const activityLogService = require("./activityLogService");


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
        const err = new Error("Project not found.");
        err.status = 404;
        throw err;
    }

    const existingReviewer = await User.findById(reviewer);
    if (!existingReviewer) {
        const err = new Error("Reviewer user not found.");
        err.status = 404;
        throw err;
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
    
    //implement activityLog
    await activityLogService.createLog({
        userEmail: existingReviewer.email,
        action: "CREATE_REVIEW",
        entity: "Review",
        entityId: review._id.toString(),
        metadata: {
            projectId: project.toString(),
            overallRating,
            status,
        },
    });

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
        const err = new Error("Review not found.");
        err.status = 404;
        throw err;
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
        const err = new Error("Review not found.");
        err.status = 404;
        throw err;
    }

    await recalculateProjectAggregates(review.project);

    return await Review.findById(review._id)
        .populate("project", "title status")
        .populate("reviewer", "name email role githubUrl");


};

exports.deleteReview = async (id) => {
    const review = await Review.findByIdAndDelete(id);

    if (!review) {
        const err = new Error("Review not found.");
        err.status = 404;
        throw err;
    }

    await recalculateProjectAggregates(review.project);

    return { message: "Review deleted successfully." };
};