const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    // Project reference (optional for general ratings)
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },

    // Who is being rated (service provider or project owner)
    ratedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Who is giving the rating
    rater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Rating details
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Review text
    review: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // Rating categories (optional detailed ratings)
    categories: {
      communication: {
        type: Number,
        min: 1,
        max: 5,
      },
      quality: {
        type: Number,
        min: 1,
        max: 5,
      },
      timeliness: {
        type: Number,
        min: 1,
        max: 5,
      },
      professionalism: {
        type: Number,
        min: 1,
        max: 5,
      },
      value: {
        type: Number,
        min: 1,
        max: 5,
      },
    },

    // Rating type (who is rating whom)
    ratingType: {
      type: String,
      enum: ["owner_to_contractor", "contractor_to_owner", "general"],
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },

    // Moderation
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    moderatedAt: Date,
    moderationNotes: String,

    // Helpful votes
    helpfulVotes: {
      type: Number,
      default: 0,
    },

    // Report flags
    reported: {
      type: Boolean,
      default: false,
    },
    reportReason: String,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reportedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
ratingSchema.index({ ratedUser: 1, createdAt: -1 });
ratingSchema.index({ project: 1 });
ratingSchema.index({ rater: 1, ratedUser: 1 }, { unique: true });
ratingSchema.index({ ratingType: 1 });
ratingSchema.index({ status: 1 });

// Virtual for average category rating
ratingSchema.virtual("averageCategoryRating").get(function () {
  const categories = this.categories;
  if (!categories) return null;

  const values = Object.values(categories).filter((val) => val !== undefined);
  if (values.length === 0) return null;

  return values.reduce((sum, val) => sum + val, 0) / values.length;
});

// Static method to get user's average rating
ratingSchema.statics.getUserAverageRating = function (userId) {
  return this.aggregate([
    {
      $match: {
        ratedUser: new mongoose.Types.ObjectId(userId),
        status: "approved",
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 },
        categoryAverages: {
          $avg: {
            $avg: ["$categories.communication", "$categories.quality", "$categories.timeliness", "$categories.professionalism", "$categories.value"],
          },
        },
      },
    },
  ]);
};

// Static method to get user's rating distribution
ratingSchema.statics.getUserRatingDistribution = function (userId) {
  return this.aggregate([
    {
      $match: {
        ratedUser: new mongoose.Types.ObjectId(userId),
        status: "approved",
      },
    },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: -1 },
    },
  ]);
};

// Static method to get recent reviews for a user
ratingSchema.statics.getUserRecentReviews = function (userId, limit = 10) {
  return this.find({
    ratedUser: userId,
    status: "approved",
  })
    .populate("rater", "firstName lastName profileImage")
    .populate("project", "title")
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Method to check if user can rate (one rating per project per user)
ratingSchema.statics.canRate = async function (raterId, ratedUserId, projectId) {
  const existingRating = await this.findOne({
    rater: raterId,
    ratedUser: ratedUserId,
    project: projectId,
  });
  return !existingRating;
};

// Pre-save middleware to ensure one rating per project per user
ratingSchema.pre("save", async function (next) {
  if (this.isNew) {
    const existingRating = await this.constructor.findOne({
      rater: this.rater,
      ratedUser: this.ratedUser,
      project: this.project,
    });

    if (existingRating) {
      const error = new Error("You have already rated this user for this project");
      error.name = "ValidationError";
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Rating", ratingSchema);
