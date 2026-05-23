import React, { useState, useEffect } from "react";
import axios from "axios";

const AnnouncementPanel = ({ groupId, userId, createdById, showToast }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const [creating, setCreating] = useState(false);
  const isAdmin = createdById === userId;

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/announcements/${groupId}`);
      setAnnouncements(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchAnnouncements(); }, [groupId]);

  const handleCreate = async () => {
    if (!form.title || !form.content) { showToast("Fill all fields!", "error"); return; }
    setCreating(true);
    try {
      await axios.post("http://localhost:5000/api/announcements", { groupId, ...form });
      setForm({ title: "", content: "" });
      setShowForm(false);
      await fetchAnnouncements();
      showToast("Announcement posted! 📢");
    } catch (err) { showToast(err.response?.data?.message || "Failed", "error"); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete announcement?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      showToast("Deleted!");
    } catch (err) { showToast("Failed to delete", "error"); }
  };

  return (
    <div className="panel-body">
      {isAdmin && (
        <button className="panel-create-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕ Cancel" : "📢 Post Announcement"}
        </button>
      )}

      {!isAdmin && (
        <div className="admin-note">Only the group admin can post announcements.</div>
      )}

      {showForm && (
        <div className="poll-form">
          <div className="form-group">
            <label>Title</label>
            <input type="text" placeholder="Announcement title..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea placeholder="Write your announcement..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} style={{ width: "100%", padding: "12px 16px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text)", fontFamily: "DM Sans, sans-serif", fontSize: "0.95rem", outline: "none", resize: "vertical" }} />
          </div>
          <button className="btn-create" onClick={handleCreate} disabled={creating} style={{ width: "100%", marginTop: "8px" }}>
            {creating ? "Posting..." : "Post Announcement"}
          </button>
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="empty-state"><h3>No announcements yet!</h3><p>Group admin can post important updates here.</p></div>
      ) : (
        announcements.map((a) => (
          <div className="announcement-card" key={a._id}>
            <div className="announcement-header">
              <div>
                <span className="announcement-badge">📢 Announcement</span>
                <h4 className="announcement-title">{a.title}</h4>
              </div>
              {isAdmin && (
                <button className="resource-delete" onClick={() => handleDelete(a._id)}>🗑️</button>
              )}
            </div>
            <p className="announcement-content">{a.content}</p>
            <div className="announcement-meta">
              Posted by <strong>{a.postedByName}</strong> · {new Date(a.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AnnouncementPanel;
