export default function MessageBubble({ sender, text, muted = false }) {
  const isUser = sender === "user";
  const isAsciiBox = /\+[-+]{2,}|\|/.test(text) || /\u251C|\u2502/.test(text);
  const widthClass = isAsciiBox ? "max-w-full md:max-w-[90%] overflow-x-auto" : "max-w-[82%] md:max-w-[70%]";

  const bubbleStyle = isUser
    ? {
        background: "rgba(255,255,255,0.06)",
        color: "#f0f0f0",
        border: "1px solid rgba(255,255,255,0.12)",
        borderBottomRightRadius: "4px",
      }
    : {
        background: "linear-gradient(130deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))",
        color: "#f6f6f6",
        border: "1px solid rgba(255,255,255,0.28)",
        borderBottomLeftRadius: "4px",
      };

  return (
    <div className={`flex fade-in ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          widthClass,
          "px-5 py-3.5 rounded-2xl shadow-lg transition-all",
          muted ? "opacity-70 italic" : "",
          isAsciiBox
            ? "font-mono whitespace-pre text-[13px]"
            : "whitespace-pre-wrap text-[14px] leading-relaxed",
        ].join(" ")}
        style={{
          ...bubbleStyle,
          ...(isAsciiBox ? { color: "rgba(255,255,255,0.7)" } : {}),
        }}
      >
        {text}
      </div>
    </div>
  );
}
