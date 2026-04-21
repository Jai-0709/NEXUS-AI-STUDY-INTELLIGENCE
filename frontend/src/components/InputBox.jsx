import { useRef, useState, useEffect, useCallback } from "react";

const SpeechRecognition = typeof window !== "undefined"
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

export default function InputBox({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [micSupported] = useState(!!SpeechRecognition);
  const textRef = useRef(null);
  const recognitionRef = useRef(null);

  const resize = () => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, 200);
    el.style.height = `${next}px`;
  };

  // Initialize speech recognition
  useEffect(() => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interim = transcript;
        }
      }
      setValue(finalTranscript + interim);
      requestAnimationFrame(resize);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Preserve final transcript
      if (finalTranscript.trim()) {
        setValue(finalTranscript.trim());
      }
      finalTranscript = "";
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch (e) { /* ignore */ }
    };
  }, []);

  const toggleMic = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;

    if (isListening) {
      rec.stop();
      setIsListening(false);
    } else {
      // Reset for new session
      setValue("");
      try {
        rec.start();
        setIsListening(true);
      } catch (e) {
        // Already started
        try { rec.stop(); } catch (e2) { /* ignore */ }
        setTimeout(() => {
          try {
            rec.start();
            setIsListening(true);
          } catch (e3) {
            console.warn("Could not start recognition:", e3);
          }
        }, 200);
      }
    }
  }, [isListening]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    // Stop mic if listening
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e2) { /* ignore */ }
      setIsListening(false);
    }
    onSend(value);
    setValue("");
    requestAnimationFrame(resize);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    requestAnimationFrame(resize);
  };

  return (
    <div className="w-full relative z-20">
      <form onSubmit={handleSubmit} className="w-full flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
        <div className="flex-1 flex flex-col gap-2">
          <div className="relative">
            <textarea
              ref={textRef}
              className="nexus-input w-full resize-none rounded-xl px-4 py-3 pr-12 text-sm custom-scrollbar"
              style={{
                fontFamily: "'Satoshi', sans-serif",
                lineHeight: 1.5,
                minHeight: "52px",
                maxHeight: "200px",
              }}
              placeholder={isListening ? "Listening... speak now" : "Ask a question, or click the mic to use your voice..."}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              aria-label="Chat input"
            />

            {/* Mic button inside textarea */}
            {micSupported && (
              <button
                type="button"
                onClick={toggleMic}
                disabled={disabled}
                className="absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: isListening ? "rgba(255,80,80,0.15)" : "rgba(255,255,255,0.05)",
                  border: isListening ? "1px solid rgba(255,80,80,0.4)" : "1px solid rgba(255,255,255,0.1)",
                  color: isListening ? "#ff5050" : "rgba(255,255,255,0.4)",
                }}
                title={isListening ? "Stop listening" : "Start voice input"}
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
              >
                <span className={`material-symbols-outlined text-[18px] ${isListening ? "nexus-pulse" : ""}`}>
                  {isListening ? "mic" : "mic_none"}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] gap-3 flex-wrap px-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            <span>
              {isListening ? (
                <span className="flex items-center gap-1.5" style={{ color: "rgba(255,80,80,0.8)" }}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "rgba(255,80,80,0.6)" }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#ff5050" }} />
                  </span>
                  Listening — speak now, then send
                </span>
              ) : (
                "Enter to send · Shift+Enter for newline"
              )}
            </span>
            {value.length > 0 && (
              <span style={{ color: value.length > 1800 ? "rgba(255,130,130,0.8)" : "rgba(255,255,255,0.3)" }}>
                {value.length}/2000
              </span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="nexus-btn-primary h-fit w-full sm:w-auto self-stretch sm:self-start flex items-center justify-center gap-2"
          style={{ padding: "12px 24px", minHeight: "48px" }}
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
          Send
        </button>
      </form>
    </div>
  );
}
