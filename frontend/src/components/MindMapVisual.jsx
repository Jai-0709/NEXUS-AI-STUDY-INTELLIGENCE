import { useState } from "react";

export default function MindMapVisual({ svg, onGenerate, disabled }) {
  const [topic, setTopic] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim() || disabled) return;
    onGenerate(topic.trim());
  };

  const safeSvg = svg?.trim().startsWith("<svg") ? svg : "";

  return (
    <div className="max-w-6xl mx-auto min-h-[calc(100vh-180px)] pt-10 pb-20 flex flex-col gap-8 relative z-30">
      <div className="text-center fade-in">
        <span className="text-[10px] uppercase tracking-[0.3em] mb-3 block"
          style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.3)" }}
        >
          Mind Map (SVG)
        </span>
        <p className="italic" style={{ color: "rgba(255,255,255,0.35)" }}>"Visual concept maps rendered as inline SVG."</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl shadow-xl p-4 flex flex-col md:flex-row gap-3 items-center"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic (e.g., Supply Chain Optimization)"
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
        <button type="submit" disabled={disabled} className="nexus-btn-primary">
          Generate
        </button>
      </form>

      {safeSvg ? (
        <div className="rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="w-full overflow-auto" style={{ minHeight: 420 }}>
            <div className="p-4 flex justify-center">
              <div className="shadow-md" dangerouslySetInnerHTML={{ __html: safeSvg }} />
            </div>
          </div>
          <div className="text-xs px-4 py-3 flex items-center justify-between"
            style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)" }}
          >
            <span>Rendered inline SVG • Use zoom in browser for details</span>
          </div>
        </div>
      ) : (
        <div className="text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No mind map yet. Enter a topic to generate.</div>
      )}
    </div>
  );
}
