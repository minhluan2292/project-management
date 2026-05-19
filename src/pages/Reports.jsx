import { useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts'
import { Download } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { projectStatusMeta } from '../data/mock'
import { fmtCurrency } from '../lib/utils'
import { PageHeader, SectionTitle } from '../components/UI'

const COLORS = ['#3563f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#0ea5e9','#22c55e']

export default function Reports() {
  const { projects, tasks, members, teams } = useStore()
  const today = '2026-05-19'

  const statusDist = useMemo(() => {
    return Object.keys(projectStatusMeta).map((k, i) => ({
      name: projectStatusMeta[k].label,
      value: projects.filter(p => p.status === k).length,
      color: COLORS[i % COLORS.length],
    }))
  }, [])

  const projectProgress = useMemo(() => {
    return projects.map(p => ({
      name: p.code,
      progress: p.progress,
      done: tasks.filter(t => t.projectId === p.id && t.status === 'done').length,
      total: tasks.filter(t => t.projectId === p.id).length,
    }))
  }, [])

  const teamProductivity = useMemo(() => {
    return teams.map(t => {
      const teamMembers = members.filter(m => m.teamId === t.id).map(m => m.id)
      const teamTasks = tasks.filter(x => teamMembers.includes(x.assigneeId))
      return {
        name: t.name,
        done: teamTasks.filter(x => x.status === 'done').length,
        ongoing: teamTasks.filter(x => ['in_progress','review'].includes(x.status)).length,
        backlog: teamTasks.filter(x => ['backlog','todo'].includes(x.status)).length,
      }
    })
  }, [])

  // Burndown mock — synthetic 12 week trend
  const burndown = useMemo(() => {
    const total = tasks.length
    const data = []
    let remain = total
    for (let w = 1; w <= 12; w++) {
      const ideal = total - (total / 12) * w
      remain = Math.max(0, remain - (3 + Math.random() * 6))
      data.push({
        week: `T${w}`,
        thực_tế: Math.round(remain),
        kế_hoạch: Math.round(ideal),
      })
    }
    return data
  }, [])

  const budgetByProject = useMemo(() => {
    return projects.map(p => ({
      name: p.code,
      budget: p.budget / 1_000_000,
      spent:  Math.round(p.budget * (p.progress / 100) / 1_000_000),
    }))
  }, [])

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0)
  const totalSpent  = projects.reduce((s, p) => s + p.budget * (p.progress / 100), 0)
  const totalTasks  = tasks.length
  const doneTasks   = tasks.filter(t => t.status === 'done').length
  const overdue     = tasks.filter(t => t.status !== 'done' && t.dueDate < today).length
  const onTimeRate  = doneTasks === 0 ? 0 : Math.round(((doneTasks - overdue) / doneTasks) * 100)

  return (
    <div>
      <PageHeader
        title="Báo cáo & Phân tích"
        description="Cái nhìn tổng thể về hiệu suất, ngân sách và tiến độ."
        actions={<button className="btn-outline"><Download size={16}/> Xuất Excel</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Tổng dự án" value={projects.length} />
        <Kpi label="Hoàn thành đúng hạn" value={`${onTimeRate}%`} accent="text-emerald-600" />
        <Kpi label="Ngân sách đã dùng"
             value={`${Math.round((totalSpent/totalBudget) * 100)}%`}
             sub={`${fmtCurrency(totalSpent)} / ${fmtCurrency(totalBudget)}`}
             accent="text-amber-600" />
        <Kpi label="Task quá hạn" value={overdue} accent="text-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="card p-5 lg:col-span-2">
          <SectionTitle title="Burndown 12 tuần" subtitle="Khối lượng task còn lại theo thời gian" />
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={burndown}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3563f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3563f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="thực_tế"  stroke="#3563f6" fill="url(#g1)" name="Thực tế" />
                <Line type="monotone" dataKey="kế_hoạch" stroke="#94a3b8" strokeDasharray="4 4" dot={false} name="Kế hoạch" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <SectionTitle title="Trạng thái dự án" />
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusDist} dataKey="value" nameKey="name"
                  innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {statusDist.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card p-5">
          <SectionTitle title="Tiến độ theo dự án" />
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={projectProgress} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={50} />
                <Tooltip />
                <Bar dataKey="progress" name="% Hoàn thành" fill="#3563f6" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <SectionTitle title="Năng suất theo Team" />
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={teamProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip /><Legend />
                <Bar dataKey="done"    stackId="x" fill="#10b981" name="Đã xong" />
                <Bar dataKey="ongoing" stackId="x" fill="#3563f6" name="Đang làm" />
                <Bar dataKey="backlog" stackId="x" fill="#cbd5e1" name="Chờ" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <SectionTitle title="Ngân sách theo dự án" subtitle="Đơn vị: triệu VND" />
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={budgetByProject}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="budget" fill="#cbd5e1" name="Tổng ngân sách" radius={[4,4,0,0]} />
              <Bar dataKey="spent"  fill="#3563f6" name="Đã chi"        radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, accent = 'text-slate-900' }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`text-3xl font-bold mt-1 ${accent}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  )
}
