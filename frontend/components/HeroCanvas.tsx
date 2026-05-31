"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

const TOTAL_FRAMES = 200;
const FRAME_PREFIX = "ezgif-frame-";
const FRAME_EXT = ".jpg";
const FRAME_PAD = 3;
const SCROLL_HEIGHT = 7500;

const isMobile = () => typeof window !== "undefined" && window.innerWidth < 768;

function frameSrc(i: number) {
  const folder = isMobile() ? "/vibescout-hero-mobile" : "/vibescout-hero";
  return `${folder}/${FRAME_PREFIX}${String(i + 1).padStart(FRAME_PAD, "0")}${FRAME_EXT}`;
}

interface HeroCanvasProps {
  onLoadProgress: (p: number) => void;
  onLoadComplete: () => void;
}

export default function HeroCanvas({ onLoadProgress, onLoadComplete }: HeroCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const images = useRef<(HTMLImageElement | null)[]>(Array(TOTAL_FRAMES).fill(null));
  const currentFrame = useRef(0);
  const rafId = useRef<number>(0);
  const lastDrawnFrame = useRef(-1);
  const loadedRef = useRef(false);

  // Framer Motion scroll-based values for text overlays
  const scrollProgress = useMotionValue(0);
  const springProgress = useSpring(scrollProgress, { stiffness: 60, damping: 20, mass: 1.2 });

  // Text overlay opacities mapped to scroll ranges
  const headlineOpacity = useTransform(springProgress, [0.0, 0.06, 0.22, 0.30], [0, 1, 1, 0]);
  const headlineY = useTransform(springProgress, [0.0, 0.06], [32, 0]);
  const sublineOpacity = useTransform(springProgress, [0.08, 0.15, 0.25, 0.32], [0, 1, 1, 0]);
  const sublineY = useTransform(springProgress, [0.08, 0.15], [24, 0]);
  const systemLabelOpacity = useTransform(springProgress, [0.55, 0.65, 0.80, 0.88], [0, 1, 1, 0]);
  const scrollHintOpacity = useTransform(springProgress, [0.0, 0.04], [1, 0]);

  // Canvas draw
  const draw = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = images.current[frameIndex];
    if (!img) return;
const cw = window.innerWidth;
const ch = window.innerHeight;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;

    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);

    // Atmospheric gradient overlays
    const top = ctx.createLinearGradient(0, 0, 0, ch * 0.28);
    top.addColorStop(0, "rgba(5,5,5,0.42)");
    top.addColorStop(1, "rgba(5,5,5,0)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, cw, ch);

    const bot = ctx.createLinearGradient(0, ch * 0.68, 0, ch);
    bot.addColorStop(0, "rgba(5,5,5,0)");
    bot.addColorStop(1, "rgba(5,5,5,0.7)");
    ctx.fillStyle = bot;
    ctx.fillRect(0, 0, cw, ch);

    lastDrawnFrame.current = frameIndex;
  }, []);

  // Resize handler
 const resizeCanvas = useCallback(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Device pixel ratio
  const dpr = window.devicePixelRatio || 1;

  // Actual display size
  const displayWidth = window.innerWidth;
  const displayHeight = window.innerHeight;

  // Set INTERNAL canvas resolution higher
  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;

  // Set VISUAL canvas size
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;

  // Reset transform before scaling
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Scale everything for DPR
  ctx.scale(dpr, dpr);

  // Better scaling quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  draw(currentFrame.current);
}, [draw]);

  // Preload frames
  const preload = useCallback(() => {
    let loaded = 0;
    const onLoad = () => {
      loaded++;
      const pct = Math.round((loaded / TOTAL_FRAMES) * 100);
      onLoadProgress(pct);
      if (loaded === TOTAL_FRAMES) {
        loadedRef.current = true;
        draw(0);
        onLoadComplete();
      }
    };

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.onload = onLoad;
      img.onerror = onLoad; // count errors so bar completes
      img.src = frameSrc(i);
      images.current[i] = img;
    }
  }, [draw, onLoadProgress, onLoadComplete]);

  useEffect(() => {
    preload();
  }, [preload]);

  // Scroll handler
  useEffect(() => {
    const onScroll = () => {
      if (!loadedRef.current) return;
      const maxScroll = SCROLL_HEIGHT - window.innerHeight;
      const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
      scrollProgress.set(progress);

      const frameMultiplier = isMobile() ? 1.6 : 1;
      const idx = Math.min(Math.floor(progress * (TOTAL_FRAMES - 1) * frameMultiplier), TOTAL_FRAMES - 1);
      currentFrame.current = idx;

      if (idx !== lastDrawnFrame.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => draw(idx));
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, [draw, scrollProgress]);

  // Resize
  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  return (
    <section
      ref={containerRef}
      style={{ height: SCROLL_HEIGHT }}
      className="relative"
    >
      {/* Sticky canvas container */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: "block" }}
        />

        {/* Atmospheric particles layer (slow) */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${1 + (i % 3) * 0.8}px`,
                height: `${1 + (i % 3) * 0.8}px`,
                left: `${(i * 8.3) % 100}%`,
                top: `${(i * 13.7 + 10) % 80}%`,
                background:
                  i % 2 === 0
                    ? "rgba(231,197,138,0.6)"
                    : "rgba(93,116,138,0.5)",
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0, 0.6, 0, 0.4, 0],
              }}
              transition={{
                duration: 12 + i * 2.3,
                repeat: Infinity,
                delay: i * 1.4,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Text overlays */}
        {/* Headline — offset top to clear navbar */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ opacity: headlineOpacity, paddingTop: "4rem" }}
        >
          <motion.div style={{ y: headlineY }}>
            <div
              style={{
                fontSize: "10px",
                letterSpacing: "0.45em",
                textTransform: "uppercase",
                textAlign: "center",
                marginBottom: "1.25rem",
                color: "rgba(231,197,138,0.55)",
              }}
            >
              Environmental Intelligence Platform
            </div>
            <h1
              className="text-center font-light"
              style={{
                fontSize: "clamp(2rem, 4.2vw, 4rem)",
                letterSpacing: "0.05em",
                lineHeight: 1.18,
                color: "rgba(255,255,255,0.9)",
                textShadow: "0 0 60px rgba(231,197,138,0.1)",
              }}
            >
              Intelligence
              <br />
              <span
                style={{
                  fontWeight: 200,
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "0.1em",
                }}
              >
                Beyond Location
              </span>
            </h1>
          </motion.div>
        </motion.div>

        {/* Subline */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 pointer-events-none flex justify-center pb-32"
          style={{ opacity: sublineOpacity }}
        >
          <motion.p
            style={{
              y: sublineY,
              fontSize: "1rem",
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.055em",
              fontWeight: 300,
              maxWidth: "460px",
              textAlign: "center",
              lineHeight: 1.85,
            }}
          >
            Vibescout understands how a place feels
            <br />
            before you ever arrive.
          </motion.p>
        </motion.div>

        {/* System active label (mid-scroll) */}
        <motion.div
          className="absolute top-1/2 right-12 md:right-20 -translate-y-1/2 pointer-events-none"
          style={{ opacity: systemLabelOpacity }}
        >
          <div className="flex items-center gap-2.5">
            <motion.div
              className="w-1 h-1 rounded-full"
              style={{ background: "#E7C58A" }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            <span
              className="text-[8px] tracking-[0.45em] uppercase"
              style={{ color: "rgba(231,197,138,0.55)" }}
            >
              Systems Active
            </span>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center gap-3"
          style={{ opacity: scrollHintOpacity }}
        >
          <span
            className="text-[8px] tracking-[0.45em] uppercase"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Scroll to Explore
          </span>
          <motion.div
            className="w-px h-10"
            style={{
              background:
                "linear-gradient(to bottom, rgba(231,197,138,0.5), transparent)",
            }}
            animate={{ scaleY: [0, 1, 0], originY: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Corner frame counter (subtle detail) */}
        <motion.div
          className="absolute bottom-8 right-8 pointer-events-none"
          style={{ opacity: useTransform(springProgress, [0, 0.05, 0.95, 1], [0, 0.4, 0.4, 0]) }}
        >
          <span
            className="text-[7px] tracking-[0.4em] tabular-nums"
            style={{ color: "rgba(255,255,255,0.15)", fontVariantNumeric: "tabular-nums" }}
          >
            {String(Math.min(Math.floor((springProgress.get() * (TOTAL_FRAMES - 1)) + 1), TOTAL_FRAMES)).padStart(3, "0")}/{TOTAL_FRAMES}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
