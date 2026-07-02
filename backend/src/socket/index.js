const { v4: uuidv4 } = require("uuid");
const { saveMessage } = require("../db");

// Map of socket.id -> username, used to track who is online and to
// clean up presence when a socket disconnects.
const onlineUsers = new Map();

function broadcastOnlineUsers(io) {
  const usernames = [...new Set(onlineUsers.values())];
  io.emit("presence:update", { onlineUsers: usernames });
}

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Client announces its username right after connecting.
    socket.on("user:join", (username) => {
      if (!username || typeof username !== "string") return;
      onlineUsers.set(socket.id, username.trim());
      broadcastOnlineUsers(io);
    });

    // Real-time message send. REST POST /api/messages exists as a
    // fallback, but this is the primary path used by the chat UI.
    socket.on("message:send", (payload, ack) => {
      try {
        const { username, text } = payload || {};

        if (!username || !text || !String(text).trim()) {
          if (typeof ack === "function") {
            ack({ success: false, error: "username and text are required" });
          }
          return;
        }

        const message = {
          id: uuidv4(),
          username: String(username).trim(),
          text: String(text).trim(),
          createdAt: new Date().toISOString(),
        };

        saveMessage(message);

        // Broadcast to everyone, including the sender, so all clients
        // render from a single source of truth.
        io.emit("message:new", message);

        if (typeof ack === "function") {
          ack({ success: true, message });
        }
      } catch (err) {
        console.error("Error handling message:send:", err);
        if (typeof ack === "function") {
          ack({ success: false, error: "Server error while sending message" });
        }
      }
    });

    // Typing indicator - broadcast to everyone except the sender.
    socket.on("typing:start", (username) => {
      socket.broadcast.emit("typing:update", { username, isTyping: true });
    });

    socket.on("typing:stop", (username) => {
      socket.broadcast.emit("typing:update", { username, isTyping: false });
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      onlineUsers.delete(socket.id);
      broadcastOnlineUsers(io);
    });
  });
}

module.exports = { registerSocketHandlers };
