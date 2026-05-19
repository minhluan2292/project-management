import { classNames } from '../lib/utils'

export function Badge({ children, className = '' }) {
  return <span className={classNames('badge', className)}>{children}</span>
}

export function StatusBadge({ meta }) {
  if (!meta) return null
  return <Badge className={meta.color}>{meta.label}</Badge>
}

export function ProgressBar({ value = 0, className = '' }) {
  const v = Math.max(0, Math.min(100, value))
  let bar = 'bg-brand-500'
  if (v >= 100) bar = 'bg-emerald-500'
  else if (v < 30) bar = 'bg-rose-500'
  else if (v < 60) bar = 'bg-amber-500'
  return (
    <div className={classNames('h-1.5 w-full bg-slate-100 rounded-full overflow-hidden', className)}>
      <div className={classNames('h-full transition-all', bar)} style={{ width: `${v}%` }} />
    </div>
  )
}

export function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 break-words">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

export function EmptyState({ title, description, icon: Icon }) {
  return (
    <div className="card p-10 text-center">
      {Icon && (
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <Icon size={20} />
        </div>
      )}
      <div className="text-slate-700 font-medium">{title}</div>
      {description && <div className="text-sm text-slate-500 mt-1">{description}</div>}
    </div>
  )
}
