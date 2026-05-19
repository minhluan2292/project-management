import { useMemo, useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, format,
  parseISO, max as maxDate, min as minDate, differenceInCalendarDays,
  isWeekend,
} from 'date-fns'
import {
  Mail, Briefcase, ListChecks, TrendingUp,
  ChevronLeft, ChevronRight, CalendarRange, Filter,
  Plus, Pencil, UserPlus,
} from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { taskStatusMeta } from '../data/mock'
import { classNames, fmtDate } from '../lib/utils'
import { PageHeader, ProgressBar, SectionTitle } from '../components/UI'
import Avatar from '../components/Avatar'
import DateField from '../components/DateField'
import MemberFormModal from '../components/MemberFormModal'
import TeamFormModal from '../components/TeamFormModal'

const TODAY = '2026-05-19'

const PRESETS = [
  { id: 'this_week',  label: 'Tuần này' },
  { id: 'this_month', label: 'Tháng này' },
  { id: 'next_month', label: 'Tháng sau' },
  { id: 'q',          label: 'Quý hiện tại' },
  { id: 'all',        label: 'Toàn thời gian' },
  { id: 'custom',     label: 'Tuỳ chọn' },
]

function rangeFromPreset(preset, today) {
  switch (preset) {
    case 'this_week':
      return {
        from: startOfWeek(today, { weekStartsOn: 1 }),
        to:   endOfWeek(today, { weekStartsOn: 1 }),
      }
    case 'this_month':
      return { from: startOfMonth(today), to: endOfMonth(today) }
    case 'next_month': {
      const n = addMonths(today, 1)
      return { from: startOfMonth(n), to: endOfMonth(n) }
    }
    case 'q': {
      const m = today.getMonth()
      const qStart = m - (m % 3)
      return {
        from: new Date(today.getFullYear(), qStart, 1),
        to:   endOfMonth(new Date(today.getFullYear(), qStart + 2, 1)),
      }
    }
    case 'all':
      return { from: null, to: null }
    default:
      return { from: startOfMonth(today), to: endOfMonth(today) }
  }
}

function workingDaysBetween(from, to) {
  if (!from || !to) return null
  let count = 0
  let d = from
  while (d <= to) {
    if (!isWeekend(d)) count++
    d = addDays(d, 1)
  }
  return count
}

