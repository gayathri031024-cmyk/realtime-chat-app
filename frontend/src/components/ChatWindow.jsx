import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function ChatWindow({
  username,
  messages,
  onlineUsers,
  typingUsers,
  connected,
  onSend,
  onTyping,
  onLogout,
}) {
  const othersTyping = typingUsers.filter((u) => u !== username);

  return (
    <div className="chat-window">
      <header className="chat-header">
        <div>
          <h2>Team Chat</h2>
          <span className={`status-dot ${connected ? "online" : "offline"}`} />
          <span className="status-label">{connected ? "Connected" : "Reconnecting..."}</span>
        </div>
        <div className="header-right">
          <span className="online-count">{onlineUsers.length} online</span>
          <button className="logout-btn" onClick={onLogout}>
            {username} · Log out
          </button>
        </div>
      </header>

      <div className="online-users">
        {onlineUsers.map((u) => (
          <span key={u} className="online-chip">
            ● {u}
          </span>
        ))}
      </div>

      <MessageList messages={messages} currentUser={username} />

      <div className="typing-indicator">
        {othersTyping.length > 0 &&
          `${othersTyping.join(", ")} ${othersTyping.length === 1 ? "is" : "are"} typing...`}
      </div>

      <MessageInput onSend={onSend} onTyping={onTyping} />
    </div>
  );
}
