import { useEffect, useId, useState } from 'react'
import { createPaymentMultipart } from '../api/payments'

function toInputDate(d) {
  const x = new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function LogPaymentModal({ open, onClose, expectedDateIso, defaultAmount = '2000', onCreated }) {
  const formId = useId()
  const [amount, setAmount] = useState(defaultAmount)
  const [dateReceived, setDateReceived] = useState(() => toInputDate(new Date()))
  const [expectedDate, setExpectedDate] = useState('')
  const [source, setSource] = useState('')
  const [notes, setNotes] = useState('')
  const [senderImage, setSenderImage] = useState(null)
  const [receiverImage, setReceiverImage] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!open || !expectedDateIso) return
    setExpectedDate(toInputDate(new Date(expectedDateIso)))
    setDateReceived(toInputDate(new Date()))
    setAmount(defaultAmount)
    setSource('')
    setNotes('')
    setSenderImage(null)
    setReceiverImage(null)
    setErr(null)
  }, [open, expectedDateIso, defaultAmount])

  if (!open || !expectedDateIso) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setErr(null)
    const amt = parseFloat(amount)
    if (Number.isNaN(amt) || amt < 0) {
      setErr('Enter a valid amount.')
      return
    }
    if (!senderImage || !receiverImage) {
      setErr('Both confirmation images are required (sender + receiver).')
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('amount', String(amt))
      fd.append('dateReceived', dateReceived)
      fd.append('expectedDate', expectedDate)
      fd.append('source', source.trim())
      fd.append('notes', notes.trim())
      fd.append('senderImage', senderImage)
      fd.append('receiverImage', receiverImage)
      await createPaymentMultipart(fd)
      onCreated?.()
      onClose()
    } catch (ex) {
      setErr(ex.message || 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex animate-backdrop-in items-end justify-center bg-black/70 p-4 backdrop-blur-sm motion-reduce:animate-none sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${formId}-title`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg animate-modal-in overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-nasa motion-reduce:animate-none dark:border-nasa-cyan/25 dark:bg-nasa-grid dark:shadow-[0_0_0_1px_rgba(0,212,255,0.08),0_24px_64px_-12px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-nasa-red dark:text-nasa-orange">Row log</p>
            <h2 id={`${formId}-title`} className="mt-1 font-sans text-lg font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
              Attach confirmations
            </h2>
            <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-nasa-mist">
              Expected Friday: <span className="text-nasa-cyan">{expectedDate}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-600 transition-all duration-200 ease-out hover:border-nasa-cyan hover:bg-zinc-100 active:scale-95 dark:border-nasa-line dark:text-nasa-mist dark:hover:bg-nasa-line/40"
            aria-label="Close dialog"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-nasa-mist" htmlFor={`${formId}-amt`}>
              Amount (CAD)
            </label>
            <input
              id={`${formId}-amt`}
              type="number"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-zinc-900 outline-none ring-nasa-cyan/40 transition focus:ring-2 dark:border-nasa-line dark:bg-nasa-void/80 dark:text-white"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-nasa-mist" htmlFor={`${formId}-recv`}>
                Date received
              </label>
              <input
                id={`${formId}-recv`}
                type="date"
                required
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-zinc-900 outline-none ring-nasa-cyan/40 transition focus:ring-2 dark:border-nasa-line dark:bg-nasa-void/80 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-nasa-mist" htmlFor={`${formId}-exp`}>
                Expected (locked)
              </label>
              <input
                id={`${formId}-exp`}
                type="date"
                required
                readOnly
                value={expectedDate}
                className="mt-1 w-full cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 font-mono text-zinc-700 dark:border-nasa-line dark:bg-nasa-grid dark:text-nasa-mist"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-nasa-mist" htmlFor={`${formId}-img1`}>
                Sender confirmation
              </label>
              <input
                id={`${formId}-img1`}
                type="file"
                accept="image/*"
                required
                onChange={(e) => setSenderImage(e.target.files?.[0] ?? null)}
                className="mt-1 w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-nasa-red file:px-3 file:py-2 file:font-mono file:text-xs file:uppercase file:text-white hover:file:bg-nasa-orange dark:text-nasa-mist dark:file:bg-nasa-orange"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-nasa-mist" htmlFor={`${formId}-img2`}>
                Receiver confirmation
              </label>
              <input
                id={`${formId}-img2`}
                type="file"
                accept="image/*"
                required
                onChange={(e) => setReceiverImage(e.target.files?.[0] ?? null)}
                className="mt-1 w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-nasa-cyan/80 file:px-3 file:py-2 file:font-mono file:text-xs file:uppercase file:text-nasa-void hover:file:bg-nasa-cyan dark:text-nasa-mist"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-nasa-mist" htmlFor={`${formId}-src`}>
              Source (optional)
            </label>
            <input
              id={`${formId}-src`}
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-nasa-cyan/40 transition focus:ring-2 dark:border-nasa-line dark:bg-nasa-void/80 dark:text-white"
            />
          </div>
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-nasa-mist" htmlFor={`${formId}-notes`}>
              Notes (optional)
            </label>
            <textarea
              id={`${formId}-notes`}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-nasa-cyan/40 transition focus:ring-2 dark:border-nasa-line dark:bg-nasa-void/80 dark:text-white"
            />
          </div>

          {err && <p className="font-mono text-sm text-nasa-red">{err}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-300 py-2.5 font-mono text-xs uppercase tracking-widest text-zinc-700 transition-all duration-200 ease-out hover:border-nasa-cyan hover:bg-zinc-50 active:scale-[0.98] dark:border-nasa-line dark:text-nasa-mist dark:hover:bg-nasa-line/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-nasa-red py-2.5 font-sans text-xs font-bold uppercase tracking-[0.2em] text-white shadow-nasa-glow transition-all duration-200 ease-out hover:bg-nasa-orange hover:shadow-[0_0_24px_-4px_rgba(252,61,33,0.55)] active:scale-[0.98] disabled:opacity-50 dark:text-black"
            >
              {submitting ? '…' : 'Transmit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
