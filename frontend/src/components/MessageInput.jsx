import { useRef, useState } from "react";

const TYPING_STOP_DELAY_MS = 1500;

export default function MessageInput({ onSend, onTyping }) {
  const [text, setText] = useState("");
  const typingTimeoutRef = useRef(null);

  function handleChange(e) {
    setText(e.target.value);

    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, TYPING_STOP_DELAY_MS);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    onSend(trimmed);
    setText("");
    onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={handleChange}
      />
      <button type="submit" disabled={!text.trim()}>
        Send
      </button>
    </form>
  );
}
