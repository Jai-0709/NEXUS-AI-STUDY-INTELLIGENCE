import { useState } from "react";

export default function OfflineTab({ messages, onSend, disabled }) {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto min-h-[calc(100vh-160px)] pt-10 pb-16 space-y-6">
      <header className="space-y-2 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em]"
          style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.3)" }}
        >
          Offline / Low-Connectivity
        </p>
        <p className="italic" style={{ color: "rgba(255,255,255,0.35)" }}>Uses cached document chunks only. No model calls.</p>
      </header>

      <form onSubmit={handleSubmit} className="rounded-2xl shadow-xl p-4 flex flex-col md:flex-row gap-3 items-center"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask using cached context (no internet)"
          className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#f0f0f0",
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"}
          onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
          disabled={disabled}
          onKeyDown={handleKeyDown}
        />
        <button type="submit" disabled={disabled} className="nexus-btn-primary">
          Send
        </button>
      </form>

      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className="p-3 rounded-lg text-sm"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: m.sender === "user" ? "rgba(255,255,255,0.85)" : "#f0f0f0",
            }}
          >
            {m.sender === "ai" && (
              <div className="text-[10px] uppercase tracking-[0.2em] mb-1"
                style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.4)" }}
              >
                Chunks
              </div>
            )}
            {Array.isArray(m.text) ? (
              <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                {m.text.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            ) : (
              <div className="whitespace-pre-wrap">{m.text}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
