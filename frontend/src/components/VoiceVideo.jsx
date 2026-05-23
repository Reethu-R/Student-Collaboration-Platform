import React, { useState, useEffect, useRef } from "react";

const VoiceVideo = ({ socket, groupId, userId, username, onClose }) => {
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState("video");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callerName, setCallerName] = useState("");
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    socket.on("incoming_call", ({ callerName, socketId }) => {
      setIncomingCall(socketId);
      setCallerName(callerName);
    });

    socket.on("call_ended", () => {
      endCall();
    });

    return () => {
      socket.off("incoming_call");
      socket.off("call_ended");
    };
  }, []);

  const startCall = async (type) => {
    try {
      setCallType(type);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });
      streamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setInCall(true);
      socket.emit("call_user", { groupId, callerId: userId, callerName: username });
    } catch (err) {
      alert("Could not access camera/microphone. Please allow permissions.");
    }
  };

  const endCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setInCall(false);
    setIncomingCall(null);
    socket.emit("end_call", { groupId });
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) { audioTrack.enabled = !audioTrack.enabled; setIsMuted(!isMuted); }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) { videoTrack.enabled = !videoTrack.enabled; setIsVideoOff(!isVideoOff); }
    }
  };

  return (
    <div className="voicevideo-overlay">
      <div className="voicevideo-card">
        <div className="vv-header">
          <h3>📹 Voice / Video Call</h3>
          <button className="pomodoro-close" onClick={onClose}>✕</button>
        </div>

        {!inCall && !incomingCall && (
          <div className="vv-start">
            <p style={{ color: "var(--text2)", marginBottom: "20px", fontSize: "0.9rem" }}>
              Start a call with your study group members
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button className="vv-btn video" onClick={() => startCall("video")}>
                📹 Video Call
              </button>
              <button className="vv-btn voice" onClick={() => startCall("audio")}>
                🎙️ Voice Call
              </button>
            </div>
          </div>
        )}

        {incomingCall && !inCall && (
          <div className="vv-incoming">
            <div className="vv-incoming-icon">📞</div>
            <p><strong>{callerName}</strong> is calling...</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
              <button className="vv-accept" onClick={() => startCall("video")}>✅ Accept</button>
              <button className="vv-decline" onClick={() => setIncomingCall(null)}>❌ Decline</button>
            </div>
          </div>
        )}

        {inCall && (
          <div className="vv-call-active">
            <div className="vv-videos">
              <video ref={localVideoRef} autoPlay muted className="vv-local" />
              <video ref={remoteVideoRef} autoPlay className="vv-remote" />
            </div>
            <div className="vv-call-info">
              <div className="vv-live-badge">🔴 LIVE</div>
              <span style={{ color: "var(--text2)", fontSize: "0.85rem" }}>Call in progress...</span>
            </div>
            <div className="vv-controls">
              <button className={`vv-control-btn ${isMuted ? "active" : ""}`} onClick={toggleMute}>
                {isMuted ? "🔇" : "🎙️"}
              </button>
              {callType === "video" && (
                <button className={`vv-control-btn ${isVideoOff ? "active" : ""}`} onClick={toggleVideo}>
                  {isVideoOff ? "📷" : "📹"}
                </button>
              )}
              <button className="vv-control-btn end" onClick={endCall}>📵 End</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceVideo;
