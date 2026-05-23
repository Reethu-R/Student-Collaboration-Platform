const express = require("express");
const Message = require("../models/Message");
const Group = require("../models/Group");

const router = express.Router();

// Get messages for a group
router.get("/:groupId", async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    const isMember = group.members.some((m) => m.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: "You are not a member of this group." });

    const messages = await Message.find({ group: req.params.groupId })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete a message
router.delete("/:msgId", async (req, res) => {
  try {
    const message = await Message.findById(req.params.msgId);
    if (!message) return res.status(404).json({ message: "Message not found." });

    if (message.sender.toString() !== req.user.id)
      return res.status(403).json({ message: "You can only delete your own messages." });

    await Message.findByIdAndDelete(req.params.msgId);
    res.json({ message: "Message deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
