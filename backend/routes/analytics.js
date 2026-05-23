const express = require("express");
const User = require("../models/User");
const Group = require("../models/Group");
const Message = require("../models/Message");
const Poll = require("../models/Poll");
const Resource = require("../models/Resource");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [totalUsers, totalGroups, totalMessages, totalPolls, totalResources] = await Promise.all([
      User.countDocuments(),
      Group.countDocuments(),
      Message.countDocuments(),
      Poll.countDocuments(),
      Resource.countDocuments(),
    ]);

    // Messages per day (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end = new Date(date.setHours(23, 59, 59, 999));
      const count = await Message.countDocuments({ createdAt: { $gte: start, $lte: end } });
      last7Days.push({ date: start.toLocaleDateString("en-US", { weekday: "short" }), count });
    }

    // Top groups by members
    const topGroups = await Group.find().sort({ members: -1 }).limit(5).select("name members subject");

    // Most active users (by message count)
    const activeUsers = await Message.aggregate([
      { $group: { _id: "$senderName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      totalUsers,
      totalGroups,
      totalMessages,
      totalPolls,
      totalResources,
      last7Days,
      topGroups,
      activeUsers,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
