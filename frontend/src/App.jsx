import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import InputBox from "./components/InputBox.jsx";
import FlashcardsTab from "./components/FlashcardsTab.jsx";
import QuizTab from "./components/QuizTab.jsx";
import MindMapVisual from "./components/MindMapVisual.jsx";
import PosterTab from "./components/PosterTab.jsx";
import IntroScreen from "./components/IntroScreen.jsx";
import StudyInsightsTab from "./components/StudyInsightsTab.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const TAB_GROUPS = [
  {
    title: "Chat",
    items: [
      { id: "doc", label: "Document QA" },
      { id: "general", label: "General AI" },
      { id: "role", label: "AI Roles" },
    ],
  },
  {
    title: "Study Tools",
    items: [
      { id: "summarize", label: "Summaries" },
      { id: "flashcards", label: "Flashcards" },
      { id: "quiz", label: "Quiz" },
      { id: "mindmap", label: "Mind Map" },
      { id: "poster", label: "Poster" },
      { id: "insights", label: "AI Insights" },
    ],
  },
  {
    title: "Media",
    items: [{ id: "media", label: "Media" }],
  },
];

const MOBILE_QUICK_TABS = [
  { id: "doc", label: "Chat" },
  { id: "summarize", label: "Study" },
  { id: "media", label: "Media" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("doc");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [shellVisible, setShellVisible] = useState(false);
  const appShellRef = useRef(null);

  // Listen for the intro being fully scrolled away
  useEffect(() => {
    const onIntroHidden = () => setShellVisible(true);
    window.addEventListener("nexus-intro-hidden", onIntroHidden);

    // Also check on scroll for when user scrolls back up
    const onScroll = () => {
      const scrollY = window.scrollY;
      const threshold = window.innerHeight * 0.35;
      if (scrollY >= threshold && !shellVisible) {
        setShellVisible(true);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("nexus-intro-hidden", onIntroHidden);
      window.removeEventListener("scroll", onScroll);
    };
  }, [shellVisible]);

  const handleExplore = () => {
    appShellRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const jumpToTab = (id) => {
    setActiveTab(id);
    setMobileSidebarOpen(false);
    appShellRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };


  const [messagesDoc, setMessagesDoc] = useState([
    { id: "welcome-doc", sender: "ai", text: "Upload a PDF, then ask any question about it." },
  ]);
  const [messagesGeneral, setMessagesGeneral] = useState([
    { id: "welcome-general", sender: "ai", text: "Ask me anything." },
  ]);
  const [messagesRole, setMessagesRole] = useState([
    { id: "welcome-role", sender: "ai", text: "Select a role (Tutor/Researcher/Summarizer) and ask." },
  ]);
  const [messagesSummaries, setMessagesSummaries] = useState([
    { id: "welcome-sum", sender: "ai", text: "Get concise summaries or revision bullets." },
  ]);
  const [messagesMedia, setMessagesMedia] = useState([
    { id: "welcome-media", sender: "ai", text: "Upload audio to transcribe or images to OCR + summarize." },
  ]);
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardsRaw, setFlashcardsRaw] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizRaw, setQuizRaw] = useState("");
  const [quizVersion, setQuizVersion] = useState(0);
  const [insightsMessages, setInsightsMessages] = useState([
    { id: "welcome-insights", sender: "ai", text: "Activate a document, then click Generate Insights to extract key study intelligence." },
  ]);
  const [insightsThinking, setInsightsThinking] = useState(false);
  const [mindMapSvg, setMindMapSvg] = useState("");
  const [fileName, setFileName] = useState("");
  const [documents, setDocuments] = useState([]);
  const [currentDocId, setCurrentDocId] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const [rolePersona, setRolePersona] = useState("tutor");
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesDoc, messagesGeneral, messagesRole, messagesSummaries, messagesMedia, activeTab, thinking]);

  // Auto-dismiss errors after 6 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 6000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/documents`);
      const docs = res.data.documents || [];
      setDocuments(docs);
      setCurrentDocId(res.data.active_id || "");
      const activeDoc = docs.find((d) => d.id === res.data.active_id);
      setFileName(activeDoc?.file_name || "");
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  const handleUpload = async (file) => {
    setError("");
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchDocuments();
      setFileName(file.name);
      setMessagesDoc([{ id: "welcome-doc", sender: "ai", text: "File received. Ask me anything about it." }]);
      setMobileSidebarOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (text) => {
    setError("");
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!currentDocId && documents.length === 0) {
      setError("Please upload or activate a document before asking questions.");
      return;
    }

    const userMsg = { id: crypto.randomUUID(), sender: "user", text: trimmed };
    setMessagesDoc((prev) => [...prev, userMsg]);
    setLoading(true);
    setThinking(true);

    try {
      const res = await axios.post(`${API_BASE}/ask`, { question: trimmed });
      const answerText = res.data.answer || "I don't know.";
      const aiMsg = { id: crypto.randomUUID(), sender: "ai", text: answerText };
      setMessagesDoc((prev) => [...prev, aiMsg]);
      setCurrentDocId(res.data.doc_id || currentDocId);
      setFileName(res.data.file_name || fileName);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
      setThinking(false);
    }
  };

  const handleClear = () => {
    if (activeTab === "doc") {
      setMessagesDoc([{ id: "welcome-doc", sender: "ai", text: "Chat cleared. Ask about your current PDF." }]);
    } else if (activeTab === "general") {
      setMessagesGeneral([{ id: "welcome-general", sender: "ai", text: "Chat cleared. Ask me anything." }]);
    } else if (activeTab === "role") {
      setMessagesRole([{ id: "welcome-role", sender: "ai", text: "Select a role and ask." }]);
    } else if (activeTab === "summarize") {
      setMessagesSummaries([{ id: "welcome-sum", sender: "ai", text: "Ready to summarize or bullet key points." }]);
    } else if (activeTab === "flashcards") {
      setFlashcards([]);
      setFlashcardsRaw("");
    } else if (activeTab === "quiz") {
      setQuizQuestions([]);
      setQuizRaw("");
    } else if (activeTab === "mindmap") {
      setMindMapSvg("");
    } else if (activeTab === "poster") {
      // PosterTab manages its own state
    } else if (activeTab === "insights") {
      setInsightsMessages([{ id: "welcome-insights", sender: "ai", text: "Activate a document, then click Generate Insights." }]);
    } else if (activeTab === "media") {
      setMessagesMedia([{ id: "welcome-media", sender: "ai", text: "Chat cleared. Upload audio (transcribe) or image (OCR)." }]);
    }
    setError("");
  };

  const handleSendGeneral = async (text) => {
    setError("");
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg = { id: crypto.randomUUID(), sender: "user", text: trimmed };
    setMessagesGeneral((prev) => [...prev, userMsg]);
    setThinking(true);

    try {
      const res = await axios.post(`${API_BASE}/chat/general`, { question: trimmed });
      const aiMsg = { id: crypto.randomUUID(), sender: "ai", text: res.data.answer || "I don't know." };
      setMessagesGeneral((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong.");
    } finally {
      setThinking(false);
    }
  };

  const handleRoleChat = async (text, role) => {
    setError("");
    const trimmed = text.trim();
    if (!trimmed) return;
    const persona = role || "tutor";

    const userMsg = { id: crypto.randomUUID(), sender: "user", text: `[${persona}] ${trimmed}` };
    setMessagesRole((prev) => [...prev, userMsg]);
    setThinking(true);

    try {
      const res = await axios.post(`${API_BASE}/chat/role`, { role: persona, question: trimmed });
      const aiMsg = { id: crypto.randomUUID(), sender: "ai", text: res.data.answer || "I don't know." };
      setMessagesRole((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err.response?.data?.detail || "Role chat failed.");
    } finally {
      setThinking(false);
    }
  };

  const handleSummarize = async (mode = "summary") => {
    setError("");
    if (!currentDocId && documents.length === 0) {
      setError("Please upload or activate a document before running tools.");
      return;
    }
    setThinking(true);
    try {
      const res = await axios.post(`${API_BASE}/summarize`, { mode });
      const aiMsg = { id: crypto.randomUUID(), sender: "ai", text: res.data.answer || "No result." };
      setMessagesSummaries((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err.response?.data?.detail || "Summary failed.");
    } finally {
      setThinking(false);
    }
  };

  const handleFlashcards = async (topic, useContext = true, count = 8) => {
    setError("");
    setLoading(true);
    setThinking(true);
    setFlashcards([]);
    setFlashcardsRaw("");

    try {
      const res = await axios.post(`${API_BASE}/flashcards`, { topic, use_context: useContext, count });
      if (Array.isArray(res.data.cards)) {
        setFlashcards(res.data.cards);
      } else {
        setFlashcards([]);
      }
      setFlashcardsRaw(res.data.raw || "");
    } catch (err) {
      setError(err.response?.data?.detail || "Flashcard generation failed.");
      setFlashcards([]);
    } finally {
      setThinking(false);
      setLoading(false);
    }
  };

  const handleQuiz = async (topic, useContext = true, count = 5) => {
    setError("");
    setLoading(true);
    setThinking(true);
    setQuizQuestions([]);
    setQuizRaw("");

    try {
      const res = await axios.post(`${API_BASE}/quiz`, { topic, use_context: useContext, count });
      if (Array.isArray(res.data.questions)) {
        setQuizQuestions(res.data.questions);
        setQuizVersion((v) => v + 1);
      } else {
        setQuizQuestions([]);
      }
      setQuizRaw(res.data.raw || "");
    } catch (err) {
      setError(err.response?.data?.detail || "Quiz generation failed.");
      setQuizQuestions([]);
    } finally {
      setThinking(false);
      setLoading(false);
    }
  };

  const handleInsights = async () => {
    setError("");
    if (!currentDocId && documents.length === 0) {
      setError("Please upload or activate a document before generating insights.");
      return;
    }
    setInsightsThinking(true);
    try {
      const res = await axios.post(`${API_BASE}/insights`, { k: 6 });
      const aiMsg = { id: crypto.randomUUID(), sender: "ai", text: res.data.answer || "No insights generated." };
      setInsightsMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err.response?.data?.detail || "Insights generation failed.");
    } finally {
      setInsightsThinking(false);
    }
  };

  const handleMindMapVisual = async (topic) => {
    setError("");
    setLoading(true);
    setThinking(true);
    setMindMapSvg("");

    try {
      const res = await axios.post(`${API_BASE}/mind-map/visual`, { topic });
      setMindMapSvg(res.data.svg || "");
    } catch (err) {
      setError(err.response?.data?.detail || "Mind map generation failed.");
    } finally {
      setThinking(false);
      setLoading(false);
    }
  };

  const handlePoster = async (topic, style = "modern") => {
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/poster`, { topic, style });
      return { html: res.data.html || "" };
    } catch (err) {
      setError(err.response?.data?.detail || "Poster generation failed.");
      return null;
    }
  };

  const handleTranscribeAudio = async (file) => {
    setError("");
    if (!file) return;

    const userMsg = { id: crypto.randomUUID(), sender: "user", text: `Audio uploaded: ${file.name}` };
    setMessagesMedia((prev) => [...prev, userMsg]);
    setThinking(true);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/transcribe-audio`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const aiMsg = { id: crypto.randomUUID(), sender: "ai", text: res.data.transcript || "No transcript." };
      setMessagesMedia((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err.response?.data?.detail || "Transcription failed.");
    } finally {
      setThinking(false);
      setLoading(false);
    }
  };

  const handleImageToText = async (file) => {
    setError("");
    if (!file) return;

    const userMsg = { id: crypto.randomUUID(), sender: "user", text: `Image uploaded: ${file.name}` };
    setMessagesMedia((prev) => [...prev, userMsg]);
    setThinking(true);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/image-to-text?analyze=true`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const extracted = res.data.text || "No text detected.";
      const analysis = res.data.analysis || extracted;
      const aiMsg = { id: crypto.randomUUID(), sender: "ai", text: `Extracted Text:\n${extracted}\n\nAnalysis:\n${analysis}` };
      setMessagesMedia((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err.response?.data?.detail || "Image analysis failed.");
    } finally {
      setThinking(false);
      setLoading(false);
    }
  };

  const messagesForTab = () => {
    switch (activeTab) {
      case "doc":
        return messagesDoc;
      case "general":
        return messagesGeneral;
      case "role":
        return messagesRole;
      case "summarize":
        return messagesSummaries;
      case "media":
        return messagesMedia;
      default:
        return messagesDoc;
    }
  };

  const handleActivateDoc = async (docId) => {
    if (!docId) return;
    setError("");
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/documents/${docId}/activate`);
      setCurrentDocId(res.data.doc_id);
      setFileName(res.data.file_name || "");
      setMessagesDoc([{ id: "welcome-doc", sender: "ai", text: "Switched document. Ask about it." }]);
      setMobileSidebarOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not activate document.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshDocs = () => fetchDocuments();

  const handleDeleteDoc = async (docId) => {
    if (!docId) return;
    setError("");
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/documents/${docId}`);
      await fetchDocuments();

      if (docId === currentDocId) {
        setCurrentDocId("");
        setFileName("");
        setMessagesDoc([{ id: "welcome-doc", sender: "ai", text: "Document deleted. Upload or activate another." }]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Could not delete document.");
    } finally {
      setLoading(false);
    }
  };

  const needsChatWindow = ["doc", "general", "role", "summarize", "media"].includes(activeTab);
  const isInsightsTab = activeTab === "insights";
  const mainScrollClass = needsChatWindow ? "overflow-hidden" : "overflow-y-auto";
  const handleSelectTab = (id) => {
    setActiveTab(id);
    setMobileSidebarOpen(false);
  };

  return (
    <div>
      <section className="h-screen">
        <IntroScreen onExplore={handleExplore} />
      </section>

      <section
        ref={appShellRef}
        className={`app-shell min-h-screen relative text-sm ${shellVisible ? 'app-shell-visible' : 'app-shell-hidden'}`}
        style={{ fontFamily: "'Satoshi', sans-serif", color: "var(--nx-text)", background: "var(--nx-bg)" }}
      >
        <Sidebar
          activeTab={activeTab}
          fileName={fileName}
          loading={loading}
          documents={documents}
          currentDocId={currentDocId}
          onUpload={handleUpload}
          onClear={handleClear}
          onActivate={handleActivateDoc}
          onRefresh={handleRefreshDocs}
          onDelete={handleDeleteDoc}
          onSelectTab={handleSelectTab}
          tabGroups={TAB_GROUPS}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {mobileSidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close menu overlay"
          />
        )}

        <header className="fixed top-0 left-0 md:left-[260px] right-0 z-40 border-b"
          style={{
            background: "rgba(5, 5, 8, 0.88)",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(255, 255, 255, 0.12)",
            boxShadow: "0 12px 48px rgba(255, 255, 255, 0.14)",
          }}
        >
          {/* Global top progress bar */}
          {(loading || insightsThinking) && (
            <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden z-50">
              <div className="top-progress-bar" />
            </div>
          )}

          <div className="flex justify-between items-center px-4 md:px-10 py-3 md:py-5">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen((prev) => !prev)}
                className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "#fff",
                  background: "rgba(255,255,255,0.06)",
                }}
                aria-label="Toggle navigation menu"
              >
                <span className="material-symbols-outlined text-[20px]">menu</span>
              </button>

              <div className="hidden md:flex items-center gap-3">
                {[
                  { id: "doc", label: "Chat" },
                  { id: "summarize", label: "Study Tools" },
                  { id: "media", label: "Media" },
                ].map((item) => {
                  const studyTabs = ["summarize", "flashcards", "quiz", "mindmap", "poster"];
                  const isActive = activeTab === item.id || (item.id === "summarize" && studyTabs.includes(activeTab));
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => jumpToTab(item.id)}
                      className="px-5 py-2.5 rounded-full text-sm font-semibold uppercase tracking-widest transition-all duration-200 glow-ripple"
                      style={{
                        fontFamily: "'Clash Display', sans-serif",
                        background: isActive ? "linear-gradient(120deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08))" : "rgba(255,255,255,0.04)",
                        border: isActive ? "1px solid rgba(255,255,255,0.48)" : "1px solid rgba(255,255,255,0.08)",
                        color: isActive ? "#f8f9ff" : "rgba(255,255,255,0.72)",
                        boxShadow: isActive ? "0 10px 30px rgba(255,255,255,0.22)" : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                        }
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/Jai-0709"
                target="_blank"
                rel="noreferrer"
                className="hidden md:inline-flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200"
                style={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "#ffffff",
                  background: "rgba(255,255,255,0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.24)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                }}
                aria-label="GitHub Profile"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 2c-5.5 0-10 4.5-10 10 0 4.4 2.9 8.1 6.9 9.4.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-.9-.9-1.1-.9-1.1-.8-.6.1-.6.1-.6.9.1 1.4 1 1.4 1 .8 1.4 2.2 1 2.7.8.1-.6.3-1 .5-1.2-2.2-.3-4.5-1.1-4.5-5 0-1.1.4-2 1-2.7-.1-.2-.4-1.2.1-2.4 0 0 .8-.3 2.8 1 .8-.2 1.6-.3 2.4-.3s1.6.1 2.4.3c2-1.3 2.8-1 2.8-1 .5 1.2.2 2.2.1 2.4.7.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.5 5 .3.2.6.7.6 1.5v2.2c0 .3.2.6.7.5C19.1 20.1 22 16.4 22 12c0-5.5-4.5-10-10-10Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full"
                style={{
                  background: "linear-gradient(120deg, rgba(255,255,255,0.16), rgba(255,255,255,0.1))",
                  border: "1px solid rgba(255,255,255,0.4)",
                  boxShadow: "0 12px 36px rgba(255,255,255,0.2)",
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ background: "rgba(255,255,255,0.6)" }}
                  />
                  <span className="relative inline-flex rounded-full h-2 w-2"
                    style={{ background: "#ffffff" }}
                  />
                </span>
                <span className="text-[10px] uppercase tracking-widest"
                  style={{ fontFamily: "'Clash Display', sans-serif", color: "#f8f9ff" }}
                >
                  {currentDocId ? "Doc Active" : "Upload PDF"}
                </span>
              </div>
            </div>
          </div>

          <div className="md:hidden px-4 pb-3">
            <div
              className="flex items-center gap-2 rounded-xl p-1"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {MOBILE_QUICK_TABS.map((item) => {
                const studyTabs = ["summarize", "flashcards", "quiz", "mindmap", "poster"];
                const isActive = activeTab === item.id || (item.id === "summarize" && studyTabs.includes(activeTab));
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => jumpToTab(item.id)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider"
                    style={{
                      color: isActive ? "#ffffff" : "rgba(255,255,255,0.62)",
                      background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                      border: isActive ? "1px solid rgba(255,255,255,0.22)" : "1px solid transparent",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <main className={`md:ml-[260px] pt-[126px] md:pt-[88px] min-h-[calc(100vh-126px)] md:h-[calc(100vh-88px)] ${mainScrollClass} scroll-smooth relative z-20`}>
          {/* Atmosphere orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="atmosphere-orb w-[600px] h-[600px] top-[-10%] left-[-10%]" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="atmosphere-orb w-[500px] h-[500px] bottom-[10%] right-[-5%]" style={{ background: "rgba(255,255,255,0.03)", animationDelay: "-5s" }} />
            <div className="atmosphere-orb w-[400px] h-[400px] bottom-[-20%] left-[20%]" style={{ background: "rgba(255,255,255,0.03)", animationDelay: "-2s" }} />
          </div>

          {!needsChatWindow && error && (
            <div className="max-w-4xl mx-auto mt-4 px-6">
              <div className="text-sm rounded-xl px-5 py-4 flex items-center gap-3 error-toast"
                style={{ color: "#ff8888", background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.15)" }}
              >
                <span className="material-symbols-outlined" style={{ color: "#ff6666" }}>error</span>
                <span className="flex-1">{error}</span>
                <button type="button" onClick={() => setError("")} className="flex-shrink-0 transition-colors"
                  style={{ color: "rgba(255,100,100,0.5)" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#ff6666"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,100,100,0.5)"}
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "flashcards" && (
            <FlashcardsTab
              cards={flashcards}
              raw={flashcardsRaw}
              onGenerate={handleFlashcards}
              disabled={loading}
              currentDocId={currentDocId}
            />
          )}

          {activeTab === "quiz" && (
            <QuizTab
              questions={quizQuestions}
              raw={quizRaw}
              onGenerate={handleQuiz}
              disabled={loading}
              currentDocId={currentDocId}
              version={quizVersion}
            />
          )}

          {activeTab === "mindmap" && (
            <MindMapVisual
              svg={mindMapSvg}
              onGenerate={handleMindMapVisual}
              disabled={loading}
            />
          )}

          {activeTab === "poster" && (
            <PosterTab
              onGenerate={handlePoster}
              disabled={loading}
            />
          )}

          {isInsightsTab && (
            <StudyInsightsTab
              messages={insightsMessages}
              onGenerate={handleInsights}
              disabled={loading}
              thinking={insightsThinking}
              currentDocId={currentDocId}
            />
          )}

          {needsChatWindow && (
            <div
              key={activeTab}
              className="fixed left-0 md:left-[260px] right-0 px-3 md:px-8 flex flex-col justify-end z-30 min-h-0 top-[130px] md:top-[88px] h-[calc(100dvh-146px)] md:h-[calc(100vh-108px)] max-h-[calc(100dvh-146px)] md:max-h-[calc(100vh-108px)] tab-content-enter"
            >
              <div className="max-w-5xl mx-auto w-full flex flex-col justify-end min-h-0" style={{ height: "100%" }}>
                <ChatWindow
                  messages={messagesForTab()}
                  thinking={thinking}
                  error={error}
                  bottomRef={chatBottomRef}
                />

                <div className="w-full flex justify-center mt-3 md:mt-4 fade-in">
                  <div className="w-full rounded-2xl p-4 relative overflow-hidden group"
                    style={{
                      background: "rgba(5, 5, 8, 0.85)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
                      paddingBottom: "max(12px, env(safe-area-inset-bottom))",
                    }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 blur-[50px]" style={{ background: "rgba(255,255,255,0.02)" }} />
                    {activeTab === "doc" && <InputBox onSend={handleSend} disabled={loading || !currentDocId} />}
                    {activeTab === "general" && <InputBox onSend={handleSendGeneral} disabled={loading} />}
                    {activeTab === "role" && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 flex-wrap text-xs">
                          <span className="font-semibold text-xs uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Clash Display', sans-serif" }}>Role</span>
                          <div className="flex gap-2">
                            {["tutor", "researcher", "summarizer"].map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setRolePersona(r)}
                                disabled={loading}
                                className="px-3.5 py-1.5 rounded-full text-xs font-medium capitalize transition-all duration-200"
                                style={{
                                  background: rolePersona === r ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
                                  border: rolePersona === r ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
                                  color: rolePersona === r ? "#ffffff" : "rgba(255,255,255,0.5)",
                                  boxShadow: rolePersona === r ? "0 4px 16px rgba(255,255,255,0.08)" : "none",
                                }}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                        <InputBox onSend={(text) => handleRoleChat(text, rolePersona)} disabled={loading} />
                      </div>
                    )}
                    {activeTab === "summarize" && (
                      <div className="flex flex-wrap gap-3 items-center justify-center p-2 relative z-10">
                        <button
                          onClick={() => handleSummarize("summary")}
                          disabled={loading || !currentDocId}
                          className="nexus-btn-primary"
                        >
                          Generate Summary
                        </button>
                        <button
                          onClick={() => handleSummarize("revision")}
                          disabled={loading || !currentDocId}
                          className="nexus-btn-ghost"
                        >
                          Revision Bullets
                        </button>
                      </div>
                    )}
                    {activeTab === "media" && (
                      <div className="grid gap-4 md:grid-cols-2 relative z-10 p-2">
                        <label className="flex flex-col gap-2 rounded-xl cursor-pointer p-4 items-center justify-center group transition-all duration-300"
                          style={{
                            border: "1px dashed rgba(255,255,255,0.15)",
                            background: "rgba(255,255,255,0.02)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                          }}
                        >
                          <span className="material-symbols-outlined text-3xl transition-transform group-hover:scale-110" style={{ color: "#ffffff" }}>graphic_eq</span>
                          <div className="text-sm font-semibold text-white">Upload audio</div>
                          <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>MP3 / WAV / M4A</div>
                          <input type="file" accept="audio/*" className="hidden" disabled={loading} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleTranscribeAudio(file); e.target.value = ""; }} />
                        </label>

                        <label className="flex flex-col gap-2 rounded-xl cursor-pointer p-4 items-center justify-center group transition-all duration-300"
                          style={{
                            border: "1px dashed rgba(255,255,255,0.15)",
                            background: "rgba(255,255,255,0.02)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                          }}
                        >
                          <span className="material-symbols-outlined text-3xl transition-transform group-hover:scale-110" style={{ color: "#ffffff" }}>imagesmode</span>
                          <div className="text-sm font-semibold text-white">Upload image</div>
                          <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Extract text and summarize</div>
                          <input type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" disabled={loading} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageToText(file); e.target.value = ""; }} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </section>
    </div>
  );
}
