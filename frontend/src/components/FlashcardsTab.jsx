import { useState } from "react";

export default function FlashcardsTab({ cards, raw, onGenerate, disabled, currentDocId }) {
  const [topic, setTopic] = useState("");
  const [useContext, setUseContext] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim() || disabled) return;
    onGenerate(topic.trim(), useContext && Boolean(currentDocId));
  };

  return (
    <div className="max-w-5xl mx-auto min-h-[calc(100vh-180px)] pt-10 pb-20 flex flex-col gap-8 relative z-30">
      <div className="text-center fade-in">
        <span className="text-[10px] uppercase tracking-[0.3em] mb-3 block"
          style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.3)" }}
        >
          Flashcards Engine
        </span>
        <p className="italic" style={{ color: "rgba(255,255,255,0.35)" }}>"Generate concise study flashcards with one click."</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl shadow-xl p-4 flex flex-col md:flex-row gap-3 items-center"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic (e.g., Neural Networks)"
          className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#f0f0f0",
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"}
          onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
          disabled={disabled}
        />
        <label className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
          <input
            type="checkbox"
            checked={useContext && Boolean(currentDocId)}
            onChange={(e) => setUseContext(e.target.checked)}
            disabled={!currentDocId || disabled}
            className="accent-white"
          />
          Use active doc context
        </label>
        <button type="submit" disabled={disabled} className="nexus-btn-primary">
          Generate
        </button>
      </form>

      {cards?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, idx) => (
            <FlipCard key={idx} front={card.front || card.question || `Card ${idx + 1}`} back={card.back || card.answer || card.explanation || ""} />
          ))}
        </div>
      ) : null}

      {!cards?.length && raw && (
        <div className="rounded-xl p-4 text-sm whitespace-pre-wrap"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          {raw}
        </div>
      )}

      {!cards?.length && !raw && (
        <div className="text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No flashcards yet. Enter a topic to generate.</div>
      )}
    </div>
  );
}

function FlipCard({ front, back }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFlipped((v) => !v)}
      className="text-left rounded-2xl p-4 shadow-lg transition-all duration-300"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
    >
      <div className="text-[10px] uppercase tracking-[0.3em] mb-2"
        style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.3)" }}
      >
        {flipped ? "Answer" : "Prompt"}
      </div>
      <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "#f0f0f0" }}>
        {flipped ? back || "No answer provided." : front || "No prompt."}
      </div>
      <div className="mt-3 text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
        {flipped ? "Tap to view question" : "Tap to reveal"}
      </div>
    </button>
  );
}
