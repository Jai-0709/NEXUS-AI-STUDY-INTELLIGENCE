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

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions?.length || 0;
  const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto min-h-[calc(100vh-180px)] pt-10 pb-20 flex flex-col gap-8 relative z-30 px-4 tab-content-enter">
      <div className="text-center">
        <span className="text-[10px] uppercase tracking-[0.3em] mb-3 block"
          style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.3)" }}
        >
          Quiz Generator
        </span>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Create practice quizzes with answers and explanations</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card shadow-xl p-4 flex flex-col md:flex-row gap-3 items-center">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic (e.g., Sorting Algorithms)"
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
        <input
          type="number"
          min="3"
          max="12"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          className="nexus-input w-20 rounded-xl px-3 py-2 text-sm text-center"
          disabled={disabled}
          title="Number of questions"
        />
        <button type="submit" disabled={disabled || !topic.trim()} className="nexus-btn-primary flex items-center gap-2 flex-shrink-0">
          <span className="material-symbols-outlined text-[16px]">
            {disabled ? "hourglass_empty" : "quiz"}
          </span>
          {disabled ? "Generating..." : "Generate"}
        </button>
      </form>

      {/* ── Skeleton Loading ── */}
      {disabled && !questions?.length && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="glass-card p-5"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <div className="skeleton-shimmer h-3 w-24 rounded-full mb-4" />
              <div className="skeleton-shimmer h-5 w-full rounded-lg mb-2" />
              <div className="skeleton-shimmer h-5 w-4/5 rounded-lg mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, oi) => (
                  <div key={oi} className="skeleton-shimmer h-10 w-full rounded-xl" style={{ opacity: 1 - oi * 0.15 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Progress bar (only when questions loaded and quiz active) ── */}
      {totalQuestions > 0 && !submitted && (
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPct}%`,
                background: progressPct === 100
                  ? "linear-gradient(90deg, rgba(100,255,150,0.8), rgba(100,255,180,0.6))"
                  : "linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.3))",
              }}
            />
          </div>
          <span className="text-xs font-semibold flex-shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>
            {answeredCount}/{totalQuestions}
          </span>
        </div>
      )}


      {questions?.length ? (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const selected = answers[idx];
            return (
              <div
                key={idx}
                className="glass-card p-5 card-stagger"
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-[0.3em]"
                    style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.3)" }}
                  >
                    Question {idx + 1}
                  </span>
                  {submitted && (
                    <span className="material-symbols-outlined text-[18px]"
                      style={{ color: answers[idx] === q.answer ? "rgba(100,255,150,0.8)" : "rgba(255,100,100,0.7)" }}
                    >
                      {answers[idx] === q.answer ? "check_circle" : "cancel"}
                    </span>
                  )}
                </div>
                <div className="font-semibold mb-4 whitespace-pre-wrap text-[15px]" style={{ color: "#f0f0f0" }}>
                  {q.question || "Untitled question"}
                </div>
                {Array.isArray(q.options) && q.options.length > 0 && (
                  <ul className="space-y-2">
                    {q.options.map((opt, i) => {
                      const value = opt;
                      const chosen = selected === value;
                      const correct = submitted && q.answer === value;
                      const wrong = submitted && chosen && q.answer !== value;

                      let optBg = "rgba(255,255,255,0.02)";
                      let optBorder = "rgba(255,255,255,0.06)";
                      let optColor = "rgba(255,255,255,0.75)";

                      if (chosen && !submitted) {
                        optBg = "rgba(255,255,255,0.08)";
                        optBorder = "rgba(255,255,255,0.28)";
                        optColor = "#ffffff";
                      }
                      if (correct) {
                        optBg = "rgba(100,255,150,0.08)";
                        optBorder = "rgba(100,255,150,0.3)";
                        optColor = "#ffffff";
                      }
                      if (wrong) {
                        optBg = "rgba(255,100,100,0.08)";
                        optBorder = "rgba(255,100,100,0.3)";
                        optColor = "#ffffff";
                      }

                      return (
                        <li key={i}>
                          <button
                            type="button"
                            disabled={submitted || disabled}
                            onClick={() => handleSelect(idx, value)}
                            className="quiz-option w-full text-left text-sm px-4 py-3 rounded-xl flex items-center gap-3"
                            style={{
                              background: optBg,
                              border: `1px solid ${optBorder}`,
                              color: optColor,
                            }}
                          >
                            <span
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{
                                background: chosen && !submitted ? "rgba(255,255,255,0.15)" : correct ? "rgba(100,255,150,0.15)" : wrong ? "rgba(255,100,100,0.15)" : "rgba(255,255,255,0.05)",
                                border: `1px solid ${chosen && !submitted ? "rgba(255,255,255,0.3)" : correct ? "rgba(100,255,150,0.3)" : wrong ? "rgba(255,100,100,0.3)" : "rgba(255,255,255,0.08)"}`,
                              }}
                            >
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {submitted && q.explanation && (
                  <div className="mt-4 text-sm whitespace-pre-wrap px-4 py-3 rounded-xl"
                    style={{
                      color: "rgba(255,255,255,0.6)",
                      background: "rgba(255,255,255,0.02)",
                      borderLeft: "2px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    <span className="text-[10px] uppercase tracking-wider block mb-1"
                      style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Clash Display', sans-serif" }}
                    >
                      Explanation
                    </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {questions?.length ? (
        <div className="glass-card flex items-center justify-between gap-4 px-5 py-4">
          <div className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            {submitted ? (
              <div className="flex items-center gap-3 score-reveal">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{
                    background: score === totalQuestions
                      ? "rgba(100,255,150,0.12)"
                      : score >= totalQuestions * 0.6
                        ? "rgba(255,200,100,0.12)"
                        : "rgba(255,100,100,0.12)",
                    border: `1px solid ${score === totalQuestions
                      ? "rgba(100,255,150,0.3)"
                      : score >= totalQuestions * 0.6
                        ? "rgba(255,200,100,0.3)"
                        : "rgba(255,100,100,0.3)"}`,
                    color: "#fff",
                  }}
                >
                  {score}/{totalQuestions}
                </div>
                <div>
                  <div className="font-semibold" style={{ color: "#fff" }}>
                    {score === totalQuestions ? "Perfect Score!" : score >= totalQuestions * 0.6 ? "Good job!" : "Keep practicing!"}
                  </div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {Math.round((score / totalQuestions) * 100)}% correct
                  </div>
                </div>
              </div>
            ) : (
              <span>Select an answer for each question, then submit</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!submitted && (
              <button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={disabled || answeredCount === 0}
                className="nexus-btn-primary flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">done_all</span>
                Submit
              </button>
            )}
            {submitted && (
              <button
                type="button"
                onClick={() => { setSubmitted(false); setAnswers({}); }}
                className="nexus-btn-ghost flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">replay</span>
                Retry
              </button>
            )}
          </div>
        </div>
      ) : null}

      {!questions?.length && raw && (
        <div className="glass-card p-5 text-sm whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.7)" }}>
          {raw}
        </div>
      )}

      {!questions?.length && !raw && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span className="material-symbols-outlined text-3xl" style={{ color: "rgba(255,255,255,0.2)" }}>quiz</span>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>Enter a topic above to generate a quiz</p>
        </div>
      )}
    </div>
  );
}
