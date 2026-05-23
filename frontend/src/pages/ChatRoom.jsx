import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import EmojiPicker from "../components/EmojiPicker";
import Toast from "../components/Toast";
import PollPanel from "../components/PollPanel";
import ResourcePanel from "../components/ResourcePanel";
import AnnouncementPanel from "../components/AnnouncementPanel";
import PomodoroTimer from "../components/PomodoroTimer";
import Whiteboard from "../components/Whiteboard";
import VoiceVideo from "../components/VoiceVideo";
import ContributionTracker from "../components/ContributionTracker";
import AISummary from "../components/AISummary";

const socket = io("http://localhost:5000");

const ChatRoom = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [charCount, setCharCount] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const [toast, setToast] = useState(null);
  const [activePanel, setActivePanel] = useState("chat");
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showVoiceVideo, setShowVoiceVideo] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const MAX_CHARS = 500;

  const showToast = (message, type = "success") => setToast({ message, type });
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupRes, msgRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/groups/${groupId}`),
          axios.get(`http://localhost:5000/api/messages/${groupId}`),
        ]);
        setGroup(groupRes.data);
        const memberIds = groupRes.data.members.map((m) => m._id || m);
        setIsMember(memberIds.includes(user.id));
        setMessages(msgRes.data);
        if (groupRes.data.pinnedMessage) setPinnedMessage(groupRes.data.pinnedMessage);
      } catch (err) {
        if (err.response?.status === 403) navigate("/dashboard");
      } finally { setLoading(false); }
    };

    fetchData();
    socket.emit("user_online", { userId: user.id, username: user.username });
    socket.emit("join_room", groupId);
    socket.on("online_users", setOnlineUsers);
    socket.on("user_typing", ({ username, isTyping }) => setTypingUser(isTyping ? username : ""));
    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      setTypingUser("");
      if (msg.sender !== user.id) {
        setUnreadCount((c) => c + 1);
        showToast(`💬 ${msg.senderName}: ${msg.content.slice(0, 25)}...`, "info");
      }
    });
    socket.on("message_pinned", ({ message, pinnedBy }) => {
      setPinnedMessage(message);
      showToast(`📌 ${pinnedBy} pinned a message`, "info");
    });

    return () => {
      socket.emit("leave_room", groupId);
      ["receive_message", "user_typing", "online_users", "message_pinned"].forEach((e) => socket.off(e));
    };
  }, [groupId, user.id, user.username, navigate]);

  useEffect(() => { if (activePanel === "chat") setUnreadCount(0); }, [activePanel]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val.length > MAX_CHARS) return;
    setInput(val); setCharCount(val.length);
    socket.emit("typing", { groupId, username: user.username, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { groupId, username: user.username, isTyping: false });
    }, 1500);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("send_message", { groupId, message: input.trim(), userId: user.id, username: user.username });
    socket.emit("typing", { groupId, username: user.username, isTyping: false });
    setInput(""); setCharCount(0); setShowEmoji(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleEmojiSelect = (emoji) => {
    if (input.length + emoji.length > MAX_CHARS) return;
    setInput((p) => p + emoji); setCharCount((p) => p + emoji.length);
  };

  const handleDeleteMessage = async (msgId, senderId) => {
    if (senderId !== user.id) return;
    if (!window.confirm("Delete this message?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/messages/${msgId}`);
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
      showToast("Deleted!");
    } catch { showToast("Failed", "error"); }
  };

  const handlePinMessage = async (content) => {
    try {
      await axios.post(`http://localhost:5000/api/groups/${groupId}/pin`, { message: content });
      socket.emit("pin_message", { groupId, message: content, pinnedBy: user.username });
      setPinnedMessage(content);
      showToast("Message pinned! 📌");
    } catch { showToast("Failed to pin", "error"); }
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isUserOnline = (uid) => onlineUsers.includes(uid);

  if (loading) return <div className="loading">Loading chat...</div>;

  return (
    <div className="chat-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {showPomodoro && <PomodoroTimer onClose={() => setShowPomodoro(false)} />}
      {showWhiteboard && <Whiteboard socket={socket} groupId={groupId} onClose={() => setShowWhiteboard(false)} />}
      {showVoiceVideo && <VoiceVideo socket={socket} groupId={groupId} userId={user.id} username={user.username} onClose={() => setShowVoiceVideo(false)} />}
      {showAISummary && <AISummary groupId={groupId} groupName={group?.name} onClose={() => setShowAISummary(false)} />}

      <div className="chat-header">
        <Link to="/dashboard" className="btn-back">← Back</Link>
        <div className="chat-header-info">
          <h2 style={{ color: group?.color || "var(--accent)" }}>{group?.name}</h2>
          <p>{group?.subject} {group?.isPrivate ? "🔒" : "🌐"}</p>
        </div>
        <div className="chat-header-actions">
          <button className="pomo-trigger-btn" onClick={() => setShowAISummary(true)} title="AI Summary">🤖</button>
          <button className="pomo-trigger-btn" onClick={() => setShowWhiteboard(true)} title="Whiteboard">🖊️</button>
          <button className="pomo-trigger-btn" onClick={() => setShowVoiceVideo(true)} title="Voice/Video">📹</button>
          <button className="pomo-trigger-btn" onClick={() => setShowPomodoro(true)} title="Pomodoro">⏱️</button>
          <div className="members-online">
            {group?.members?.slice(0, 3).map((m) => (
              <div key={m._id} className="member-badge">
                <span className={`online-dot ${isUserOnline(m._id) ? "online" : "offline"}`}></span>
                <span className="member-name">{m.username}</span>
              </div>
            ))}
            {group?.members?.length > 3 && <span style={{ fontSize: "0.78rem", color: "var(--text2)" }}>+{group.members.length - 3}</span>}
          </div>
        </div>
      </div>

      {pinnedMessage && (
        <div className="pinned-message">📌 <strong>Pinned:</strong> {pinnedMessage}</div>
      )}

      <div className="chat-tabs">
        <button className={`chat-tab ${activePanel === "chat" ? "active" : ""}`} onClick={() => setActivePanel("chat")}>
          💬 Chat {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
        </button>
        <button className={`chat-tab ${activePanel === "polls" ? "active" : ""}`} onClick={() => setActivePanel("polls")}>🗳️ Polls</button>
        <button className={`chat-tab ${activePanel === "resources" ? "active" : ""}`} onClick={() => setActivePanel("resources")}>📚 Resources</button>
        <button className={`chat-tab ${activePanel === "announcements" ? "active" : ""}`} onClick={() => setActivePanel("announcements")}>📢 Announcements</button>
        <button className={`chat-tab ${activePanel === "contributions" ? "active" : ""}`} onClick={() => setActivePanel("contributions")}>🏅 Contributions</button>
      </div>

      {activePanel === "chat" && (
        <>
          <div className="chat-body">
            {messages.length === 0 && <div style={{ textAlign: "center", color: "var(--text2)", padding: "40px" }}>No messages yet. Say hello! 👋</div>}
            {messages.map((msg, idx) => {
              const isOwn = msg.sender === user.id || msg.sender?._id === user.id;
              return (
                <div key={msg._id || idx} className={`message ${isOwn ? "own" : "other"}`}>
                  {!isOwn && <div className="message-sender">{msg.senderName}</div>}
                  <div className="message-bubble-wrapper">
                    <div className="message-bubble">{msg.content}</div>
                    {isOwn && (
                      <div className="msg-actions">
                        <button className="delete-msg-btn" onClick={() => handleDeleteMessage(msg._id, msg.sender)}>🗑️</button>
                        <button className="pin-msg-btn" onClick={() => handlePinMessage(msg.content)}>📌</button>
                      </div>
                    )}
                  </div>
                  <div className="message-time">{formatTime(msg.createdAt)}</div>
                </div>
              );
            })}
            {typingUser && (
              <div className="typing-indicator">
                <div className="typing-bubble"><span></span><span></span><span></span></div>
                <span className="typing-text">{typingUser} is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {showEmoji && <div className="emoji-picker-wrapper"><EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} /></div>}

          {isMember ? (
            <div className="chat-input-area">
              <button className="emoji-toggle-btn" onClick={() => setShowEmoji(!showEmoji)}>😊</button>
              <div className="input-wrapper">
                <input className="chat-input" type="text" placeholder="Type a message..." value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} />
                <span className={`char-count ${charCount > MAX_CHARS * 0.8 ? "warning" : ""}`}>{charCount}/{MAX_CHARS}</span>
              </div>
              <button className="btn-send" onClick={sendMessage} disabled={!input.trim()}>Send →</button>
            </div>
          ) : (
            <div className="not-member-msg">Not a member. <Link to="/dashboard" style={{ color: "var(--accent)" }}>Join from dashboard.</Link></div>
          )}
        </>
      )}

      {activePanel === "polls" && <PollPanel groupId={groupId} userId={user.id} isMember={isMember} showToast={showToast} />}
      {activePanel === "resources" && <ResourcePanel groupId={groupId} userId={user.id} isMember={isMember} showToast={showToast} />}
      {activePanel === "announcements" && <AnnouncementPanel groupId={groupId} userId={user.id} createdById={group?.createdBy?._id} showToast={showToast} />}
      {activePanel === "contributions" && <ContributionTracker groupId={groupId} currentUserId={user.id} />}
    </div>
  );
};

export default ChatRoom;
