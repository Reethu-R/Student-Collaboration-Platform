import React, { useState, useEffect } from "react";
import axios from "axios";

const ContributionTracker = ({ groupId, currentUserId }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/contributions/group/${groupId}`)
      .then((res) => setMembers(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [groupId]);

  const getContributionBar = (value, max) => {
    const pct = max === 0 ? 0 : Math.min((value / max) * 100, 100);
    return pct;
  };

  const maxTotal = Math.max(...members.map((m) => m.contributions.total), 1);

  const getLevelColor = (level) => {
    if (level >= 10) return "#f7971e";
    if (level >= 5) return "#6c63ff";
    if (level >= 3) return "#43e97b";
    return "#8888aa";
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "var(--text2)" }}>Loading contributions...</div>;

  return (
    <div className="panel-body">
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ fontFamily: "Syne, sans-serif", marginBottom: "4px" }}>🏅 Member Contributions</h3>
        <p style={{ color: "var(--text2)", fontSize: "0.85rem" }}>Track who's contributing the most to this group</p>
      </div>

      {members.length === 0 ? (
        <div className="empty-state"><h3>No members yet!</h3></div>
      ) : (
        members.map((member, idx) => (
          <div className="contribution-card" key={member._id} style={{ borderLeft: `4px solid ${getLevelColor(member.level)}` }}>
            <div className="contribution-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="contrib-avatar" style={{ background: getLevelColor(member.level) }}>
                  {member.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="contrib-name">{member.username}</span>
                    {member._id === currentUserId && <span className="you-badge">You</span>}
                    {idx === 0 && <span className="top-badge">🏆 Top Contributor</span>}
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                    {member.badges?.slice(0, 3).map((badge, i) => (
                      <span key={i} className="mini-badge">{badge}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="contrib-level" style={{ color: getLevelColor(member.level) }}>Level {member.level}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text2)" }}>{member.points || member.contributions.total * 2} pts</div>
              </div>
            </div>

            <div className="contrib-progress-bar">
              <div className="contrib-progress-fill" style={{ width: `${getContributionBar(member.contributions.total, maxTotal)}%`, background: getLevelColor(member.level) }}></div>
            </div>

            <div className="contribution-stats">
              <div className="contrib-stat">
                <span className="contrib-stat-icon">💬</span>
                <span className="contrib-stat-value">{member.contributions.messages}</span>
                <span className="contrib-stat-label">Messages</span>
              </div>
              <div className="contrib-stat">
                <span className="contrib-stat-icon">🗳️</span>
                <span className="contrib-stat-value">{member.contributions.polls}</span>
                <span className="contrib-stat-label">Polls</span>
              </div>
              <div className="contrib-stat">
                <span className="contrib-stat-icon">📚</span>
                <span className="contrib-stat-value">{member.contributions.resources}</span>
                <span className="contrib-stat-label">Resources</span>
              </div>
              <div className="contrib-stat">
                <span className="contrib-stat-icon">⭐</span>
                <span className="contrib-stat-value">{member.contributions.total}</span>
                <span className="contrib-stat-label">Total Score</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ContributionTracker;
