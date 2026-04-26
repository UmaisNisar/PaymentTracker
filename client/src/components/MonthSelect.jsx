import { useEffect, useId, useRef, useState } from 'react'

const statusStyles = {
  complete: {
    row: 'border-l-4 border-l-emerald-500 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14] dark:bg-emerald-500/10 dark:hover:bg-emerald-500/[0.18]',
    chip: 'bg-emerald-500/20 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-300',
  },
  skipped: {
    row: 'border-l-4 border-l-sky-500 bg-sky-500/[0.08] hover:bg-sky-500/[0.14] dark:border-nasa-cyan dark:bg-nasa-cyan/10 dark:hover:bg-nasa-cyan/[0.18]',
    chip: 'bg-sky-500/20 text-sky-900 dark:bg-nasa-cyan/20 dark:text-nasa-cyan',
  },
  open: {
    row: 'border-l-4 border-l-zinc-300 hover:border-l-nasa-cyan/60 dark:border-l-nasa-line dark:hover:border-l-nasa-cyan/50 dark:hover:bg-white/[0.04]',
    chip: 'bg-zinc-200/80 text-zinc-700 dark:bg-nasa-line/60 dark:text-nasa-mist',
  },
}

const statusTitles = {
  complete: 'All Fridays in this month are fully paid',
  skipped: 'This month is marked as skipped',
  open: 'Missing or underpaid Fridays, or month in progress',
}

/**
 * @param {object} props
 * @param {string} props.value YYYY-MM
 * @param {(v: string) => void} props.onChange
 * @param {{ value: string, monthLabel: string, status: 'open' | 'complete' | 'skipped' }[]} props.options
 */
export default function MonthSelect({ value, onChange, options, labelId }) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const hasOptions = options.length > 0
  const selected = hasOptions
    ? (options.find((o) => o.value === value) ?? options[options.length - 1])
    : null
  const selStyle = selected ? statusStyles[selected.status] : statusStyles.open

  useEffect(() => {
    if (!hasOptions) setOpen(false)
  }, [hasOptions])

  useEffect(() => {
    if (!open || !hasOptions) return
    function onDocMouseDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, hasOptions])

  if (!hasOptions) {
    return (
      <div className="min-w-[min(100%,280px)] rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-500 dark:border-nasa-line dark:bg-nasa-void dark:text-nasa-mist/70">
        No months in range yet
      </div>
    )
  }

  const chipText =
    selected.status === 'complete' ? 'Complete' : selected.status === 'skipped' ? 'Skipped' : 'Open'

  return (
    <div className="relative min-w-[min(100%,280px)]" ref={rootRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId ?? undefined}
        aria-label={labelId ? undefined : 'Select month'}
        onClick={() => setOpen((o) => !o)}
        className={[
          'flex w-full items-center justify-between gap-3 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-left font-mono text-sm text-zinc-900 outline-none ring-2 ring-transparent transition-all duration-200 ease-out',
          'hover:border-nasa-cyan/50 focus-visible:ring-nasa-cyan/40 dark:border-nasa-line dark:bg-nasa-void dark:text-nasa-mist dark:hover:border-nasa-cyan/40',
          open ? 'ring-nasa-cyan/35 dark:ring-nasa-cyan/30' : '',
        ].join(' ')}
      >
        <span className="truncate">{selected.monthLabel}</span>
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${selStyle.chip}`}
          title={statusTitles[selected.status]}
        >
          {chipText}
        </span>
        <span className="shrink-0 text-zinc-400 transition-transform duration-200 dark:text-nasa-mist/60" style={{ transform: open ? 'rotate(180deg)' : undefined }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-40 mt-1 max-h-72 overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-xl dark:border-nasa-line dark:bg-nasa-grid dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.65)]"
        >
          {options.map((o) => {
            const st = statusStyles[o.status]
            const isSel = o.value === value
            const chip =
              o.status === 'complete' ? 'Complete' : o.status === 'skipped' ? 'Skipped' : 'Open'
            return (
              <li key={o.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  title={statusTitles[o.status]}
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={[
                    'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left font-mono text-sm transition-colors duration-150',
                    st.row,
                    isSel ? 'font-semibold text-zinc-900 dark:text-white' : 'text-zinc-800 dark:text-nasa-mist',
                  ].join(' ')}
                >
                  <span className="truncate">{o.monthLabel}</span>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${st.chip}`}>{chip}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
