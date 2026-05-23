import React, { useState, useEffect } from "react";
import axios from "axios";

const PollPanel = ({ groupId, userId, isMember, showToast }) => {
  const [polls, setPolls] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [creating, setCreating] = useState(false);

  const fetchPolls = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/polls/${groupId}`);
      setPolls(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchPolls(); }, [groupId]);

  const handleAddOption = () => {
    if (options.length < 5) setOptions([...options, ""]);
  };

  const handleOptionChange = (idx, val) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleCreate = async () => {
    const validOptions = options.filter((o) => o.trim());
    if (!question.trim() || validOptions.length < 2) {
      showToast("Add a question and at least 2 options!", "error");
      return;
    }
    setCreating(true);
    try {
      await axios.post("http://localhost:5000/api/polls", { groupId, question, options: validOptions });
      setQuestion(""); setOptions(["", ""]); setShowForm(false);
      await fetchPolls();
      showToast("Poll created! 🗳️");
    } catch (err) { showToast("Failed to create poll", "error"); }
    finally { setCreating(false); }
  };

  const handleVote = async (pollId, optionIndex) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/polls/${pollId}/vote`, { optionIndex });
      setPolls((prev) => prev.map((p) => p._id === pollId ? res.data : p));
      showToast("Vote recorded! ✅");
    } catch (err) { showToast("Failed to vote", "error"); }
  };

  const getTotalVotes = (poll) => poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
  const getPercent = (votes, total) => total === 0 ? 0 : Math.round((votes / total) * 100);
  const hasVoted = (poll) => poll.options.some((opt) => opt.votes.includes(userId));
  const getUserVote = (poll) => poll.options.findIndex((opt) => opt.votes.includes(userId));

  return (
    <div className="panel-body">
      {isMember && (
        <button className="panel-create-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕ Cancel" : "+ Create Poll"}
        </button>
      )}

      {showForm && (
        <div className="poll-form">
          <div className="form-group">
            <label>Question</label>
            <input type="text" placeholder="Ask your group something..." value={question} onChange={(e) => setQuestion(e.target.value)} />
          </div>
          {options.map((opt, idx) => (
            <div className="form-group" key={idx}>
              <label>Option {idx + 1}</label>
              <input type="text" placeholder={`Option ${idx + 1}`} value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)} />
            </div>
          ))}
          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            {options.length < 5 && (
              <button className="btn-add-option" onClick={handleAddOption}>+ Add Option</button>
            )}
            <button className="btn-create" onClick={handleCreate} disabled={creating} style={{ flex: 1 }}>
              {creating ? "Creating..." : "Create Poll"}
            </button>
          </div>
        </div>
      )}

      {polls.length === 0 ? (
        <div className="empty-state"><h3>No polls yet!</h3><p>Create the first poll for your group.</p></div>
      ) : (
        polls.map((poll) => {
          const total = getTotalVotes(poll);
          const userVoteIdx = getUserVote(poll);
          return (
            <div className="poll-card" key={poll._id}>
              <div className="poll-question">{poll.question}</div>
              <div className="poll-meta">By {poll.createdByName} · {total} vote{total !== 1 ? "s" : ""}</div>
              <div className="poll-options">
                {poll.options.map((opt, idx) => {
                  const pct = getPercent(opt.votes.length, total);
                  const isSelected = userVoteIdx === idx;
                  return (
                    <button
                      key={idx}
                      className={`poll-option ${isSelected ? "selected" : ""}`}
                      onClick={() => isMember && handleVote(poll._id, idx)}
                      disabled={!isMember}
                    >
                      <div className="poll-option-bar" style={{ width: `${pct}%` }}></div>
                      <span className="poll-option-text">{opt.text}</span>
                      <span className="poll-option-pct">{pct}%</span>
                      {isSelected && <span className="poll-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default PollPanel;
