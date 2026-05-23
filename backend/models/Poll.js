const mongoose = require("mongoose");

const pollSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    question: { type: String, required: true },
    options: [
      {
        text: { type: String, required: true },
        votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdByName: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Poll", pollSchema);
