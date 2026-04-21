import { useEffect, useRef, useState } from 'react';

// ── Inline markdown renderer ─────────────────────────────────────
function inlineBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={i} style={{ color: '#f5f5f5', fontWeight: 600 }}>{bold[1]}</strong>;
    return part;
  });
}

function renderLine(line, idx) {
  const h2 = line.match(/^##\s+(.*)/);
  const h3 = line.match(/^###\s+(.*)/);
  const numbered = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*(.*)/);

  if (h2) return (
    <h2 key={idx} className="text-base font-bold mt-6 mb-2 flex items-center gap-2"
      style={{ color: '#f0f0f0', fontFamily: "'Clash Display', sans-serif", letterSpacing: '0.04em' }}>
      <span className="w-1 h-4 rounded-full inline-block flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.5)' }} />
      {h2[1]}
    </h2>
  );
  if (h3) return (
    <h3 key={idx} className="text-sm font-semibold mt-3 mb-1"
      style={{ color: 'rgba(255,255,255,0.75)', fontFamily: "'Clash Display', sans-serif" }}>
      {h3[1]}
    </h3>
  );
  if (numbered) return (
    <div key={idx} className="flex items-start gap-3 mt-4 mb-1">
      <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff' }}>
        {numbered[1]}
      </span>
      <span className="text-sm font-semibold leading-relaxed" style={{ color: '#f0f0f0' }}>
        {numbered[2]}
        <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}>{numbered[3]}</span>
      </span>
    </div>
  );
  if (!line.trim()) return <div key={idx} className="h-2" />;
  return (
    <p key={idx} className="text-[13.5px] leading-relaxed mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
      {inlineBold(line)}
    </p>
  );
}

function MarkdownBlock({ text }) {
  const lines = text.split('\n');
  const elements = [];
  let listItems = [];

  const flushList = (key) => {
    if (listItems.length) {
      elements.push(<ul key={key} className="space-y-0.5 mb-2 pl-1">{listItems}</ul>);
      listItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const bullet = line.match(/^[-*]\s+(.*)/);
    if (bullet) {
      listItems.push(
        <li key={idx} className="flex items-start gap-2 text-[13.5px] leading-relaxed mb-1"
          style={{ color: 'rgba(255,255,255,0.72)' }}>
          <span className="mt-[6px] w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.3)' }} />
          <span>{inlineBold(bullet[1])}</span>
        </li>
      );
    } else {
      flushList(`ul-${idx}`);
      elements.push(renderLine(line, idx));
    }
  });
  flushList('ul-end');
  return <div>{elements}</div>;
}

// ── Main component ────────────────────────────────────────────────
export default function StudyInsightsTab({ messages, onGenerate, disabled, thinking, currentDocId }) {
  const insightRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Only show AI messages that are actual insight responses (not the welcome message)
  const insights = messages.filter(
    m => m.sender === 'ai' &&
         !m.text.includes('Generate Insights') &&
         !m.text.includes('Activate a document') &&
         !m.text.includes('click Generate')
  );
  const lastInsight = insights.at(-1) ?? null;
  const hasDoc = Boolean(currentDocId);

  useEffect(() => {
    if (lastInsight && insightRef.current) {
      insightRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [lastInsight]);

  const handleCopy = () => {
    if (!lastInsight) return;
    navigator.clipboard.writeText(lastInsight.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-4xl mx-auto min-h-[calc(100vh-180px)] pt-10 pb-24 flex flex-col gap-8 relative z-30 px-4 tab-content-enter">

      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] uppercase tracking-[0.3em] mb-3 block"
          style={{ fontFamily: "'Clash Display', sans-serif", color: 'rgba(255,255,255,0.3)' }}>
          AI Study Intelligence
        </span>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Deep document analysis — themes, concepts, exam focus &amp; knowledge gaps
        </p>
      </div>

      {/* Generate button */}
      <div className="flex justify-center">
        <button
          onClick={onGenerate}
          disabled={disabled || thinking || !hasDoc}
          className="nexus-btn-primary flex items-center gap-3"
          style={{ borderRadius: '14px', fontSize: '14px', fontWeight: 700, padding: '12px 32px' }}
        >
          <span className="material-symbols-outlined text-[18px]">
            {thinking ? 'hourglass_empty' : 'psychology'}
          </span>
          {thinking ? 'Analysing document…' : lastInsight ? 'Regenerate Insights' : 'Generate Insights'}
        </button>
      </div>

      {/* No doc warning */}
      {!hasDoc && !lastInsight && !thinking && (
        <div className="glass-card p-5 flex items-center gap-3 fade-in"
          style={{ borderColor: 'rgba(255,200,100,0.15)', background: 'rgba(255,200,100,0.04)' }}>
          <span className="material-symbols-outlined text-[20px]" style={{ color: 'rgba(255,200,100,0.6)' }}>info</span>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Upload or activate a document to enable insight generation.
          </p>
        </div>
      )}

      {/* ── Thinking skeleton ── */}
      {thinking && (
        <div className="space-y-5 fade-in">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="skeleton-shimmer w-7 h-7 rounded-full flex-shrink-0" />
                <div className="skeleton-shimmer h-4 rounded-lg" style={{ width: `${130 + i * 20}px` }} />
              </div>
              <div className="space-y-2.5">
                {Array.from({ length: 3 + (i % 2) }).map((_, j) => (
                  <div key={j}
                    className="skeleton-shimmer h-3 rounded-full"
                    style={{ width: j === 2 ? '60%' : j === 1 ? '82%' : '96%' }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Insight result ── */}
      {lastInsight && !thinking && (
        <div ref={insightRef} className="fade-in space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]" style={{ color: 'rgba(255,255,255,0.3)' }}>psychology</span>
              <span className="text-[10px] uppercase tracking-[0.25em]"
                style={{ fontFamily: "'Clash Display', sans-serif", color: 'rgba(255,255,255,0.3)' }}>
                NEXUS Analysis
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="nexus-btn-ghost flex items-center gap-1.5 text-xs"
                style={{ padding: '5px 14px' }}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={onGenerate}
                disabled={disabled || thinking || !hasDoc}
                className="nexus-btn-ghost flex items-center gap-1.5 text-xs"
                style={{ padding: '5px 14px' }}
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                Regenerate
              </button>
            </div>
          </div>

          {/* Content card */}
          <div className="glass-card p-7 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 blur-[80px] pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.015)' }} />
            <div className="relative z-10">
              <MarkdownBlock text={lastInsight.text} />
            </div>
          </div>
        </div>
      )}

      {/* ── Idle state (doc active, no insight yet) ── */}
      {!lastInsight && !thinking && hasDoc && (
        <div className="flex flex-col items-center justify-center py-12 gap-4 fade-in">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center neural-glow"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="material-symbols-outlined text-3xl" style={{ color: 'rgba(255,255,255,0.25)' }}>psychology</span>
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Click <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Generate Insights</strong> to deep-analyse your document
          </p>
        </div>
      )}

    </div>
  );
}
