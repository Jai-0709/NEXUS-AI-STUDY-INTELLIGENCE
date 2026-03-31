import { useEffect, useState } from "react";

export default function QuizTab({ questions, raw, onGenerate, disabled, currentDocId, version = 0 }) {
  const [topic, setTopic] = useState("");
  const [useContext, setUseContext] = useState(true);
  const [count, setCount] = useState(5);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Reset selections when a new quiz is generated
  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
  }, [version]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim() || disabled) return;
    const safeCount = Math.max(3, Math.min(Number(count) || 5, 12));
    onGenerate(topic.trim(), useContext && Boolean(currentDocId), safeCount);
  };

  const handleSelect = (qIdx, option) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: option }));
  };

  const handleSubmitQuiz = () => {
    if (!questions?.length) return;
    setSubmitted(true);
  };

  const score = submitted
    ? questions.reduce((acc, q, idx) => acc + (answers[idx] === q.answer ? 1 : 0), 0)
    : 0;

  return (
    <div className="max-w-5xl mx-auto min-h-[calc(100vh-180px)] pt-10 pb-20 flex flex-col gap-8 relative z-30">
      <div className="text-center fade-in">
        <span className="text-[10px] uppercase tracking-[0.3em] mb-3 block"
          style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.3)" }}
        >
          Quiz Generator
        </span>
        <p className="italic" style={{ color: "rgba(255,255,255,0.35)" }}>"Create quick practice quizzes with answers and explanations."</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl shadow-xl p-4 flex flex-col md:flex-row gap-3 items-center"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic (e.g., Sorting Algorithms)"
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
        <input
          type="number"
          min="3"
          max="12"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          className="w-20 rounded-xl px-3 py-2 text-sm focus:outline-none transition-all"
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

      {questions?.length ? (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const selected = answers[idx];
            return (
              <div key={idx} className="rounded-2xl p-4 shadow-lg"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="text-[10px] uppercase tracking-[0.3em] mb-2"
                  style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.3)" }}
                >
                  Question {idx + 1}
                </div>
                <div className="font-semibold mb-3 whitespace-pre-wrap" style={{ color: "#f0f0f0" }}>
                  {q.question || "Untitled question"}
                </div>
                {Array.isArray(q.options) && q.options.length > 0 && (
                  <ul className="space-y-2">
                    {q.options.map((opt, i) => {
                      const value = opt;
                      const chosen = selected === value;
                      const correct = submitted && q.answer === value;
                      const wrong = submitted && chosen && q.answer !== value;

                      let optStyle = {
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.75)",
                      };
                      if (chosen && !submitted) {
                        optStyle = {
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.25)",
                          color: "#ffffff",
                        };
                      }
                      if (correct) {
                        optStyle = {
                          background: "rgba(100,255,150,0.08)",
                          border: "1px solid rgba(100,255,150,0.3)",
                          color: "#ffffff",
                        };
                      }
                      if (wrong) {
                        optStyle = {
                          background: "rgba(255,100,100,0.08)",
                          border: "1px solid rgba(255,100,100,0.3)",
                          color: "#ffffff",
                        };
                      }

                      return (
                        <li key={i}>
                          <button
                            type="button"
                            disabled={submitted || disabled}
                            onClick={() => handleSelect(idx, value)}
                            className="w-full text-left text-sm px-3 py-2 rounded-lg transition-all duration-200"
                            style={optStyle}
                            onMouseEnter={(e) => {
                              if (!chosen && !submitted) e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                            }}
                            onMouseLeave={(e) => {
                              if (!chosen && !submitted) e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                            }}
                          >
                            {String.fromCharCode(65 + i)}. {opt}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {submitted && q.explanation && (
                  <div className="mt-2 text-sm whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.45)" }}>{q.explanation}</div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {questions?.length ? (
        <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            {submitted ? (
              <span className="font-semibold" style={{ color: "#ffffff" }}>Score: {score}/{questions.length}</span>
            ) : (
              "Select an option for each question, then submit to see your score."
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmitQuiz}
              disabled={submitted || disabled || !questions.length}
              className="nexus-btn-primary"
            >
              Submit
            </button>
            {submitted && (
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="nexus-btn-ghost"
              >
                Review
              </button>
            )}
          </div>
        </div>
      ) : null}

      {!questions?.length && raw && (
        <div className="rounded-xl p-4 text-sm whitespace-pre-wrap"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}
        >
          {raw}
        </div>
      )}

      {!questions?.length && !raw && (
        <div className="text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No quiz yet. Enter a topic to generate.</div>
      )}
    </div>
  );
}
