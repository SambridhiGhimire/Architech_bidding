const express = require("express");
const { body, validationResult } = require("express-validator");
const Project = require("../models/Project");
const User = require("../models/User");
const { auth, authorizeRoles } = require("../middleware/auth");
const { uploadBidDocuments, handleUploadError } = require("../middleware/upload");
const parseNestedFormData = require("../middleware/parseFormData");

const router = express.Router();

// @route   POST /api/bids
// @desc    Submit a bid on a project
// @access  Private (Service Providers only)
router.post(
  "/",
  [
    auth,
    authorizeRoles("service_provider"),
    uploadBidDocuments,
    handleUploadError,
    parseNestedFormData,
    body("projectId").isMongoId().withMessage("Valid project ID is required"),
    body("amount").isNumeric().withMessage("Bid amount must be a number"),
    body("timeline").isNumeric().withMessage("Timeline must be a number"),
    body("message").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, amount, timeline, message } = req.body;

      // Check if project exists and is live
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (project.status !== "live") {
        return res.status(400).json({ message: "Project is not accepting bids" });
      }

      // Check if bidding deadline has passed
      if (new Date() > new Date(project.biddingDeadline)) {
        return res.status(400).json({ message: "Bidding deadline has passed" });
      }

      // Check if user has already bid on this project
      const existingBid = project.bids.find((bid) => bid.serviceProvider.toString() === req.user._id.toString());
      if (existingBid) {
        return res.status(400).json({ message: "You have already submitted a bid for this project" });
      }

      // Process uploaded documents
      const documents = [];
      if (req.files && req.files.bidDocuments) {
        documents.push(
          ...req.files.bidDocuments.map((file) => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.relativeFilePath || file.path,
          }))
        );
      }

      // Create bid object
      const bid = {
        serviceProvider: req.user._id,
        amount: parseFloat(amount),
        timeline: parseInt(timeline),
        message: message || "",
        documents,
        status: "pending",
        submittedAt: new Date(),
      };

      // Add bid to project
      project.bids.push(bid);
      await project.save();

      // Populate service provider details
      await project.populate("bids.serviceProvider", "firstName lastName email serviceProvider");

      const submittedBid = project.bids[project.bids.length - 1];

      res.status(201).json({
        message: "Bid submitted successfully",
        bid: submittedBid,
      });
    } catch (error) {
      console.error("Submit bid error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/bids/project/:projectId
// @desc    Get all bids for a project (project owner only)
// @access  Private (Project Owner only)
router.get("/project/:projectId", auth, authorizeRoles("project_owner"), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).populate("bids.serviceProvider", "firstName lastName email serviceProvider");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check ownership
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      bids: project.bids,
      totalBids: project.bids.length,
    });
  } catch (error) {
    console.error("Get bids error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/bids/my-bids
// @desc    Get all bids submitted by current user
// @access  Private (Service Provider only)
router.get("/my-bids", auth, authorizeRoles("service_provider"), async (req, res) => {
  try {
    // Find all projects that have bids from the current user
    const projects = await Project.find({
      "bids.serviceProvider": req.user._id,
    })
      .populate("owner", "firstName lastName email")
      .populate("bids.serviceProvider", "firstName lastName email")
      .lean();

    // Extract and format the user's bids
    const myBids = [];
    projects.forEach((project) => {
      const userBid = project.bids.find((bid) => bid.serviceProvider._id.toString() === req.user._id.toString());
      if (userBid) {
        myBids.push({
          ...userBid,
          projectTitle: project.title,
          projectId: project._id,
          projectCategory: project.category,
          projectLocation: project.location,
          projectStatus: project.status,
          projectOwner: project.owner,
        });
      }
    });

    // Sort by submission date (newest first)
    myBids.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.json({
      bids: myBids,
      total: myBids.length,
    });
  } catch (error) {
    console.error("Get my bids error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/bids/:projectId/:bidId/accept
// @desc    Accept a bid (project owner only)
// @access  Private (Project Owner only)
router.put("/:projectId/:bidId/accept", auth, authorizeRoles("project_owner"), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check ownership
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Find the bid
    const bidIndex = project.bids.findIndex((bid) => bid._id.toString() === req.params.bidId);
    if (bidIndex === -1) {
      return res.status(404).json({ message: "Bid not found" });
    }

    // Update bid status
    project.bids[bidIndex].status = "accepted";

    // Reject all other bids
    project.bids.forEach((bid, index) => {
      if (index !== bidIndex) {
        bid.status = "rejected";
      }
    });

    // Update project status
    project.status = "in_progress";
    project.awardedBid = project.bids[bidIndex]._id;

    await project.save();

    // Populate service provider details
    await project.populate("bids.serviceProvider", "firstName lastName email");

    res.json({
      message: "Bid accepted successfully",
      project: {
        status: project.status,
        awardedBid: project.bids[bidIndex],
      },
    });
  } catch (error) {
    console.error("Accept bid error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/bids/:projectId/:bidId/reject
// @desc    Reject a bid (project owner only)
// @access  Private (Project Owner only)
router.put("/:projectId/:bidId/reject", auth, authorizeRoles("project_owner"), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check ownership
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Find the bid
    const bidIndex = project.bids.findIndex((bid) => bid._id.toString() === req.params.bidId);
    if (bidIndex === -1) {
      return res.status(404).json({ message: "Bid not found" });
    }

    // Update bid status
    project.bids[bidIndex].status = "rejected";

    await project.save();

    res.json({
      message: "Bid rejected successfully",
    });
  } catch (error) {
    console.error("Reject bid error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/bids/:projectId/:bidId
// @desc    Update a bid (bid owner only)
// @access  Private (Service Provider only)
router.put(
  "/:projectId/:bidId",
  [
    auth,
    authorizeRoles("service_provider"),
    uploadBidDocuments,
    handleUploadError,
    body("amount").optional().isNumeric().withMessage("Bid amount must be a number"),
    body("timeline").optional().isNumeric().withMessage("Timeline must be a number"),
    body("message").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const project = await Project.findById(req.params.projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Find the bid
      const bidIndex = project.bids.findIndex((bid) => bid._id.toString() === req.params.bidId);
      if (bidIndex === -1) {
        return res.status(404).json({ message: "Bid not found" });
      }

      // Check ownership
      if (project.bids[bidIndex].serviceProvider.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if project is still accepting bids
      if (project.status !== "live") {
        return res.status(400).json({ message: "Project is not accepting bid updates" });
      }

      // Update bid fields
      if (req.body.amount) {
        project.bids[bidIndex].amount = parseFloat(req.body.amount);
      }
      if (req.body.timeline) {
        project.bids[bidIndex].timeline = parseInt(req.body.timeline);
      }
      if (req.body.message !== undefined) {
        project.bids[bidIndex].message = req.body.message;
      }

      // Process uploaded documents
      if (req.files && req.files.bidDocuments) {
        const newDocuments = req.files.bidDocuments.map((file) => ({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
        }));
        project.bids[bidIndex].documents.push(...newDocuments);
      }

      await project.save();

      // Populate service provider details
      await project.populate("bids.serviceProvider", "firstName lastName email");

      res.json({
        message: "Bid updated successfully",
        bid: project.bids[bidIndex],
      });
    } catch (error) {
      console.error("Update bid error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   DELETE /api/bids/:projectId/:bidId
// @desc    Delete a bid (bid owner only)
// @access  Private (Service Provider only)
router.delete("/:projectId/:bidId", auth, authorizeRoles("service_provider"), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Find the bid
    const bidIndex = project.bids.findIndex((bid) => bid._id.toString() === req.params.bidId);
    if (bidIndex === -1) {
      return res.status(404).json({ message: "Bid not found" });
    }

    // Check ownership
    if (project.bids[bidIndex].serviceProvider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if project is still accepting bids
    if (project.status !== "live") {
      return res.status(400).json({ message: "Cannot delete bid on closed project" });
    }

    // Remove the bid
    project.bids.splice(bidIndex, 1);
    await project.save();

    res.json({
      message: "Bid deleted successfully",
    });
  } catch (error) {
    console.error("Delete bid error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
