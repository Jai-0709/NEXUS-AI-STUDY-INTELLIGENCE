import { useState } from "react";

export default function BundleTab({ data, onGenerate, loading, error }) {
  const [topic, setTopic] = useState("");
  const [useContext, setUseContext] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;
    onGenerate(topic.trim(), useContext);
  };

  return (
    <div className="max-w-6xl mx-auto min-h-[calc(100vh-160px)] pt-10 pb-16 space-y-8">
      <header className="space-y-2 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em]"
          style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.3)" }}
        >
          Collaboration Bundle
        </p>
        <p className="italic" style={{ color: "rgba(255,255,255,0.35)" }}>Generate a shareable pack: summary + flashcards + quiz + mind map.</p>
      </header>

      <form onSubmit={handleSubmit} className="rounded-2xl shadow-xl p-4 flex flex-col md:flex-row gap-3 items-center"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic (or leave blank to cancel)"
          className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#f0f0f0",
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"}
          onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
          disabled={loading}
        />
        <label className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
          <input
            type="checkbox"
            checked={useContext}
            onChange={(e) => setUseContext(e.target.checked)}
            disabled={loading}
            className="accent-white"
          />
          Use active document context
        </label>
        <button type="submit" disabled={loading} className="nexus-btn-primary">
          {loading ? "Generating..." : "Create Bundle"}
        </button>
      </form>

      {error ? <div className="text-sm text-center" style={{ color: "rgba(255,100,100,0.8)" }}>{error}</div> : null}

      {data?.summary ? (
        <section className="rounded-2xl p-5 space-y-2"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="text-[10px] uppercase tracking-[0.25em]"
            style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.5)" }}
          >
            Summary
          </div>
          <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: data.summary.replace(/\n/g, "<br>") }} />
        </section>
      ) : null}

      {Array.isArray(data?.flashcards) && data.flashcards.length ? (
        <section className="rounded-2xl p-5 space-y-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="text-[10px] uppercase tracking-[0.25em]"
            style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.5)" }}
          >
            Flashcards
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {data.flashcards.map((card, idx) => (
              <div key={idx} className="p-3 rounded-lg text-sm"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", color: "#f0f0f0" }}
              >
                <div className="font-semibold mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>{card.front}</div>
                <div className="text-sm whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.6)" }}>{card.back}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {Array.isArray(data?.quiz) && data.quiz.length ? (
        <section className="rounded-2xl p-5 space-y-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="text-[10px] uppercase tracking-[0.25em]"
            style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.5)" }}
          >
            Quiz
          </div>
          {data.quiz.map((q, idx) => (
            <div key={idx} className="p-3 rounded-lg text-sm space-y-1"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", color: "#f0f0f0" }}
            >
              <div className="font-semibold">{q.question}</div>
              <ul className="list-disc list-inside text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                {(q.options || []).map((opt, oi) => (
                  <li key={oi}>{opt}</li>
                ))}
              </ul>
              {q.answer ? <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Answer: {q.answer}</div> : null}
              {q.explanation ? <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{q.explanation}</div> : null}
            </div>
          ))}
        </section>
      ) : null}

      {data?.mindmap_svg ? (
        <section className="rounded-2xl p-5 space-y-2"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="text-[10px] uppercase tracking-[0.25em]"
            style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.5)" }}
          >
            Mind Map
          </div>
          <div className="w-full overflow-auto rounded-lg p-2"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            dangerouslySetInnerHTML={{ __html: data.mindmap_svg }}
          />
        </section>
      ) : null}
    </div>
  );
}
