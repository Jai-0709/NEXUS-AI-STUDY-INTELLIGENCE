import MessageBubble from "./MessageBubble.jsx";

export default function ChatWindow({ messages, thinking, error, bottomRef }) {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
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
  );
}
