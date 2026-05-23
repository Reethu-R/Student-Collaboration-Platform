const express = require("express");
const User = require("../models/User");
const Message = require("../models/Message");
const Poll = require("../models/Poll");
const Resource = require("../models/Resource");
const Group = require("../models/Group");

const router = express.Router();

// Calculate points and level
const calculateLevel = (points) => Math.floor(points / 100) + 1;
const calculateBadges = (contributions) => {
  const badges = [];
  if (contributions.messagesSent >= 1) badges.push("💬 First Message");
  if (contributions.messagesSent >= 50) badges.push("🗣️ Chatterbox");
  if (contributions.messagesSent >= 200) badges.push("📢 Megaphone");
  if (contributions.resourcesShared >= 1) badges.push("📚 Contributor");
  if (contributions.resourcesShared >= 10) badges.push("🧠 Knowledge Guru");
  if (contributions.pollsCreated >= 1) badges.push("🗳️ Poll Master");
  if (contributions.pollsCreated >= 5) badges.push("📊 Decision Maker");
  return badges;
};

// Get contributions for a group
router.get("/group/:groupId", async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate("members", "username points level badges contributions");
    if (!group) return res.status(404).json({ message: "Group not found." });

    const memberStats = await Promise.all(
      group.members.map(async (member) => {
        const [msgCount, pollCount, resourceCount] = await Promise.all([
          Message.countDocuments({ group: req.params.groupId, sender: member._id }),
          Poll.countDocuments({ group: req.params.groupId, createdBy: member._id }),
          Resource.countDocuments({ group: req.params.groupId, addedBy: member._id }),
        ]);
        return {
          _id: member._id,
          username: member.username,
          points: member.points || 0,
          level: member.level || 1,
          badges: member.badges || [],
          contributions: {
            messages: msgCount,
            polls: pollCount,
            resources: resourceCount,
            total: msgCount + pollCount * 5 + resourceCount * 3,
          },
        };
      })
    );

    memberStats.sort((a, b) => b.contributions.total - a.contributions.total);
    res.json(memberStats);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get my contributions
router.get("/me", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const [totalMessages, totalPolls, totalResources] = await Promise.all([
      Message.countDocuments({ sender: req.user.id }),
      Poll.countDocuments({ createdBy: req.user.id }),
      Resource.countDocuments({ addedBy: req.user.id }),
    ]);

    const contributions = { messagesSent: totalMessages, pollsCreated: totalPolls, resourcesShared: totalResources };
    const points = totalMessages * 2 + totalPolls * 10 + totalResources * 5;
    const level = calculateLevel(points);
    const badges = calculateBadges(contributions);

    await User.findByIdAndUpdate(req.user.id, { contributions, points, level, badges, lastActive: new Date() });

    res.json({ contributions, points, level, badges, username: user.username });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
