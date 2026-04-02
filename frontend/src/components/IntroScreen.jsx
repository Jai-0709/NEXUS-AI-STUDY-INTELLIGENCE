import { useEffect, useState } from "react";

export default function IntroScreen({ onExplore }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Always start at top; prevent browser scroll restoration
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo({ top: 0, behavior: "auto" });
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
    }

    // Init Unicorn Studio scene
    const initUnicorn = () => {
      if (!window.UnicornStudio) return;
      window.UnicornStudio.addScene({
        elementId: "nexus-unicorn-container",
        projectId: "AENJiN0mHh5Rijv25Cbf",
        fps: 60,
        scale: 1,
        dpi: Math.min(window.devicePixelRatio || 1, 2),
        lazyLoad: false,
        production: false,
        interactivity: { mouse: { disableMobile: false } },
      }).then(() => {
        applyCoverScale();
        killWatermark();
        setLoaded(true);
      }).catch(() => {
        setLoaded(true);
      });
    };

    const applyCoverScale = () => {
      const wrapper = document.querySelector("#nexus-unicorn-container > div");
      const canvas = document.querySelector("#nexus-unicorn-container canvas");
      if (!wrapper || !canvas) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cw = canvas.width || canvas.offsetWidth || 1440;
      const ch = canvas.height || canvas.offsetHeight || 900;
      const scale = Math.max(vw / cw, vh / ch);
      wrapper.style.position = "absolute";
      wrapper.style.top = "50%";
      wrapper.style.left = "50%";
      wrapper.style.width = cw + "px";
      wrapper.style.height = ch + "px";
      wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
      wrapper.style.transformOrigin = "center center";
    };

    const killWatermark = () => {
      const container = document.getElementById("nexus-unicorn-container");
      if (!container) return;
      container.querySelectorAll("a").forEach((el) => el.remove());
      container.querySelectorAll("*").forEach((el) => {
        if (
          el.children.length === 0 &&
          el.textContent.toLowerCase().includes("unicorn")
        ) {
          let node = el;
          while (
            node.parentElement &&
            node.parentElement !== container &&
            node.parentElement.children.length === 1
          ) {
            node = node.parentElement;
          }
          node.remove();
        }
      });
    };

    // Watch for SDK injecting watermark
    const container = document.getElementById("nexus-unicorn-container");
    let observer = null;
    if (container) {
      observer = new MutationObserver(killWatermark);
      observer.observe(container, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initUnicorn);
    } else {
      initUnicorn();
    }

    // Fallback: show loaded state after 3s even if Unicorn fails
    const fallbackTimer = setTimeout(() => setLoaded(true), 3000);

    const tmr1 = setTimeout(killWatermark, 1500);
    const tmr2 = setTimeout(killWatermark, 3000);
    const tmr3 = setTimeout(applyCoverScale, 800);
    const tmr4 = setTimeout(applyCoverScale, 1600);

    const resizeHandler = () => applyCoverScale();
    window.addEventListener("resize", resizeHandler);

    // ─── Scroll-away intro effect ──
    const FADE_DISTANCE = window.innerHeight * 0.14;
    const onScroll = () => {
      const introEl = document.getElementById("nexus-intro");
      if (!introEl) return;
      const scrollY = window.scrollY;
      const progress = Math.min(scrollY / FADE_DISTANCE, 1);

      if (progress >= 1) {
        introEl.style.transform = "translateY(-100%)";
        introEl.style.opacity = "0";
        introEl.style.pointerEvents = "none";
      } else if (progress <= 0) {
        introEl.style.transform = "translateY(0)";
        introEl.style.opacity = "1";
        introEl.style.pointerEvents = "auto";
      } else {
        introEl.style.transform = `translateY(${-progress * 110}px)`;
        introEl.style.opacity = String(1 - progress);
        introEl.style.pointerEvents = "none";
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      clearTimeout(fallbackTimer);
      clearTimeout(tmr1);
      clearTimeout(tmr2);
      clearTimeout(tmr3);
      clearTimeout(tmr4);
      window.removeEventListener("resize", resizeHandler);
      window.removeEventListener("scroll", onScroll);
      if (observer) observer.disconnect();
    };
  }, []);

  const handleScrollClick = () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    if (onExplore) onExplore();
  };

  return (
    <div
      id="nexus-intro"
      style={{
        position: "relative",
        zIndex: 200,
        background: "var(--nx-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        transition: "transform 0.06s ease-out, opacity 0.06s ease-out",
        willChange: "transform, opacity",
        minHeight: "100vh",
      }}
    >
      {/* Unicorn Studio Canvas */}
      <div
        id="nexus-unicorn-container"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      />

      {/* Vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(
            to bottom,
            rgba(0,0,0,0.15) 0%,
            transparent 20%,
            transparent 75%,
            rgba(0,0,0,0.95) 100%
          )`,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Center content — subtle NEXUS branding */}
      {/* Center content — completely removed per user request */}

      {/* Scroll to explore button */}
      <button
        onClick={handleScrollClick}
        style={{
          position: "absolute",
          bottom: "max(28px, env(safe-area-inset-bottom))",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          background: "#ffffff",
          color: "#000000",
          border: "none",
          borderRadius: "12px",
          width: "min(260px, calc(100% - 32px))",
          height: "44px",
          fontFamily: "'Satoshi', sans-serif",
          fontSize: "14px",
          fontWeight: 600,
          letterSpacing: "0.02em",
          cursor: "pointer",
          boxShadow: "0 0 24px rgba(255,255,255,0.08)",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.5s ease, background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#f0f0f0";
          e.currentTarget.style.boxShadow = "0 0 32px rgba(255,255,255,0.2)";
          e.currentTarget.style.transform = "translateX(-50%) scale(1.03)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#ffffff";
          e.currentTarget.style.boxShadow = "0 0 24px rgba(255,255,255,0.08)";
          e.currentTarget.style.transform = "translateX(-50%) scale(1)";
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1v10M2 7l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Scroll to explore
      </button>
    </div>
  );
}
