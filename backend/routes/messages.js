const express = require("express");
const { body, validationResult } = require("express-validator");
const Message = require("../models/Message");
const User = require("../models/User");
const Project = require("../models/Project");
const { auth, authorizeRoles } = require("../middleware/auth");
const { uploadSingleFile, handleUploadError } = require("../middleware/upload");

const router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get("/conversations", auth, async (req, res) => {
  try {
    const conversations = await Message.getUserConversations(req.user._id);

    // Populate user details for each conversation
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findById(conv.lastMessage._id)
          .populate("sender", "firstName lastName email profileImage")
          .populate("recipient", "firstName lastName email profileImage")
          .populate("project", "title");

        if (!lastMessage) {
          return null; // Skip if message not found
        }

        // Get the other participant (not the current user)
        const otherParticipantId = lastMessage.sender._id.toString() === req.user._id.toString() ? lastMessage.recipient._id : lastMessage.sender._id;

        const otherParticipant = await User.findById(otherParticipantId).select("firstName lastName email profileImage role");

        if (!otherParticipant) {
          return null; // Skip if other participant not found
        }

        return {
          conversationId: conv._id,
          lastMessage: {
            content: lastMessage.content,
            type: lastMessage.type,
            createdAt: lastMessage.createdAt,
            isRead: lastMessage.isRead,
          },
          otherParticipant,
          unreadCount: conv.unreadCount,
          project: lastMessage.project,
        };
      })
    );

    // Filter out null values
    const validConversations = populatedConversations.filter((conv) => conv !== null);

    res.json({ conversations: validConversations });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/messages/conversation/:conversationId
// @desc    Get messages in a specific conversation
// @access  Private
router.get("/conversation/:conversationId", auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({ conversationId })
      .populate("sender", "firstName lastName email profileImage")
      .populate("recipient", "firstName lastName email profileImage")
      .populate("project", "title")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Mark messages as read if current user is recipient
    const unreadMessages = messages.filter((msg) => msg.recipient._id.toString() === req.user._id.toString() && !msg.isRead);

    if (unreadMessages.length > 0) {
      await Promise.all(unreadMessages.map((msg) => msg.markAsRead()));
    }

    // Get conversation participants
    const firstMessage = messages[messages.length - 1]; // Oldest message
    if (!firstMessage) {
      return res.json({
        messages: [],
        otherParticipant: null,
        project: null,
      });
    }

    const otherParticipantId = firstMessage.sender._id.toString() === req.user._id.toString() ? firstMessage.recipient._id : firstMessage.sender._id;

    const otherParticipant = await User.findById(otherParticipantId).select("firstName lastName email profileImage role");

    res.json({
      messages: messages.reverse(), // Return in chronological order
      otherParticipant,
      project: firstMessage.project,
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/messages/send
// @desc    Send a message
// @access  Private
router.post(
  "/send",
  [
    auth,
    uploadSingleFile,
    handleUploadError,
    body("recipientId").isMongoId().withMessage("Valid recipient ID is required"),
    body("content").trim().notEmpty().withMessage("Message content is required"),
    body("projectId").optional().isMongoId().withMessage("Valid project ID is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { recipientId, content, projectId } = req.body;

      // Check if recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }

      // Check if project exists (if provided)
      if (projectId) {
        const project = await Project.findById(projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
      }

      // Generate conversation ID
      const conversationId = Message.generateConversationId(req.user._id, recipientId, projectId);

      // Create message object
      const messageData = {
        conversationId,
        sender: req.user._id,
        recipient: recipientId,
        content: content.trim(),
        type: "text",
      };

      // Add project reference if provided
      if (projectId) {
        messageData.project = projectId;
      }

      // Add file attachment if uploaded
      if (req.file) {
        messageData.type = "file";
        messageData.attachment = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
          mimeType: req.file.mimetype,
        };
      }

      // Create and save message
      const message = new Message(messageData);
      await message.save();

      // Populate sender and recipient details
      await message.populate("sender", "firstName lastName email profileImage");
      await message.populate("recipient", "firstName lastName email profileImage");
      if (projectId) {
        await message.populate("project", "title");
      }

      res.status(201).json({ message: message });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   PUT /api/messages/:messageId/read
// @desc    Mark a message as read
// @access  Private
router.put("/:messageId/read", auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if current user is the recipient
    if (message.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await message.markAsRead();

    res.json({ message: "Message marked as read" });
  } catch (error) {
    console.error("Mark message as read error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/messages/unread-count
// @desc    Get unread message count for current user
// @access  Private
router.get("/unread-count", auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete a message (only sender can delete)
// @access  Private
router.delete("/:messageId", auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if current user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    await message.remove();

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
