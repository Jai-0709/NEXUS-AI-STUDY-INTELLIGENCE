import { useRef, useState } from "react";

export default function InputBox({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const textRef = useRef(null);

  const resize = () => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, 200); // up to ~6 rows
    el.style.height = `${next}px`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
    requestAnimationFrame(resize);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    requestAnimationFrame(resize);
  };

  return (
    <div
      className="w-full relative z-20 fade-in"
      style={{
        position: "sticky",
        bottom: 0,
        background: "rgba(5,5,8,0.85)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 -12px 40px rgba(0,0,0,0.5)",
      }}
    >
      <form onSubmit={handleSubmit} className="w-full flex gap-3 items-end px-4 py-3">
        <div className="flex-1 flex flex-col gap-2">
          <textarea
            ref={textRef}
            className="flex-1 resize-none rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200 custom-scrollbar"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#f0f0f0",
              fontFamily: "'Satoshi', sans-serif",
              lineHeight: 1.5,
              minHeight: "72px",
              maxHeight: "200px",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              e.currentTarget.style.boxShadow = "0 0 12px rgba(255,255,255,0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.boxShadow = "none";
            }}
            placeholder="Ask a question, reason through a problem, or request a summary..."
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-label="Chat input"
          />
          <div className="flex items-center justify-between text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            <span>Enter to send · Shift+Enter for newline</span>
            {disabled && <span>Sending…</span>}
          </div>
        </div>

        <button
          type="submit"
          disabled={disabled}
          className="nexus-btn-primary h-fit"
          style={{ padding: "12px 20px" }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
