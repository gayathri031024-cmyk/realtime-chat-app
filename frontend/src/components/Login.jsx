import { useState } from "react";
import { login } from "../api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Please enter a username.");
      return;
    }

    setLoading(true);
    try {
      const { username: clean } = await login(username);
      onLogin(clean);
    } catch (err) {
      setError(err.message || "Failed to log in. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Welcome 👋</h1>
        <p className="subtitle">Enter a username to join the chat.</p>
        <input
          type="text"
          placeholder="e.g. alex"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={30}
          autoFocus
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Joining..." : "Join chat"}
        </button>
      </form>
    </div>
  );
}
