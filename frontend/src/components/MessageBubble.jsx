export default function MessageBubble({ sender, text, muted = false }) {
  const isUser = sender === "user";
  const isThinking = muted && text === "thinking";
  const isAsciiBox = !isThinking && (/\+[-+]{2,}|\|/.test(text) || /\u251C|\u2502/.test(text));
  const widthClass = isAsciiBox ? "max-w-full md:max-w-[90%] overflow-x-auto" : "max-w-[82%] md:max-w-[70%]";

  const bubbleStyle = isUser
    ? {
        background: "rgba(255,255,255,0.06)",
        color: "#f0f0f0",
        border: "1px solid rgba(255,255,255,0.12)",
        borderBottomRightRadius: "4px",
      }
    : isThinking
    ? {
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderBottomLeftRadius: "4px",
      }
    : {
        background: "linear-gradient(130deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))",
        color: "#f6f6f6",
        border: "1px solid rgba(255,255,255,0.28)",
        borderBottomLeftRadius: "4px",
      };

  return (
    <div className={`flex fade-in ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-3"
          style={{
            background: isThinking
              ? "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))"
              : "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))",
            border: isThinking
              ? "1px solid rgba(255,255,255,0.22)"
              : "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <span
            className={`material-symbols-outlined ${isThinking ? "nexus-pulse" : ""}`}
            style={{ fontSize: "14px", color: isThinking ? "rgba(255,255,255,0.6)" : "#fff" }}
          >
            psychology
          </span>
        </div>
      )}
      <div
        className={[
          widthClass,
          "px-5 py-3.5 rounded-2xl shadow-lg transition-all",
          !isThinking && isAsciiBox
            ? "font-mono whitespace-pre text-[13px]"
            : !isThinking ? "whitespace-pre-wrap text-[14px] leading-relaxed" : "",
        ].join(" ")}
        style={{
          ...bubbleStyle,
          ...(isAsciiBox ? { color: "rgba(255,255,255,0.7)" } : {}),
        }}
      >
        {isThinking ? (
          <div className="flex items-center gap-3 py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="thinking-dot" />
              <span className="thinking-dot" />
              <span className="thinking-dot" />
            </div>
            <span
              className="text-[11px] uppercase tracking-[0.2em]"
              style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.35)" }}
            >
              Thinking
            </span>
          </div>
        ) : (
          text
        )}
      </div>
    </div>
  );
}
