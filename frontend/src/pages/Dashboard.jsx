import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Toast from "../components/Toast";

const GROUP_COLORS = ["#6c63ff","#ff6584","#43e97b","#f7971e","#2196f3","#e91e63","#9c27b0","#00bcd4"];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("all");
  const [allGroups, setAllGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showJoinPrivate, setShowJoinPrivate] = useState(false);
  const [form, setForm] = useState({ name: "", subject: "", description: "", isPrivate: false, color: "#6c63ff" });
  const [inviteCode, setInviteCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joiningId, setJoiningId] = useState(null);
  const [leavingId, setLeavingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchGroups = async () => {
    try {
      const [allRes, myRes] = await Promise.all([
        axios.get("http://localhost:5000/api/groups"),
        axios.get("http://localhost:5000/api/groups/my"),
      ]);
      setAllGroups(allRes.data);
      setMyGroups(myRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleJoin = async (groupId) => {
    setJoiningId(groupId);
    try {
      await axios.post(`http://localhost:5000/api/groups/${groupId}/join`);
      await fetchGroups();
      showToast("Joined group! 🎉");
    } catch (err) { showToast(err.response?.data?.message || "Failed", "error"); }
    finally { setJoiningId(null); }
  };

  const handleJoinPrivate = async () => {
    if (!inviteCode.trim()) return;
    try {
      await axios.post("http://localhost:5000/api/groups/join-private", { inviteCode });
      await fetchGroups();
      setInviteCode(""); setShowJoinPrivate(false);
      showToast("Joined private group! 🔒🎉");
    } catch (err) { showToast(err.response?.data?.message || "Invalid code", "error"); }
  };

  const handleLeave = async (groupId) => {
    if (!window.confirm("Leave this group?")) return;
    setLeavingId(groupId);
    try {
      await axios.post(`http://localhost:5000/api/groups/${groupId}/leave`);
      await fetchGroups();
      showToast("Left group.");
    } catch (err) { showToast("Failed", "error"); }
    finally { setLeavingId(null); }
  };

  const handleCreate = async () => {
    if (!form.name || !form.subject) return;
    setCreating(true);
    try {
      const res = await axios.post("http://localhost:5000/api/groups", form);
      setForm({ name: "", subject: "", description: "", isPrivate: false, color: "#6c63ff" });
      setShowModal(false);
      await fetchGroups();
      setActiveTab("my");
      if (res.data.isPrivate) {
        showToast(`Group created! Invite Code: ${res.data.inviteCode} 🔒`);
      } else {
        showToast("Group created! 🎉");
      }
    } catch (err) { showToast("Failed", "error"); }
    finally { setCreating(false); }
  };

  const filterGroups = (groups) => {
    if (!searchQuery) return groups;
    return groups.filter((g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const displayedGroups = filterGroups(activeTab === "all" ? allGroups : myGroups);

  return (
    <div className="dashboard">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <nav className="navbar">
        <div className="nav-logo">StudyCollab</div>
        <div className="nav-user">
          <button className="theme-btn" onClick={toggleTheme}>{isDark ? "☀️" : "🌙"}</button>
          <Link to="/analytics" className="btn-logout">📊 Analytics</Link>
          <Link to="/profile" className="btn-logout">👤 Profile</Link>
          <span>Hey, <strong>{user?.username}</strong> 👋</span>
          <button className="btn-logout" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Study Groups</h1>
          <p>Find your tribe. Learn together. Grow together.</p>
        </div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <button className="create-group-btn" onClick={() => setShowModal(true)}>+ Create Study Group</button>
  
        </div>

        <div className="search-bar">
          <input type="text" placeholder="🔍 Search groups by name or subject..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
          {searchQuery && <button className="clear-search" onClick={() => setSearchQuery("")}>✕</button>}
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>All Groups ({allGroups.length})</button>
          <button className={`tab ${activeTab === "my" ? "active" : ""}`} onClick={() => setActiveTab("my")}>My Groups ({myGroups.length})</button>
        </div>

        {loading ? (
          <div style={{ color: "var(--text2)", textAlign: "center", padding: "40px" }}>Loading...</div>
        ) : displayedGroups.length === 0 ? (
          <div className="empty-state">
            <h3>{searchQuery ? "No groups found!" : "No groups yet!"}</h3>
            <p>{searchQuery ? "Try different search." : "Create the first group!"}</p>
          </div>
        ) : (
          <div className="groups-grid">
            {displayedGroups.map((group) => {
              const joined = myGroups.some((g) => g._id === group._id);
              return (
                <div className="group-card" key={group._id} style={{ borderTop: `3px solid ${group.color || "var(--accent)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="group-tag" style={{ background: `${group.color}22`, color: group.color }}>{group.subject}</div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text2)" }}>{group.isPrivate ? "🔒 Private" : "🌐 Public"}</span>
                  </div>
                  <h3>{group.name}</h3>
                  <p>{group.description || "No description."}</p>
                  <div style={{ fontSize: "0.8rem", color: "var(--text2)", marginBottom: "12px" }}>
                    By <strong>{group.createdBy?.username || "Unknown"}</strong>
                  </div>
                  <div className="group-meta">
                    <span className="group-members">👥 {group.members?.length || 0} member{group.members?.length !== 1 ? "s" : ""}</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {joined ? (
                        <>
                          <Link to={`/chat/${group._id}`} className="btn-chat" style={{ background: group.color || "var(--accent)", border: "none" }}>Open Chat →</Link>
                          <button className="btn-leave" onClick={() => handleLeave(group._id)} disabled={leavingId === group._id}>
                            {leavingId === group._id ? "..." : "Leave"}
                          </button>
                        </>
                      ) : (
                        <button className="btn-join" onClick={() => handleJoin(group._id)} disabled={joiningId === group._id} style={{ borderColor: group.color, color: group.color }}>
                          {joiningId === group._id ? "Joining..." : "Join Group"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Study Group</h2>
            <div className="form-group">
              <label>Group Name *</label>
              <input type="text" placeholder="e.g. DSA Warriors" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Subject *</label>
              <input type="text" placeholder="e.g. Computer Science" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input type="text" placeholder="What will this group focus on?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Group Color</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {GROUP_COLORS.map((color) => (
                  <button key={color} onClick={() => setForm({ ...form, color })} style={{ width: "28px", height: "28px", borderRadius: "50%", background: color, border: form.color === color ? "3px solid white" : "2px solid transparent", cursor: "pointer" }} />
                ))}
              </div>
            </div>
            <div className="form-group">
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input type="checkbox" checked={form.isPrivate} onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })} />
                🔒 Make this group private (invite code only)
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-create" onClick={handleCreate} disabled={creating || !form.name || !form.subject}>
                {creating ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Private Group Modal */}
      {showJoinPrivate && (
        <div className="modal-overlay" onClick={() => setShowJoinPrivate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>🔒 Join Private Group</h2>
            <div className="form-group">
              <label>Invite Code</label>
              <input type="text" placeholder="Enter invite code e.g. AB12CD" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "1.1rem" }} />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowJoinPrivate(false)}>Cancel</button>
              <button className="btn-create" onClick={handleJoinPrivate} disabled={!inviteCode.trim()}>Join Group</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
