import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchPayments,
  fetchSkippedMonths,
  fetchSummary,
  skipMonth,
  unskipMonth,
} from './api/payments'
import Header from './components/Header'
import ImageLightbox from './components/ImageLightbox'
import LogPaymentModal from './components/LogPaymentModal'
import MonthSelect from './components/MonthSelect'
import PaymentsTable from './components/PaymentsTable'
import SummaryCards from './components/SummaryCards'
import WakingIndicator from './components/WakingIndicator'
import { getFridaysInMonth, parseYearMonth, toDateKey } from './utils/schedule'
import { haptics } from './utils/haptics'

/** First month shown in the UI (payments start in 2026). */
const TRACKING_FIRST_MONTH = new Date(2026, 0, 1)

function currentYearMonth() {
  const d = new Date()
  const t = d < TRACKING_FIRST_MONTH ? new Date(TRACKING_FIRST_MONTH) : d
  const y = t.getFullYear()
  const m = String(t.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** Months from tracking start through the current calendar month only (no future months). */
function monthOptions() {
  const out = []
  const now = new Date()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  for (
    let d = new Date(TRACKING_FIRST_MONTH);
    d <= lastMonthStart;
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  ) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const v = `${y}-${m}`
    out.push({ value: v, label: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) })
  }
  return out
}

function pickPaymentForDay(payments, year, month) {
  const map = {}
  for (const p of payments) {
    const d = new Date(p.expectedDate)
    if (d.getFullYear() !== year || d.getMonth() + 1 !== month) continue
    const k = toDateKey(d)
    const cur = map[k]
    if (!cur || new Date(p.dateReceived) > new Date(cur.dateReceived)) map[k] = p
  }
  return map
}

function isMonthSkippedYearMonth(year, month, skippedList) {
  return skippedList.some((s) => s.year === year && s.month === month)
}

/** Every Friday in the calendar month has a payment at or above the expected weekly amount. */
function isMonthComplete(year, month, payments, skippedList, expectedWeekly) {
  if (isMonthSkippedYearMonth(year, month, skippedList)) return false
  const fridays = getFridaysInMonth(year, month - 1)
  if (fridays.length === 0) return false
  const byDay = pickPaymentForDay(payments, year, month)
  for (const friday of fridays) {
    const k = toDateKey(friday)
    const p = byDay[k]
    if (!p || p.amount < expectedWeekly) return false
  }
  return true
}

