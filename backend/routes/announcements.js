const express = require("express");
const Announcement = require("../models/Announcement");
const Group = require("../models/Group");

const router = express.Router();

// Get announcements for group
router.get("/:groupId", async (req, res) => {
  try {
    const announcements = await Announcement.find({ group: req.params.groupId }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create announcement (only group creator)
router.post("/", async (req, res) => {
  try {
    const { groupId, title, content } = req.body;
    if (!title || !content) return res.status(400).json({ message: "Title and content required." });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });
    if (group.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Only group admin can post announcements." });

    const announcement = await Announcement.create({
      group: groupId,
      title,
      content,
      postedBy: req.user.id,
      postedByName: req.user.username,
    });

    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete announcement
router.delete("/:id", async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: "Not found." });
    if (announcement.postedBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized." });
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
