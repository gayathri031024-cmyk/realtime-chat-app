const express = require("express");

const router = express.Router();

// Dummy, username-only "login". No password, no real session/token -
// just validates and echoes back the username. Good enough to identify
// who is chatting without building a real auth system.
router.post("/login", (req, res) => {
  const { username } = req.body;

  if (!username || typeof username !== "string" || !username.trim()) {
    return res.status(400).json({ success: false, error: "username is required" });
  }

  const clean = username.trim();
  if (clean.length > 30) {
    return res.status(400).json({ success: false, error: "username must be 30 characters or fewer" });
  }

  res.json({ success: true, username: clean });
});

module.exports = router;
