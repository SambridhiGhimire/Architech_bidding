const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Project = require("../models/Project");
const User = require("../models/User");
const { auth, authorizeRoles } = require("../middleware/auth");
const { uploadProjectFiles, handleUploadError } = require("../middleware/upload");
const parseNestedFormData = require("../middleware/parseFormData");

const router = express.Router();

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private (Project Owners only)
router.post(
  "/",
  [
    auth,
    authorizeRoles("project_owner"),
    uploadProjectFiles,
    handleUploadError,
    parseNestedFormData,
    body("title").trim().notEmpty().withMessage("Project title is required"),
    body("description").trim().notEmpty().withMessage("Project description is required"),
    body("category").isIn(["residential", "commercial", "industrial", "infrastructure", "renovation", "other"]).withMessage("Invalid category"),
    body("location.address").trim().notEmpty().withMessage("Address is required"),
    body("location.city").trim().notEmpty().withMessage("City is required"),
    body("location.state").trim().notEmpty().withMessage("State is required"),
    body("budget.min").isNumeric().withMessage("Minimum budget must be a number"),
    body("budget.max").isNumeric().withMessage("Maximum budget must be a number"),
    body("timeline.startDate").isISO8601().withMessage("Start date must be a valid date"),
    body("timeline.endDate").isISO8601().withMessage("End date must be a valid date"),
    body("timeline.estimatedDuration").isNumeric().withMessage("Estimated duration must be a number"),
    body("specifications.area").isNumeric().withMessage("Area must be a number"),
    body("biddingDeadline").isISO8601().withMessage("Bidding deadline must be a valid date"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, category, location, budget, timeline, specifications, biddingDeadline, requirements, specialRequirements } = req.body;

      // Process uploaded files
      const files = {};
      if (req.files) {
        if (req.files.propertyImages) {
          files.propertyImages = req.files.propertyImages.map((file) => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.relativeFilePath || file.path,
          }));
        }
        if (req.files.boq) {
          files.boq = req.files.boq.map((file) => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.relativeFilePath || file.path,
          }));
        }
        if (req.files.drawings) {
          files.drawings = req.files.drawings.map((file) => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.relativeFilePath || file.path,
          }));
        }
        if (req.files.otherDocuments) {
          files.otherDocuments = req.files.otherDocuments.map((file) => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.relativeFilePath || file.path,
          }));
        }
      }

      // Create project
      const project = new Project({
        title,
        description,
        category,
        location,
        budget,
        timeline,
        specifications: {
          ...specifications,
          requirements: requirements ? JSON.parse(requirements) : [],
          specialRequirements,
        },
        biddingDeadline,
        isPublic: true,
        status: "live",
        owner: req.user._id,
        files,
      });

      await project.save();

      // Populate owner details
      await project.populate("owner", "firstName lastName email");

      res.status(201).json({
        message: "Project created successfully",
        project,
      });
    } catch (error) {
      console.error("Create project error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/projects
// @desc    Get all projects (with filters)
// @access  Public (for browsing) / Private (for user's projects)
router.get(
  "/",
  [
    query("category").optional().isIn(["residential", "commercial", "industrial", "infrastructure", "renovation", "other"]),
    query("city").optional().trim(),
    query("state").optional().trim(),
    query("minBudget").optional().isNumeric(),
    query("maxBudget").optional().isNumeric(),
    query("status").optional().isIn(["draft", "live", "in_progress", "completed", "cancelled"]),
    query("page").optional().isNumeric(),
    query("limit").optional().isNumeric(),
  ],
  async (req, res) => {
    try {
      const { category, city, state, minBudget, maxBudget, status, page = 1, limit = 10, myProjects = false } = req.query;

      // Build filter object
      const filter = {};

      // If authenticated user wants their own projects
      if (req.user && myProjects === "true") {
        filter.owner = req.user._id;
      } else {
        // Public projects only (live status and public visibility)
        filter.status = "live";
        filter.isPublic = true;
      }

      if (category) filter.category = category;
      if (city) filter["location.city"] = new RegExp(city, "i");
      if (state) filter["location.state"] = new RegExp(state, "i");
      if (status) filter.status = status;
      if (minBudget || maxBudget) {
        filter.budget = {};
        if (minBudget) filter.budget.$gte = parseFloat(minBudget);
        if (maxBudget) filter.budget.$lte = parseFloat(maxBudget);
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      console.log(filter);

      // Get projects
      const projects = await Project.find(filter)
        .populate("owner", "firstName lastName email")
        .populate("assignedArchitect", "firstName lastName email")
        .populate("bids.serviceProvider", "firstName lastName email _id")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get total count
      const total = await Project.countDocuments(filter);

      // Add virtual fields
      const projectsWithVirtuals = projects.map((project) => ({
        ...project,
        bidCount: project.bids ? project.bids.length : 0,
        daysUntilDeadline: Math.ceil((new Date(project.biddingDeadline) - new Date()) / (1000 * 60 * 60 * 24)),
      }));

      res.json({
        projects: projectsWithVirtuals,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          totalProjects: total,
        },
      });
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Public (for live projects) / Private (for project owner)
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("owner", "firstName lastName email phone")
      .populate("assignedArchitect", "firstName lastName email phone")
      .populate("bids.serviceProvider", "firstName lastName email serviceProvider");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check access permissions
    const isOwner = req.user && project.owner._id.toString() === req.user._id.toString();
    const isPublic = project.status === "live" && project.isPublic;

    if (!isOwner && !isPublic) {
      return res.status(403).json({ message: "Access denied" });
    }

    // If not owner, remove sensitive information but keep basic owner info
    if (!isOwner) {
      const publicProject = project.getPublicData();
      publicProject.bidCount = project.bids.length;
      publicProject.daysUntilDeadline = Math.ceil((new Date(project.biddingDeadline) - new Date()) / (1000 * 60 * 60 * 24));

      // Add basic owner information for display
      if (project.owner) {
        publicProject.owner = {
          firstName: project.owner.firstName,
          lastName: project.owner.lastName,
          email: project.owner.email,
        };
      }

      // Add basic architect information if assigned
      if (project.assignedArchitect) {
        publicProject.assignedArchitect = {
          firstName: project.assignedArchitect.firstName,
          lastName: project.assignedArchitect.lastName,
          email: project.assignedArchitect.email,
        };
      }

      return res.json({ project: publicProject });
    }

    // Add virtual fields for owner
    const projectWithVirtuals = {
      ...project.toObject(),
      bidCount: project.bids.length,
      daysUntilDeadline: Math.ceil((new Date(project.biddingDeadline) - new Date()) / (1000 * 60 * 60 * 24)),
    };

    res.json({ project: projectWithVirtuals });
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (Project Owner only)
router.put("/:id", [auth, authorizeRoles("project_owner"), uploadProjectFiles, handleUploadError, parseNestedFormData], async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check ownership
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update fields
    const updateFields = { ...req.body };

    // Process uploaded files
    if (req.files) {
      if (req.files.propertyImages) {
        updateFields["files.propertyImages"] = req.files.propertyImages.map((file) => ({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
        }));
      }
      if (req.files.boq) {
        updateFields["files.boq"] = req.files.boq.map((file) => ({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
        }));
      }
      if (req.files.drawings) {
        updateFields["files.drawings"] = req.files.drawings.map((file) => ({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
        }));
      }
      if (req.files.otherDocuments) {
        updateFields["files.otherDocuments"] = req.files.otherDocuments.map((file) => ({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
        }));
      }
    }

    const updatedProject = await Project.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true, runValidators: true }).populate("owner", "firstName lastName email");

    res.json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (Project Owner only)
router.delete("/:id", auth, authorizeRoles("project_owner"), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check ownership
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if project has bids
    if (project.bids.length > 0) {
      return res.status(400).json({ message: "Cannot delete project with existing bids" });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/projects/:id/publish
// @desc    Publish project (make it live)
// @access  Private (Project Owner only)
router.post("/:id/publish", auth, authorizeRoles("project_owner"), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check ownership
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update status to live
    project.status = "live";
    project.isPublic = true;
    await project.save();

    res.json({
      message: "Project published successfully",
      project,
    });
  } catch (error) {
    console.error("Publish project error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
