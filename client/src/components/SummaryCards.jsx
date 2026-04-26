export default function SummaryCards({ summary, loading }) {
  const currency = summary?.currency ?? 'CAD'
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency })

  const items = [
    { label: 'Total received', value: money.format(summary?.totalReceived ?? 0), tone: 'default' },
    { label: 'Expected total', value: money.format(summary?.expectedTotal ?? 0), tone: 'default' },
    { label: 'Missing', value: String(summary?.missingPayments ?? 0), tone: 'danger' },
    { label: 'Underpaid', value: String(summary?.underpaidPayments ?? 0), tone: 'warn' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {items.map(({ label, value, tone }, i) => (
        <div
          key={label}
          style={{ animationDelay: `${i * 60}ms` }}
          className={[
            'animate-fade-up rounded-xl border p-4 shadow-nasa transition-all duration-300 ease-out sm:p-5',
            'border-zinc-200 bg-white dark:border-nasa-cyan/20 dark:bg-nasa-grid',
            !loading &&
              'motion-reduce:transition-none hover:-translate-y-0.5 hover:border-nasa-cyan/35 hover:shadow-lg active:scale-[0.98] motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 dark:hover:border-nasa-cyan/40 dark:hover:shadow-[0_12px_40px_-8px_rgba(0,212,255,0.12)]',
            tone === 'danger' && 'ring-1 ring-nasa-red/30 dark:shadow-nasa-glow',
            tone === 'warn' && 'ring-1 ring-nasa-orange/30',
            loading && 'animate-pulse opacity-70',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-nasa-cyan/70">
            {label}
          </p>
          <p className="mt-2 font-sans text-xl font-semibold tabular-nums text-zinc-900 dark:text-white sm:text-2xl">
            {value}
          </p>
        </div>
      ))}
    </div>
  )
}
