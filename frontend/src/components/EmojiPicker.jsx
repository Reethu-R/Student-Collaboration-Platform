import React from "react";

const emojis = [
  "😀","😂","😍","🥺","😎","🤔","😅","🔥","❤️","👍",
  "👏","🙌","🎉","✅","⭐","💡","📚","💻","🧠","🚀",
  "😊","🥳","😭","😤","🤩","💪","🙏","👀","💯","🎯"
];

const EmojiPicker = ({ onSelect, onClose }) => {
  return (
    <div className="emoji-picker">
      <div className="emoji-header">
        <span>Pick an emoji</span>
        <button onClick={onClose} className="emoji-close">✕</button>
      </div>
      <div className="emoji-grid">
        {emojis.map((emoji, idx) => (
          <button
            key={idx}
            className="emoji-btn"
            onClick={() => { onSelect(emoji); onClose(); }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
