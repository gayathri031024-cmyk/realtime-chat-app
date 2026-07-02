import { useCallback, useEffect, useState } from "react";
import Login from "./components/Login";
import ChatWindow from "./components/ChatWindow";
import { fetchHistory } from "./api";
import { socket } from "./socket";
import "./index.css";

const STORAGE_KEY = "chat-app-username";

export default function App() {
  const [username, setUsername] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Load history + connect socket once we have a username.
  useEffect(() => {
    if (!username) return;

    let cancelled = false;

    async function loadHistory() {
      try {
        const { messages: history } = await fetchHistory();
        if (!cancelled) setMessages(history);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load chat history");
      }
    }
    loadHistory();

    socket.connect();
    socket.emit("user:join", username);

    function handleConnect() {
      setConnected(true);
      socket.emit("user:join", username);
    }
    function handleDisconnect() {
      setConnected(false);
    }
    function handleNewMessage(message) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev; // avoid dupes
        return [...prev, message];
      });
    }
    function handlePresenceUpdate({ onlineUsers: users }) {
      setOnlineUsers(users);
    }
    function handleTypingUpdate({ username: typer, isTyping }) {
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.includes(typer) ? prev : [...prev, typer];
        }
        return prev.filter((u) => u !== typer);
      });
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("message:new", handleNewMessage);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("typing:update", handleTypingUpdate);

    return () => {
      cancelled = true;
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("message:new", handleNewMessage);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("typing:update", handleTypingUpdate);
      socket.disconnect();
    };
  }, [username]);

  const handleLogin = useCallback((name) => {
    localStorage.setItem(STORAGE_KEY, name);
    setUsername(name);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUsername("");
    setMessages([]);
    setOnlineUsers([]);
    setTypingUsers([]);
  }, []);

  const handleSend = useCallback(
    (text) => {
      socket.emit("message:send", { username, text }, (ack) => {
        if (!ack?.success) {
          console.error("Failed to send message:", ack?.error);
        }
      });
    },
    [username]
  );

  const handleTyping = useCallback(
    (isTyping) => {
      socket.emit(isTyping ? "typing:start" : "typing:stop", username);
    },
    [username]
  );

  if (!username) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      {loadError && <div className="banner-error">{loadError}</div>}
      <ChatWindow
        username={username}
        messages={messages}
        onlineUsers={onlineUsers}
        typingUsers={typingUsers}
        connected={connected}
        onSend={handleSend}
        onTyping={handleTyping}
        onLogout={handleLogout}
      />
    </div>
  );
}
