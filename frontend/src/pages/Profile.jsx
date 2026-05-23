import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Profile = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:5000/api/contributions/me")
      .then((res) => setMyStats(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getLevelColor = (level) => {
    if (level >= 10) return "#f7971e";
    if (level >= 5) return "#6c63ff";
    if (level >= 3) return "#43e97b";
    return "#8888aa";
  };

  const getNextLevelPoints = (level) => level * 100;
  const progressToNext = myStats ? (myStats.points % 100) : 0;

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="nav-logo">StudyCollab</div>
        <div className="nav-user">
          <button className="theme-btn" onClick={toggleTheme}>{isDark ? "☀️" : "🌙"}</button>
          <Link to="/dashboard" className="btn-logout">← Dashboard</Link>
          <button className="btn-logout" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>

          {/* Profile Card */}
          <div className="profile-card" style={{ marginBottom: "24px" }}>
            <div className="profile-avatar" style={{ background: myStats ? `linear-gradient(135deg, ${getLevelColor(myStats.level)}, #8b7cf8)` : "linear-gradient(135deg, var(--accent), var(--accent2))" }}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <h1 className="profile-name">{user?.username}</h1>
            <p className="profile-email">{user?.email}</p>

            {myStats && (
              <>
                <div style={{ display: "flex", gap: "16px", justifyContent: "center", margin: "16px 0" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "Syne", fontSize: "1.5rem", fontWeight: "800", color: getLevelColor(myStats.level) }}>
                      {myStats.level}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text2)" }}>Level</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "Syne", fontSize: "1.5rem", fontWeight: "800", color: "var(--accent)" }}>
                      {myStats.points}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text2)" }}>Points</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "Syne", fontSize: "1.5rem", fontWeight: "800", color: "var(--accent3)" }}>
                      {myStats.badges?.length || 0}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text2)" }}>Badges</div>
                  </div>
                </div>

                {/* Level Progress Bar */}
                <div style={{ width: "100%", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text2)", marginBottom: "6px" }}>
                    <span>Level {myStats.level}</span>
                    <span>{progressToNext}/100 XP to Level {myStats.level + 1}</span>
                  </div>
                  <div style={{ height: "8px", background: "var(--bg2)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progressToNext}%`, background: getLevelColor(myStats.level), borderRadius: "4px", transition: "width 1s ease" }}></div>
                  </div>
                </div>
              </>
            )}

            <div className="profile-badges">
              {loading ? (
                <span style={{ color: "var(--text2)", fontSize: "0.85rem" }}>Loading badges...</span>
              ) : myStats?.badges?.length > 0 ? (
                myStats.badges.map((badge, i) => <div key={i} className="badge">{badge}</div>)
              ) : (
                <>
                  <div className="badge">🎓 Student</div>
                  <div className="badge">🚀 Early Member</div>
                </>
              )}
            </div>
          </div>

          {/* Contribution Stats */}
          {myStats && (
            <div className="profile-card">
              <h2 style={{ fontFamily: "Syne", fontSize: "1.2rem", marginBottom: "20px" }}>📊 My Contributions</h2>
              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <span className="profile-info-label">Messages Sent</span>
                  <span className="profile-info-value" style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--accent)" }}>
                    {myStats.contributions.messagesSent}
                  </span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Polls Created</span>
                  <span className="profile-info-value" style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--accent2)" }}>
                    {myStats.contributions.pollsCreated}
                  </span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Resources Shared</span>
                  <span className="profile-info-value" style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--accent3)" }}>
                    {myStats.contributions.resourcesShared}
                  </span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Theme</span>
                  <span className="profile-info-value">
                    <button className="theme-toggle" onClick={toggleTheme}>
                      {isDark ? "🌙 Dark Mode" : "☀️ Light Mode"}
                    </button>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
