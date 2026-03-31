import React, { useRef } from 'react';

export default function Sidebar({ activeTab, fileName, onUpload, onClear, loading, documents, currentDocId, onActivate, onRefresh, onDelete, onSelectTab, tabGroups }) {
  const navRef = useRef(null);
  const activeTabRef = useRef(null);

  const handleNavWheel = (e) => {
    const el = navRef.current;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    el.scrollTop += e.deltaY;
  };

  React.useEffect(() => {
    const target = activeTabRef.current;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeTab]);
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  return (
    <aside
      className="h-screen w-[260px] fixed left-0 top-0 z-50 flex flex-col p-6 space-y-8 overflow-hidden"
      style={{
        background: "rgba(5, 5, 8, 0.92)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 0 45px rgba(0,0,0,0.5)",
      }}
    >
      <div className="absolute inset-0 grainy-bg opacity-[0.02]" />
      
      {/* Logo */}
      <div className="relative z-10 flex items-center space-x-3" style={{ marginTop: "-6px" }}>
        <div
          className="w-13 h-13 rounded-2xl flex items-center justify-center relative"
          style={{
            width: "54px",
            height: "54px",
            background: "linear-gradient(140deg, rgba(255,255,255,0.16), rgba(255,255,255,0.06))",
            border: "1px solid rgba(255,255,255,0.36)",
            boxShadow: "0 14px 32px rgba(255,255,255,0.12)",
          }}
        >
          <div
            className="absolute inset-[-4px] rounded-2xl"
            style={{
              border: "1px dashed rgba(255,255,255,0.3)",
              opacity: 0.6,
              filter: "blur(0.2px)",
            }}
          />
          <span className="material-symbols-outlined" style={{ color: "#ffffff", fontSize: "24px" }}>psychology</span>
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-black tracking-tighter uppercase"
              style={{ fontFamily: "'Clash Display', sans-serif", color: "#ffffff" }}
            >
              NEXUS
            </h1>
            <span className="text-[9px] px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.32)",
                color: "#ffffff",
                letterSpacing: "0.14em",
              }}
            >
              CORE
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.32em]"
            style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.42)" }}
          >
            AI assistant
          </p>
        </div>
      </div>

      {/* Upload button */}
      <label
        className="cursor-pointer relative z-10 w-full py-3 font-bold rounded-full flex items-center justify-center space-x-2 transition-all duration-300"
        style={{
          background: "#ffffff",
          color: "#000000",
          boxShadow: "0 0 20px rgba(255,255,255,0.08)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.03)";
          e.currentTarget.style.boxShadow = "0 0 32px rgba(255,255,255,0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 0 20px rgba(255,255,255,0.08)";
        }}
      >
        <span className="material-symbols-outlined text-sm">add</span>
        <span className="uppercase tracking-widest text-xs" style={{ fontFamily: "'Clash Display', sans-serif" }}>
          {loading ? "Processing..." : "Upload PDF"}
        </span>
        <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} disabled={loading} />
      </label>

      {/* Navigation */}
      <nav
        ref={navRef}
        onWheel={handleNavWheel}
        className="relative z-10 flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar"
      >
        {/* Current File */}
        <div className="space-y-2">
          <div className="px-4 text-[13px] uppercase tracking-widest flex justify-between items-center"
            style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.3)" }}
          >
            <span>Current File</span>
            <button onClick={onRefresh} disabled={loading} className="transition-colors"
              style={{ color: "rgba(255,255,255,0.3)" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
            </button>
          </div>
          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg group"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ color: "#ffffff" }}>description</span>
            <span className="text-[15px] truncate flex-1" style={{ color: "rgba(255,255,255,0.7)" }} title={fileName || "No file active"}>
              {fileName || "No file active"}
            </span>
          </div>
        </div>

        {/* Documents list */}
        <div className="space-y-2">
          <div className="px-4 text-[13px] uppercase tracking-widest"
            style={{ fontFamily: "'Clash Display', sans-serif", color: "rgba(255,255,255,0.3)" }}
          >
            Documents
          </div>
          <div className="space-y-1">
            {documents?.length ? documents.map((doc) => (
              <div 
                key={doc.id}
                className="flex items-center justify-between px-4 py-2 rounded-lg transition-all duration-300 group"
                style={{
                  background: doc.id === currentDocId ? "linear-gradient(120deg, rgba(255,255,255,0.14), rgba(255,255,255,0.08))" : "transparent",
                  border: doc.id === currentDocId ? "1px solid rgba(255,255,255,0.32)" : "1px solid transparent",
                  color: doc.id === currentDocId ? "#ffffff" : "rgba(255,255,255,0.45)",
                }}
              >
                <button
                  type="button"
                  onClick={() => onActivate(doc.id)}
                  disabled={loading}
                  className="flex items-center space-x-3 flex-1 overflow-hidden"
                >
                  <span className="material-symbols-outlined text-[16px]">folder_open</span>
                  <span className="text-[15px] truncate text-left">{doc.file_name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(doc.id)}
                  disabled={loading}
                  className="transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 flex-shrink-0"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                  title="Delete Document"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            )) : (
              <div className="px-4 text-xs italic" style={{ color: "rgba(255,255,255,0.2)" }}>No documents yet.</div>
            )}
          </div>
        </div>

        {/* Tab groups */}
        <div className="space-y-4">
          {tabGroups?.map((group) => (
            <div key={group.title} className="space-y-2">
              <div className="px-4 flex items-center gap-2">
                <span className="block w-1.5 h-1.5 rounded-full" style={{ background: "var(--nx-accent)" }} />
                <div className="text-[12px] uppercase tracking-[0.3em]"
                  style={{ fontFamily: "'Clash Display', sans-serif", color: "#ffffff", letterSpacing: "0.28em" }}
                >
                  {group.title}
                </div>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.22)" }} />
              </div>
              <div className="space-y-1">
                {group.items.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onSelectTab(tab.id)}
                      disabled={loading}
                      className="w-full text-left px-4 py-2.5 rounded-lg transition-all duration-300 flex items-center justify-between"
                      ref={isActive ? activeTabRef : undefined}
                      data-tab-id={tab.id}
                      style={{
                        background: isActive ? "linear-gradient(120deg, rgba(255,255,255,0.14), rgba(255,255,255,0.08))" : "transparent",
                        border: isActive ? "1px solid rgba(255,255,255,0.32)" : "1px solid transparent",
                        color: isActive ? "#ffffff" : "rgba(255,255,255,0.45)",
                        boxShadow: isActive ? "0 10px 28px rgba(255,255,255,0.15)" : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                          e.currentTarget.style.color = "#ffffff";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                        }
                      }}
                    >
                      <span className="text-[15px]">{tab.label}</span>
                      {isActive && <span className="material-symbols-outlined text-[14px]" style={{ color: "#ffffff" }}>chevron_right</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Clear button */}
      <div className="relative z-10 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onClear} disabled={loading}
          className="flex items-center justify-center space-x-3 px-4 py-3 w-full rounded-lg transition-all duration-300 uppercase tracking-widest text-xs disabled:opacity-50"
          style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Clash Display', sans-serif" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ff6b6b";
            e.currentTarget.style.background = "rgba(255,100,100,0.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.35)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
          <span>Clear Chat</span>
        </button>
      </div>
    </aside>
  );
}
