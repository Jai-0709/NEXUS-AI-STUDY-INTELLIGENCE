import { useState } from "react";

export default function InputBox({ onSend, disabled }) {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full relative z-10 p-2 fade-in">
      <form onSubmit={handleSubmit} className="w-full flex gap-3 items-center">
        <textarea
          className="flex-1 resize-none rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#f0f0f0",
            fontFamily: "'Satoshi', sans-serif",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
            e.currentTarget.style.boxShadow = "0 0 12px rgba(255,255,255,0.05)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            e.currentTarget.style.boxShadow = "none";
          }}
          rows={2}
          placeholder="Ask a question, reason through a problem, or request a summary..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled}
          className="nexus-btn-primary h-fit"
          style={{ padding: "12px 24px" }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
