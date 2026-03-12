const Review = require("../models/mongo/Review");
const Project = require("../models/mongo/Project");
const User = require("../models/mongo/User");

const recalculateProjectAggregates = async (projectId) => {
    const reviews = await Review.find({
        project: projectId,
        status: "published",
    });

    const totalReviews = reviews.length;

    let aggregateRating = 0;
    let aggregateCodeQuality = 0;
    let aggregateCreativity = 0;
    let aggregateCleanCode = 0;
    let hireVotes = 0;

    if (totalReviews > 0) {
        aggregateRating =
            reviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews;

        aggregateCodeQuality =
            reviews.reduce((sum, r) => sum + r.codeQualityScore, 0) / totalReviews;

        aggregateCreativity =
            reviews.reduce((sum, r) => sum + r.creativityScore, 0) / totalReviews;

        aggregateCleanCode =
            reviews.reduce((sum, r) => sum + r.cleanCodeScore, 0) / totalReviews;

        hireVotes = reviews.filter((r) => r.wouldHire === true).length;
    }

    await Project.findByIdAndUpdate(projectId, {
        aggregateRating: Number(aggregateRating.toFixed(2)),
        aggregateCodeQuality: Number(aggregateCodeQuality.toFixed(2)),
        aggregateCreativity: Number(aggregateCreativity.toFixed(2)),
        aggregateCleanCode: Number(aggregateCleanCode.toFixed(2)),
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
        .populate("project", "title status")
        .populate("reviewer", "name email role githubUrl");

    if (!review) {
        const err = new Error("Review not found.");
        err.status = 404;
        throw err;
    }

    await recalculateProjectAggregates(review.project._id);

    return review;
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