export default function Team() {
  const { members, teams, tasks, projects, teamById } = useStore()
  const today = new Date(TODAY)

  const [view, setView] = useState('members')
  const [teamFilter, setTeamFilter] = useState('all')

  const [memberEdit, setMemberEdit] = useState(null) // null|undefined|member
  const [teamEdit, setTeamEdit]     = useState(null) // null|undefined|team

  const [preset, setPreset] = useState('this_month')
  const [from, setFrom] = useState(format(startOfMonth(today), 'yyyy-MM-dd'))
  const [to, setTo]     = useState(format(endOfMonth(today), 'yyyy-MM-dd'))

  const onPreset = (id) => {
    setPreset(id)
    if (id === 'custom') return
    if (id === 'all') {
      setFrom('')
      setTo('')
      return
    }
    const r = rangeFromPreset(id, today)
    setFrom(format(r.from, 'yyyy-MM-dd'))
    setTo(format(r.to, 'yyyy-MM-dd'))
  }

  const isAllTime = preset === 'all' || (!from && !to)
  const rangeFrom = isAllTime ? null : (from ? parseISO(from) : null)
  const rangeTo   = isAllTime ? null : (to   ? parseISO(to)   : null)
  const workDays = isAllTime ? null : workingDaysBetween(rangeFrom, rangeTo)
  const weeks    = workDays == null ? null : workDays / 5

  const memberStats = useMemo(() => members.map(m => {
    // capacity for the period (or full capacity if all-time)
    const capacity = weeks == null ? m.capacity : Math.round(m.capacity * weeks)

    let myTasks = tasks.filter(t => t.assigneeId === m.id)
    if (!isAllTime) {
      // only tasks overlapping the range
      myTasks = myTasks.filter(t => {
        const ts = parseISO(t.startDate)
        const te = parseISO(t.dueDate)
        return !(te < rangeFrom || ts > rangeTo)
      })
    }

    const open    = myTasks.filter(t => t.status !== 'done')
    const done    = myTasks.filter(t => t.status === 'done')
    const inProg  = myTasks.filter(t => t.status === 'in_progress')
    const review  = myTasks.filter(t => t.status === 'review')
    const overdue = myTasks.filter(t => t.dueDate < TODAY && t.status !== 'done').length
    const projectIds = [...new Set(myTasks.map(t => t.projectId))]

    // estimate (allocated hours): if all-time, use raw estimate; else proportional to overlap
    let estimate = 0
    if (isAllTime) {
      estimate = open.reduce((s, t) => s + t.estimateHours, 0)
    } else {
      for (const t of myTasks) {
        const ts = parseISO(t.startDate)
        const te = parseISO(t.dueDate)
        const ovStart = maxDate([ts, rangeFrom])
        const ovEnd   = minDate([te, rangeTo])
        const overlap = differenceInCalendarDays(ovEnd, ovStart) + 1
        const total   = differenceInCalendarDays(te, ts) + 1
        estimate += t.estimateHours * (overlap / total)
      }
      estimate = Math.round(estimate * 10) / 10
    }

    return {
      member: m,
      capacity,
      total: myTasks.length,
      open: open.length,
      done: done.length,
      inProg: inProg.length,
      review: review.length,
      overdue,
      projects: projectIds.length,
      estimate,
      tasks: myTasks,
    }
  }), [members, tasks, isAllTime, from, to, weeks])

  const filtered = teamFilter === 'all'
    ? memberStats
    : memberStats.filter(s => s.member.teamId === teamFilter)

  return (
    <div>
      <PageHeader
        title="Nhân sự & Khối lượng"
        description="Xem ai đang làm gì, ai đang quá tải, ai đang rảnh."
        actions={
          <>
            <button className="btn-outline" onClick={() => setTeamEdit(undefined)}>
              <Plus size={14}/> Team mới
            </button>
            <button className="btn-primary" onClick={() => setMemberEdit(undefined)}>
              <UserPlus size={14}/> Thêm nhân sự
            </button>
          </>
        }
      />

      {/* View / team / range filter */}
      <div className="card p-3 mb-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => setView('members')}
              className={classNames('px-3 py-1.5 rounded-md text-sm', view === 'members' && 'bg-white shadow-sm font-semibold')}>Thành viên</button>
            <button onClick={() => setView('teams')}
              className={classNames('px-3 py-1.5 rounded-md text-sm', view === 'teams' && 'bg-white shadow-sm font-semibold')}>Theo Team</button>
            <button onClick={() => setView('workload')}
              className={classNames('px-3 py-1.5 rounded-md text-sm', view === 'workload' && 'bg-white shadow-sm font-semibold')}>Workload</button>
          </div>
          <select className="input w-full sm:w-44" value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
            <option value="all">Tất cả team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <div className="text-xs text-slate-500 sm:ml-auto flex items-center gap-2">
            <CalendarRange size={14} className="text-slate-400" />
            {isAllTime
              ? <span>Toàn thời gian</span>
              : <span>{fmtDate(from)} → {fmtDate(to)} · {workDays} ngày làm việc</span>}
          </div>
        </div>

        {/* Range presets */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs uppercase font-semibold text-slate-500 mr-1">
            <Filter size={12} className="inline -mt-0.5 mr-1"/>Khoảng thời gian
          </span>
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
              disabled={isAllTime}
              onClick={() => {
                setPreset('custom')
                setFrom(format(subMonths(parseISO(from), 1), 'yyyy-MM-dd'))
                setTo(format(subMonths(parseISO(to), 1), 'yyyy-MM-dd'))
              }}>
              <ChevronLeft size={16}/>
            </button>
            <DateField
              value={from}
              disabled={isAllTime}
              onChange={(v) => { setFrom(v); setPreset('custom') }}
              className="flex-1 md:w-40 min-w-[8.5rem]"
            />
            <span className="text-slate-400">→</span>
            <DateField
              value={to}
              disabled={isAllTime}
              minDate={from}
              onChange={(v) => { setTo(v); setPreset('custom') }}
              className="flex-1 md:w-40 min-w-[8.5rem]"
            />
            <button className="btn-ghost p-1.5"
              disabled={isAllTime}
              onClick={() => {
                setPreset('custom')
                setFrom(format(addMonths(parseISO(from), 1), 'yyyy-MM-dd'))
                setTo(format(addMonths(parseISO(to), 1), 'yyyy-MM-dd'))
              }}>
              <ChevronRight size={16}/>
            </button>
          </div>
        </div>
      </div>

      {view === 'members'  && <MembersView stats={filtered} teamById={teamById} isAllTime={isAllTime} onEdit={setMemberEdit} />}
      {view === 'teams'    && <TeamsView teams={teams} memberStats={memberStats} projects={projects} onEdit={setTeamEdit} />}
      {view === 'workload' && <WorkloadView stats={filtered} isAllTime={isAllTime} onEdit={setMemberEdit} />}

      <MemberFormModal
        open={memberEdit !== null}
        member={memberEdit}
        onClose={() => setMemberEdit(null)}
      />
      <TeamFormModal
        open={teamEdit !== null}
        team={teamEdit}
        onClose={() => setTeamEdit(null)}
      />
    </div>
  )
}

function MembersView({ stats, teamById, isAllTime, onEdit }) {
  if (stats.length === 0) {
    return (
      <div className="card p-10 text-center">
        <div className="text-slate-700 font-medium">Chưa có nhân sự nào</div>
        <div className="text-sm text-slate-500 mt-1 mb-4">Bấm "Thêm nhân sự" ở trên để tạo.</div>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {stats.map(s => {
        const team = teamById[s.member.teamId]
        const completion = s.total === 0 ? 0 : Math.round((s.done / s.total) * 100)
        const load = s.capacity === 0 ? 0 : Math.min(100, Math.round((s.estimate / s.capacity) * 100))
        return (
          <div key={s.member.id} className="card p-5 group relative">
            <button
              onClick={() => onEdit(s.member)}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition btn-ghost p-1.5"
              title="Sửa">
              <Pencil size={14} />
            </button>
            <div className="flex items-center gap-3">
              <Avatar name={s.member.name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900 truncate">{s.member.name}</div>
                <div className="text-xs text-slate-500 truncate">{s.member.role}</div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {team
                    ? <span className="text-[10px] uppercase font-semibold border px-1.5 py-0.5 rounded"
                            style={{ borderColor: team.color, color: team.color }}>
                        {team.name}
                      </span>
                    : <span className="text-[10px] uppercase font-semibold border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded">
                        Chưa có team
                      </span>
                  }
                  {s.member.email && (
                    <span className="text-[11px] text-slate-500"><Mail size={10} className="inline -mt-0.5"/> {s.member.email}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <Stat label="Đang làm" value={s.inProg + s.review} />
              <Stat label="Quá hạn" value={s.overdue} color={s.overdue > 0 ? 'text-rose-600' : ''} />
              <Stat label="Dự án" value={s.projects} />
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Hoàn thành ({s.done}/{s.total})</span>
                <span className="font-semibold text-slate-700">{completion}%</span>
              </div>
              <ProgressBar value={completion} />
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>{isAllTime ? 'Tải hiện tại' : 'Tải trong khoảng'}</span>
                <span className={classNames('font-semibold', load > 90 ? 'text-rose-600' : load > 70 ? 'text-amber-600' : 'text-slate-700')}>
                  {s.estimate}h / {s.capacity}h
                </span>
              </div>
              <ProgressBar value={load} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TeamsView({ teams, memberStats, projects }) {
  // Aggregate per team using filtered memberStats
  const byTeam = teams.map(t => {
    const teamStats = memberStats.filter(s => s.member.teamId === t.id)
    const memberIds = new Set(teamStats.map(s => s.member.id))
    const allTasks = teamStats.flatMap(s => s.tasks)
    // dedupe tasks by id (a task only has one assignee, but safe-guard)
    const seen = new Set()
    const unique = []
    for (const tk of allTasks) {
      if (seen.has(tk.id)) continue
      seen.add(tk.id); unique.push(tk)
    }
    const done = unique.filter(x => x.status === 'done').length
    const projectsInvolved = new Set()
    for (const p of projects) if (p.teamIds.includes(t.id)) projectsInvolved.add(p.id)
    const completion = unique.length === 0 ? 0 : Math.round((done / unique.length) * 100)
    const totalEstimate = teamStats.reduce((s, x) => s + x.estimate, 0)
    const totalCapacity = teamStats.reduce((s, x) => s + x.capacity, 0)
    const load = totalCapacity === 0 ? 0 : Math.round((totalEstimate / totalCapacity) * 100)
    return { team: t, teamStats, taskCount: unique.length, done, completion, projectsInvolved: projectsInvolved.size, totalEstimate, totalCapacity, load }
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {byTeam.map(({ team: t, teamStats, taskCount, done, completion, projectsInvolved, totalEstimate, totalCapacity, load }) => (
        <div key={t.id} className="card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: t.color }}>
                {t.name.slice(0,1)}
              </div>
              <div>
                <div className="font-semibold text-slate-900">{t.name}</div>
                <div className="text-xs text-slate-500">{teamStats.length} thành viên</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Hoàn thành</div>
              <div className="font-bold text-lg text-slate-800">{completion}%</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <Stat icon={Briefcase} label="Dự án" value={projectsInvolved} />
            <Stat icon={ListChecks} label="Task" value={taskCount} />
            <Stat icon={TrendingUp} label="Đã xong" value={done} color="text-emerald-600" />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Tải trong khoảng</span>
              <span className={classNames('font-semibold',
                load > 100 ? 'text-rose-600' : load > 80 ? 'text-amber-600' : 'text-slate-700')}>
                {Math.round(totalEstimate)}h / {totalCapacity}h
              </span>
            </div>
            <ProgressBar value={Math.min(100, load)} />
          </div>

          <div className="mt-4">
            <div className="text-xs text-slate-500 mb-2">Thành viên</div>
            <div className="flex flex-wrap gap-2">
              {teamStats.map(s => (
                <div key={s.member.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100">
                  <Avatar name={s.member.name} size="xs" />
                  <span className="text-xs text-slate-700">{s.member.name.split(' ').slice(-1)[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function WorkloadView({ stats, isAllTime }) {
  const sorted = [...stats].sort((a, b) => b.estimate - a.estimate)
  const max = Math.max(40, ...sorted.map(s => s.estimate))
  return (
    <div className="card p-4 sm:p-5">
      <SectionTitle
        title="Khối lượng đang gánh"
        subtitle={isAllTime ? 'Toàn thời gian. Đỏ = quá tải.' : 'Đã quy đổi capacity theo số tuần trong khoảng đã chọn.'}
      />
      <div className="space-y-3">
        {sorted.map(s => {
          const pct = s.capacity === 0 ? 0 : (s.estimate / s.capacity) * 100
          const overload = pct > 100
          const color = pct > 100 ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
          return (
            <div key={s.member.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="w-full sm:w-44 flex items-center gap-2 shrink-0">
                <Avatar name={s.member.name} size="sm" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{s.member.name}</div>
                  <div className="text-xs text-slate-500 truncate">{s.member.role}</div>
                </div>
              </div>
              <div className="flex-1 h-7 bg-slate-100 rounded-md overflow-hidden relative">
                <div className={classNames('h-full', color)} style={{ width: `${Math.min(100, (s.estimate / max) * 100)}%` }} />
                <div className="absolute inset-0 flex items-center px-2 text-xs font-medium text-slate-700">
                  <span className="font-semibold">{Math.round(s.estimate)}h</span>
                  <span className="text-slate-400 mx-1">/ {s.capacity}h cap</span>
                  {overload && <span className="ml-2 text-rose-600 font-semibold">QUÁ TẢI</span>}
                </div>
              </div>
              <div className="w-full sm:w-32 sm:text-right text-xs text-slate-500">
                {s.open} đang làm{s.overdue > 0 && <> · <span className="text-rose-600 font-semibold">{s.overdue} trễ</span></>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, color = 'text-slate-800' }) {
  return (
    <div className="rounded-lg bg-slate-50 py-2">
      <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
        {Icon && <Icon size={11} />}{label}
      </div>
      <div className={classNames('text-lg font-bold mt-0.5', color)}>{value}</div>
    </div>
  )
}
