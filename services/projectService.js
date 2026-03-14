const Project = require("../models/mongo/Project");
const Review = require("../models/mongo/Review");
const User = require("../models/mongo/User");
const activityLogService = require("./activityLogService");

exports.createProject = async (data) => {
    const { owner, title, description, repoUrl, liveUrl, techStack, status } = data;

    const ownerUser = await User.findById(owner);
    if (!ownerUser) {
        const err = new Error("Owner user not found.");
        err.status = 404;
        throw err;
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
    await activityLogService.createLog({
        userEmail: ownerUser.email,
        action: "CREATE_PROJECT",
        entity: "Project",
        entityId: project._id.toString(),
        metadata: {
            title: project.title,
            status: project.status,
        },
    });

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
        const err = new Error("Project not found.");
        err.status = 404;
        throw err;
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
        const err = new Error("Project not found.");
        err.status = 404;
        throw err;
    }

    return project;
};

exports.deleteProject = async (id) => {
    const project = await Project.findByIdAndDelete(id);

    if (!project) {
        const err = new Error("Project not found.");
        err.status = 404;
        throw err;
    }

    // delete also related reviews
    await Review.deleteMany({ project: id });

    return { message: "Project deleted successfully." };
};

exports.getProjectReviews = async (id) => {
    const project = await Project.findById(id);
    if (!project) {
        const err = new Error("Project not found.");
        err.status = 404;
        throw err;
    }

    return await Review.find({ project: id })
        .populate("reviewer", "name email role githubUrl")
        .populate("project", "title status")
        .sort({ createdAt: -1 });
};
