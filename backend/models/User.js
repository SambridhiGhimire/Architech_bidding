const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Basic info
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["project_owner", "service_provider", "admin"],
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    location: {
      address: String,
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    profileImage: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Project Owner specific fields
    company: {
      name: String,
      website: String,
      description: String,
    },

    // Service Provider specific fields
    serviceProvider: {
      skills: [
        {
          type: String,
          enum: ["electrical", "plumbing", "carpentry", "masonry", "painting", "roofing", "landscaping", "general_contractor", "architect", "engineer", "supplier"],
        },
      ],
      experience: {
        years: Number,
        description: String,
      },
      certifications: [
        {
          name: String,
          issuingAuthority: String,
          issueDate: Date,
          expiryDate: Date,
          certificateFile: String,
        },
      ],
      portfolio: [
        {
          title: String,
          description: String,
          imageUrl: String,
          projectDate: Date,
        },
      ],
      hourlyRate: Number,
      rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
      },
    },

    // Common fields
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("User", userSchema);
