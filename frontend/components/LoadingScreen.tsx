"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingScreenProps {
  progress: number;
}

interface Particle {
  id: number;
  left: string;
  top: string;
  width: string;
  height: string;
  color: string;
  duration: number;
  delay: number;
}

export default function LoadingScreen({ progress }: LoadingScreenProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${8 + Math.random() * 84}%`,
        top: `${8 + Math.random() * 84}%`,
        width: `${Math.random() * 2 + 0.5}px`,
        height: `${Math.random() * 2 + 0.5}px`,
        color:
          i % 3 === 0
            ? "rgba(231,197,138,0.7)"
            : i % 3 === 1
            ? "rgba(93,116,138,0.5)"
            : "rgba(255,255,255,0.25)",
        duration: 2.5 + Math.random() * 3,
        delay: Math.random() * 4,
      }))
    );
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[9990] flex flex-col items-center justify-center"
      style={{ background: "#050505" }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.8, ease: [0.16, 1, 0.3, 1] } }}
    >
      {/* Radial atmospheric glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="rounded-full"
          style={{
            width: 700,
            height: 420,
            background:
              "radial-gradient(ellipse, rgba(231,197,138,0.12) 0%, transparent 65%)",
            filter: "blur(40px)",
          }}
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.06, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Subtle scan line */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden opacity-20"
        style={{ zIndex: 1 }}
      >
        <motion.div
          className="absolute left-0 right-0 h-[1px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(231,197,138,0.4) 50%, transparent 100%)",
          }}
          animate={{ y: ["-10vh", "110vh"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: 1 }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: p.left,
              top: p.top,
              width: p.width,
              height: p.height,
              background: p.color,
            }}
            animate={{ opacity: [0, 0.8, 0.3, 0.8, 0] }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Brand identity */}
      <motion.div
        className="relative z-10 text-center mb-16"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      >
        <motion.div
          className="text-[9px] tracking-[0.55em] uppercase mb-4"
          style={{ color: "rgba(231,197,138,0.55)" }}
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Environmental Intelligence
        </motion.div>
        <div
          className="text-[42px] font-light tracking-[0.25em] uppercase"
          style={{ color: "rgba(255,255,255,0.92)" }}
        >
          Vibescout
        </div>
        <div
          className="text-[9px] tracking-[0.35em] uppercase mt-3"
          style={{ color: "rgba(255,255,255,0.22)" }}
        >
          Initializing Systems
        </div>
      </motion.div>

      {/* Loading bar */}
      <motion.div
        className="relative z-10 w-52"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
      >
        <div className="flex justify-between mb-2.5">
          <span
            className="text-[8px] tracking-[0.4em] uppercase"
            style={{ color: "rgba(231,197,138,0.4)" }}
          >
            Loading
          </span>
          <motion.span
            className="text-[8px] tracking-[0.3em] tabular-nums"
            style={{ color: "rgba(231,197,138,0.55)" }}
          >
            {progress}%
          </motion.span>
        </div>
        <div
          className="h-[1px] rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(231,197,138,0.35) 0%, rgba(231,197,138,0.95) 60%, rgba(255,230,190,1) 100%)",
              boxShadow:
                "0 0 8px rgba(231,197,138,0.7), 0 0 16px rgba(231,197,138,0.3)",
            }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
