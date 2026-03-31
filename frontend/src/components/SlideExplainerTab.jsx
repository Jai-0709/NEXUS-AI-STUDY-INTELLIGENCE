import { useRef } from "react";

export default function SlideExplainerTab({ data, onUpload, loading, error }) {
  const fileInput = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file && onUpload) onUpload(file);
    e.target.value = "";
  };

  return (
    <div className="max-w-5xl mx-auto min-h-[calc(100vh-160px)] pt-10 pb-16 space-y-8">
      <header className="space-y-2 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em]"
          style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.3)" }}
        >
          Slide / Image Explainer
        </p>
        <p className="italic" style={{ color: "rgba(255,255,255,0.35)" }}>Upload a slide/image → OCR → notes + flashcards + quiz.</p>
      </header>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={loading}
          className="nexus-btn-primary"
        >
          {loading ? "Processing..." : "Upload Slide (PNG/JPG)"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/png, image/jpeg"
          className="hidden"
          onChange={handleFile}
          disabled={loading}
        />
      </div>

      {error ? (
        <div className="text-sm text-center" style={{ color: "rgba(255,100,100,0.8)" }}>{error}</div>
      ) : null}

      {data?.ocr_text ? (
        <div className="rounded-xl p-4 text-xs whitespace-pre-wrap"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
        >
          <div className="text-[10px] uppercase tracking-[0.25em] mb-1"
            style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.5)" }}
          >
            OCR Text
          </div>
          {data.ocr_text || ""}
        </div>
      ) : null}

      {data?.notes ? (
        <div className="rounded-xl p-5 space-y-2"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#f0f0f0" }}
        >
          <div className="text-[10px] uppercase tracking-[0.25em]"
            style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.5)" }}
          >
            Notes
          </div>
          <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: data.notes.replace(/\n/g, "<br>") }} />
        </div>
      ) : null}

      {Array.isArray(data?.flashcards) && data.flashcards.length ? (
        <div className="rounded-xl p-5 space-y-3"
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
                <div style={{ color: "rgba(255,255,255,0.6)" }}>{card.back}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {Array.isArray(data?.quiz) && data.quiz.length ? (
        <div className="rounded-xl p-5 space-y-4"
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
        </div>
      ) : null}
    </div>
  );
}
