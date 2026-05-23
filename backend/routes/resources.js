const express = require("express");
const Resource = require("../models/Resource");
const Group = require("../models/Group");

const router = express.Router();

// Get resources for a group
router.get("/:groupId", async (req, res) => {
  try {
    const resources = await Resource.find({ group: req.params.groupId }).sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Add resource
router.post("/", async (req, res) => {
  try {
    const { groupId, title, url, description } = req.body;
    if (!title || !url) return res.status(400).json({ message: "Title and URL required." });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    const isMember = group.members.some((m) => m.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: "Not a member." });

    const resource = await Resource.create({
      group: groupId,
      title,
      url,
      description,
      addedBy: req.user.id,
      addedByName: req.user.username,
    });

    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Upvote resource
router.post("/:resourceId/upvote", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource) return res.status(404).json({ message: "Resource not found." });

    const hasVoted = resource.upvotes.some((v) => v.toString() === req.user.id);
    if (hasVoted) {
      resource.upvotes = resource.upvotes.filter((v) => v.toString() !== req.user.id);
    } else {
      resource.upvotes.push(req.user.id);
    }

    await resource.save();
    res.json(resource);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete resource
router.delete("/:resourceId", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource) return res.status(404).json({ message: "Resource not found." });
    if (resource.addedBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized." });
    await Resource.findByIdAndDelete(req.params.resourceId);
    res.json({ message: "Deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
