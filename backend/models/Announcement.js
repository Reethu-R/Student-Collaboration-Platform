const mongoose = require("mongoose");
const announcementSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  postedByName: { type: String },
  pinned: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.model("Announcement", announcementSchema);
