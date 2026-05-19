import { useMemo, useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, format,
  parseISO, max as maxDate, min as minDate, differenceInCalendarDays,
  isWeekend,
} from 'date-fns'
import { vi } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Filter, Users, User } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { fmtDate, classNames } from '../lib/utils'
import { PageHeader, SectionTitle, Badge } from '../components/UI'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'
import { SearchableSelect, SearchableMultiSelect } from '../components/SearchableSelect'
import DateField from '../components/DateField'
import { taskStatusMeta, priorityMeta } from '../data/mock'
import { useUI } from '../store/UIContext'

const PRESETS = [
  { id: 'this_month', label: 'Tháng này' },
  { id: 'next_month', label: 'Tháng sau' },
  { id: 'this_week',  label: 'Tuần này' },
  { id: 'next_2w',    label: '2 tuần tới' },
  { id: 'q',          label: 'Quý hiện tại' },
  { id: 'custom',     label: 'Tuỳ chọn' },
]

function rangeFromPreset(preset, today) {
  const t = today
  switch (preset) {
    case 'this_month': return { from: startOfMonth(t), to: endOfMonth(t) }
    case 'next_month': {
      const n = addMonths(t, 1)
      return { from: startOfMonth(n), to: endOfMonth(n) }
    }
    case 'this_week': return {
      from: startOfWeek(t, { weekStartsOn: 1 }),
      to:   endOfWeek(t, { weekStartsOn: 1 }),
    }
    case 'next_2w': return { from: t, to: addDays(t, 14) }
    case 'q': {
      const m = t.getMonth()
      const qStartMonth = m - (m % 3)
      const from = new Date(t.getFullYear(), qStartMonth, 1)
      const to   = endOfMonth(new Date(t.getFullYear(), qStartMonth + 2, 1))
      return { from, to }
    }
    default:
      return { from: startOfMonth(t), to: endOfMonth(t) }
  }
}

