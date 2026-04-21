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
    <div className="max-w-5xl mx-auto min-h-[calc(100vh-180px)] pt-10 pb-20 flex flex-col gap-8 relative z-30 px-4 tab-content-enter">
      <div className="text-center">
        <span className="text-[10px] uppercase tracking-[0.3em] mb-3 block"
          style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.3)" }}
        >
          Flashcards Engine
        </span>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Generate concise study flashcards with one click</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card shadow-xl p-4 flex flex-col md:flex-row gap-3 items-center">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic (e.g., Neural Networks)"
          className="nexus-input flex-1 rounded-xl px-4 py-3 text-sm w-full"
          disabled={disabled}
        />
        <label className="flex items-center gap-2 text-xs flex-shrink-0 cursor-pointer select-none" style={{ color: "rgba(255,255,255,0.6)" }}>
          <input
            type="checkbox"
            checked={useContext && Boolean(currentDocId)}
            onChange={(e) => setUseContext(e.target.checked)}
            disabled={!currentDocId || disabled}
            className="accent-white"
          />
          Use doc context
        </label>
        <button type="submit" disabled={disabled || !topic.trim()} className="nexus-btn-primary flex items-center gap-2 flex-shrink-0">
          <span className="material-symbols-outlined text-[16px]">
            {disabled ? "hourglass_empty" : "auto_awesome"}
          </span>
          {disabled ? "Generating..." : "Generate"}
        </button>
      </form>

      {/* ── Skeleton Loading Grid ── */}
      {disabled && !cards?.length && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                minHeight: 180,
                animationDelay: `${idx * 0.05}s`,
              }}
            >
              <div className="p-5 flex flex-col gap-3 h-full">
                <div className="skeleton-shimmer h-3 w-20 rounded-full" />
                <div className="skeleton-shimmer h-4 w-full rounded-lg mt-1" />
                <div className="skeleton-shimmer h-4 w-4/5 rounded-lg" />
                <div className="skeleton-shimmer h-4 w-3/5 rounded-lg" />
                <div className="flex-1" />
                <div className="skeleton-shimmer h-3 w-28 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Cards Grid ── */}
      {cards?.length ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="card-stagger"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <FlipCard
                index={idx + 1}
                total={cards.length}
                front={card.front || card.question || `Card ${idx + 1}`}
                back={card.back || card.answer || card.explanation || ""}
              />
            </div>
          ))}
        </div>
      ) : null}

      {!cards?.length && raw && (
        <div className="glass-card p-5 text-sm whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.7)" }}>
          {raw}
        </div>
      )}

      {!cards?.length && !raw && !disabled && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span className="material-symbols-outlined text-3xl" style={{ color: "rgba(255,255,255,0.2)" }}>style</span>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>Enter a topic above to generate flashcards</p>
        </div>
      )}
    </div>
  );
}

function FlipCard({ front, back, index, total }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className={`flip-card ${flipped ? "flipped" : ""}`}
      onClick={() => setFlipped((v) => !v)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setFlipped((v) => !v); }}
      aria-label={`Flashcard ${index} of ${total}. ${flipped ? "Showing answer" : "Showing question"}. Click to flip.`}
    >
      <div className="flip-card-inner">
        <div className="flip-card-front">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[0.3em]"
                style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.3)" }}
              >
                Question
              </span>
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>{index}/{total}</span>
            </div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "#f0f0f0" }}>
              {front || "No prompt."}
            </div>
          </div>
          <div className="mt-4 text-[11px] flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            <span className="material-symbols-outlined text-[14px]">touch_app</span>
            Tap to reveal answer
          </div>
        </div>
        <div className="flip-card-back">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[0.3em]"
                style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.5)" }}
              >
                Answer
              </span>
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{index}/{total}</span>
            </div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "#f4f4f4" }}>
              {back || "No answer provided."}
            </div>
          </div>
          <div className="mt-4 text-[11px] flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            <span className="material-symbols-outlined text-[14px]">replay</span>
            Tap to view question
          </div>
        </div>
      </div>
    </div>
  );
}
