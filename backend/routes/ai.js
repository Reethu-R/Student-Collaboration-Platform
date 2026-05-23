const express = require("express");
const Message = require("../models/Message");
const Poll = require("../models/Poll");
const Resource = require("../models/Resource");
const Group = require("../models/Group");

const router = express.Router();

// Generate AI summary of group activity
router.get("/summary/:groupId", async (req, res) => {
  try {
    const [group, messages, polls, resources] = await Promise.all([
      Group.findById(req.params.groupId).populate("members", "username"),
      Message.find({ group: req.params.groupId }).sort({ createdAt: -1 }).limit(50),
      Poll.find({ group: req.params.groupId }),
      Resource.find({ group: req.params.groupId }),
    ]);

    if (!group) return res.status(404).json({ message: "Group not found." });

    // Build context for AI
    const recentMessages = messages.slice(0, 20).reverse().map((m) => `${m.senderName}: ${m.content}`).join("\n");
    const pollSummary = polls.map((p) => {
      const totalVotes = p.options.reduce((sum, o) => sum + o.votes.length, 0);
      const topOption = p.options.sort((a, b) => b.votes.length - a.votes.length)[0];
      return `Poll: "${p.question}" - Top answer: "${topOption?.text}" (${topOption?.votes.length}/${totalVotes} votes)`;
    }).join("\n");
    const resourceSummary = resources.map((r) => `Resource: "${r.title}" by ${r.addedByName}`).join("\n");

    const prompt = `You are an AI assistant for a student study group called "${group.name}" focused on "${group.subject}".

Here is the recent activity:

RECENT MESSAGES (last 20):
${recentMessages || "No messages yet"}

POLLS:
${pollSummary || "No polls yet"}

SHARED RESOURCES:
${resourceSummary || "No resources yet"}

GROUP STATS:
- Members: ${group.members.length}
- Total messages: ${messages.length}
- Total polls: ${polls.length}
- Total resources: ${resources.length}

Please provide:
1. A 2-3 sentence summary of what this group has been discussing
2. Key topics covered
3. Group activity level (Low/Medium/High)
4. 2-3 suggestions for what the group should do next
5. One motivational message for the group

Keep it concise, friendly and encouraging!`;

    res.json({
      prompt,
      groupName: group.name,
      subject: group.subject,
      stats: {
        members: group.members.length,
        messages: messages.length,
        polls: polls.length,
        resources: resources.length,
      },
      recentMessages: messages.slice(0, 5).reverse().map((m) => ({ sender: m.senderName, content: m.content, time: m.createdAt })),
      topResources: resources.slice(0, 3).map((r) => ({ title: r.title, url: r.url, upvotes: r.upvotes?.length || 0 })),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