export default function App() {
  const [month, setMonth] = useState(currentYearMonth)
  const [payments, setPayments] = useState([])
  const [summary, setSummary] = useState(null)
  const [skippedList, setSkippedList] = useState([])
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [skipBusy, setSkipBusy] = useState(false)
  const [logExpectedIso, setLogExpectedIso] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setSummaryLoading(true)
    setError(null)
    try {
      const [list, sum, skipped] = await Promise.all([
        fetchPayments(),
        fetchSummary(month),
        fetchSkippedMonths(),
      ])
      setPayments(Array.isArray(list) ? list : [])
      setSummary(sum)
      setSkippedList(Array.isArray(skipped) ? skipped : [])
    } catch (e) {
      setError(e.message || 'Failed to load data')
      setPayments([])
      setSummary(null)
      setSkippedList([])
    } finally {
      setLoading(false)
      setSummaryLoading(false)
    }
  }, [month])

  useEffect(() => {
    refresh()
  }, [refresh])

  const { year: y, month: mNum } = parseYearMonth(month)
  const monthSkipped = skippedList.some((s) => s.year === y && s.month === mNum)

  const rows = useMemo(() => {
    const { year, month: m } = parseYearMonth(month)
    const fridays = getFridaysInMonth(year, m - 1)
    const expectedWeekly = summary?.expectedWeeklyAmount ?? 2000
    const byDay = pickPaymentForDay(payments, year, m)
    const skippedMonth = summary?.monthSkipped === true

    return fridays.map((friday) => {
      const k = toDateKey(friday)
      const p = byDay[k]
      if (skippedMonth) {
        return {
          expectedDate: friday.toISOString(),
          dateReceived: p?.dateReceived ?? null,
          amount: p?.amount ?? null,
          senderImageUrl: p?.senderImageUrl ?? null,
          receiverImageUrl: p?.receiverImageUrl ?? null,
          status: 'Skipped',
        }
      }
      if (!p) {
        return {
          expectedDate: friday.toISOString(),
          dateReceived: null,
          amount: null,
          senderImageUrl: null,
          receiverImageUrl: null,
          status: 'Missing',
        }
      }
      const status = p.amount < expectedWeekly ? 'Underpaid' : 'Paid'
      return {
        expectedDate: p.expectedDate,
        dateReceived: p.dateReceived,
        amount: p.amount,
        senderImageUrl: p.senderImageUrl ?? null,
        receiverImageUrl: p.receiverImageUrl ?? null,
        status,
      }
    })
  }, [month, payments, summary])

  const hasNoPaymentsEver = !loading && payments.length === 0 && !error

  async function handleSkipToggle() {
    setSkipBusy(true)
    haptics.select()
    try {
      if (monthSkipped) await unskipMonth(y, mNum)
      else await skipMonth(y, mNum)
      haptics.success()
      await refresh()
    } catch (e) {
      haptics.error()
      setError(e.message || 'Skip action failed')
    } finally {
      setSkipBusy(false)
    }
  }

  const defaultAmountStr =
    summary?.expectedWeeklyAmount != null ? String(summary.expectedWeeklyAmount) : '2000'

  const expectedWeeklyForLabels = summary?.expectedWeeklyAmount ?? 2000

  const calendarMonthKey = `${new Date().getFullYear()}-${new Date().getMonth()}`

  const monthSelectOptions = useMemo(
    () =>
      monthOptions().map((o) => {
        const { year, month: m } = parseYearMonth(o.value)
        let status = 'open'
        if (isMonthSkippedYearMonth(year, m, skippedList)) status = 'skipped'
        else if (isMonthComplete(year, m, payments, skippedList, expectedWeeklyForLabels)) status = 'complete'
        return { value: o.value, monthLabel: o.label, status }
      }),
    [payments, skippedList, expectedWeeklyForLabels, calendarMonthKey],
  )

  useEffect(() => {
    if (monthSelectOptions.length === 0) return
    if (!monthSelectOptions.some((o) => o.value === month)) {
      setMonth(monthSelectOptions[monthSelectOptions.length - 1].value)
    }
  }, [monthSelectOptions, month])

  return (
    <div
      className="relative mx-auto min-h-screen max-w-6xl px-4 pb-safe pt-safe sm:px-6 lg:px-8"
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
    >
      <div className="scanlines" aria-hidden="true" />
      <div className="py-5 sm:py-7">
        <Header />
      </div>

      <WakingIndicator loading={loading} />

      <div className="mt-2 flex flex-col gap-3 sm:mt-6 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 lg:w-auto">
          <span id="month-field-label" className="font-mono text-[11px] uppercase tracking-widest text-zinc-600 dark:text-nasa-mist sm:text-xs">
            Month
          </span>
          <div className="min-w-0 flex-1 lg:flex-initial">
            <MonthSelect
              labelId="month-field-label"
              value={month}
              onChange={setMonth}
              options={monthSelectOptions}
            />
          </div>
          {monthSkipped && (
            <span className="animate-fade-up rounded border border-nasa-cyan/40 bg-nasa-cyan/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-nasa-cyan">
              Month skipped
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={skipBusy}
            onClick={handleSkipToggle}
            className="w-full rounded-lg border border-zinc-400 bg-zinc-100 px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-zinc-800 transition-all duration-200 ease-out hover:border-nasa-cyan hover:text-nasa-red hover:shadow-sm active:scale-[0.97] disabled:opacity-50 motion-reduce:active:scale-100 dark:border-nasa-line dark:bg-nasa-grid dark:text-nasa-mist dark:hover:border-nasa-orange dark:hover:text-nasa-orange dark:hover:shadow-[0_0_16px_-8px_rgba(255,107,53,0.2)] sm:w-auto"
          >
            {skipBusy ? (
              <span className="inline-flex items-center gap-2">
                <span className="anim-spin-slow inline-block h-3 w-3 rounded-full border-2 border-current border-r-transparent" />
                Working…
              </span>
            ) : monthSkipped ? (
              'Unskip month'
            ) : (
              'Skip whole month'
            )}
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        <SummaryCards summary={summary} loading={summaryLoading} />
      </div>

      {hasNoPaymentsEver && (
        <div className="mt-6 animate-fade-up rounded-xl border border-nasa-line bg-white p-5 text-center transition-all duration-300 ease-out dark:border-nasa-cyan/20 dark:bg-nasa-grid dark:hover:border-nasa-cyan/35 sm:mt-8 sm:p-6">
          <p className="font-sans font-semibold text-zinc-900 dark:text-white">No transmissions yet</p>
          <p className="mt-2 font-mono text-sm text-zinc-600 dark:text-nasa-mist">
            Use <strong className="text-nasa-orange">Attach</strong> on a Friday row to add sender + receiver screenshots and transmit.
          </p>
        </div>
      )}

      <div className="mt-6 sm:mt-8">
        <h2 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-nasa-cyan/70">
          Friday schedule
        </h2>
        <PaymentsTable
          rows={rows}
          loading={loading}
          error={error}
          currency={summary?.currency ?? 'CAD'}
          onViewImage={(src, label) => setLightbox({ src, label })}
          onAttachRow={(expectedDateIso) => setLogExpectedIso(expectedDateIso)}
        />
      </div>

      <LogPaymentModal
        open={!!logExpectedIso}
        expectedDateIso={logExpectedIso}
        defaultAmount={defaultAmountStr}
        onClose={() => setLogExpectedIso(null)}
        onCreated={() => refresh()}
      />

      <ImageLightbox
        src={lightbox?.src}
        label={lightbox?.label}
        onClose={() => setLightbox(null)}
      />
    </div>
  )
}
