const Project = require("../models/mongo/Project");
const Review = require("../models/mongo/Review");
const User = require("../models/mongo/User");
const projectLogger = require("../loggers/projectLogger");
const AppError = require("../utils/AppError");

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

exports.recalculateUserProfileScore = recalculateUserProfileScore;

exports.createProject = async (data) => {
    const { owner, title, description, repoUrl, liveUrl, techStack, status } = data;

    const ownerUser = await User.findById(owner);
    if (!ownerUser) {
        throw new AppError("Owner user not found.", 404);
    }

    const project = await Project.create({
        owner,
        title,
        description,
        repoUrl,
        liveUrl,
        techStack,
        status,
    });

    //implement activityLog
    projectLogger.logProjectCreated(
      ownerUser._id.toString(),
      project._id.toString(),
      project.title,
      project.status
    );

    return await project.populate("owner", "name email role githubUrl");
};

exports.getAllProjects = async (filters = {}) => {
    const query = {};

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.owner) {
        query.owner = filters.owner;
    }

    if (filters.techStack) {
        const techs = Array.isArray(filters.techStack)
            ? filters.techStack
            : [filters.techStack];
        query.techStack = { $in: techs };
    }

    return await Project.find(query)
        .populate("owner", "name email role githubUrl")
        .sort({ createdAt: -1 });
};

exports.getProject = async (id) => {
    const project = await Project.findById(id).populate(
        "owner",
        "name email role githubUrl"
    );

    if (!project) {
        throw new AppError("Project not found.", 404);
    }

    return project;
};

exports.updateProject = async (id, data) => {
    const project = await Project.findByIdAndUpdate(
        id,
        {
            title: data.title,
            description: data.description,
            repoUrl: data.repoUrl,
            liveUrl: data.liveUrl,
            techStack: data.techStack,
            status: data.status,
        },
        { new: true, runValidators: true }
    ).populate("owner", "name email role githubUrl");

    if (!project) {
        throw new AppError("Project not found.", 404);
    }

    projectLogger.logProjectUpdated(
      project.owner._id.toString(),
      project._id.toString(),
      project.title,
      project.status
    );

    return project;
};


// Helper function to clean up project data on deletion
async function cleanupProjectData(project) {
    // Delete the project
    await Project.findByIdAndDelete(project._id);
    // Delete related reviews
    await Review.deleteMany({ project: project._id });
    // Recalculate owner's profile score directly
    await recalculateUserProfileScore(project.owner._id);
    // Log the deletion
    projectLogger.logProjectDeleted(
      project.owner._id.toString(),
      project._id.toString(),
      project.title
    );
}

exports.deleteProject = async (id) => {
    const project = await Project.findById(id).populate("owner", "email");
    if (!project) {
        throw new AppError("Project not found.", 404);
    }
    await cleanupProjectData(project);
    return { message: "Project deleted successfully." };
};

exports.getProjectReviews = async (id) => {
    const project = await Project.findById(id);
    if (!project) {
        throw new AppError("Project not found.", 404);
    }

    return await Review.find({ project: id })
        .populate("reviewer", "name email role githubUrl")
        .populate("project", "title status")
        .sort({ createdAt: -1 });
};