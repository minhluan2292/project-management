import { useMemo, useState } from 'react'
import { differenceInDays, parseISO, addMonths, format, startOfMonth } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Filter } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { projectStatusMeta } from '../data/mock'
import { fmtDate, classNames } from '../lib/utils'
import { PageHeader, Badge, ProgressBar } from '../components/UI'

const ROW_H = 40
const DAY_W = 6 // px per day - kept tight to fit a year on screen

export default function Timeline() {
  const { projects, tasks, memberById } = useStore()
  const [scope, setScope] = useState('projects') // projects | tasks
  const [filter, setFilter] = useState('all')

  // Determine timeline range
  const range = useMemo(() => {
    const all = scope === 'projects' ? projects : tasks
    const starts = all.map(x => x.startDate)
    const ends   = all.map(x => x.endDate || x.dueDate)
    const min = starts.reduce((a, b) => a < b ? a : b)
    const max = ends.reduce((a, b) => a > b ? a : b)
    const start = startOfMonth(parseISO(min))
    const end = parseISO(max)
    const totalDays = differenceInDays(end, start) + 30
    return { start, end, totalDays }
  }, [scope, projects, tasks])

  // Build month markers
  const months = useMemo(() => {
    const arr = []
    let d = range.start
    while (d <= range.end) {
      const next = addMonths(d, 1)
      const startOffset = differenceInDays(d, range.start)
      const days = differenceInDays(next, d)
      arr.push({ label: format(d, 'MMM yyyy', { locale: vi }), startOffset, days })
      d = next
    }
    return arr
  }, [range])

  const items = useMemo(() => {
    const all = scope === 'projects' ? projects : tasks
    return all.filter(x => {
      if (filter === 'all') return true
      if (scope === 'projects') return x.status === filter
      return x.status === filter
    })
  }, [scope, filter, projects, tasks])

  const todayOffset = differenceInDays(parseISO('2026-05-19'), range.start)

  return (
    <div>
      <PageHeader
        title="Timeline"
        description="Góc nhìn Gantt cho tiến độ dự án và công việc"
      />

      <div className="card p-3 mb-5 flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
          <button onClick={() => setScope('projects')}
            className={classNames('px-3 py-1.5 rounded-md text-sm', scope === 'projects' && 'bg-white shadow-sm font-semibold')}>Dự án</button>
          <button onClick={() => setScope('tasks')}
            className={classNames('px-3 py-1.5 rounded-md text-sm', scope === 'tasks' && 'bg-white shadow-sm font-semibold')}>Công việc</button>
        </div>
        <Filter size={14} className="text-slate-400" />
        <select className="input flex-1 sm:flex-none sm:w-44" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">Mọi trạng thái</option>
          {scope === 'projects'
            ? Object.entries(projectStatusMeta).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)
            : ['backlog','todo','in_progress','review','done'].map(k => <option key={k} value={k}>{k}</option>)
          }
        </select>
        <div className="text-xs text-slate-500 w-full sm:w-auto sm:ml-auto">
          {fmtDate(range.start)} → {fmtDate(range.end)} · {items.length} mục
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: 480 + range.totalDays * DAY_W }}>
            {/* Header months */}
            <div className="flex border-b border-slate-200 sticky top-0 bg-white z-10">
              <div className="w-44 sm:w-72 shrink-0 px-3 sm:px-4 py-2 text-[11px] sm:text-xs uppercase font-semibold text-slate-500 border-r border-slate-200">
                {scope === 'projects' ? 'Dự án' : 'Công việc'}
              </div>
              <div className="relative flex-1 h-9">
                {months.map((m, i) => (
                  <div key={i}
                    className={classNames(
                      'absolute top-0 h-full border-r border-slate-100 flex items-center text-xs font-medium text-slate-500 px-2',
                      i % 2 === 0 ? 'bg-slate-50/40' : 'bg-white'
                    )}
                    style={{ left: m.startOffset * DAY_W, width: m.days * DAY_W }}>
                    {m.label}
                  </div>
                ))}
                {/* today line in header */}
                <div className="absolute top-0 bottom-0 border-l-2 border-rose-400"
                  style={{ left: todayOffset * DAY_W }} />
              </div>
            </div>

            {/* Rows */}
            <div>
              {items.map((item, i) => <Row key={item.id} item={item} scope={scope} range={range} index={i} todayOffset={todayOffset} memberById={memberById} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ item, scope, range, index, todayOffset, memberById }) {
  const isProj = scope === 'projects'
  const startISO = item.startDate
  const endISO   = isProj ? item.endDate : item.dueDate
  const offset = differenceInDays(parseISO(startISO), range.start)
  const length = Math.max(1, differenceInDays(parseISO(endISO), parseISO(startISO)))

  const colorMap = {
    planning: 'bg-slate-400',
    in_progress: 'bg-brand-500',
    on_hold: 'bg-amber-400',
    completed: 'bg-emerald-500',
    backlog: 'bg-slate-400',
    todo: 'bg-sky-400',
    review: 'bg-violet-500',
    done: 'bg-emerald-500',
  }
  const barColor = colorMap[item.status] || 'bg-brand-500'

  return (
    <div
      className={classNames('flex border-b border-slate-100 hover:bg-slate-50/60', index % 2 === 1 && 'bg-slate-50/30')}
      style={{ height: ROW_H }}>
      <div className="w-44 sm:w-72 shrink-0 px-3 sm:px-4 flex items-center gap-2 border-r border-slate-200">
        {isProj
          ? (
            <>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{item.code}</span>
              <span className="text-xs sm:text-sm font-medium text-slate-800 truncate" title={item.name}>{item.name}</span>
            </>
          )
          : (
            <>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{memberById[item.assigneeId]?.avatar}</span>
              <span className="text-xs sm:text-sm text-slate-700 truncate" title={item.title}>{item.title}</span>
            </>
          )
        }
      </div>
      <div className="relative flex-1">
        <div className="absolute top-0 bottom-0 border-l-2 border-rose-400 opacity-60 pointer-events-none"
             style={{ left: todayOffset * DAY_W }} />
        <div className="absolute top-1/2 -translate-y-1/2 h-5 rounded-md flex items-center px-2 text-[10px] text-white font-semibold shadow-sm overflow-hidden"
          style={{
            left: offset * DAY_W,
            width: length * DAY_W,
            backgroundColor: 'transparent',
          }}>
          <div className={classNames('absolute inset-0 rounded-md', barColor, 'opacity-30')} />
          <div className={classNames('absolute inset-y-0 left-0 rounded-md', barColor)}
            style={{ width: `${isProj ? item.progress : (item.status === 'done' ? 100 : item.status === 'review' ? 80 : item.status === 'in_progress' ? 50 : 10)}%` }} />
          <span className="relative truncate">
            {isProj ? `${item.progress}%` : (item.estimateHours + 'h')}
          </span>
        </div>
      </div>
    </div>
  )
}
