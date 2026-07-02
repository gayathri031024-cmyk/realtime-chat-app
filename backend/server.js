require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRouter = require("./src/routes/auth");
const buildMessagesRouter = require("./src/routes/messages");
const { registerSocketHandlers } = require("./src/socket");

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// --- Routes -----------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/messages", buildMessagesRouter(io));

// --- Fallback error handling -------------------------------------------
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// --- Socket.io -----------------------------------------------------------
registerSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Chat backend listening on http://localhost:${PORT}`);
});
