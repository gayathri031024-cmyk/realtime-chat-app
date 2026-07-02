const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { saveMessage, getHistory } = require("../db");

module.exports = function buildMessagesRouter(io) {
  const router = express.Router();

  // GET /api/messages?limit=200 - fetch chat history
  router.get("/", (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 200, 1000);
      const history = getHistory(limit);
      res.json({ success: true, messages: history });
    } catch (err) {
      console.error("Failed to fetch history:", err);
      res.status(500).json({ success: false, error: "Failed to fetch chat history" });
    }
  });

  // POST /api/messages - send a message (also used as a REST fallback;
  // primary send path in the app is the Socket.io "message:send" event).
  router.post("/", (req, res) => {
    try {
      const { username, text } = req.body;

      if (!username || typeof username !== "string" || !username.trim()) {
        return res.status(400).json({ success: false, error: "username is required" });
      }
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ success: false, error: "text is required" });
      }

      const message = {
        id: uuidv4(),
        username: username.trim(),
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };

      saveMessage(message);

      // Broadcast to all connected clients so REST-sent messages
      // still show up in real time for everyone.
      io.emit("message:new", message);

      res.status(201).json({ success: true, message });
    } catch (err) {
      console.error("Failed to save message:", err);
      res.status(500).json({ success: false, error: "Failed to send message" });
    }
  });

  return router;
};
