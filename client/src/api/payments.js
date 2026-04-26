export const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5280'

async function handle(res) {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  const ct = res.headers.get('content-type')
  if (ct?.includes('application/json')) return res.json()
  return null
}

export function resolveUploadUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${apiBase}${path}`
}

export async function fetchPayments() {
  const res = await fetch(`${apiBase}/payments`)
  return handle(res)
}

export async function fetchSummary(month) {
  const q = new URLSearchParams({ month })
  const res = await fetch(`${apiBase}/payments/summary?${q}`)
  return handle(res)
}

export async function fetchSkippedMonths() {
  const res = await fetch(`${apiBase}/skipped-months`)
  return handle(res)
}

export async function skipMonth(year, month) {
  const res = await fetch(`${apiBase}/skipped-months`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, month }),
  })
  return handle(res)
}

export async function unskipMonth(year, month) {
  const res = await fetch(`${apiBase}/skipped-months/${year}/${month}`, { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
}

/** @param {FormData} formData */
export async function createPaymentMultipart(formData) {
  const res = await fetch(`${apiBase}/payments`, {
    method: 'POST',
    body: formData,
  })
  return handle(res)
}
