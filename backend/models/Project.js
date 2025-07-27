const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    // Basic project info
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["residential", "commercial", "industrial", "infrastructure", "renovation", "other"],
      required: true,
    },

    // Location
    location: {
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    // Project details
    budget: {
      min: {
        type: Number,
        required: true,
      },
      max: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: "USD",
      },
    },

    timeline: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
      estimatedDuration: {
        type: Number, // in days
        required: true,
      },
    },

    // Project owner
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Assigned architect
    assignedArchitect: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Files and documents
    files: {
      propertyImages: [
        {
          filename: String,
          originalName: String,
          path: String,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      boq: [
        {
          filename: String,
          originalName: String,
          path: String,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      drawings: [
        {
          filename: String,
          originalName: String,
          path: String,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      otherDocuments: [
        {
          filename: String,
          originalName: String,
          path: String,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },

    // Project specifications
    specifications: {
      area: {
        type: Number, // in square feet/meters
        required: true,
      },
      floors: {
        type: Number,
        default: 1,
      },
      requirements: [String],
      specialRequirements: String,
    },

    // Status and visibility
    status: {
      type: String,
      enum: ["draft", "live", "in_progress", "completed", "cancelled"],
      default: "draft",
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    // Bidding
    biddingDeadline: {
      type: Date,
      required: true,
    },

    bids: [
      {
        serviceProvider: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        timeline: {
          type: Number, // in days
          required: true,
        },
        message: String,
        documents: [
          {
            filename: String,
            originalName: String,
            path: String,
            uploadedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Awarded bid
    awardedBid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bid",
    },

    // Project progress
    progress: {
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      milestones: [
        {
          title: String,
          description: String,
          dueDate: Date,
          completed: {
            type: Boolean,
            default: false,
          },
          completedAt: Date,
        },
      ],
    },

    // Ratings and reviews
    ratings: {
      ownerRating: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        review: String,
        ratedAt: Date,
      },
      contractorRating: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        review: String,
        ratedAt: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
projectSchema.index({ status: 1, isPublic: 1 });
projectSchema.index({ "location.city": 1, "location.state": 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ owner: 1 });
projectSchema.index({ biddingDeadline: 1 });

// Virtual for bid count
projectSchema.virtual("bidCount").get(function () {
  return this.bids.length;
});

// Virtual for days until deadline
projectSchema.virtual("daysUntilDeadline").get(function () {
  const now = new Date();
  const deadline = new Date(this.biddingDeadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to check if bidding is open
projectSchema.methods.isBiddingOpen = function () {
  return this.status === "live" && new Date() < new Date(this.biddingDeadline);
};

// Method to get public project data (without sensitive info)
projectSchema.methods.getPublicData = function () {
  const projectObject = this.toObject();
  delete projectObject.owner;
  delete projectObject.assignedArchitect;
  delete projectObject.bids;
  delete projectObject.awardedBid;
  return projectObject;
};

module.exports = mongoose.model("Project", projectSchema);
