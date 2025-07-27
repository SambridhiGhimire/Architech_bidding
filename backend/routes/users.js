const express = require("express");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const router = express.Router();

// @route   GET /api/users/:userId
// @desc    Get user details by ID
// @access  Private
router.get("/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if userId is valid
    if (!userId || userId === "undefined" || userId === "null") {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId).select("firstName lastName email profileImage role phone location");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
