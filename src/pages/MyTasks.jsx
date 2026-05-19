import { useMemo, useState } from 'react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import {
  AlertTriangle, Calendar as CalIcon, ListChecks, CheckCircle2,
  Clock, ArrowRight, Plus,
} from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { taskStatusMeta, priorityMeta, currentUser } from '../data/mock'
import { fmtDate, classNames } from '../lib/utils'
import { PageHeader, Badge, ProgressBar } from '../components/UI'
import Avatar from '../components/Avatar'
import { useUI } from '../store/UIContext'

const TODAY = '2026-05-19'

export default function MyTasks() {
  const { tasks, projectById, subtasks, comments } = useStore()
  const ui = useUI()

  const myTasks = useMemo(
    () => tasks.filter(t => t.assigneeId === currentUser.id),
    [tasks]
  )

  const buckets = useMemo(() => {
    const overdue   = []
    const today     = []
    const thisWeek  = []
    const upcoming  = []
    const noDate    = []
    const done      = []

    for (const t of myTasks) {
      if (t.status === 'done') { done.push(t); continue }
      if (!t.dueDate) { noDate.push(t); continue }
      const diff = differenceInCalendarDays(parseISO(t.dueDate), parseISO(TODAY))
      if (diff < 0) overdue.push(t)
      else if (diff === 0) today.push(t)
      else if (diff <= 7) thisWeek.push(t)
      else upcoming.push(t)
    }
    const sortByDue = (a, b) => a.dueDate.localeCompare(b.dueDate)
    overdue.sort(sortByDue); today.sort(sortByDue); thisWeek.sort(sortByDue)
    upcoming.sort(sortByDue); done.sort((a, b) => b.dueDate.localeCompare(a.dueDate))
    return { overdue, today, thisWeek, upcoming, noDate, done }
  }, [myTasks])

  const total = myTasks.length
  const doneCount = buckets.done.length
  const completion = total === 0 ? 0 : Math.round((doneCount / total) * 100)
  const overdueCount = buckets.overdue.length
  const totalEst = myTasks.filter(t => t.status !== 'done').reduce((s, t) => s + (t.estimateHours || 0), 0)
  const totalSpent = myTasks.reduce((s, t) => s + (t.spentHours || 0), 0)

  return (
    <div>
      <PageHeader
        title="Việc của tôi"
        description={`Xin chào ${currentUser.name.split(' ').slice(-1)[0]}, đây là tất cả công việc đang được giao cho bạn.`}
        actions={
          <button className="btn-primary" onClick={() => ui.openCreateTask()}>
            <Plus size={16}/> Task mới
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Kpi icon={AlertTriangle} label="Quá hạn" value={overdueCount} accent="text-rose-600" sub="Cần xử lý gấp" />
        <Kpi icon={CalIcon} label="Hôm nay" value={buckets.today.length} accent="text-amber-600" />
        <Kpi icon={ListChecks} label="Đang mở" value={total - doneCount} sub={`${totalEst}h ước tính`} />
        <Kpi icon={CheckCircle2} label="Đã hoàn thành" value={`${completion}%`} accent="text-emerald-600"
          sub={`${doneCount}/${total} task`}>
          <ProgressBar value={completion} className="mt-2" />
        </Kpi>
      </div>

      <div className="space-y-4">
        <Section title="Quá hạn" tone="rose" tasks={buckets.overdue}
          projectById={projectById} subtaskCounts={subtasks} comments={comments} ui={ui} />
        <Section title="Hôm nay" tone="amber" tasks={buckets.today}
          projectById={projectById} subtaskCounts={subtasks} comments={comments} ui={ui} />
        <Section title="Tuần này" tone="brand" tasks={buckets.thisWeek}
          projectById={projectById} subtaskCounts={subtasks} comments={comments} ui={ui} />
        <Section title="Sắp tới" tone="slate" tasks={buckets.upcoming}
          projectById={projectById} subtaskCounts={subtasks} comments={comments} ui={ui} />
        {buckets.noDate.length > 0 && (
          <Section title="Chưa có hạn" tone="slate" tasks={buckets.noDate}
            projectById={projectById} subtaskCounts={subtasks} comments={comments} ui={ui} />
        )}
        <Section title="Đã hoàn thành" tone="emerald" tasks={buckets.done.slice(0, 10)}
          projectById={projectById} subtaskCounts={subtasks} comments={comments} ui={ui}
          collapseDefault />
      </div>
    </div>
  )
}

function Kpi({ icon: Icon, label, value, sub, accent = 'text-slate-900', children }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">{label}</div>
        {Icon && <Icon size={14} className="text-slate-400" />}
      </div>
      <div className={classNames('text-2xl font-bold mt-1', accent)}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      {children}
    </div>
  )
}

const TONES = {
  rose:    'bg-rose-50 text-rose-700 border-rose-200',
  amber:   'bg-amber-50 text-amber-700 border-amber-200',
  brand:   'bg-brand-50 text-brand-700 border-brand-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  slate:   'bg-slate-100 text-slate-600 border-slate-200',
}

function Section({ title, tone, tasks, projectById, subtaskCounts, comments, ui, collapseDefault }) {
  const [open, setOpen] = useState(!collapseDefault)
  if (tasks.length === 0) return null
  return (
    <div className="card overflow-hidden">
      <button
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50"
        onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2">
          <span className={classNames('inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border', TONES[tone])}>
            {title} · {tasks.length}
          </span>
        </div>
        <ArrowRight size={14} className={classNames('text-slate-400 transition', open && 'rotate-90')} />
      </button>
      {open && (
        <ul className="divide-y divide-slate-100">
          {tasks.map(t => (
            <Row key={t.id} task={t}
                 project={projectById[t.projectId]}
                 subtaskCount={subtaskCounts.filter(s => s.taskId === t.id).length}
                 commentCount={comments.filter(c => c.taskId === t.id).length}
                 onOpen={() => ui.openTaskDetail(t.id)} />
          ))}
        </ul>
      )}
    </div>
  )
}

function Row({ task, project, subtaskCount, commentCount, onOpen }) {
  const overdue = task.dueDate < TODAY && task.status !== 'done'
  const subDone = 0 // we don't compute here for perf — keep simple
  return (
    <li>
      <button onClick={onOpen}
        className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {project && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                {project.code}
              </span>
            )}
            <Badge className={priorityMeta[task.priority].color + ' !text-[10px] !px-1.5'}>
              {priorityMeta[task.priority].label}
            </Badge>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`w-1.5 h-1.5 rounded-full ${taskStatusMeta[task.status].dot}`} />
              {taskStatusMeta[task.status].label}
            </span>
          </div>
          <div className="text-sm font-medium text-slate-800 truncate">{task.title}</div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
            <span className={overdue ? 'text-rose-600 font-semibold' : ''}>
              <Clock size={11} className="inline -mt-0.5 mr-1"/>{fmtDate(task.dueDate)}
            </span>
            <span>{task.spentHours}h / {task.estimateHours}h</span>
            {subtaskCount > 0 && <span>{subtaskCount} subtask</span>}
            {commentCount > 0 && <span>{commentCount} bình luận</span>}
          </div>
        </div>
        <ArrowRight size={14} className="text-slate-300 shrink-0" />
      </button>
    </li>
  )
}