export default function Workload() {
  const { tasks, members, teams, memberById, teamById, projectById } = useStore()
  const today = new Date('2026-05-19')

  const [preset, setPreset] = useState('this_month')
  const [from, setFrom] = useState(format(startOfMonth(today), 'yyyy-MM-dd'))
  const [to, setTo]     = useState(format(endOfMonth(today), 'yyyy-MM-dd'))
  const [teamFilter, setTeamFilter] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState([]) // empty = tất cả thuộc team
  const [view, setView] = useState('grid') // grid | summary | bytask

  const onPreset = (id) => {
    setPreset(id)
    if (id === 'custom') return
    const r = rangeFromPreset(id, today)
    setFrom(format(r.from, 'yyyy-MM-dd'))
    setTo(format(r.to, 'yyyy-MM-dd'))
  }

  // Range as Date
  const rangeFrom = parseISO(from)
  const rangeTo   = parseISO(to)
  const days = useMemo(() => {
    const arr = []
    let d = rangeFrom
    while (d <= rangeTo) { arr.push(d); d = addDays(d, 1) }
    return arr
  }, [from, to])
  const workingDays = useMemo(() => days.filter(d => !isWeekend(d)).length, [days])
  const totalDays = days.length

  // Members in scope
  const scopedMembers = useMemo(() => {
    let arr = members
    if (teamFilter !== 'all') arr = arr.filter(m => m.teamId === teamFilter)
    if (selectedUsers.length > 0) arr = arr.filter(m => selectedUsers.includes(m.id))
    return arr
  }, [teamFilter, selectedUsers, members])

  // Compute overlap of each task with [rangeFrom, rangeTo]
  const taskRows = useMemo(() => {
    const rows = []
    for (const t of tasks) {
      const ts = parseISO(t.startDate)
      const te = parseISO(t.dueDate)
      if (te < rangeFrom || ts > rangeTo) continue // no overlap
      const ovStart = maxDate([ts, rangeFrom])
      const ovEnd   = minDate([te, rangeTo])
      const overlapDays = differenceInCalendarDays(ovEnd, ovStart) + 1
      const totalSpan   = differenceInCalendarDays(te, ts) + 1
      const portion     = overlapDays / totalSpan
      const allocHours  = Math.round(t.estimateHours * portion * 10) / 10
      rows.push({
        ...t,
        overlapStart: ovStart,
        overlapEnd:   ovEnd,
        overlapDays,
        allocHours,
      })
    }
    return rows
  }, [tasks, from, to])

  const byUser = useMemo(() => {
    const map = {}
    for (const m of scopedMembers) map[m.id] = { member: m, tasks: [], hours: 0 }
    for (const r of taskRows) {
      if (!map[r.assigneeId]) continue
      map[r.assigneeId].tasks.push(r)
      map[r.assigneeId].hours += r.allocHours
    }
    return Object.values(map).map(x => {
      // capacity = workingDays * (capacity/5) per week. capacity field = hours/week
      const weeks = workingDays / 5
      const capacityHours = x.member.capacity * weeks
      const loadPct = capacityHours === 0 ? 0 : Math.round((x.hours / capacityHours) * 100)
      return { ...x, capacityHours: Math.round(capacityHours), loadPct }
    }).sort((a, b) => b.hours - a.hours)
  }, [taskRows, scopedMembers, workingDays])

  const totalAllocHours = byUser.reduce((s, x) => s + x.hours, 0)
  const totalCapacity   = byUser.reduce((s, x) => s + x.capacityHours, 0)

  // Cell drilldown
  const [cellDetail, setCellDetail] = useState(null) // { member, day, tasks: [{...row, hoursThatDay}] }

  return (
    <div>
      <PageHeader
        title="Workload Planner"
        description="Xem khối lượng công việc của một người hoặc nhiều người trong team theo khung thời gian."
      />

      <div className="card p-3 sm:p-4 mb-5 space-y-3">
        {/* Range presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase font-semibold text-slate-500 mr-1">Khoảng thời gian</span>
          <div className="flex gap-1.5 flex-wrap overflow-x-auto -mx-1 px-1 pb-1 sm:pb-0">
            {PRESETS.map(p => (
              <button key={p.id} onClick={() => onPreset(p.id)}
                className={classNames(
                  'px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap shrink-0',
                  preset === p.id
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                )}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="w-full md:w-auto md:ml-auto flex items-center gap-2 flex-wrap">
            <button className="btn-ghost p-1.5"
              onClick={() => {
                setPreset('custom')
                setFrom(format(subMonths(parseISO(from), 1), 'yyyy-MM-dd'))
                setTo(format(subMonths(parseISO(to), 1), 'yyyy-MM-dd'))
              }}>
              <ChevronLeft size={16}/>
            </button>
            <DateField
              value={from}
              onChange={(v) => { setFrom(v); setPreset('custom') }}
              className="flex-1 md:w-40 min-w-[8.5rem]"
            />
            <span className="text-slate-400">→</span>
            <DateField
              value={to}
              onChange={(v) => { setTo(v); setPreset('custom') }}
              minDate={from}
              className="flex-1 md:w-40 min-w-[8.5rem]"
            />
            <button className="btn-ghost p-1.5"
              onClick={() => {
                setPreset('custom')
                setFrom(format(addMonths(parseISO(from), 1), 'yyyy-MM-dd'))
                setTo(format(addMonths(parseISO(to), 1), 'yyyy-MM-dd'))
              }}>
              <ChevronRight size={16}/>
            </button>
          </div>
        </div>

        {/* Team / User filters */}
        <div className="flex flex-wrap items-start gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs uppercase font-semibold text-slate-500 mr-1 mt-2">
            <Filter size={12} className="inline -mt-0.5 mr-1"/>Lọc
          </span>
          <div className="w-full sm:w-44">
            <SearchableSelect
              value={teamFilter === 'all' ? '' : teamFilter}
              onChange={(v) => { setTeamFilter(v || 'all'); setSelectedUsers([]) }}
              placeholder="Mọi team"
              options={teams.map(t => ({ value: t.id, label: t.name }))}
            />
          </div>

          <div className="flex-1 min-w-[260px]">
            <SearchableMultiSelect
              value={selectedUsers}
              onChange={setSelectedUsers}
              placeholder="Tìm và chọn nhân viên (để trống = tất cả)..."
              options={members
                .filter(m => teamFilter === 'all' || m.teamId === teamFilter)
                .map(m => ({
                  value: m.id,
                  label: m.name,
                  sub: `${m.role} · ${teamById[m.teamId]?.name}`,
                }))}
              renderOption={(o) => (
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={o.label} size="xs" />
                  <div className="min-w-0">
                    <div className="text-sm text-slate-800 truncate">{o.label}</div>
                    <div className="text-xs text-slate-500 truncate">{o.sub}</div>
                  </div>
                </div>
              )}
            />
          </div>

          <div className="w-full sm:w-auto sm:ml-auto flex items-center bg-slate-100 rounded-lg p-0.5 overflow-x-auto">
            <button onClick={() => setView('grid')}
              className={classNames('px-3 py-1 rounded-md text-xs whitespace-nowrap', view === 'grid' && 'bg-white shadow-sm font-semibold')}>
              Lưới ngày
            </button>
            <button onClick={() => setView('summary')}
              className={classNames('px-3 py-1 rounded-md text-xs whitespace-nowrap', view === 'summary' && 'bg-white shadow-sm font-semibold')}>
              Tổng hợp
            </button>
            <button onClick={() => setView('bytask')}
              className={classNames('px-3 py-1 rounded-md text-xs whitespace-nowrap', view === 'bytask' && 'bg-white shadow-sm font-semibold')}>
              Theo task
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Kpi label="Khoảng thời gian" value={`${totalDays} ngày`} sub={`${workingDays} ngày làm việc`} />
        <Kpi label="Số người" value={byUser.length} sub={teamFilter === 'all' ? 'Toàn công ty' : teamById[teamFilter]?.name} />
        <Kpi label="Tổng capacity" value={`${totalCapacity}h`} sub="Theo capacity tuần × số tuần" />
        <Kpi label="Tổng giờ phân bổ"
             value={`${Math.round(totalAllocHours)}h`}
             sub={`${totalCapacity ? Math.round(totalAllocHours / totalCapacity * 100) : 0}% capacity`}
             accent={totalCapacity && totalAllocHours / totalCapacity > 1 ? 'text-rose-600' : 'text-slate-900'} />
      </div>

      {view === 'summary' && <SummaryView byUser={byUser} />}
      {view === 'grid'    && <DayGridView byUser={byUser} days={days} taskRows={taskRows} projectById={projectById} onCellClick={setCellDetail} />}
      {view === 'bytask'  && <ByTaskView byUser={byUser} projectById={projectById} />}

      <CellDetailModal
        detail={cellDetail}
        onClose={() => setCellDetail(null)}
        projectById={projectById}
      />
    </div>
  )
}

