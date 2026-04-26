import { useEffect, useState } from 'react'
import { haptics } from '../utils/haptics'

const STORAGE_KEY = 'theme'

function applyTheme(mode) {
  const root = document.documentElement
  if (mode === 'light') root.classList.remove('dark')
  else root.classList.add('dark')
}

export default function Header() {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'light'
    } catch {
      return true
    }
  })

  useEffect(() => {
    applyTheme(dark ? 'dark' : 'light')
    try {
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [dark])

  return (
    <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 dark:border-nasa-line sm:flex-row sm:items-start sm:justify-between sm:pb-6">
      <div className="animate-fade-up">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-nasa-red dark:text-nasa-orange">NASA PUNK // OPS</p>
        <h1 className="mt-1 font-sans text-xl font-bold uppercase tracking-[0.1em] text-zinc-900 dark:text-white sm:text-2xl sm:tracking-[0.12em] lg:text-3xl">
          Mission Payment Tracker
        </h1>
        <p className="mt-2 max-w-xl font-mono text-[11px] leading-relaxed text-zinc-600 dark:text-nasa-mist/90 sm:text-xs">
          Friday cadence · CAD ledger · dual confirmation captures · monthly skip zones
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          haptics.toggle()
          setDark((d) => !d)
        }}
        className="inline-flex animate-fade-up items-center justify-center gap-2 self-start rounded-lg border border-zinc-300 bg-white px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-zinc-800 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-nasa-cyan hover:text-nasa-red hover:shadow-md active:translate-y-0 active:scale-[0.96] motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-sm motion-reduce:active:scale-100 dark:border-nasa-line dark:bg-nasa-grid dark:text-nasa-cyan dark:hover:border-nasa-cyan dark:hover:text-nasa-orange dark:hover:shadow-[0_0_20px_-6px_rgba(0,212,255,0.25)]"
        style={{ animationDelay: '60ms' }}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <span className="inline-flex h-4 w-4 items-center justify-center transition-transform duration-500" style={{ transform: dark ? 'rotate(0deg)' : 'rotate(180deg)' }}>
          {dark ? <SunIcon /> : <MoonIcon />}
        </span>
        {dark ? 'Day mode' : 'Night ops'}
      </button>
    </header>
  )
}

function SunIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  )
}
