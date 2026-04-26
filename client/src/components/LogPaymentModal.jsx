import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPaymentMultipart } from '../api/payments'
import { haptics } from '../utils/haptics'

function toInputDate(d) {
  const x = new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function extFromMime(mime) {
  switch (mime) {
    case 'image/jpeg': return 'jpg'
    case 'image/png': return 'png'
    case 'image/gif': return 'gif'
    case 'image/webp': return 'webp'
    default: return 'png'
  }
}

function clipboardItemToFile(item, role) {
  const blob = item.getAsFile()
  if (!blob) return null
  const ext = extFromMime(blob.type)
  const name = `${role}-${Date.now()}.${ext}`
  return new File([blob], name, { type: blob.type || 'image/png' })
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
  const [pasteTarget, setPasteTarget] = useState('sender')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState(null)
  const [pasteFlash, setPasteFlash] = useState(null)
  const modalRef = useRef(null)

  useEffect(() => {
    if (!open || !expectedDateIso) return
    setExpectedDate(toInputDate(new Date(expectedDateIso)))
    setDateReceived(toInputDate(new Date()))
    setAmount(defaultAmount)
    setSource('')
    setNotes('')
    setSenderImage(null)
    setReceiverImage(null)
    setPasteTarget('sender')
    setErr(null)
    setPasteFlash(null)
  }, [open, expectedDateIso, defaultAmount])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const senderPreview = useMemo(() => (senderImage ? URL.createObjectURL(senderImage) : null), [senderImage])
  const receiverPreview = useMemo(() => (receiverImage ? URL.createObjectURL(receiverImage) : null), [receiverImage])
  useEffect(() => () => { if (senderPreview) URL.revokeObjectURL(senderPreview) }, [senderPreview])
  useEffect(() => () => { if (receiverPreview) URL.revokeObjectURL(receiverPreview) }, [receiverPreview])

  useEffect(() => {
    if (!open) return
    function onPaste(e) {
      const items = e.clipboardData?.items
      if (!items) return
      let imageItem = null
      for (const it of items) {
        if (it.kind === 'file' && it.type.startsWith('image/')) {
          imageItem = it
          break
        }
      }
      if (!imageItem) return
      e.preventDefault()

      let target = pasteTarget
      if (!senderImage) target = 'sender'
      else if (!receiverImage) target = 'receiver'

      const file = clipboardItemToFile(imageItem, target)
      if (!file) return

      if (target === 'sender') {
        setSenderImage(file)
        setPasteTarget(receiverImage ? 'sender' : 'receiver')
      } else {
        setReceiverImage(file)
        setPasteTarget('sender')
      }
      setPasteFlash(target)
      haptics.tap()
      setTimeout(() => setPasteFlash(null), 700)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [open, pasteTarget, senderImage, receiverImage])

  if (!open || !expectedDateIso) return null

  function handleClose() {
    haptics.tap()
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErr(null)
    const amt = parseFloat(amount)
    if (Number.isNaN(amt) || amt < 0) {
      setErr('Enter a valid amount.')
      haptics.error()
      return
    }
    if (!senderImage || !receiverImage) {
      setErr('Both confirmation images are required (sender + receiver).')
      haptics.error()
      return
    }
    setSubmitting(true)
    haptics.select()
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
      haptics.success()
      onCreated?.()
      onClose()
    } catch (ex) {
      haptics.error()
      setErr(ex.message || 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex animate-backdrop-in items-end justify-center bg-black/70 backdrop-blur-sm motion-reduce:animate-none sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${formId}-title`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        ref={modalRef}
        className="max-h-[92vh] w-full max-w-lg animate-sheet-in overflow-y-auto overscroll-contain rounded-t-2xl border border-zinc-200 bg-white p-5 shadow-nasa motion-reduce:animate-none dark:border-nasa-cyan/25 dark:bg-nasa-grid dark:shadow-[0_0_0_1px_rgba(0,212,255,0.08),0_24px_64px_-12px_rgba(0,0,0,0.55)] sm:animate-modal-in sm:rounded-2xl sm:p-6"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile only) */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-300 dark:bg-nasa-line sm:hidden" aria-hidden="true" />

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-nasa-red dark:text-nasa-orange">Row log</p>
            <h2 id={`${formId}-title`} className="mt-1 font-sans text-base font-semibold uppercase tracking-wider text-zinc-900 dark:text-white sm:text-lg">
              Attach confirmations
            </h2>
            <p className="mt-1 truncate font-mono text-xs text-zinc-500 dark:text-nasa-mist">
              Expected Friday: <span className="text-nasa-cyan">{expectedDate}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-lg border border-zinc-300 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-600 transition-all duration-200 ease-out hover:border-nasa-cyan hover:bg-zinc-100 active:scale-90 motion-reduce:active:scale-100 dark:border-nasa-line dark:text-nasa-mist dark:hover:bg-nasa-line/40"
            aria-label="Close dialog"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 sm:mt-6">
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-nasa-mist" htmlFor={`${formId}-amt`}>
              Amount (CAD)
            </label>
            <input
              id={`${formId}-amt`}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base font-mono text-zinc-900 outline-none ring-nasa-cyan/40 transition focus:ring-2 dark:border-nasa-line dark:bg-nasa-void/80 dark:text-white"
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
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base font-mono text-zinc-900 outline-none ring-nasa-cyan/40 transition focus:ring-2 dark:border-nasa-line dark:bg-nasa-void/80 dark:text-white"
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
                className="mt-1 w-full cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2.5 text-base font-mono text-zinc-700 dark:border-nasa-line dark:bg-nasa-grid dark:text-nasa-mist"
              />
            </div>
          </div>

          <div className="hidden rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-[11px] text-zinc-600 dark:border-nasa-cyan/30 dark:bg-nasa-void/40 dark:text-nasa-mist sm:block">
            Tip: copy a screenshot, then press <kbd className="rounded border border-zinc-300 bg-white px-1 py-0.5 font-mono text-[10px] dark:border-nasa-line dark:bg-nasa-grid">Ctrl</kbd>+<kbd className="rounded border border-zinc-300 bg-white px-1 py-0.5 font-mono text-[10px] dark:border-nasa-line dark:bg-nasa-grid">V</kbd> to attach. Next paste goes to: <span className="text-nasa-cyan">{(!senderImage ? 'sender' : !receiverImage ? 'receiver' : pasteTarget)}</span>.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ImageSlot
              id={`${formId}-img1`}
              label="Sender confirmation"
              role="sender"
              file={senderImage}
              previewUrl={senderPreview}
              isPasteTarget={(!senderImage) || (senderImage && receiverImage && pasteTarget === 'sender')}
              flashed={pasteFlash === 'sender'}
              onFile={(f) => { haptics.tap(); setSenderImage(f); setPasteTarget('receiver') }}
              onClear={() => { haptics.warn(); setSenderImage(null); setPasteTarget('sender') }}
              onTarget={() => setPasteTarget('sender')}
              accentClass="file:bg-nasa-red hover:file:bg-nasa-orange dark:file:bg-nasa-orange file:text-white"
            />
            <ImageSlot
              id={`${formId}-img2`}
              label="Receiver confirmation"
              role="receiver"
              file={receiverImage}
              previewUrl={receiverPreview}
              isPasteTarget={(senderImage && !receiverImage) || (senderImage && receiverImage && pasteTarget === 'receiver')}
              flashed={pasteFlash === 'receiver'}
              onFile={(f) => { haptics.tap(); setReceiverImage(f); setPasteTarget('sender') }}
              onClear={() => { haptics.warn(); setReceiverImage(null); setPasteTarget('receiver') }}
              onTarget={() => setPasteTarget('receiver')}
              accentClass="file:bg-nasa-cyan/80 hover:file:bg-nasa-cyan file:text-nasa-void"
            />
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
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none ring-nasa-cyan/40 transition focus:ring-2 dark:border-nasa-line dark:bg-nasa-void/80 dark:text-white"
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
              className="mt-1 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none ring-nasa-cyan/40 transition focus:ring-2 dark:border-nasa-line dark:bg-nasa-void/80 dark:text-white"
            />
          </div>

          {err && (
            <p className="animate-fade-up rounded-md border border-nasa-red/40 bg-nasa-red/10 px-3 py-2 font-mono text-sm text-nasa-red">
              {err}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-lg border border-zinc-300 py-3 font-mono text-xs uppercase tracking-widest text-zinc-700 transition-all duration-200 ease-out hover:border-nasa-cyan hover:bg-zinc-50 active:scale-[0.97] motion-reduce:active:scale-100 dark:border-nasa-line dark:text-nasa-mist dark:hover:bg-nasa-line/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-nasa-red py-3 font-sans text-xs font-bold uppercase tracking-[0.2em] text-white shadow-nasa-glow transition-all duration-200 ease-out hover:bg-nasa-orange hover:shadow-[0_0_24px_-4px_rgba(252,61,33,0.55)] active:scale-[0.97] disabled:opacity-50 motion-reduce:active:scale-100 dark:text-black"
            >
              {submitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Spinner /> Transmitting…
                </span>
              ) : (
                'Transmit'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="h-4 w-4 anim-spin-slow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function ImageSlot({ id, label, file, previewUrl, isPasteTarget, flashed, onFile, onClear, onTarget, accentClass }) {
  const ringClass = flashed
    ? 'ring-2 ring-nasa-cyan animate-flash-cyan'
    : isPasteTarget
      ? 'ring-1 ring-nasa-cyan/60'
      : ''
  return (
    <div
      onClick={onTarget}
      className={`group relative rounded-lg border border-zinc-200 bg-white p-2.5 transition dark:border-nasa-line dark:bg-nasa-void/40 ${ringClass}`}
    >
      <label className="block font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-nasa-mist" htmlFor={id}>
        {label}
        {isPasteTarget && <span className="ml-1 text-nasa-cyan">• paste here</span>}
      </label>
      {previewUrl ? (
        <div className="mt-2">
          <img src={previewUrl} alt={label} className="h-28 w-full animate-fade-up rounded-md object-cover motion-reduce:animate-none sm:h-24" />
          <div className="mt-1.5 flex items-center justify-between gap-2 font-mono text-[10px] text-zinc-500 dark:text-nasa-mist">
            <span className="truncate">{file?.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear() }}
              className="shrink-0 rounded border border-zinc-300 px-2 py-1 uppercase tracking-wider text-zinc-600 transition-all duration-150 ease-out hover:border-nasa-red hover:text-nasa-red active:scale-95 motion-reduce:active:scale-100 dark:border-nasa-line dark:text-nasa-mist"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <input
          id={id}
          type="file"
          accept="image/*"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          className={`mt-2 w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-2 file:font-mono file:text-xs file:uppercase dark:text-nasa-mist ${accentClass}`}
        />
      )}
    </div>
  )
}
