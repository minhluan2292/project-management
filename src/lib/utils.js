// Tiện ích chung
import { format, parseISO, differenceInDays } from 'date-fns'
import { vi } from 'date-fns/locale'

export function fmtDate(iso, pattern = 'dd/MM/yyyy') {
  if (!iso) return ''
  try {
    return format(typeof iso === 'string' ? parseISO(iso) : iso, pattern, { locale: vi })
  } catch {
    return iso
  }
}

export function fmtCurrency(n) {
  if (n == null) return ''
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
}

export function daysBetween(a, b) {
  return differenceInDays(parseISO(b), parseISO(a))
}

export function classNames(...xs) {
  return xs.filter(Boolean).join(' ')
}

export function avatarColor(seed) {
  const colors = ['bg-rose-500','bg-orange-500','bg-amber-500','bg-emerald-500','bg-teal-500','bg-sky-500','bg-blue-500','bg-indigo-500','bg-violet-500','bg-pink-500']
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return colors[h % colors.length]
}

export function initials(name) {
  return name.split(' ').slice(-2).map(s => s[0]).join('').toUpperCase()
}
