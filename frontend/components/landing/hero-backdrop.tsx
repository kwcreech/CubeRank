"use client"

import { motion, useReducedMotion } from "motion/react"

/**
 * Full-bleed isometric cube field for the landing hero.
 * Decorative SVG — product atmosphere, not a floating media card.
 */
export function HeroBackdrop() {
  const reduceMotion = useReducedMotion()

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,color-mix(in_oklch,var(--primary)_28%,transparent),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_80%,color-mix(in_oklch,var(--chart-2)_18%,transparent),transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_b,transparent_55%,var(--background)_95%)]" />

      <motion.svg
        className="absolute left-1/2 top-[42%] h-[min(92vw,52rem)] w-[min(140vw,78rem)] -translate-x-1/2 -translate-y-1/2 text-primary/25 dark:text-primary/35"
        viewBox="0 0 1200 700"
        fill="none"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <defs>
          <linearGradient id="cubeFaceA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.55" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="cubeFaceB" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.08" />
          </linearGradient>
          <pattern
            id="stickerGrid"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 28V0H28"
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Center hero cube */}
        <g transform="translate(480 210)">
          <path d="M120 0 L240 70 L120 140 L0 70 Z" fill="url(#cubeFaceA)" />
          <path d="M0 70 L120 140 L120 280 L0 210 Z" fill="url(#cubeFaceB)" />
          <path
            d="M120 140 L240 70 L240 210 L120 280 Z"
            fill="currentColor"
            fillOpacity="0.18"
          />
          <path
            d="M120 0 L240 70 L120 140 L0 70 Z"
            fill="url(#stickerGrid)"
          />
          <path
            d="M120 0 L240 70 L120 140 L0 70 Z M0 70 L120 140 L120 280 L0 210 Z M120 140 L240 70 L240 210 L120 280 Z"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="2"
          />
          <path
            d="M60 35 L180 35 M40 70 L200 70 M60 105 L180 105 M120 0 L120 140 M40 47 L100 82 M140 82 L200 47"
            stroke="currentColor"
            strokeOpacity="0.28"
            strokeWidth="1.5"
          />
        </g>

        {/* Satellite cubes */}
        <g transform="translate(160 120) scale(0.45)" opacity="0.7">
          <path d="M120 0 L240 70 L120 140 L0 70 Z" fill="url(#cubeFaceA)" />
          <path d="M0 70 L120 140 L120 280 L0 210 Z" fill="url(#cubeFaceB)" />
          <path
            d="M120 140 L240 70 L240 210 L120 280 Z"
            fill="currentColor"
            fillOpacity="0.15"
          />
        </g>
        <g transform="translate(880 160) scale(0.38)" opacity="0.55">
          <path d="M120 0 L240 70 L120 140 L0 70 Z" fill="url(#cubeFaceA)" />
          <path d="M0 70 L120 140 L120 280 L0 210 Z" fill="url(#cubeFaceB)" />
          <path
            d="M120 140 L240 70 L240 210 L120 280 Z"
            fill="currentColor"
            fillOpacity="0.15"
          />
        </g>
        <g transform="translate(120 420) scale(0.32)" opacity="0.4">
          <path d="M120 0 L240 70 L120 140 L0 70 Z" fill="url(#cubeFaceA)" />
          <path d="M0 70 L120 140 L120 280 L0 210 Z" fill="url(#cubeFaceB)" />
          <path
            d="M120 140 L240 70 L240 210 L120 280 Z"
            fill="currentColor"
            fillOpacity="0.15"
          />
        </g>
        <g transform="translate(920 400) scale(0.5)" opacity="0.45">
          <path d="M120 0 L240 70 L120 140 L0 70 Z" fill="url(#cubeFaceA)" />
          <path d="M0 70 L120 140 L120 280 L0 210 Z" fill="url(#cubeFaceB)" />
          <path
            d="M120 140 L240 70 L240 210 L120 280 Z"
            fill="currentColor"
            fillOpacity="0.15"
          />
        </g>
      </motion.svg>

      {!reduceMotion ? (
        <motion.div
          className="absolute left-[18%] top-[28%] size-2 rounded-full bg-primary/50"
          animate={{ y: [0, -10, 0], opacity: [0.35, 0.8, 0.35] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
      {!reduceMotion ? (
        <motion.div
          className="absolute right-[22%] top-[36%] size-1.5 rounded-full bg-chart-2/60"
          animate={{ y: [0, 12, 0], opacity: [0.3, 0.75, 0.3] }}
          transition={{
            duration: 6.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.8,
          }}
        />
      ) : null}
    </div>
  )
}
