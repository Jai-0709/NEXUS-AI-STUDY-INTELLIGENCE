import React from 'react';

export default function StudyInsightsTab({ messages, onGenerate, disabled, thinking, currentDocId }) {
  const loading = disabled || thinking;
  const aiMessages = messages.filter(m => m.sender === "ai" && !m.text.includes("Chat cleared."));
  const lastInsight = aiMessages.length > 0 ? aiMessages[aiMessages.length - 1] : null;

  return (
    <>
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)] relative z-30 pt-10 pb-32">
        <div className="text-center mb-10 w-full fade-in">
          <span className="text-[10px] uppercase tracking-[0.3em] mb-4 block"
            style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.3)" }}
          >
            Analytical Engine v1.0
          </span>
          <p className="italic" style={{ color: "rgba(255,255,255,0.35)" }}>"Extract comprehensive study insights from context."</p>
        </div>

        <div className="w-full flex justify-center mb-10 fade-in">
          <button 
            onClick={onGenerate} 
            disabled={loading || !currentDocId}
            className="px-8 py-3 rounded-full uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.8)",
              fontFamily: "'Clash Display', sans-serif",
              fontSize: "12px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span className="material-symbols-outlined text-lg rounded-full p-1"
              style={{ border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.04)" }}
            >
              psychology
            </span>
            {thinking ? "Analyzing document..." : "Generate Insights"}
          </button>
        </div>

        {lastInsight && (
          <div className="w-full rounded-2xl p-8 shadow-2xl relative overflow-hidden group fade-in"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 blur-[80px]" style={{ background: "rgba(255,255,255,0.02)" }} />
            
            <article className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed relative z-10"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              {lastInsight.text}
            </article>
          </div>
        )}
      </div>
    </>
  );
}
