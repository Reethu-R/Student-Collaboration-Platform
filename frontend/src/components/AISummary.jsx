import React, { useState } from "react";
import axios from "axios";

const AISummary = ({ groupId, groupName, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [aiResponse, setAiResponse] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchSummaryData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/ai/summary/${groupId}`);
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateAISummary = async () => {
    if (!summary) return;
    setGenerating(true);
    setAiResponse("");
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: summary.prompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map((c) => c.text || "").join("") || "Could not generate summary.";
      setAiResponse(text);
    } catch (err) {
      setAiResponse("AI summary unavailable. Here's what we know:\n\n" +
        `📊 Group Stats:\n` +
        `• ${summary.stats.members} members\n` +
        `• ${summary.stats.messages} messages sent\n` +
        `• ${summary.stats.polls} polls created\n` +
        `• ${summary.stats.resources} resources shared\n\n` +
        `Keep up the great work! 🚀`
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="pomodoro-overlay">
      <div className="ai-summary-card">
        <div className="pomodoro-header">
          <h3>🤖 AI Group Summary</h3>
          <button className="pomodoro-close" onClick={onClose}>✕</button>
        </div>

        {!summary && !loading && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🤖</div>
            <p style={{ color: "var(--text2)", marginBottom: "20px", fontSize: "0.9rem" }}>
              Get an AI-powered summary of your group's activity, discussions, and suggestions!
            </p>
            <button className="btn-primary" onClick={fetchSummaryData}>
              Analyze Group Activity
            </button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text2)" }}>
            Analyzing group activity... ⏳
          </div>
        )}

        {summary && !aiResponse && (
          <div>
            <div className="ai-stats-grid">
              <div className="ai-stat"><span>👥</span><strong>{summary.stats.members}</strong><span>Members</span></div>
              <div className="ai-stat"><span>💬</span><strong>{summary.stats.messages}</strong><span>Messages</span></div>
              <div className="ai-stat"><span>🗳️</span><strong>{summary.stats.polls}</strong><span>Polls</span></div>
              <div className="ai-stat"><span>📚</span><strong>{summary.stats.resources}</strong><span>Resources</span></div>
            </div>

            {summary.recentMessages.length > 0 && (
              <div className="ai-section">
                <h4>Recent Activity</h4>
                {summary.recentMessages.map((msg, i) => (
                  <div key={i} className="ai-msg-preview">
                    <strong>{msg.sender}:</strong> {msg.content.slice(0, 60)}{msg.content.length > 60 ? "..." : ""}
                  </div>
                ))}
              </div>
            )}

            <button className="btn-primary" style={{ width: "100%", marginTop: "16px" }} onClick={generateAISummary}>
              🤖 Generate AI Summary
            </button>
          </div>
        )}

        {generating && (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--accent)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🤖</div>
            AI is analyzing your group... ✨
          </div>
        )}

        {aiResponse && (
          <div className="ai-response">
            <div className="ai-response-header">🤖 AI Summary for "{groupName}"</div>
            <div className="ai-response-text">
              {aiResponse.split("\n").map((line, i) => (
                <p key={i} style={{ marginBottom: line ? "8px" : "0" }}>{line}</p>
              ))}
            </div>
            <button className="btn-primary" style={{ width: "100%", marginTop: "16px" }} onClick={() => { setSummary(null); setAiResponse(""); }}>
              Refresh Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISummary;
