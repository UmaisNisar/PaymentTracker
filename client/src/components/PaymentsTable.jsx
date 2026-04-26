import { resolveUploadUrl } from '../api/payments'
import { toDateKey } from '../utils/schedule'
import { haptics } from '../utils/haptics'

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

function fmtDateShort(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

const rowBase =
  'motion-reduce:transition-none transition-[background-color,box-shadow] duration-200 ease-out border-b border-zinc-200 dark:border-nasa-line/80 hover:bg-zinc-100/90 dark:hover:bg-white/[0.04] motion-reduce:hover:bg-transparent dark:motion-reduce:hover:bg-transparent'

const statusBadge = {
  Paid: 'bg-emerald-500/20 text-emerald-900 dark:bg-nasa-lime/15 dark:text-nasa-lime',
  Missing: 'bg-nasa-red/20 text-nasa-red dark:bg-nasa-red/25 dark:text-nasa-orange',
  Underpaid: 'bg-nasa-orange/25 text-amber-950 dark:bg-nasa-orange/20 dark:text-nasa-orange',
  Skipped: 'bg-nasa-cyan/15 text-sky-900 dark:bg-nasa-cyan/20 dark:text-nasa-cyan',
}

const statusAccent = {
  Paid: 'border-l-emerald-500/70 dark:border-l-nasa-lime/60',
  Missing: 'border-l-nasa-red/80 animate-pulse-soft motion-reduce:animate-none',
  Underpaid: 'border-l-nasa-orange/80',
  Skipped: 'border-l-nasa-cyan/70',
}

function Thumb({ url, label, onOpen }) {
  const full = resolveUploadUrl(url)
  if (!full)
    return <span className="font-mono text-xs text-zinc-400 dark:text-nasa-mist/50">—</span>
  return (
    <button
      type="button"
      onClick={() => {
        haptics.tap()
        onOpen(full, label)
      }}
      className="group block overflow-hidden rounded border border-zinc-300 transition-all duration-300 ease-out hover:border-nasa-cyan hover:shadow-nasa-glow active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 dark:border-nasa-line dark:hover:border-nasa-cyan dark:hover:shadow-[0_0_16px_-2px_rgba(0,212,255,0.35)]"
    >
      <img
        src={full}
        alt={label}
        className="h-14 w-20 object-cover transition duration-300 group-hover:scale-105"
      />
    </button>
  )
}

function ThumbSm({ url, label, onOpen }) {
  const full = resolveUploadUrl(url)
  if (!full)
    return (
      <div className="flex h-16 w-full items-center justify-center rounded border border-dashed border-zinc-300 bg-zinc-50 font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:border-nasa-line dark:bg-nasa-void/40 dark:text-nasa-mist/50">
        {label}
      </div>
    )
  return (
    <button
      type="button"
      onClick={() => {
        haptics.tap()
        onOpen(full, label)
      }}
      className="group relative block w-full overflow-hidden rounded border border-zinc-300 transition-transform duration-200 ease-out active:scale-95 motion-reduce:active:scale-100 dark:border-nasa-line"
      aria-label={`View ${label}`}
    >
      <img src={full} alt={label} className="h-16 w-full object-cover" />
      <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white">
        {label}
      </span>
    </button>
  )
}

function AttachButton({ onClick, className = '', children = 'Attach' }) {
  return (
    <button
      type="button"
      onClick={() => {
        haptics.select()
        onClick?.()
      }}
      className={`whitespace-nowrap rounded border border-nasa-red/60 bg-nasa-red/10 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-nasa-red transition-all duration-200 ease-out hover:bg-nasa-red hover:text-white hover:shadow-md active:scale-[0.96] motion-reduce:hover:scale-100 motion-reduce:active:scale-100 dark:border-nasa-orange/50 dark:bg-nasa-orange/10 dark:text-nasa-orange dark:hover:bg-nasa-orange dark:hover:text-nasa-void dark:hover:shadow-[0_0_20px_-4px_rgba(255,107,53,0.55)] ${className}`}
    >
      {children}
    </button>
  )
}

function MobileSkeleton() {
  return (
    <div className="space-y-3 sm:hidden">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-nasa-line dark:bg-nasa-grid"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  )
}

export default function PaymentsTable({ rows, loading, error, currency, onViewImage, onAttachRow }) {
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: currency ?? 'CAD' })

  if (error) {
    return (
      <div className="animate-fade-up rounded-xl border border-nasa-red/40 bg-nasa-red/5 p-6 text-center dark:bg-nasa-red/10 sm:p-8">
        <p className="font-sans font-semibold text-nasa-red">Signal lost</p>
        <p className="mt-1 break-words font-mono text-sm text-zinc-600 dark:text-nasa-mist">{error}</p>
      </div>
    )
  }

  if (!loading && rows.length === 0) {
    return (
      <div className="animate-fade-up rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-nasa-line dark:bg-nasa-grid sm:p-12">
        <p className="font-sans text-lg font-medium text-zinc-800 dark:text-white">No Fridays in range</p>
        <p className="mt-2 font-mono text-sm text-zinc-500 dark:text-nasa-mist/80">Adjust month selector.</p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile / small-screen card layout */}
      <div className="sm:hidden">
        {loading ? (
          <MobileSkeleton />
        ) : (
          <ul className="space-y-3">
            {rows.map((row, i) => {
              const key = toDateKey(row.expectedDate)
              const accent = statusAccent[row.status] ?? 'border-l-zinc-300 dark:border-l-nasa-line'
              return (
                <li
                  key={key}
                  className={`animate-fade-up rounded-xl border border-zinc-200 border-l-4 bg-white p-4 shadow-sm transition-shadow duration-200 ease-out active:scale-[0.995] motion-reduce:animate-none motion-reduce:active:scale-100 dark:border-nasa-line dark:bg-nasa-grid ${accent}`}
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-nasa-cyan/70">
                        Expected
                      </p>
                      <p className="font-mono text-sm font-medium text-zinc-900 dark:text-white">
                        {fmtDateShort(row.expectedDate)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${statusBadge[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-nasa-cyan/70">
                        Received
                      </p>
                      <p className="font-mono text-xs text-zinc-800 dark:text-nasa-mist">
                        {fmtDateShort(row.dateReceived)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-nasa-cyan/70">
                        Amount
                      </p>
                      <p className="font-mono tabular-nums text-zinc-900 dark:text-white">
                        {row.amount != null ? money.format(row.amount) : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <ThumbSm url={row.senderImageUrl} label="Sender" onOpen={onViewImage} />
                    <ThumbSm url={row.receiverImageUrl} label="Receiver" onOpen={onViewImage} />
                  </div>

                  <div className="mt-3 flex justify-end">
                    <AttachButton onClick={() => onAttachRow?.(row.expectedDate)}>
                      {row.senderImageUrl || row.receiverImageUrl ? 'Re-attach' : 'Attach'}
                    </AttachButton>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Tablet+ table layout */}
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-nasa transition-shadow duration-300 ease-out hover:shadow-xl motion-reduce:transition-none dark:border-nasa-cyan/20 dark:bg-nasa-grid dark:shadow-nasa dark:hover:shadow-[0_0_0_1px_rgba(0,212,255,0.12),0_16px_48px_-12px_rgba(0,0,0,0.5)] sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100 dark:border-nasa-line dark:bg-nasa-void">
                <th className="px-3 py-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-600 dark:text-nasa-cyan/80">
                  Received
                </th>
                <th className="px-3 py-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-600 dark:text-nasa-cyan/80">
                  Expected
                </th>
                <th className="px-3 py-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-600 dark:text-nasa-cyan/80">
                  Amount
                </th>
                <th className="px-3 py-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-600 dark:text-nasa-cyan/80">
                  Sender
                </th>
                <th className="px-3 py-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-600 dark:text-nasa-cyan/80">
                  Receiver
                </th>
                <th className="px-3 py-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-600 dark:text-nasa-cyan/80">
                  Status
                </th>
                <th className="px-3 py-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-600 dark:text-nasa-cyan/80">
                  Attach
                </th>
              </tr>
            </thead>
            <tbody className={loading ? 'animate-pulse opacity-60' : ''}>
              {rows.map((row, i) => {
                const key = toDateKey(row.expectedDate)
                const rowTint =
                  row.status === 'Missing'
                    ? `${rowBase} bg-nasa-red/[0.06] dark:bg-nasa-red/10`
                    : row.status === 'Underpaid'
                      ? `${rowBase} bg-nasa-orange/[0.08] dark:bg-nasa-orange/10`
                      : row.status === 'Skipped'
                        ? `${rowBase} bg-nasa-cyan/[0.04] dark:bg-nasa-cyan/5`
                        : rowBase
                return (
                  <tr
                    key={key}
                    className={`${rowTint} animate-slide-in motion-reduce:animate-none`}
                    style={{ animationDelay: `${Math.min(i, 10) * 28}ms` }}
                  >
                    <td className="px-3 py-3 font-mono text-xs text-zinc-800 dark:text-nasa-mist">{fmtDate(row.dateReceived)}</td>
                    <td className="px-3 py-3 font-mono text-xs font-medium text-zinc-900 dark:text-white">
                      {fmtDate(row.expectedDate)}
                    </td>
                    <td className="px-3 py-3 font-mono tabular-nums text-zinc-800 dark:text-nasa-mist">
                      {row.amount != null ? money.format(row.amount) : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <Thumb url={row.senderImageUrl} label="Sender confirmation" onOpen={onViewImage} />
                    </td>
                    <td className="px-3 py-2">
                      <Thumb url={row.receiverImageUrl} label="Receiver confirmation" onOpen={onViewImage} />
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${statusBadge[row.status]}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <AttachButton onClick={() => onAttachRow?.(row.expectedDate)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
