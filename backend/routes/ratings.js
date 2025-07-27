const express = require("express");
const { body, validationResult } = require("express-validator");
const Rating = require("../models/Rating");
const Project = require("../models/Project");
const User = require("../models/User");
const { auth, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/ratings
// @desc    Submit a rating and review
// @access  Private
router.post(
  "/",
  [
    auth,
    body("projectId").optional().isMongoId().withMessage("Valid project ID is required if provided"),
    body("ratedUserId").isMongoId().withMessage("Valid user ID is required"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("review").trim().isLength({ min: 10, max: 1000 }).withMessage("Review must be between 10 and 1000 characters"),
    body("ratingType").isIn(["owner_to_contractor", "contractor_to_owner", "general"]).withMessage("Invalid rating type"),
    body("categories.communication").optional().isInt({ min: 1, max: 5 }),
    body("categories.quality").optional().isInt({ min: 1, max: 5 }),
    body("categories.timeliness").optional().isInt({ min: 1, max: 5 }),
    body("categories.professionalism").optional().isInt({ min: 1, max: 5 }),
    body("categories.value").optional().isInt({ min: 1, max: 5 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, ratedUserId, rating, review, ratingType, categories } = req.body;

      // Check if project exists and is valid (if projectId is provided)
      let project = null;
      if (projectId) {
        project = await Project.findById(projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }

        if (project.status !== "completed" && project.status !== "in_progress") {
          return res.status(400).json({ message: "Can only rate projects that are in progress or completed" });
        }
      }

      // Check if rated user exists
      const ratedUser = await User.findById(ratedUserId);
      if (!ratedUser) {
        return res.status(404).json({ message: "User to rate not found" });
      }

      // Verify the rater is involved in the project (only if projectId is provided)
      if (projectId) {
        const isOwner = project.owner.toString() === req.user._id.toString();
        const isContractor = project.bids.some((bid) => bid.serviceProvider.toString() === req.user._id.toString() && bid.status === "accepted");

        if (!isOwner && !isContractor) {
          return res.status(403).json({ message: "You can only rate users involved in this project" });
        }
      }

      // Check if user can rate (one rating per project per user, or general rating if no project)
      if (projectId) {
        const canRate = await Rating.canRate(req.user._id, ratedUserId, projectId);
        if (!canRate) {
          return res.status(400).json({ message: "You have already rated this user for this project" });
        }
      }

      // Create rating
      const ratingData = {
        ratedUser: ratedUserId,
        rater: req.user._id,
        rating,
        review: review.trim(),
        ratingType,
      };

      // Add project reference if provided
      if (projectId) {
        ratingData.project = projectId;
      }

      // Add category ratings if provided
      if (categories) {
        ratingData.categories = {};
        Object.keys(categories).forEach((key) => {
          if (categories[key] && categories[key] >= 1 && categories[key] <= 5) {
            ratingData.categories[key] = categories[key];
          }
        });
      }

      const newRating = new Rating(ratingData);
      await newRating.save();

      // Populate references
      await newRating.populate("rater", "firstName lastName profileImage");
      await newRating.populate("ratedUser", "firstName lastName profileImage");
      await newRating.populate("project", "title");

      res.status(201).json({ rating: newRating });
    } catch (error) {
      console.error("Submit rating error:", error);
      console.error("Request body:", req.body);
      console.error("User ID:", req.user._id);

      if (error.name === "ValidationError") {
        return res.status(400).json({ message: error.message });
      }

      // Return more specific error messages
      if (error.code === 11000) {
        return res.status(400).json({ message: "You have already rated this user for this project" });
      }

      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/ratings/user/:userId
// @desc    Get ratings for a specific user
// @access  Public
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate userId
    if (!userId || userId === "undefined" || userId === "null") {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get average rating and total count
    let averageRating = { averageRating: 0, totalRatings: 0 };
    let ratingDistribution = [];

    try {
      const [averageRatingResult] = await Rating.getUserAverageRating(userId);
      if (averageRatingResult) {
        averageRating = averageRatingResult;
      }
    } catch (aggError) {
      console.error("Error getting average rating:", aggError);
    }

    try {
      ratingDistribution = await Rating.getUserRatingDistribution(userId);
    } catch (aggError) {
      console.error("Error getting rating distribution:", aggError);
    }

    // Get recent reviews
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reviews = await Rating.find({
      ratedUser: userId,
      status: "approved",
    })
      .populate("rater", "firstName lastName profileImage")
      .populate("project", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalReviews = await Rating.countDocuments({
      ratedUser: userId,
      status: "approved",
    });

    res.json({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        role: user.role,
      },
      averageRating: averageRating.averageRating || 0,
      totalRatings: averageRating.totalRatings || 0,
      ratingDistribution,
      reviews,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalReviews / parseInt(limit)),
        totalReviews,
      },
    });
  } catch (error) {
    console.error("Get user ratings error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/ratings/project/:projectId
// @desc    Get ratings for a specific project
// @access  Private (Project participants only)
router.get("/project/:projectId", auth, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is involved in the project
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isContractor = project.bids.some((bid) => bid.serviceProvider.toString() === req.user._id.toString() && bid.status === "accepted");

    if (!isOwner && !isContractor) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get ratings for this project
    const ratings = await Rating.find({ project: projectId })
      .populate("rater", "firstName lastName profileImage")
      .populate("ratedUser", "firstName lastName profileImage")
      .sort({ createdAt: -1 });

    res.json({ ratings });
  } catch (error) {
    console.error("Get project ratings error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/ratings/my-ratings
// @desc    Get ratings submitted by current user
// @access  Private
router.get("/my-ratings", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const ratings = await Rating.find({ rater: req.user._id })
      .populate("ratedUser", "firstName lastName profileImage")
      .populate("project", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalRatings = await Rating.countDocuments({ rater: req.user._id });

    res.json({
      ratings,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalRatings / parseInt(limit)),
        totalRatings,
      },
    });
  } catch (error) {
    console.error("Get my ratings error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/ratings/:ratingId
// @desc    Update a rating (only by the original rater)
// @access  Private
router.put(
  "/:ratingId",
  [
    auth,
    body("rating").optional().isInt({ min: 1, max: 5 }),
    body("review").optional().trim().isLength({ min: 10, max: 1000 }),
    body("categories.communication").optional().isInt({ min: 1, max: 5 }),
    body("categories.quality").optional().isInt({ min: 1, max: 5 }),
    body("categories.timeliness").optional().isInt({ min: 1, max: 5 }),
    body("categories.professionalism").optional().isInt({ min: 1, max: 5 }),
    body("categories.value").optional().isInt({ min: 1, max: 5 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { ratingId } = req.params;
      const updateData = req.body;

      const rating = await Rating.findById(ratingId);
      if (!rating) {
        return res.status(404).json({ message: "Rating not found" });
      }

      // Check if user is the original rater
      if (rating.rater.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to update this rating" });
      }

      // Update rating
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          rating[key] = updateData[key];
        }
      });

      await rating.save();

      // Populate references
      await rating.populate("rater", "firstName lastName profileImage");
      await rating.populate("ratedUser", "firstName lastName profileImage");
      await rating.populate("project", "title");

      res.json({ rating });
    } catch (error) {
      console.error("Update rating error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   DELETE /api/ratings/:ratingId
// @desc    Delete a rating (only by the original rater)
// @access  Private
router.delete("/:ratingId", auth, async (req, res) => {
  try {
    const { ratingId } = req.params;

    const rating = await Rating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }

    // Check if user is the original rater
    if (rating.rater.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this rating" });
    }

    await rating.remove();

    res.json({ message: "Rating deleted successfully" });
  } catch (error) {
    console.error("Delete rating error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/ratings/:ratingId/report
// @desc    Report a rating
// @access  Private
router.post("/:ratingId/report", [auth, body("reason").trim().notEmpty().withMessage("Report reason is required")], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ratingId } = req.params;
    const { reason } = req.body;

    const rating = await Rating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }

    // Check if user has already reported this rating
    if (rating.reported && rating.reportedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You have already reported this rating" });
    }

    rating.reported = true;
    rating.reportReason = reason;
    rating.reportedBy = req.user._id;
    rating.reportedAt = new Date();

    await rating.save();

    res.json({ message: "Rating reported successfully" });
  } catch (error) {
    console.error("Report rating error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
