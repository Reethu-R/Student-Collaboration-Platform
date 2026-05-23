const express = require("express");
const Group = require("../models/Group");
const User = require("../models/User");
const crypto = require("crypto");

const router = express.Router();

// Get all public groups
router.get("/", async (req, res) => {
  try {
    const groups = await Group.find({}).populate("createdBy", "username").lean();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get my groups
router.get("/my", async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id }).populate("createdBy", "username").lean();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create group
router.post("/", async (req, res) => {
  try {
    const { name, subject, description, isPrivate, color } = req.body;
    if (!name || !subject) return res.status(400).json({ message: "Name and subject required." });

    const inviteCode = isPrivate ? crypto.randomBytes(4).toString("hex").toUpperCase() : "";

    const group = await Group.create({
      name, subject, description,
      createdBy: req.user.id,
      members: [req.user.id],
      isPrivate: isPrivate || false,
      inviteCode,
      color: color || "#6c63ff",
    });

    await User.findByIdAndUpdate(req.user.id, { $push: { joinedGroups: group._id } });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Join public group
router.post("/:id/join", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found." });
    if (group.isPrivate) return res.status(403).json({ message: "This is a private group. Use invite code." });
    if (group.members.includes(req.user.id)) return res.status(400).json({ message: "Already a member." });
    group.members.push(req.user.id);
    await group.save();
    await User.findByIdAndUpdate(req.user.id, { $push: { joinedGroups: group._id } });
    res.json({ message: "Joined!", group });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Join private group with invite code
router.post("/join-private", async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!group) return res.status(404).json({ message: "Invalid invite code." });
    if (group.members.includes(req.user.id)) return res.status(400).json({ message: "Already a member." });
    group.members.push(req.user.id);
    await group.save();
    await User.findByIdAndUpdate(req.user.id, { $push: { joinedGroups: group._id } });
    res.json({ message: "Joined private group!", group });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Leave group
router.post("/:id/leave", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found." });
    group.members = group.members.filter((m) => m.toString() !== req.user.id);
    await group.save();
    await User.findByIdAndUpdate(req.user.id, { $pull: { joinedGroups: group._id } });
    res.json({ message: "Left group." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Pin message in group
router.post("/:id/pin", async (req, res) => {
  try {
    const { message, senderName } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found." });
    group.pinnedMessage = message;
    group.pinnedBy = req.user.username;
    await group.save();
    res.json({ message: "Message pinned!", group });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get single group
router.get("/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("createdBy", "username")
      .populate("members", "username");
    if (!group) return res.status(404).json({ message: "Group not found." });
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
