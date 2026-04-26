/** @returns {Date[]} Fridays in the given calendar month (local time). */
export function getFridaysInMonth(year, monthIndex0) {
  const fridays = []
  const d = new Date(year, monthIndex0, 1)
  while (d.getMonth() === monthIndex0) {
    if (d.getDay() === 5) fridays.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return fridays
}

export function toDateKey(d) {
  const x = d instanceof Date ? d : new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseYearMonth(ym) {
  const [y, m] = ym.split('-').map(Number)
  return { year: y, month: m }
}
