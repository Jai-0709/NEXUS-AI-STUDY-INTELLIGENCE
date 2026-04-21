import { useState } from "react";

export default function MindMapVisual({ svg, onGenerate, disabled }) {
  const [topic, setTopic] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim() || disabled) return;
    onGenerate(topic.trim());
  };

  const safeSvg = svg?.trim().startsWith("<svg") ? svg : "";

  const handleDownloadSvg = () => {
    if (!safeSvg) return;
    const blob = new Blob([safeSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase() || "mindmap"}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto min-h-[calc(100vh-180px)] pt-10 pb-20 flex flex-col gap-8 relative z-30 px-4 tab-content-enter">
      <div className="text-center">
        <span className="text-[10px] uppercase tracking-[0.3em] mb-3 block"
          style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.3)" }}
        >
          Mind Map Studio
        </span>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Visual concept maps rendered as inline SVG</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card shadow-xl p-4 flex flex-col md:flex-row gap-3 items-center">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic (e.g., Supply Chain Optimization)"
          className="nexus-input flex-1 rounded-xl px-4 py-3 text-sm w-full"
          disabled={disabled}
        />
        <button type="submit" disabled={disabled || !topic.trim()} className="nexus-btn-primary flex items-center gap-2 flex-shrink-0">
          <span className="material-symbols-outlined text-[16px]">
            {disabled ? "hourglass_empty" : "account_tree"}
          </span>
          {disabled ? "Generating..." : "Generate"}
        </button>
      </form>

      {/* ── Skeleton loading state ── */}
      {disabled && !safeSvg && (
        <div className="glass-card overflow-hidden fade-in" style={{ minHeight: 420 }}>
          <div className="p-6 border-b flex items-center gap-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="skeleton-shimmer w-6 h-6 rounded-full flex-shrink-0" />
            <div className="skeleton-shimmer h-4 w-40 rounded-full" />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <span className="thinking-dot" />
              <span className="thinking-dot" />
              <span className="thinking-dot" />
            </div>
          </div>
          <div className="p-8 flex justify-center items-center" style={{ minHeight: 360 }}>
            <div className="flex flex-col items-center gap-5 w-full">
              <div className="skeleton-shimmer rounded-2xl w-full" style={{ maxWidth: 520, height: 280 }} />
              <p className="text-xs uppercase tracking-[0.2em]"
                style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.22)" }}>
                Rendering Mind Map…
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SVG Result ── */}
      {safeSvg ? (
        <div className="glass-card shadow-2xl overflow-hidden fade-in">
          {/* Toolbar */}
          <div className="px-5 py-3.5 flex items-center justify-between border-b"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
            <span className="flex items-center gap-2 text-xs"
              style={{ color: "rgba(255,255,255,0.4)" }}>
              <span className="material-symbols-outlined text-[14px]">account_tree</span>
              Mind Map · Inline SVG
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadSvg}
                className="nexus-btn-ghost flex items-center gap-1.5 text-xs"
                style={{ padding: "5px 14px" }}
              >
                <span className="material-symbols-outlined text-[14px]">download</span>
                Export SVG
              </button>
            </div>
          </div>

          <div className="w-full overflow-auto custom-scrollbar" style={{ minHeight: 420 }}>
            <div className="p-6 flex justify-center">
              <div dangerouslySetInnerHTML={{ __html: safeSvg }} />
            </div>
          </div>

          <div className="text-xs px-5 py-3.5 flex items-center gap-2 border-t"
            style={{ background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", borderColor: "rgba(255,255,255,0.06)" }}>
            <span className="material-symbols-outlined text-[14px]">info</span>
            Use browser zoom for detail · Export SVG to open in Figma, Inkscape, or any viewer
          </div>
        </div>
      ) : !disabled && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span className="material-symbols-outlined text-3xl" style={{ color: "rgba(255,255,255,0.2)" }}>account_tree</span>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>Enter a topic above to generate a mind map</p>
        </div>
      )}
    </div>
  );
}
