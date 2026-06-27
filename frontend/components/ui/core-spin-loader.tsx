'use client'

import React, { useState, useEffect } from 'react'

interface CoreSpinLoaderProps {
  title?: string
  messages?: string[]
}

const DEFAULT_MESSAGES = ['Loading...', 'Fetching Data..', 'Syncing...', 'Processing..', 'Optimizing...']

export function CoreSpinLoader({ title, messages = DEFAULT_MESSAGES }: CoreSpinLoaderProps) {
  const [loadingText, setLoadingText] = useState(messages[0])

  useEffect(() => {
    setLoadingText(messages[0])
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % messages.length
      setLoadingText(messages[i])
    }, 1000)
    return () => clearInterval(interval)
  }, [messages])

  return (
    <div className="flex flex-col items-center justify-center min-h-[260px] gap-6 py-10">
      {title && (
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/50 text-center mb-2">
          {title}
        </p>
      )}

      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Base Glow */}
        <div className="
          absolute inset-0 rounded-full blur-xl animate-pulse
          dark:bg-cyan-500/10
          bg-emerald-400/15
        " />

        {/* Outer Dashed Ring */}
        <div className="
          absolute inset-0 rounded-full border border-dashed
          dark:border-cyan-500/20
          border-emerald-500/40
          animate-[spin_10s_linear_infinite]
        " />

        {/* Main Arc */}
        <div className="
          absolute inset-1 rounded-full border-2 border-transparent
          dark:border-t-cyan-400
          border-t-emerald-500
          dark:shadow-[0_0_10px_rgba(34,211,238,0.4)]
          shadow-[0_0_6px_rgba(16,185,129,0.5)]
          animate-[spin_2s_linear_infinite]
        " />

        {/* Reverse Arc */}
        <div className="
          absolute inset-3 rounded-full border-2 border-transparent
          dark:border-b-purple-500
          border-b-green-600
          dark:shadow-[0_0_10px_rgba(168,85,247,0.4)]
          shadow-[0_0_6px_rgba(22,163,74,0.4)]
          animate-[spin_3s_linear_infinite_reverse]
        " />

        {/* Inner Fast Ring */}
        <div className="
          absolute inset-5 rounded-full border border-transparent
          dark:border-l-white/50
          border-l-green-700/60
          animate-[spin_1s_ease-in-out_infinite]
        " />

        {/* Orbital Dot */}
        <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
          <div className="
            absolute top-0 left-1/2 -translate-x-1/2
            w-1 h-1 rounded-full
            dark:bg-cyan-400
            bg-emerald-600
            dark:shadow-[0_0_6px_rgba(34,211,238,0.8)]
            shadow-[0_0_4px_rgba(16,185,129,0.9)]
          " />
        </div>

        {/* Center Core */}
        <div className="
          absolute w-2 h-2 rounded-full animate-pulse
          dark:bg-white
          bg-emerald-700
          dark:shadow-[0_0_10px_rgba(255,255,255,0.8)]
          shadow-[0_0_6px_rgba(16,185,129,0.6)]
        " />
      </div>

      {/* Cycling message */}
      <div className="flex flex-col items-center gap-1 h-8 justify-center">
        <span
          key={loadingText}
          className="
            text-[10px] font-medium tracking-[0.3em] uppercase
            dark:text-cyan-200/70
            text-emerald-700
            animate-[fadeSlideIn_0.5s_ease_both]
          "
        >
          {loadingText}
        </span>
      </div>
    </div>
  )
}
