export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid response from server");
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export function login(username) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export function fetchHistory(limit = 200) {
  return request(`/api/messages?limit=${limit}`);
}

export function sendMessageRest(username, text) {
  return request("/api/messages", {
    method: "POST",
    body: JSON.stringify({ username, text }),
  });
}
