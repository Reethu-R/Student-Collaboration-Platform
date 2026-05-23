const mongoose = require("mongoose");
const pinnedSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  message: { type: String, required: true },
  pinnedBy: { type: String },
  originalSender: { type: String },
}, { timestamps: true });
module.exports = mongoose.model("PinnedMessage", pinnedSchema);