function Kpi({ label, value, sub, accent = 'text-slate-900' }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  )
}

function SummaryView({ byUser }) {
  if (byUser.length === 0) return <Empty />
  const max = Math.max(40, ...byUser.map(b => b.hours))
  return (
    <div className="card p-4 sm:p-5">
      <SectionTitle title="Khối lượng theo người" subtitle="Bar = giờ phân bổ trong khung thời gian. Đỏ = quá tải." />
      <div className="space-y-3">
        {byUser.map(b => {
          const pct = b.capacityHours === 0 ? 0 : Math.min(120, (b.hours / b.capacityHours) * 100)
          const color = b.loadPct > 100 ? 'bg-rose-500' : b.loadPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
          return (
            <div key={b.member.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="w-full sm:w-44 flex items-center gap-2 shrink-0">
                <Avatar name={b.member.name} size="sm" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{b.member.name}</div>
                  <div className="text-xs text-slate-500 truncate">{b.member.role}</div>
                </div>
              </div>
              <div className="flex-1 h-7 bg-slate-100 rounded-md overflow-hidden relative">
                <div className={classNames('h-full', color)}
                     style={{ width: `${Math.min(100, (b.hours / max) * 100)}%` }} />
                <div className="absolute inset-0 flex items-center px-2 text-xs font-medium text-slate-700">
                  <span className="font-semibold">{Math.round(b.hours)}h</span>
                  <span className="text-slate-400 mx-1 hidden sm:inline">/ {b.capacityHours}h capacity</span>
                  <span className="text-slate-400 mx-1 sm:hidden">/{b.capacityHours}h</span>
                  <span className={classNames('ml-2 font-semibold',
                    b.loadPct > 100 ? 'text-rose-600' :
                    b.loadPct > 80 ? 'text-amber-600' : 'text-emerald-600')}>
                    {b.loadPct}%
                  </span>
                </div>
              </div>
              <div className="w-full sm:w-32 sm:text-right text-xs text-slate-500 shrink-0">
                {b.tasks.length} task
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DayGridView({ byUser, days, taskRows, projectById, onCellClick }) {
  if (byUser.length === 0) return <Empty />
  const cellW = 28
  const colorFor = (h) => {
    if (h <= 0)   return 'bg-slate-50'
    if (h <= 2)   return 'bg-emerald-100'
    if (h <= 4)   return 'bg-emerald-300'
    if (h <= 6)   return 'bg-amber-300'
    if (h <= 8)   return 'bg-amber-500'
    return 'bg-rose-500'
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: 200 + days.length * cellW }}>
          <div className="flex border-b border-slate-200 sticky top-0 bg-white z-10">
            <div className="w-40 sm:w-72 shrink-0 px-3 sm:px-4 py-2 text-[11px] sm:text-xs uppercase font-semibold text-slate-500 border-r border-slate-200">
              Thành viên
            </div>
            <div className="flex">
              {days.map((d, i) => {
                const isWE = isWeekend(d)
                const newMonth = i === 0 || d.getDate() === 1
                return (
                  <div key={i}
                    style={{ width: cellW }}
                    className={classNames(
                      'text-[10px] text-center py-2 border-r border-slate-100',
                      isWE && 'bg-slate-50/60 text-slate-400',
                      newMonth && 'border-l-2 border-l-slate-300',
                    )}
                    title={fmtDate(d.toISOString().slice(0,10))}>
                    <div className="font-semibold">{format(d, 'd')}</div>
                    <div className="opacity-70">{format(d, 'EEEEEE', { locale: vi })}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {byUser.map(b => {
            // hoursByDay + tasksByDay
            const hoursByDay = new Array(days.length).fill(0)
            const tasksByDay = Array.from({ length: days.length }, () => [])
            for (const r of b.tasks) {
              const startIdx = days.findIndex(d => d.toDateString() === r.overlapStart.toDateString())
              const endIdx   = days.findIndex(d => d.toDateString() === r.overlapEnd.toDateString())
              if (startIdx === -1 || endIdx === -1) continue
              const perDay = r.allocHours / Math.max(1, r.overlapDays)
              for (let i = startIdx; i <= endIdx; i++) {
                if (!isWeekend(days[i])) {
                  hoursByDay[i] += perDay
                  tasksByDay[i].push({ task: r, hours: perDay })
                }
              }
            }
            return (
              <div key={b.member.id} className="flex border-b border-slate-100">
                <div className="w-40 sm:w-72 shrink-0 px-3 sm:px-4 py-2 flex items-center gap-2 border-r border-slate-200">
                  <Avatar name={b.member.name} size="sm" />
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-medium text-slate-800 truncate">{b.member.name}</div>
                    <div className="text-[10px] sm:text-xs text-slate-500 truncate">
                      {Math.round(b.hours)}h · {b.loadPct}%
                    </div>
                  </div>
                </div>
                <div className="flex">
                  {hoursByDay.map((h, i) => {
                    const hasTasks = tasksByDay[i].length > 0
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={!hasTasks}
                        onClick={() => hasTasks && onCellClick({
                          member: b.member,
                          day: days[i],
                          totalHours: h,
                          tasks: tasksByDay[i].sort((a, b) => b.hours - a.hours),
                        })}
                        style={{ width: cellW }}
                        title={`${fmtDate(days[i].toISOString().slice(0,10))} · ${h.toFixed(1)}h${hasTasks ? ' · click xem chi tiết' : ''}`}
                        className={classNames(
                          'h-12 border-r border-slate-100 flex items-center justify-center text-[10px] font-semibold transition',
                          colorFor(h),
                          h > 8 ? 'text-white' : 'text-slate-700',
                          isWeekend(days[i]) && h === 0 && 'opacity-60',
                          hasTasks && 'hover:ring-2 hover:ring-brand-400 hover:ring-inset cursor-pointer',
                          !hasTasks && 'cursor-default',
                        )}>
                        {h > 0 ? h.toFixed(1) : ''}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-t border-slate-100 text-xs text-slate-500 overflow-x-auto">
        <span className="shrink-0">Cường độ:</span>
        <span className="flex items-center gap-1 shrink-0"><i className="w-3 h-3 rounded bg-emerald-100 inline-block"/>≤2h</span>
        <span className="flex items-center gap-1 shrink-0"><i className="w-3 h-3 rounded bg-emerald-300 inline-block"/>≤4h</span>
        <span className="flex items-center gap-1 shrink-0"><i className="w-3 h-3 rounded bg-amber-300 inline-block"/>≤6h</span>
        <span className="flex items-center gap-1 shrink-0"><i className="w-3 h-3 rounded bg-amber-500 inline-block"/>≤8h</span>
        <span className="flex items-center gap-1 shrink-0"><i className="w-3 h-3 rounded bg-rose-500 inline-block"/>&gt;8h</span>
        <span className="ml-auto shrink-0 text-slate-400 hidden sm:inline">Mẹo: click ô có giờ để xem chi tiết task</span>
      </div>
    </div>
  )
}

function CellDetailModal({ detail, onClose, projectById }) {
  const ui = useUI()
  if (!detail) return null
  const cap = 8 // hours/day standard
  const overload = detail.totalHours > cap
  return (
    <Modal
      open={!!detail}
      onClose={onClose}
      size="md"
      title={
        <span className="flex items-center gap-3">
          <Avatar name={detail.member.name} size="sm" />
          <span className="flex flex-col">
            <span className="text-base">{detail.member.name}</span>
            <span className="text-xs font-normal text-slate-500">
              {fmtDate(detail.day.toISOString().slice(0,10))} · {format(detail.day, 'EEEE', { locale: vi })}
            </span>
          </span>
        </span>
      }
      footer={<button className="btn-primary" onClick={onClose}>Đóng</button>}
    >
      <div className={classNames(
        'rounded-lg p-3 mb-4 flex items-center justify-between',
        overload ? 'bg-rose-50 border border-rose-100' : 'bg-slate-50'
      )}>
        <div>
          <div className="text-xs text-slate-500">Tổng giờ trong ngày</div>
          <div className={classNames(
            'text-2xl font-bold',
            overload ? 'text-rose-600' : 'text-slate-900'
          )}>
            {detail.totalHours.toFixed(1)}h
            <span className="text-sm text-slate-400 font-normal"> / {cap}h chuẩn</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Số task</div>
          <div className="text-2xl font-bold text-slate-900">{detail.tasks.length}</div>
        </div>
      </div>

      <div className="space-y-2 max-h-[55vh] overflow-y-auto">
        {detail.tasks.map(({ task, hours }) => {
          const proj = projectById[task.projectId]
          const pct = Math.min(100, (hours / cap) * 100)
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => { onClose(); ui.openTaskDetail(task.id) }}
              className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-brand-200 hover:bg-slate-50 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {proj && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{proj.code}</span>}
                    <Badge className={priorityMeta[task.priority].color + ' !text-[10px] !px-1.5'}>
                      {priorityMeta[task.priority].label}
                    </Badge>
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <span className={`w-1.5 h-1.5 rounded-full ${taskStatusMeta[task.status].dot}`} />
                      {taskStatusMeta[task.status].label}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-800">{task.title}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {fmtDate(task.startDate)} → {fmtDate(task.dueDate)}
                    <span className="text-slate-400"> · ước tính {task.estimateHours}h tổng</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-500">Phân bổ</div>
                  <div className="text-lg font-bold text-slate-900">{hours.toFixed(1)}h</div>
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={classNames(
                    'h-full',
                    hours > 6 ? 'bg-rose-500' : hours > 4 ? 'bg-amber-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${pct}%` }} />
              </div>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}

function ByTaskView({ byUser, projectById }) {
  if (byUser.length === 0) return <Empty />
  return (
    <div className="space-y-4">
      {byUser.map(b => (
        <div key={b.member.id} className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={b.member.name} />
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 truncate">{b.member.name}</div>
                <div className="text-xs text-slate-500 truncate">{b.member.role}</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-slate-500">Phân bổ</div>
              <div className={classNames('text-base sm:text-lg font-bold',
                b.loadPct > 100 ? 'text-rose-600' :
                b.loadPct > 80 ? 'text-amber-600' : 'text-slate-900')}>
                {Math.round(b.hours)}h <span className="text-slate-400 text-xs sm:text-sm font-normal">/ {b.capacityHours}h</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left py-2">Task</th>
                  <th className="text-left py-2">Dự án</th>
                  <th className="text-left py-2">Trạng thái</th>
                  <th className="text-left py-2">Ưu tiên</th>
                  <th className="text-left py-2">Khoảng overlap</th>
                  <th className="text-right py-2">Giờ trong khoảng</th>
                </tr>
              </thead>
              <tbody>
                {b.tasks
                  .sort((a, b) => b.allocHours - a.allocHours)
                  .map(t => {
                    const proj = projectById[t.projectId]
                    return (
                      <tr key={t.id} className="border-t border-slate-100">
                        <td className="py-2 pr-3 font-medium text-slate-800">{t.title}</td>
                        <td className="py-2 pr-3 text-xs">
                          {proj && <span className="font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{proj.code}</span>}
                        </td>
                        <td className="py-2 pr-3">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span className={`w-2 h-2 rounded-full ${taskStatusMeta[t.status].dot}`} />
                            {taskStatusMeta[t.status].label}
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          <span className={classNames('badge', priorityMeta[t.priority].color)}>
                            {priorityMeta[t.priority].label}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-xs text-slate-600">
                          {format(t.overlapStart, 'dd/MM/yyyy')} → {format(t.overlapEnd, 'dd/MM/yyyy')}
                          <span className="text-slate-400"> · {t.overlapDays} ngày</span>
                        </td>
                        <td className="py-2 text-right font-semibold text-slate-700">{t.allocHours}h</td>
                      </tr>
                    )
                  })}
                {b.tasks.length === 0 && (
                  <tr><td colSpan={6} className="py-3 text-center text-sm text-slate-400">Không có task trong khoảng này.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

function Empty() {
  return (
    <div className="card p-10 text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
        <User size={20}/>
      </div>
      <div className="text-slate-700 font-medium">Không có người nào trong bộ lọc hiện tại</div>
      <div className="text-sm text-slate-500 mt-1">Thử mở rộng team hoặc bỏ chọn user.</div>
    </div>
  )
}
