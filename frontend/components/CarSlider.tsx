"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { animate } from "framer-motion";
import { SLIDES } from "./data";

const FLIP_MS = 380;
const WIPE_MS = 700;
const EASE_OUT: [number,number,number,number] = [0.22, 1, 0.36, 1];
const EASE_INOUT: [number,number,number,number] = [0.87, 0, 0.13, 1];

export default function CarSlider() {
  const [current, setCurrent] = useState(0);
  const [next, setNext]       = useState<number | null>(null);
  const busy = useRef(false);
  const wheelLock = useRef(false);
  const touchY = useRef(0);
  const N = SLIDES.length;

  // Refs for every animatable DOM element
  // Current slide
  const curSlideRef  = useRef<HTMLDivElement>(null);
  const curSideRef   = useRef<HTMLDivElement>(null);
  const curTopRef    = useRef<HTMLDivElement>(null);
  const curTextRef   = useRef<HTMLDivElement>(null);
  const curStatsRef  = useRef<HTMLDivElement>(null);
  // Next slide
  const nxtSlideRef  = useRef<HTMLDivElement>(null);
  const nxtSideRef   = useRef<HTMLDivElement>(null);
  const nxtTextRef   = useRef<HTMLDivElement>(null);
  const nxtStatsRef  = useRef<HTMLDivElement>(null);

  const go = useCallback(async (dir: 1 | -1) => {
    const nextIdx = current + dir;
    if (busy.current || nextIdx < 0 || nextIdx >= N) return;
    busy.current = true;
    setNext(nextIdx);

    // Give React one frame to render the next slide (opacity:0, translateY set)
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    const curSlide  = curSlideRef.current;
    const curSide   = curSideRef.current;
    const curTop    = curTopRef.current;
    const curText   = curTextRef.current;
    const curStats  = curStatsRef.current;
    const nxtSlide  = nxtSlideRef.current;
    const nxtSide   = nxtSideRef.current;
    const nxtText   = nxtTextRef.current;
    const nxtStats  = nxtStatsRef.current;

    if (!curSlide || !curSide || !curTop || !nxtSlide || !nxtSide) {
      busy.current = false;
      return;
    }

    // ── PHASE 1: flip current car side → top (slide stays still) ──
    // Fade out side, fade in top simultaneously
    await Promise.all([
      animate(curSide, { opacity: 0, scale: 1.08, y: -20 }, { duration: FLIP_MS/1000, ease: EASE_INOUT }),
      animate(curTop,  { opacity: 1, scale: 1,    y: 0   }, { duration: FLIP_MS/1000, ease: EASE_OUT, delay: 0.05 }),
    ]);

    // Also fade out text during flip
    if (curText)  animate(curText,  { opacity: 0, y: -10 }, { duration: 0.22, ease: EASE_INOUT });
    if (curStats) animate(curStats, { opacity: 0         }, { duration: 0.18, ease: EASE_INOUT });

    // ── PHASE 2: vertical wipe — cur goes down, nxt comes from top ──
    // Position next slide above viewport before animating
    animate(nxtSlide, { y: "-100%" }, { duration: 0 });
    animate(nxtSlide, { opacity: 1 }, { duration: 0 });

    await Promise.all([
      animate(curSlide, { y: "100%"  }, { duration: WIPE_MS/1000, ease: EASE_INOUT }),
      animate(nxtSlide, { y: "0%"   }, { duration: WIPE_MS/1000, ease: EASE_INOUT }),
    ]);

    // ── PHASE 3: new slide settled — animate in text + car ──
    if (nxtText) {
      animate(nxtText,  { opacity: [0, 1], y: [14, 0] }, { duration: 0.45, ease: EASE_OUT, delay: 0.05 });
    }
    if (nxtStats) {
      animate(nxtStats, { opacity: [0, 1], y: [8, 0]  }, { duration: 0.4,  ease: EASE_OUT, delay: 0.12 });
    }
    animate(nxtSide, { opacity: [0, 1], scale: [0.94, 1], y: [24, 0] }, { duration: 0.55, ease: EASE_OUT, delay: 0.08 });

    // Commit state
    setCurrent(nextIdx);
    setNext(null);
    busy.current = false;
  }, [current, N]);

  const navigate = useCallback((dir: 1 | -1) => go(dir), [go]);

  // Wheel
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelLock.current) return;
      wheelLock.current = true;
      if (e.deltaY > 30) navigate(1);
      else if (e.deltaY < -30) navigate(-1);
      setTimeout(() => { wheelLock.current = false; }, FLIP_MS + WIPE_MS + 300);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [navigate]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") navigate(1);
      if (e.key === "ArrowUp"   || e.key === "PageUp"  ) navigate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  // Touch
  useEffect(() => {
    const onStart = (e: TouchEvent) => { touchY.current = e.touches[0].clientY; };
    const onEnd   = (e: TouchEvent) => {
      const dy = touchY.current - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 50) navigate(dy > 0 ? 1 : -1);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend",   onEnd,   { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend",   onEnd);
    };
  }, [navigate]);

  const cur = SLIDES[current];
  const nxt = next !== null ? SLIDES[next] : null;

  return (
    <div className="w-full h-full bg-[#111] flex items-center justify-center overflow-hidden">
      {/* UI card */}
      <div
        className="relative overflow-hidden bg-white"
        style={{
          width: "min(96vw, calc(96vh * 1.44))",
          height: "min(96vh, calc(96vw / 1.44))",
          borderRadius: 3,
          boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
        }}
      >

        {/* ── CURRENT SLIDE ── */}
        <SlideEl
          data={cur}
          slideRef={curSlideRef}
          sideRef={curSideRef}
          topRef={curTopRef}
          textRef={curTextRef}
          statsRef={curStatsRef}
          isCurrent
        />

        {/* ── NEXT SLIDE (rendered hidden, ready to wipe in) ── */}
        {nxt && (
          <SlideEl
            data={nxt}
            slideRef={nxtSlideRef}
            sideRef={nxtSideRef}
            topRef={null}
            textRef={nxtTextRef}
            statsRef={nxtStatsRef}
            isCurrent={false}
          />
        )}

        {/* ── NAVBAR ── */}
        <nav
          className="absolute top-0 left-0 right-0 flex items-center z-50 pointer-events-none"
          style={{ height: "7.5%", minHeight: 44, padding: "0 3.5%" }}
        >
          <span
            className="font-medium text-[#1a1a1a] tracking-[-0.02em] pointer-events-auto"
            style={{ fontSize: "clamp(11px,1.4vw,16px)" }}
          >
            collectcar.
          </span>
          <div className="ml-[2%] flex flex-col cursor-pointer pointer-events-auto" style={{ gap: 3.5 }}>
            {[0,1,2].map(i => (
              <span key={i} className="block bg-[#1a1a1a]" style={{ width: 16, height: 1.5 }} />
            ))}
          </div>
          <div className="ml-auto flex items-center pointer-events-auto" style={{ gap: "clamp(12px,2vw,24px)" }}>
            <span className="font-medium text-[#1a1a1a] tracking-[0.05em] flex items-center" style={{ fontSize: "clamp(10px,1vw,13px)", gap: 4 }}>
              ENG
              <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                <path d="M1 1L4 4L7 1" stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1a1a1a" strokeWidth="1.6" className="cursor-pointer">
              <circle cx="7" cy="7" r="5"/>
              <line x1="11" y1="11" x2="14.5" y2="14.5"/>
            </svg>
          </div>
        </nav>

        {/* ── SIDE NAV ── */}
        <div
          className="absolute z-50 flex flex-col items-center"
          style={{ left: "3.8%", top: "50%", transform: "translateY(-50%)", gap: "clamp(8px,1.2vw,14px)" }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{ width: "clamp(22px,2.8vw,34px)", height: "clamp(22px,2.8vw,34px)", background: "transparent", border: "none", cursor: current === 0 ? "default" : "pointer", opacity: current === 0 ? 0.2 : 0.55 }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round">
              <polyline points="1.5,8.5 6.5,3.5 11.5,8.5"/>
            </svg>
          </button>
          <button
            onClick={() => navigate(1)}
            className="rounded-full"
            style={{ width: "clamp(26px,3.2vw,38px)", height: "clamp(26px,3.2vw,38px)", background: "#1f1f1f", border: "none", cursor: current === N-1 ? "default" : "pointer", opacity: current === N-1 ? 0.25 : 1 }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
              <polyline points="1.5,4.5 6.5,9.5 11.5,4.5"/>
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}

// ── SlideEl: pure presentational, all animation driven by parent refs ──
interface SlideElProps {
  data: typeof SLIDES[0];
  slideRef: React.RefObject<HTMLDivElement>;
  sideRef:  React.RefObject<HTMLDivElement>;
  topRef:   React.RefObject<HTMLDivElement> | null;
  textRef:  React.RefObject<HTMLDivElement> | null;
  statsRef: React.RefObject<HTMLDivElement> | null;
  isCurrent: boolean;
}

function SlideEl({ data, slideRef, sideRef, topRef, textRef, statsRef, isCurrent }: SlideElProps) {
  return (
    <div
      ref={slideRef}
      className="absolute inset-0 flex flex-col"
      style={{ opacity: isCurrent ? 1 : 0, zIndex: isCurrent ? 2 : 1 }}
    >
      {/* Hero */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${data.bgTop} 0%, ${data.bgMid} 28%, ${data.bgBot} 62%, #eeeeee 100%)`,
        }}
      >
        {/* Nav spacer */}
        <div style={{ height: "7.5%", minHeight: 44 }} />

        {/* Text row */}
        <div
          ref={textRef}
          className="flex items-start relative z-10"
          style={{ padding: "2% 5% 0" }}
        >
          {/* Crest */}
          <div className="flex-shrink-0 mt-1">
            <PorscheCrest />
          </div>

          {/* Title */}
          <div className="flex-1 text-center" style={{ padding: "0 2%" }}>
            <h1
              className="font-bold text-[#1a1a1a] tracking-[-0.03em] leading-tight"
              style={{ fontSize: "clamp(18px,2.8vw,36px)" }}
            >
              {data.model}
            </h1>
            <p
              className="font-light tracking-[-0.02em] leading-snug mt-[0.15em]"
              style={{
                fontSize: "clamp(14px,2.2vw,28px)",
                color: "transparent",
                WebkitTextStroke: "1px rgba(30,30,30,0.3)",
              }}
            >
              {data.variant}
            </p>
          </div>

          {/* Price */}
          <div className="flex-shrink-0 text-right">
            <p
              className="font-bold text-[#1a1a1a] tracking-[-0.03em] leading-tight"
              style={{ fontSize: "clamp(16px,2.4vw,32px)" }}
            >
              {data.price}
            </p>
            <p className="text-[#999] mt-[3px]" style={{ fontSize: "clamp(9px,0.9vw,12px)" }}>
              {data.location}
            </p>
          </div>
        </div>

        {/* Center vertical line */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-px bg-black/15 z-10"
          style={{ top: "11%", height: "26%" }}
        />

        {/* Car stage */}
        <div className="absolute inset-0 top-[20%] z-10">
          {/* Side view */}
          <div
            ref={sideRef}
            className="absolute inset-0 flex items-end justify-center pb-0"
            style={{ opacity: 1 }}
          >
            <div className="relative w-[82%] max-w-[620px]" style={{ marginBottom: "-2%" }}>
              <Image
                src={data.sideImg}
                alt={data.model}
                width={2400}
                height={1200}
                className="w-full h-auto object-contain"
                style={{ filter: "drop-shadow(0 10px 28px rgba(0,0,0,0.12))" }}
                priority
              />
            </div>
          </div>

          {/* Top-down view — only on current slide */}
          {topRef && (
            <div
              ref={topRef}
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: 0 }}
            >
              <div className="relative w-[58%] max-w-[400px]">
                <Image
                  src={data.topImg}
                  alt={`${data.model} top`}
                  width={2000}
                  height={2000}
                  className="w-full h-auto object-contain"
                  style={{ filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.1))" }}
                  priority
                />
              </div>
            </div>
          )}
        </div>

        {/* Floor fade */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
          style={{
            height: "36%",
            background: "linear-gradient(to top, #eeeeee 0%, rgba(238,238,238,0) 100%)",
          }}
        />
      </div>

      {/* Stats bar */}
      <div
        ref={statsRef}
        className="relative flex items-center flex-shrink-0 bg-[#e2e2e2]"
        style={{ height: "15%", minHeight: 64, padding: "0 5%" }}
      >
        <span
          className="absolute font-medium text-[#aaa] tracking-[0.05em]"
          style={{ left: "5%", fontSize: "clamp(9px,0.95vw,12px)" }}
        >
          {data.index}
        </span>

        <div className="flex mx-auto" style={{ gap: "clamp(20px,3.5vw,48px)" }}>
          {[
            { value: data.year,    label: "Year"       },
            { value: data.mileage, label: "Mileage"    },
            { value: data.hp,      label: "Horsepower" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p
                className="font-bold text-[#1a1a1a] tracking-[-0.03em] leading-none"
                style={{ fontSize: "clamp(16px,2.1vw,26px)" }}
              >
                {value}
              </p>
              <p className="text-[#aaa] tracking-[0.04em] mt-[4px]" style={{ fontSize: "clamp(8px,0.8vw,11px)" }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="absolute" style={{ right: "5%" }}>
          <button
            className="flex items-center gap-2 font-medium text-[#1a1a1a] border-b border-[#1a1a1a] pb-[2px] hover:opacity-60 transition-opacity"
            style={{ fontSize: "clamp(9px,1vw,13px)" }}
          >
            Full details <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PorscheCrest() {
  return (
    <svg width="28" height="34" viewBox="0 0 32 39" fill="none">
      <path d="M16 1L30 7V21C30 29 23 36 16 38C9 36 2 29 2 21V7L16 1Z" fill="none" stroke="#1a1a1a" strokeWidth="1.4"/>
      <line x1="16" y1="1" x2="16" y2="38" stroke="#1a1a1a" strokeWidth="0.8"/>
      <line x1="2" y1="20" x2="30" y2="20" stroke="#1a1a1a" strokeWidth="0.8"/>
      <rect x="2" y="7" width="14" height="13" fill="#1a1a1a" opacity="0.07"/>
      <rect x="16" y="20" width="14" height="9" fill="#1a1a1a" opacity="0.12"/>
      <rect x="20" y="7" width="4" height="13" fill="#cc0000" opacity="0.75"/>
      <rect x="24" y="7" width="6" height="13" fill="#cc0000" opacity="0.5"/>
      <path d="M6,18 Q7,12 10,10 Q11,14 9,18 Z" fill="#1a1a1a" opacity="0.45"/>
    </svg>
  );
}