import { useEffect } from 'react'
import { X } from 'lucide-react'
import { classNames } from '../lib/utils'

export default function Modal({ open, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto"
         onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={classNames(
          'relative w-full bg-white rounded-xl shadow-xl border border-slate-200 my-8',
          widths[size]
        )}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function Field({ label, required, error, children }) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-700 mb-1">
        {label}{required && <span className="text-rose-500"> *</span>}
      </div>
      {children}
      {error && <div className="text-xs text-rose-600 mt-1">{error}</div>}
    </label>
  )
}

export function MultiSelect({ value = [], options, onChange, placeholder = 'Chọn...' }) {
  const toggle = (id) => {
    onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id])
  }
  return (
    <div className="border border-slate-200 rounded-lg p-2 max-h-44 overflow-y-auto bg-white">
      {options.length === 0 && <div className="text-sm text-slate-400 px-2 py-1">{placeholder}</div>}
      {options.map(opt => (
        <label key={opt.value}
          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            checked={value.includes(opt.value)}
            onChange={() => toggle(opt.value)}
          />
          <span className="text-sm text-slate-700">{opt.label}</span>
        </label>
      ))}
    </div>
  )
}
