import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, X, Check, ChevronDown } from 'lucide-react'
import { classNames } from '../lib/utils'

// options: [{ value, label, sub?, avatarName?, group? }]

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Chọn...',
  emptyText = 'Không tìm thấy',
  renderOption,
  renderValue,
  disabled,
  allowClear = true,
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 0) }, [open])

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase()
    if (!k) return options
    return options.filter(o =>
      `${o.label} ${o.sub || ''} ${o.value}`.toLowerCase().includes(k)
    )
  }, [q, options])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className={classNames(
          'input flex items-center justify-between text-left gap-2',
          disabled && 'bg-slate-50 text-slate-400 cursor-not-allowed',
          !selected && 'text-slate-400'
        )}>
        <span className="truncate min-w-0">
          {selected
            ? (renderValue ? renderValue(selected) : <span className="text-slate-700">{selected.label}</span>)
            : placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {allowClear && selected && !disabled && (
            <X size={14} className="text-slate-400 hover:text-slate-600"
              onClick={(e) => { e.stopPropagation(); onChange('') }} />
          )}
          <ChevronDown size={14} className="text-slate-400" />
        </span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full pl-8 pr-2 py-1.5 text-sm rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-sm text-slate-400 text-center">{emptyText}</div>
            )}
            {filtered.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); setQ('') }}
                className={classNames(
                  'w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50',
                  value === o.value && 'bg-brand-50 text-brand-700'
                )}>
                <span className="flex-1 min-w-0">
                  {renderOption ? renderOption(o) : <DefaultRow option={o} />}
                </span>
                {value === o.value && <Check size={14} className="text-brand-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function SearchableMultiSelect({
  value = [],
  onChange,
  options,
  placeholder = 'Chọn...',
  emptyText = 'Không tìm thấy',
  renderOption,
  showSelectAll = true,
  maxChipsVisible = 3,
  size = 'md', // 'md' | 'sm'
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 0) }, [open])

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase()
    if (!k) return options
    return options.filter(o =>
      `${o.label} ${o.sub || ''} ${o.value}`.toLowerCase().includes(k)
    )
  }, [q, options])

  const toggle = (v) => {
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  }
  const clearAll = () => onChange([])
  const selectAllFiltered = () => {
    const ids = filtered.map(o => o.value)
    const merged = Array.from(new Set([...value, ...ids]))
    onChange(merged)
  }
  const clearFiltered = () => {
    const ids = new Set(filtered.map(o => o.value))
    onChange(value.filter(x => !ids.has(x)))
  }

  const selectedOpts = options.filter(o => value.includes(o.value))
  const shownChips = selectedOpts.slice(0, maxChipsVisible)
  const restChips  = selectedOpts.length - shownChips.length

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={classNames(
          'w-full rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500',
          size === 'sm' ? 'min-h-[34px] px-2 py-1' : 'min-h-[38px] px-2 py-1.5',
          'text-left'
        )}>
        <div className="flex items-center gap-1.5 flex-wrap">
          {selectedOpts.length === 0 && <span className="text-slate-400 px-1">{placeholder}</span>}
          {shownChips.map(o => (
            <span key={o.value}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs">
              {o.label}
              <X size={12} className="opacity-60 hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); toggle(o.value) }} />
            </span>
          ))}
          {restChips > 0 && (
            <span className="text-xs text-slate-500">+{restChips}</span>
          )}
          <span className="ml-auto flex items-center gap-1 text-slate-400">
            {selectedOpts.length > 0 && (
              <X size={14} className="hover:text-slate-600"
                onClick={(e) => { e.stopPropagation(); clearAll() }} title="Bỏ chọn tất cả"/>
            )}
            <ChevronDown size={14} />
          </span>
        </div>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Tìm tên..."
                className="w-full pl-8 pr-2 py-1.5 text-sm rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            {showSelectAll && filtered.length > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <button type="button" onClick={selectAllFiltered}
                  className="px-2 py-1 rounded hover:bg-slate-100 text-brand-600">Chọn hết</button>
                <button type="button" onClick={clearFiltered}
                  className="px-2 py-1 rounded hover:bg-slate-100 text-slate-500">Bỏ</button>
              </div>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-sm text-slate-400 text-center">{emptyText}</div>
            )}
            {filtered.map(o => {
              const checked = value.includes(o.value)
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
                  className={classNames(
                    'w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50',
                    checked && 'bg-brand-50/40'
                  )}>
                  <input type="checkbox" readOnly checked={checked}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  <span className="flex-1 min-w-0">
                    {renderOption ? renderOption(o) : <DefaultRow option={o} />}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{value.length} đã chọn</span>
            <button type="button" onClick={() => setOpen(false)}
              className="text-brand-600 font-medium hover:underline">Xong</button>
          </div>
        </div>
      )}
    </div>
  )
}

function DefaultRow({ option }) {
  return (
    <div className="min-w-0">
      <div className="text-slate-800 truncate">{option.label}</div>
      {option.sub && <div className="text-xs text-slate-500 truncate">{option.sub}</div>}
    </div>
  )
}
