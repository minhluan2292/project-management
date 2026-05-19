import { useState, useRef, useEffect, useMemo } from 'react'
import {
  parseISO, format, isValid,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameDay, isSameMonth,
} from 'date-fns'
import { vi } from 'date-fns/locale'
import { Calendar as CalIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { classNames } from '../lib/utils'

// value: 'YYYY-MM-DD' or '' ; onChange(string)
export default function DateField({
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  disabled = false,
  className = '',
  size = 'md', // 'md' | 'sm'
  allowClear = true,
  minDate, // 'YYYY-MM-DD'
  maxDate,
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(toDisplay(value))
  const [cursor, setCursor] = useState(value ? parseISO(value) : new Date())
  const ref = useRef(null)

  useEffect(() => { setText(toDisplay(value)); if (value) setCursor(parseISO(value)) }, [value])

  useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const commitText = (raw) => {
    const t = (raw ?? text).trim()
    if (!t) { onChange(''); return }
    const parsed = tryParse(t)
    if (parsed) {
      onChange(format(parsed, 'yyyy-MM-dd'))
      setCursor(parsed)
    } else {
      // revert
      setText(toDisplay(value))
    }
  }

  const min = minDate ? parseISO(minDate) : null
  const max = maxDate ? parseISO(maxDate) : null
  const inRange = (d) => (!min || d >= min) && (!max || d <= max)

  return (
    <div ref={ref} className={classNames('relative', className)}>
      <div className={classNames(
        'flex items-center rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500',
        disabled && 'bg-slate-50 text-slate-400',
        size === 'sm' ? 'h-[34px] px-2' : 'h-[38px] px-3'
      )}>
        <CalIcon size={14} className="text-slate-400 shrink-0 mr-2" />
        <input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          placeholder={placeholder}
          value={text}
          onChange={e => setText(maskInput(e.target.value))}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => commitText()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitText(); setOpen(false) }
            if (e.key === 'Escape') { setText(toDisplay(value)); setOpen(false) }
          }}
          className="flex-1 min-w-0 bg-transparent outline-none text-sm"
        />
        {allowClear && value && !disabled && (
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); setText('') }}
            className="text-slate-400 hover:text-slate-600 ml-1">
            <X size={14} />
          </button>
        )}
      </div>

      {open && !disabled && (
        <div className="absolute z-30 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 w-[280px]">
          <CalendarGrid
            cursor={cursor}
            setCursor={setCursor}
            value={value ? parseISO(value) : null}
            inRange={inRange}
            onPick={(d) => {
              onChange(format(d, 'yyyy-MM-dd'))
              setText(format(d, 'dd/MM/yyyy'))
              setOpen(false)
            }}
          />
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-xs">
            <button type="button"
              onClick={() => {
                const today = new Date()
                if (inRange(today)) {
                  onChange(format(today, 'yyyy-MM-dd'))
                  setText(format(today, 'dd/MM/yyyy'))
                  setCursor(today)
                  setOpen(false)
                }
              }}
              className="text-brand-600 font-medium hover:underline">
              Hôm nay
            </button>
            {value && allowClear && (
              <button type="button"
                onClick={() => { onChange(''); setText(''); setOpen(false) }}
                className="text-slate-500 hover:underline">
                Xoá
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CalendarGrid({ cursor, setCursor, value, inRange, onPick }) {
  const monthStart = startOfMonth(cursor)
  const monthEnd   = endOfMonth(cursor)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd    = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const today = new Date()

  const days = useMemo(() => {
    const arr = []
    let d = gridStart
    while (d <= gridEnd) { arr.push(d); d = addDays(d, 1) }
    return arr
  }, [gridStart, gridEnd])

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setCursor(subMonths(cursor, 1))}
          className="p-1 rounded hover:bg-slate-100 text-slate-500">
          <ChevronLeft size={16} />
        </button>
        <div className="text-sm font-semibold text-slate-700 capitalize">
          {format(cursor, 'MMMM yyyy', { locale: vi })}
        </div>
        <button type="button" onClick={() => setCursor(addMonths(cursor, 1))}
          className="p-1 rounded hover:bg-slate-100 text-slate-500">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-[10px] text-slate-400 uppercase font-semibold mb-1">
        {['T2','T3','T4','T5','T6','T7','CN'].map(d => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map(d => {
          const inMonth = isSameMonth(d, cursor)
          const selected = value && isSameDay(d, value)
          const isToday  = isSameDay(d, today)
          const allowed  = inRange(d)
          return (
            <button
              type="button"
              key={d.toISOString()}
              disabled={!allowed}
              onClick={() => allowed && onPick(d)}
              className={classNames(
                'h-8 w-full rounded text-sm flex items-center justify-center transition',
                !inMonth && 'text-slate-300',
                inMonth && !selected && 'text-slate-700 hover:bg-brand-50',
                selected && 'bg-brand-600 text-white font-semibold',
                !selected && isToday && 'ring-1 ring-brand-300',
                !allowed && 'opacity-30 cursor-not-allowed',
              )}>
              {format(d, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function toDisplay(iso) {
  if (!iso) return ''
  try {
    return format(parseISO(iso), 'dd/MM/yyyy')
  } catch { return '' }
}

function maskInput(raw) {
  // Allow only digits and slash, auto-add slashes
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  let out = ''
  if (digits.length > 0) out += digits.slice(0, 2)
  if (digits.length >= 3) out += '/' + digits.slice(2, 4)
  if (digits.length >= 5) out += '/' + digits.slice(4, 8)
  return out
}

function tryParse(text) {
  // dd/MM/yyyy or dd/MM/yy
  const m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (!m) return null
  let [, dd, mm, yyyy] = m
  const day = parseInt(dd, 10)
  const month = parseInt(mm, 10)
  let year = parseInt(yyyy, 10)
  if (yyyy.length === 2) year = 2000 + year
  const d = new Date(year, month - 1, day)
  if (!isValid(d) || d.getDate() !== day || d.getMonth() !== month - 1) return null
  return d
}
