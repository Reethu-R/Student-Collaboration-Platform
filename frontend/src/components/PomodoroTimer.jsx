import React, { useState, useEffect, useRef } from "react";

const PomodoroTimer = ({ onClose }) => {
  const [mode, setMode] = useState("study"); // study | break
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef(null);

  const TIMES = { study: 25 * 60, break: 5 * 60, longBreak: 15 * 60 };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            if (mode === "study") {
              setSessions((s) => s + 1);
              setMode("break");
              setTimeLeft(TIMES.break);
            } else {
              setMode("study");
              setTimeLeft(TIMES.study);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setTimeLeft(TIMES[mode]);
  };

  const handleModeChange = (newMode) => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(TIMES[newMode]);
  };

  const progress = ((TIMES[mode] - timeLeft) / TIMES[mode]) * 100;

  return (
    <div className="pomodoro-overlay">
      <div className="pomodoro-card">
        <div className="pomodoro-header">
          <h3>⏱️ Pomodoro Timer</h3>
          <button className="pomodoro-close" onClick={onClose}>✕</button>
        </div>

        <div className="pomodoro-modes">
          <button className={`pomo-mode-btn ${mode === "study" ? "active" : ""}`} onClick={() => handleModeChange("study")}>Study</button>
          <button className={`pomo-mode-btn ${mode === "break" ? "active" : ""}`} onClick={() => handleModeChange("break")}>Break</button>
          <button className={`pomo-mode-btn ${mode === "longBreak" ? "active" : ""}`} onClick={() => handleModeChange("longBreak")}>Long Break</button>
        </div>

        <div className="pomodoro-circle">
          <svg viewBox="0 0 100 100" className="pomo-svg">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="4" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={mode === "study" ? "var(--accent)" : "var(--accent3)"}
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="pomo-time">{formatTime(timeLeft)}</div>
          <div className="pomo-mode-label">{mode === "study" ? "Focus Time" : mode === "break" ? "Short Break" : "Long Break"}</div>
        </div>

        <div className="pomodoro-controls">
          <button className="pomo-btn" onClick={handleReset}>↺</button>
          <button className="pomo-btn pomo-main" onClick={() => setIsRunning(!isRunning)}>
            {isRunning ? "⏸" : "▶"}
          </button>
          <div className="pomo-sessions">🍅 {sessions}</div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
