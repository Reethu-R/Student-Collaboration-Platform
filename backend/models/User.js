const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  joinedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
  contributions: {
    messagesSent: { type: Number, default: 0 },
    pollsCreated: { type: Number, default: 0 },
    resourcesShared: { type: Number, default: 0 },
    announcementsPosted: { type: Number, default: 0 },
  },
  points: { type: Number, default: 0 },
  badges: [{ type: String }],
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
