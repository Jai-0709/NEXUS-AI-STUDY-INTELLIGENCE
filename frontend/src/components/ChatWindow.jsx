import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";

export default function ChatWindow({ messages, thinking, error, bottomRef }) {
  const listRef = useRef(null);
  const [showJump, setShowJump] = useState(false);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const handleScroll = () => {
      const distance = el.scrollHeight - el.clientHeight - el.scrollTop;
      setShowJump(distance > 140);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    bottomRef?.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking]);

  return (
    <div className="flex-1 relative" aria-live="polite">
      <div
        ref={listRef}
        className="overflow-y-auto px-8 py-6 custom-scrollbar h-full"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="max-w-5xl mx-auto flex flex-col gap-5">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} sender={msg.sender} text={msg.text} />
          ))}

          {thinking && <MessageBubble sender="ai" text="Thinking..." muted />}

          {error && (
            <div className="text-sm rounded-xl px-5 py-4 flex items-center gap-3 fade-in"
              style={{
                color: "rgba(255,140,140,0.9)",
                background: "rgba(255,100,100,0.06)",
                border: "1px solid rgba(255,100,100,0.12)",
              }}
            >
              <span className="material-symbols-outlined" style={{ color: "rgba(255,100,100,0.7)" }}>error</span>
              {error}
            </div>
          )}

          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      {showJump && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="fixed bottom-24 right-10 z-40 px-3 py-2 rounded-full text-xs font-semibold shadow-lg transition-all"
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            backdropFilter: "blur(10px)",
          }}
        >
          Jump to latest
        </button>
      )}
    </div>
  );
}
