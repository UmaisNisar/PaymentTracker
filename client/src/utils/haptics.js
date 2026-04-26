const canVibrate = typeof window !== 'undefined' && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'

let lastFireMs = 0
function fire(pattern) {
  if (!canVibrate) return
  const now = Date.now()
  if (now - lastFireMs < 25) return
  lastFireMs = now
  try {
    navigator.vibrate(pattern)
  } catch {
    /* ignore */
  }
}

export const haptics = {
  tap: () => fire(8),
  select: () => fire(12),
  success: () => fire([10, 40, 20]),
  warn: () => fire([18, 50, 18]),
  error: () => fire([30, 60, 30, 60, 30]),
  toggle: () => fire(14),
}
