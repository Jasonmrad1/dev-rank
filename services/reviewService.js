const Review = require("../models/mongo/Review");
const Project = require("../models/mongo/Project");
const User = require("../models/mongo/User");
const activityLogService = require("./activityLogService");


const calculateAverage = (reviews, field) => {
    if (reviews.length === 0) return 0;

    const total = reviews.reduce((sum, review) => sum + review[field], 0);
    return Number((total / reviews.length).toFixed(2));
};

const recalculateUserProfileScore = async (userId) => {
    const ownedProjects = await Project.find({ owner: userId });

    if (ownedProjects.length === 0) {
        await User.findByIdAndUpdate(userId, { profileScore: 0 });
        return;
    }

    const scoredProjects = ownedProjects.filter(
        (p) => typeof p.aggregateRating === "number" && p.totalReviews > 0
    );

    if (scoredProjects.length === 0) {
        await User.findByIdAndUpdate(userId, { profileScore: 0 });
        return;
    }

    const avg =
        scoredProjects.reduce((sum, p) => sum + p.aggregateRating, 0) /
        scoredProjects.length;

    await User.findByIdAndUpdate(userId, {
        profileScore: Number(avg.toFixed(2)),
    });
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

    if (!existingReviewer.isVerifiedReviewer || existingReviewer.role !== "reviewer") {
        const err = new Error("Only verified reviewers can submit reviews.");
        err.status = 403;
        throw err;
    }

    //prevent user from reviewing their own project
    if (existingProject.owner.toString() === reviewer.toString()) {
        const err = new Error("Project owners cannot review their own projects.");
        err.status = 403;
        throw err;
    }

    //Reviewer can review project once
    const alreadyReviewed = await Review.findOne({ project, reviewer });
    if (alreadyReviewed) {
        const err = new Error("This reviewer has already reviewed this project.");
        err.status = 409;
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
    await recalculateUserProfileScore(existingProject.owner)

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

    const updatedProject = await Project.findById(review.project);
    await recalculateUserProfileScore(updatedProject.owner);

    const populatedReview = await Review.findById(review._id)
        .populate("project", "title status")
        .populate("reviewer", "name email role githubUrl");

    //Implement log for update Review
    await activityLogService.createLog({
        userEmail: populatedReview.reviewer.email,
        action: "UPDATE_REVIEW",
        entity: "Review",
        entityId: review._id.toString(),
        metadata: {
            projectId: review.project.toString(),
            status: review.status,
        },
    });

    return populatedReview;


};

exports.deleteReview = async (id) => {
    const review = await Review.findByIdAndDelete(id);

    if (!review) {
        const err = new Error("Review not found.");
        err.status = 404;
        throw err;
    }

    await Review.findByIdAndDelete(id);

    await recalculateProjectAggregates(review.project);

    const affectedProject = await Project.findById(review.project);
    if (affectedProject) {
        await recalculateUserProfileScore(affectedProject.owner);
    }

    await activityLogService.createLog({
        userEmail: review.reviewer.email,
        action: "DELETE_REVIEW",
        entity: "Review",
        entityId: review._id.toString(),
        metadata: {
            projectId: review.project.toString(),
        },
    });

    return { message: "Review deleted successfully." };
};


//Remove dup reviews
//Add profile Score recalculation
//Implemented log for UD