import { useEffect, useRef, useState } from 'react'

const SHOW_DELAY_MS = 800
const HINT_DELAY_MS = 5000
const TIME_CONSTANT_MS = 18000
const CAP = 0.95
const FINISH_HOLD_MS = 350

function computeFakeProgress(elapsedMs) {
  const p = 1 - Math.exp(-elapsedMs / TIME_CONSTANT_MS)
  return Math.min(p, CAP)
}

export default function WakingIndicator({ loading }) {
  const [visible, setVisible] = useState(false)
  const [percent, setPercent] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const startRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!loading) {
      if (visible) {
        setFinishing(true)
        setPercent(1)
        const t = setTimeout(() => {
          setVisible(false)
          setFinishing(false)
          setPercent(0)
          setShowHint(false)
          startRef.current = null
        }, FINISH_HOLD_MS)
        return () => clearTimeout(t)
      }
      return
    }

    startRef.current = performance.now()
    setFinishing(false)

    const showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    const hintTimer = setTimeout(() => setShowHint(true), HINT_DELAY_MS)

    const tick = () => {
      const elapsed = performance.now() - (startRef.current ?? performance.now())
      setPercent(computeFakeProgress(elapsed))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hintTimer)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [loading, visible])

  if (!visible) return null

  const pctText = Math.round(percent * 100)

  return (
    <div
      role="status"
      aria-live="polite"
      className={`mt-4 overflow-hidden rounded-xl border border-nasa-cyan/40 bg-white/80 shadow-sm backdrop-blur transition-opacity duration-300 ease-out dark:border-nasa-cyan/30 dark:bg-nasa-grid/80 ${
        finishing ? 'opacity-0' : 'animate-fade-up opacity-100'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
        <span className="anim-spin-slow inline-block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-nasa-cyan border-r-transparent" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate font-mono text-[11px] uppercase tracking-widest text-zinc-700 dark:text-nasa-cyan">
              {finishing ? 'Linked' : 'Waking server'}
            </p>
            <p className="font-mono text-[11px] tabular-nums text-zinc-700 dark:text-nasa-cyan">
              {pctText}%
            </p>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded bg-zinc-200 dark:bg-nasa-void">
            <div
              className="h-full bg-nasa-cyan transition-[width] duration-200 ease-out"
              style={{ width: `${pctText}%` }}
            />
          </div>
          {showHint && !finishing && (
            <p className="mt-1.5 font-mono text-[10px] text-zinc-500 dark:text-nasa-mist/70">
              Free tier — first load can take 30–60s while the API spins up.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
