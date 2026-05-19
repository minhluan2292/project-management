import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, LayoutGrid, List, Filter, Pencil } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import {
  projectStatusMeta, priorityMeta,
} from '../data/mock'
import { fmtDate, fmtCurrency, classNames } from '../lib/utils'
import { PageHeader, ProgressBar, StatusBadge, Badge } from '../components/UI'
import { AvatarGroup } from '../components/Avatar'
import ProjectFormModal from '../components/ProjectFormModal'

const statusFilters = [
  { value: 'all',         label: 'Tất cả' },
  { value: 'planning',    label: 'Lên kế hoạch' },
  { value: 'in_progress', label: 'Đang chạy' },
  { value: 'on_hold',     label: 'Tạm dừng' },
  { value: 'completed',   label: 'Hoàn thành' },
]

export default function Projects() {
  const { projects, tasks, memberById, teamById } = useStore()
  const [view, setView]     = useState('grid')
  const [status, setStatus] = useState('all')
  const [q, setQ]           = useState('')
  const [editing, setEditing] = useState(null) // null | undefined | project
  // null = closed, undefined = create new, object = edit

  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (status !== 'all' && p.status !== status) return false
      if (q && !`${p.name} ${p.code} ${p.description}`.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
  }, [status, q, projects])

  return (
    <div>
      <PageHeader
        title="Dự án"
        description="Quản lý toàn bộ dự án của công ty"
        actions={
          <button className="btn-primary" onClick={() => setEditing(undefined)}>
            <Plus size={16}/> Dự án mới
          </button>
        }
      />

      <div className="card p-3 mb-5 flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Tìm dự án..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 flex-wrap overflow-x-auto -mx-1 px-1 pb-1 md:pb-0">
          <Filter size={14} className="text-slate-400 shrink-0" />
          {statusFilters.map(f => (
            <button key={f.value}
              onClick={() => setStatus(f.value)}
              className={classNames(
                'px-3 py-1.5 rounded-full text-xs font-medium transition border whitespace-nowrap shrink-0',
                status === f.value
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 self-start md:self-auto shrink-0">
          <button onClick={() => setView('grid')}
            className={classNames('px-2 py-1 rounded-md', view === 'grid' && 'bg-white shadow-sm')}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setView('list')}
            className={classNames('px-2 py-1 rounded-md', view === 'list' && 'bg-white shadow-sm')}>
            <List size={16} />
          </button>
        </div>
      </div>

      <div className="text-sm text-slate-500 mb-3">{filtered.length} dự án</div>

      {view === 'grid'
        ? <ProjectsGrid projects={filtered} tasks={tasks} memberById={memberById} teamById={teamById} onEdit={setEditing} />
        : <ProjectsList projects={filtered} memberById={memberById} onEdit={setEditing} />
      }

      <ProjectFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        project={editing}
      />
    </div>
  )
}

function ProjectsGrid({ projects, tasks, memberById, teamById, onEdit }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {projects.map(p => {
        const taskCount = tasks.filter(t => t.projectId === p.id).length
        const doneCount = tasks.filter(t => t.projectId === p.id && t.status === 'done').length
        return (
          <div key={p.id} className="card p-5 hover:shadow-md hover:border-brand-200 transition relative group">
            <button
              onClick={(e) => { e.preventDefault(); onEdit(p) }}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition btn-ghost p-1.5"
              title="Sửa">
              <Pencil size={14} />
            </button>
            <Link to={`/projects/${p.id}`} className="block">
              <div className="flex items-start justify-between gap-2 pr-8">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{p.code}</span>
                    <Badge className={priorityMeta[p.priority].color}>{priorityMeta[p.priority].label}</Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900 truncate">{p.name}</h3>
                </div>
                <StatusBadge meta={projectStatusMeta[p.status]} />
              </div>

              <p className="text-sm text-slate-500 mt-2 line-clamp-2 min-h-[2.5rem]">{p.description}</p>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Tiến độ</span>
                  <span className="font-semibold text-slate-700">{p.progress}%</span>
                </div>
                <ProgressBar value={p.progress} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-500">
                <div>
                  <div className="text-slate-400">Task</div>
                  <div className="font-semibold text-slate-700 mt-0.5">{doneCount}/{taskCount}</div>
                </div>
                <div>
                  <div className="text-slate-400">Bắt đầu</div>
                  <div className="font-semibold text-slate-700 mt-0.5">{fmtDate(p.startDate)}</div>
                </div>
                <div>
                  <div className="text-slate-400">Kết thúc</div>
                  <div className="font-semibold text-slate-700 mt-0.5">{fmtDate(p.endDate)}</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <AvatarGroup names={p.memberIds.map(id => memberById[id]?.name).filter(Boolean)} max={4} />
                <div className="flex flex-wrap gap-1 justify-end">
                  {p.teamIds.slice(0,3).map(tid => teamById[tid] && (
                    <span key={tid}
                      style={{ borderColor: teamById[tid].color, color: teamById[tid].color }}
                      className="text-[10px] uppercase font-semibold border px-1.5 py-0.5 rounded">
                      {teamById[tid].name}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </div>
        )
      })}
    </div>
  )
}

function ProjectsList({ projects, memberById, onEdit }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-3">Dự án</th>
            <th className="text-left px-4 py-3">Trạng thái</th>
            <th className="text-left px-4 py-3">Ưu tiên</th>
            <th className="text-left px-4 py-3 w-48">Tiến độ</th>
            <th className="text-left px-4 py-3">Thành viên</th>
            <th className="text-left px-4 py-3">Thời gian</th>
            <th className="text-left px-4 py-3">Ngân sách</th>
            <th className="text-left px-4 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {projects.map(p => (
            <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link to={`/projects/${p.id}`} className="block">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{p.code}</span>
                    <span className="font-semibold text-slate-800">{p.name}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{p.description}</div>
                </Link>
              </td>
              <td className="px-4 py-3"><StatusBadge meta={projectStatusMeta[p.status]} /></td>
              <td className="px-4 py-3"><Badge className={priorityMeta[p.priority].color}>{priorityMeta[p.priority].label}</Badge></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <ProgressBar value={p.progress} className="flex-1" />
                  <span className="text-xs font-semibold text-slate-700 w-9 text-right">{p.progress}%</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <AvatarGroup names={p.memberIds.map(id => memberById[id]?.name).filter(Boolean)} max={4} />
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {fmtDate(p.startDate)} → {fmtDate(p.endDate)}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{fmtCurrency(p.budget)}</td>
              <td className="px-4 py-3">
                <button className="btn-ghost p-1.5" onClick={() => onEdit(p)}>
                  <Pencil size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
