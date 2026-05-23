const express = require("express");
const Poll = require("../models/Poll");
const Group = require("../models/Group");

const router = express.Router();

// Get polls for a group
router.get("/:groupId", async (req, res) => {
  try {
    const polls = await Poll.find({ group: req.params.groupId }).sort({ createdAt: -1 });
    res.json(polls);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create poll
router.post("/", async (req, res) => {
  try {
    const { groupId, question, options } = req.body;
    if (!question || !options || options.length < 2)
      return res.status(400).json({ message: "Question and at least 2 options required." });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    const isMember = group.members.some((m) => m.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: "Not a member." });

    const poll = await Poll.create({
      group: groupId,
      question,
      options: options.map((opt) => ({ text: opt, votes: [] })),
      createdBy: req.user.id,
      createdByName: req.user.username,
    });

    res.status(201).json(poll);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Vote on poll
router.post("/:pollId/vote", async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ message: "Poll not found." });

    // Remove previous vote
    poll.options.forEach((opt) => {
      opt.votes = opt.votes.filter((v) => v.toString() !== req.user.id);
    });

    // Add new vote
    poll.options[optionIndex].votes.push(req.user.id);
    await poll.save();

    res.json(poll);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
