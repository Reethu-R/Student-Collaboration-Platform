import React, { useState, useEffect } from "react";
import axios from "axios";

const ResourcePanel = ({ groupId, userId, isMember, showToast }) => {
  const [resources, setResources] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", url: "", description: "" });
  const [adding, setAdding] = useState(false);

  const fetchResources = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/resources/${groupId}`);
      setResources(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchResources(); }, [groupId]);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      showToast("Title and URL are required!", "error"); return;
    }
    setAdding(true);
    try {
      await axios.post("http://localhost:5000/api/resources", { groupId, ...form });
      setForm({ title: "", url: "", description: "" });
      setShowForm(false);
      await fetchResources();
      showToast("Resource added! 📚");
    } catch (err) { showToast("Failed to add resource", "error"); }
    finally { setAdding(false); }
  };

  const handleUpvote = async (resourceId) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/resources/${resourceId}/upvote`);
      setResources((prev) => prev.map((r) => r._id === resourceId ? res.data : r));
    } catch (err) { showToast("Failed to upvote", "error"); }
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm("Delete this resource?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/resources/${resourceId}`);
      setResources((prev) => prev.filter((r) => r._id !== resourceId));
      showToast("Resource deleted!");
    } catch (err) { showToast("Failed to delete", "error"); }
  };

  const hasUpvoted = (resource) => resource.upvotes?.includes(userId);

  return (
    <div className="panel-body">
      {isMember && (
        <button className="panel-create-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕ Cancel" : "+ Add Resource"}
        </button>
      )}

      {showForm && (
        <div className="poll-form">
          <div className="form-group">
            <label>Title *</label>
            <input type="text" placeholder="e.g. DSA Cheat Sheet" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label>URL *</label>
            <input type="text" placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input type="text" placeholder="What is this resource about?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className="btn-create" onClick={handleAdd} disabled={adding} style={{ width: "100%", marginTop: "8px" }}>
            {adding ? "Adding..." : "Add Resource"}
          </button>
        </div>
      )}

      {resources.length === 0 ? (
        <div className="empty-state"><h3>No resources yet!</h3><p>Share useful links and study materials.</p></div>
      ) : (
        resources.map((resource) => (
          <div className="resource-card" key={resource._id}>
            <div className="resource-header">
              <a href={resource.url} target="_blank" rel="noreferrer" className="resource-title">
                📎 {resource.title}
              </a>
              {resource.addedBy === userId && (
                <button className="resource-delete" onClick={() => handleDelete(resource._id)}>🗑️</button>
              )}
            </div>
            {resource.description && <p className="resource-desc">{resource.description}</p>}
            <div className="resource-footer">
              <span className="resource-meta">Added by {resource.addedByName}</span>
              <button
                className={`upvote-btn ${hasUpvoted(resource) ? "upvoted" : ""}`}
                onClick={() => isMember && handleUpvote(resource._id)}
                disabled={!isMember}
              >
                👍 {resource.upvotes?.length || 0}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ResourcePanel;
