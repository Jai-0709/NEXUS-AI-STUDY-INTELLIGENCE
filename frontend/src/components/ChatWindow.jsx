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
      setShowJump(distance > 160);
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
    <div className="flex-1 relative min-h-0" aria-live="polite">
      <div
        ref={listRef}
        className="flex flex-col h-full overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,14,0.7)] backdrop-blur-md"
      >
        <div className="px-6 py-4 text-xs uppercase tracking-[0.25em] border-b border-[rgba(255,255,255,0.06)]"
          style={{ color: "rgba(255,255,255,0.45)", fontFamily: "'Clash Display', sans-serif" }}
        >
          Conversation
        </div>

        <div
          className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar"
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

            <div ref={bottomRef} className="h-6" />
          </div>
        </div>
      </div>

      {showJump && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-6 right-6 z-40 px-3 py-2 rounded-full text-xs font-semibold shadow-lg transition-all"
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
