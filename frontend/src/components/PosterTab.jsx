import { useRef, useState } from "react";

const STYLES = [
  { id: "modern", label: "Modern", icon: "dashboard", desc: "Dark minimal" },
  { id: "academic", label: "Academic", icon: "school", desc: "Classic clean" },
  { id: "creative", label: "Creative", icon: "palette", desc: "Vibrant bold" },
  { id: "infographic", label: "Infographic", icon: "analytics", desc: "Data-driven" },
  { id: "neon", label: "Neon", icon: "fluorescent", desc: "Cyberpunk glow" },
];

export default function PosterTab({ onGenerate, disabled }) {
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("modern");
  const [posterHtml, setPosterHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const posterRef = useRef(null);

  const handleGenerate = async () => {
    if (!topic.trim() || disabled || loading) return;
    setError("");
    setLoading(true);
    setPosterHtml("");
    try {
      const result = await onGenerate(topic.trim(), style);
      if (result?.html) {
        setPosterHtml(result.html);
      } else {
        setError("No poster was generated. Try again.");
      }
    } catch (err) {
      setError(err?.message || "Poster generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleGenerate();
  };

  const handleDownload = () => {
    if (!posterHtml) return;
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${topic} — NEXUS Poster</title>
<style>
  body { margin: 0; padding: 40px 20px; background: #0a0a0f; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; display: flex; justify-content: center; }
</style>
</head>
<body>
${posterHtml}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}-poster.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto min-h-[calc(100vh-180px)] pt-10 pb-20 flex flex-col gap-8 relative z-30 px-4 tab-content-enter">
      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] uppercase tracking-[0.3em] mb-3 block"
          style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.3)" }}
        >
          AI Poster Studio
        </span>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          Generate beautiful study posters on any topic
        </p>
      </div>

      {/* Topic Input */}
      <form onSubmit={handleSubmit} className="glass-card shadow-xl p-5 flex flex-col gap-5">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic (e.g., Machine Learning Fundamentals)"
            className="nexus-input flex-1 rounded-xl px-4 py-3 text-sm"
            disabled={disabled || loading}
          />
          <button
            type="submit"
            disabled={disabled || loading || !topic.trim()}
            className="nexus-btn-primary flex items-center justify-center gap-2 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">
              {loading ? "hourglass_empty" : "brush"}
            </span>
            {loading ? "Generating..." : "Generate Poster"}
          </button>
        </div>

        {/* Style Selector */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-[0.2em]"
            style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.35)" }}
          >
            Poster Style
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                disabled={loading}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-200"
                style={{
                  background: style === s.id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.02)",
                  border: style === s.id ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: style === s.id ? "0 4px 20px rgba(255,255,255,0.08)" : "none",
                }}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ color: style === s.id ? "#ffffff" : "rgba(255,255,255,0.35)" }}
                >
                  {s.icon}
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: style === s.id ? "#ffffff" : "rgba(255,255,255,0.5)" }}
                >
                  {s.label}
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: style === s.id ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)" }}
                >
                  {s.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="text-sm rounded-xl px-5 py-4 flex items-center gap-3 error-toast"
          style={{ color: "#ff8888", background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.15)" }}
        >
          <span className="material-symbols-outlined" style={{ color: "#ff6666" }}>error</span>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && !posterHtml && (
        <div className="flex flex-col items-center justify-center py-16 gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center neural-glow"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span className="material-symbols-outlined text-4xl nexus-pulse" style={{ color: "rgba(255,255,255,0.4)" }}>brush</span>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>Creating your poster...</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>This may take a few seconds</p>
          </div>
          <div className="flex gap-2">
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-dot" />
          </div>
        </div>
      )}

      {/* Poster Display */}
      {posterHtml && (
        <div className="fade-in">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.2em]"
                style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.3)" }}
              >
                Generated Poster
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "capitalize",
                }}
              >
                {style}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="nexus-btn-ghost flex items-center gap-1.5 text-xs"
                style={{ padding: "6px 14px" }}
              >
                <span className="material-symbols-outlined text-[14px]">download</span>
                Download HTML
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="nexus-btn-ghost flex items-center gap-1.5 text-xs"
                style={{ padding: "6px 14px" }}
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                Regenerate
              </button>
            </div>
          </div>

          {/* Poster Frame */}
          <div
            ref={posterRef}
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: "rgba(10,10,15,0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="poster-render p-6 md:p-10"
              dangerouslySetInnerHTML={{ __html: posterHtml }}
            />
          </div>

          {/* Footer */}
          <div className="text-center mt-4">
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
              Generated by NEXUS AI • Right-click the poster to save as image, or use the download button for the HTML file
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!posterHtml && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span className="material-symbols-outlined text-3xl" style={{ color: "rgba(255,255,255,0.2)" }}>image</span>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
            Enter a topic and choose a style to generate a poster
          </p>
        </div>
      )}
    </div>
  );
}
