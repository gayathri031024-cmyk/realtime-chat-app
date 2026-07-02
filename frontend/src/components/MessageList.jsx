import { useEffect, useRef } from "react";

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function MessageList({ messages, currentUser }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.length === 0 && (
        <p className="empty-state">No messages yet. Say hi 👋</p>
      )}
      {messages.map((msg) => {
        const isOwn = msg.username === currentUser;
        return (
          <div key={msg.id} className={`message-row ${isOwn ? "own" : ""}`}>
            <div className="message-bubble">
              {!isOwn && <div className="message-author">{msg.username}</div>}
              <div className="message-text">{msg.text}</div>
              <div className="message-time">{formatTime(msg.createdAt)}</div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
