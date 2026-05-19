import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderKanban, ListChecks, Users, Clock, AlertTriangle,
  TrendingUp, CheckCircle2, ArrowRight
} from 'lucide-react'
import { useStore } from '../store/StoreContext'
import {
  currentUser,
  projectStatusMeta, taskStatusMeta, priorityMeta,
} from '../data/mock'
import { fmtDate } from '../lib/utils'
import { PageHeader, ProgressBar, StatusBadge, Badge, SectionTitle } from '../components/UI'
import Avatar, { AvatarGroup } from '../components/Avatar'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'

export default function Dashboard() {
  const { projects, tasks, members, events, projectById, memberById } = useStore()
  const today = '2026-05-19'

  const stats = useMemo(() => {
    const active   = projects.filter(p => p.status === 'in_progress').length
    const planning = projects.filter(p => p.status === 'planning').length
    const done     = projects.filter(p => p.status === 'completed').length
    const overdue  = tasks.filter(t => t.dueDate < today && t.status !== 'done').length
    const inProg   = tasks.filter(t => t.status === 'in_progress').length
    const review   = tasks.filter(t => t.status === 'review').length
    return { active, planning, done, overdue, inProg, review }
  }, [projects, tasks])

  const myTasks = useMemo(
    () => tasks.filter(t => t.assigneeId === currentUser.id && t.status !== 'done')
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                .slice(0, 5),
    [tasks]
  )

  const upcomingEvents = useMemo(
    () => events.filter(e => e.date >= today)
                .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
                .slice(0, 5),
    [events]
  )

  const taskByStatus = useMemo(() => {
    const out = Object.keys(taskStatusMeta).map(k => ({
      key: k, name: taskStatusMeta[k].label,
      value: tasks.filter(t => t.status === k).length,
    }))
    return out
  }, [tasks])

  const workloadData = useMemo(() => {
    return members.map(m => {
      const open = tasks.filter(t => t.assigneeId === m.id && t.status !== 'done').length
      const done = tasks.filter(t => t.assigneeId === m.id && t.status === 'done').length
      return { name: m.name.split(' ').slice(-1)[0], open, done }
    })
  }, [members, tasks])

  const PIE_COLORS = ['#94a3b8','#0ea5e9','#3b82f6','#8b5cf6','#10b981']

  return (
    <div>
      <PageHeader
        title={`Xin chào, ${currentUser.name.split(' ').slice(-1)[0]}`}
        description={`Hôm nay ${fmtDate(today, 'EEEE, dd/MM/yyyy')} - Tổng quan dự án công ty.`}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={FolderKanban} label="Dự án đang chạy" value={stats.active}
                 sub={`${stats.planning} đang lên kế hoạch`} color="bg-brand-50 text-brand-700" />
        <KpiCard icon={ListChecks} label="Task đang làm" value={stats.inProg}
                 sub={`${stats.review} đang review`} color="bg-blue-50 text-blue-700" />
        <KpiCard icon={AlertTriangle} label="Task quá hạn" value={stats.overdue}
                 sub="Cần xử lý ngay" color="bg-rose-50 text-rose-700" />
        <KpiCard icon={CheckCircle2} label="Dự án đã hoàn thành" value={stats.done}
                 sub="Trong năm 2026" color="bg-emerald-50 text-emerald-700" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 lg:col-span-2">
          <SectionTitle title="Khối lượng công việc theo nhân sự"
                        subtitle="Số task đang làm và đã hoàn thành" />
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="open" name="Đang làm" stackId="a" fill="#3563f6" radius={[0,0,0,0]} />
                <Bar dataKey="done" name="Đã xong"   stackId="a" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <SectionTitle title="Phân bố trạng thái task" />
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={taskByStatus} dataKey="value" nameKey="name"
                     cx="50%" cy="50%" innerRadius={50} outerRadius={90}>
                  {taskByStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active projects */}
        <div className="card p-5 lg:col-span-2">
          <SectionTitle
            title="Dự án nổi bật"
            subtitle="Dự án đang chạy, sắp xếp theo tiến độ"
            action={<Link to="/projects" className="text-sm text-brand-600 inline-flex items-center gap-1">Xem tất cả <ArrowRight size={14}/></Link>}
          />
          <div className="space-y-3">
            {projects.filter(p => p.status === 'in_progress')
                     .sort((a,b) => b.progress - a.progress)
                     .slice(0, 5)
                     .map(p => (
              <Link to={`/projects/${p.id}`} key={p.id}
                className="block p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{p.code}</span>
                      <div className="font-semibold text-slate-800 truncate">{p.name}</div>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{p.description}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <AvatarGroup names={p.memberIds.map(id => memberById[id].name)} max={3} />
                    <StatusBadge meta={projectStatusMeta[p.status]} />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <ProgressBar value={p.progress} className="flex-1" />
                  <div className="text-xs font-semibold text-slate-600 w-10 text-right">{p.progress}%</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right column: my tasks + events */}
        <div className="space-y-4">
          <div className="card p-5">
            <SectionTitle
              title="Task của tôi"
              subtitle={`${myTasks.length} đang mở`}
              action={<Link to="/tasks" className="text-sm text-brand-600 inline-flex items-center gap-1">Tất cả <ArrowRight size={14}/></Link>}
            />
            <div className="space-y-2">
              {myTasks.map(t => {
                const overdue = t.dueDate < today
                return (
                  <div key={t.id} className="flex items-start gap-2 p-2 rounded hover:bg-slate-50">
                    <span className={`mt-1.5 w-2 h-2 rounded-full ${taskStatusMeta[t.status].dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800 truncate">{t.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{projectById[t.projectId].code}</span>
                        <span>·</span>
                        <span className={overdue ? 'text-rose-600 font-medium' : ''}>
                          <Clock size={12} className="inline -mt-0.5 mr-0.5"/>
                          {fmtDate(t.dueDate)}
                        </span>
                      </div>
                    </div>
                    <Badge className={priorityMeta[t.priority].color}>{priorityMeta[t.priority].label}</Badge>
                  </div>
                )
              })}
              {myTasks.length === 0 && (
                <div className="text-sm text-slate-500 py-3 text-center">
                  Trống. Hôm nay nhẹ rồi.
                </div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <SectionTitle
              title="Sự kiện sắp tới"
              action={<Link to="/calendar" className="text-sm text-brand-600 inline-flex items-center gap-1">Lịch <ArrowRight size={14}/></Link>}
            />
            <div className="space-y-2">
              {upcomingEvents.map(e => (
                <div key={e.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                  <div className="w-12 text-center">
                    <div className="text-[10px] uppercase text-slate-400">{fmtDate(e.date, 'MMM')}</div>
                    <div className="text-lg font-bold text-slate-800 leading-none">{fmtDate(e.date, 'dd')}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{e.title}</div>
                    <div className="text-xs text-slate-500">{e.time} - {e.attendees.length} người</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">{label}</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{value}</div>
          <div className="text-xs text-slate-500 mt-1">{sub}</div>
        </div>
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}
