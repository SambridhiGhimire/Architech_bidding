const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // Conversation/Thread ID
    conversationId: {
      type: String,
      required: true,
      index: true,
    },

    // Sender and recipient
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Message content
    content: {
      type: String,
      required: true,
      trim: true,
    },

    // Message type
    type: {
      type: String,
      enum: ["text", "file", "image"],
      default: "text",
    },

    // File attachment (if any)
    attachment: {
      filename: String,
      originalName: String,
      path: String,
      size: Number,
      mimeType: String,
    },

    // Related project (optional)
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },

    // Read status
    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
    },

    // Message status
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ isRead: 1 });

// Virtual for conversation participants
messageSchema.virtual("participants", {
  ref: "User",
  localField: "sender",
  foreignField: "_id",
  justOne: true,
});

// Method to mark message as read
messageSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  this.status = "read";
  return this.save();
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = function (user1Id, user2Id, projectId = null) {
  const query = {
    conversationId: this.generateConversationId(user1Id, user2Id, projectId),
  };

  return this.find(query)
    .populate("sender", "firstName lastName email profileImage")
    .populate("recipient", "firstName lastName email profileImage")
    .populate("project", "title")
    .sort({ createdAt: 1 });
};

// Static method to generate conversation ID
messageSchema.statics.generateConversationId = function (user1Id, user2Id, projectId = null) {
  const sortedIds = [user1Id.toString(), user2Id.toString()].sort();
  const baseId = `${sortedIds[0]}-${sortedIds[1]}`;
  return projectId ? `${baseId}-${projectId}` : baseId;
};

// Static method to get user conversations
messageSchema.statics.getUserConversations = function (userId) {
  return this.aggregate([
    {
      $match: {
        $or: [{ sender: new mongoose.Types.ObjectId(userId.toString()) }, { recipient: new mongoose.Types.ObjectId(userId.toString()) }],
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: "$conversationId",
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [{ $eq: ["$recipient", new mongoose.Types.ObjectId(userId.toString())] }, { $eq: ["$isRead", false] }],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $sort: { "lastMessage.createdAt": -1 },
    },
  ]);
};

module.exports = mongoose.model("Message", messageSchema);
