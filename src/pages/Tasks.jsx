import { useMemo, useState } from 'react'
import { Plus, Search, LayoutGrid, List, Filter, Clock, MessageSquare, GitBranch } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import {
  taskStatusMeta, priorityMeta,
} from '../data/mock'
import { fmtDate, classNames } from '../lib/utils'
import { PageHeader, Badge } from '../components/UI'
import Avatar from '../components/Avatar'
import { SearchableSelect } from '../components/SearchableSelect'
import TaskFormModal from '../components/TaskFormModal'

const COLUMNS = ['backlog','todo','in_progress','review','done']

export default function Tasks() {
  const { tasks: allTasks, projects, members, memberById, projectById, upsertTask } = useStore()
  const [view, setView]         = useState('kanban')
  const [q, setQ]               = useState('')
  const [projectId, setProject] = useState('all')
  const [assignee, setAssignee] = useState('all')
  const [priority, setPriority] = useState('all')
  const [taskEdit, setTaskEdit] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const filtered = useMemo(() => {
    return allTasks.filter(t => {
      if (projectId !== 'all' && t.projectId !== projectId) return false
      if (assignee !== 'all' && t.assigneeId !== assignee) return false
      if (priority !== 'all' && t.priority !== priority) return false
      if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
  }, [allTasks, q, projectId, assignee, priority])

  const moveTask = (taskId, newStatus) => {
    const t = allTasks.find(x => x.id === taskId)
    if (!t || t.status === newStatus) return
    upsertTask({ ...t, status: newStatus })
  }

  return (
    <div>
      <PageHeader
        title="Công việc"
        description={`${filtered.length} task hiển thị`}
        actions={
          <button className="btn-primary" onClick={() => setTaskEdit(undefined)}>
            <Plus size={16}/> Task mới
          </button>
        }
      />

      <div className="card p-3 mb-5 grid grid-cols-2 md:flex md:flex-wrap md:items-center gap-2 md:gap-3">
        <div className="relative col-span-2 md:flex-1 md:min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Tìm task..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <Filter size={14} className="text-slate-400 hidden md:block" />
        <div className="md:w-44">
          <SearchableSelect
            value={projectId === 'all' ? '' : projectId}
            onChange={(v) => setProject(v || 'all')}
            placeholder="Mọi dự án"
            options={projects.map(p => ({
              value: p.id,
              label: `${p.code} - ${p.name}`,
            }))}
          />
        </div>
        <div className="md:w-44">
          <SearchableSelect
            value={assignee === 'all' ? '' : assignee}
            onChange={(v) => setAssignee(v || 'all')}
            placeholder="Mọi người"
            options={members.map(m => ({
              value: m.id,
              label: m.name,
              sub: m.role,
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
            renderValue={(o) => (
              <span className="flex items-center gap-2">
                <Avatar name={o.label} size="xs" />
                <span className="text-slate-700 truncate">{o.label}</span>
              </span>
            )}
          />
        </div>
        <select className="input md:w-36" value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="all">Mọi mức</option>
          {Object.keys(priorityMeta).map(p => <option key={p} value={p}>{priorityMeta[p].label}</option>)}
        </select>
        <div className="col-span-2 md:col-auto flex items-center bg-slate-100 rounded-lg p-0.5 self-start md:self-auto md:ml-auto">
          <button onClick={() => setView('kanban')}
            className={classNames('px-2 py-1 rounded-md', view === 'kanban' && 'bg-white shadow-sm')}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setView('list')}
            className={classNames('px-2 py-1 rounded-md', view === 'list' && 'bg-white shadow-sm')}>
            <List size={16} />
          </button>
        </div>
      </div>

      {view === 'kanban'
        ? <Kanban tasks={filtered} projectById={projectById} memberById={memberById}
                  onCard={setTaskEdit} onAdd={() => setTaskEdit(undefined)}
                  onMove={moveTask} dragOver={dragOver} setDragOver={setDragOver} />
        : <ListView tasks={filtered} projectById={projectById} memberById={memberById}
                    onRow={setTaskEdit} />
      }

      <TaskFormModal
        open={taskEdit !== null}
        onClose={() => setTaskEdit(null)}
        task={taskEdit}
        defaultProjectId={projectId !== 'all' ? projectId : undefined}
      />
    </div>
  )
}

function Kanban({ tasks, projectById, memberById, onCard, onAdd, onMove, dragOver, setDragOver }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col)
        const meta = taskStatusMeta[col]
        const isOver = dragOver === col
        return (
          <div key={col}
            onDragOver={(e) => { e.preventDefault(); setDragOver(col) }}
            onDragLeave={(e) => {
              // only clear when leaving column boundary
              if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(prev => prev === col ? null : prev)
            }}
            onDrop={(e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData('text/plain')
              if (id) onMove(id, col)
              setDragOver(null)
            }}
            className={classNames(
              'rounded-xl p-3 min-h-[60vh] transition',
              isOver ? 'bg-brand-50 ring-2 ring-brand-300' : 'bg-slate-100/70'
            )}>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                <span className="text-sm font-semibold text-slate-700">{meta.label}</span>
                <span className="text-xs text-slate-500">{colTasks.length}</span>
              </div>
              <button className="text-slate-400 hover:text-slate-600" onClick={onAdd}>
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {colTasks.map(t => (
                <KanbanCard key={t.id} task={t}
                            projectById={projectById} memberById={memberById}
                            onClick={() => onCard(t)} />
              ))}
              {colTasks.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
                  Kéo task vào đây
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function KanbanCard({ task, projectById, memberById, onClick }) {
  const proj = projectById[task.projectId]
  const today = '2026-05-19'
  const overdue = task.dueDate < today && task.status !== 'done'
  const assignee = memberById[task.assigneeId]

  const onDragStart = (e) => {
    e.dataTransfer.setData('text/plain', task.id)
    e.dataTransfer.effectAllowed = 'move'
    e.currentTarget.classList.add('opacity-40')
  }
  const onDragEnd = (e) => {
    e.currentTarget.classList.remove('opacity-40')
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="bg-white rounded-lg p-3 shadow-card border border-slate-100 hover:shadow-md transition cursor-grab active:cursor-grabbing">
      <div className="flex items-center gap-2 mb-2">
        {proj && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{proj.code}</span>}
        <Badge className={priorityMeta[task.priority].color + ' !text-[10px] !px-1.5'}>
          {priorityMeta[task.priority].label}
        </Badge>
      </div>
      <div className="text-sm font-medium text-slate-800 mb-2">{task.title}</div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className={overdue ? 'text-rose-600 font-semibold' : ''}>
            <Clock size={11} className="inline -mt-0.5 mr-0.5"/>{fmtDate(task.dueDate)}
          </span>
          {task.subtaskCount > 0 && (
            <span><GitBranch size={11} className="inline -mt-0.5 mr-0.5"/>{task.subtaskCount}</span>
          )}
          {task.commentCount > 0 && (
            <span><MessageSquare size={11} className="inline -mt-0.5 mr-0.5"/>{task.commentCount}</span>
          )}
        </div>
        {assignee && <Avatar name={assignee.name} size="xs" />}
      </div>
    </div>
  )
}

function ListView({ tasks, projectById, memberById, onRow }) {
  const today = '2026-05-19'
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="text-left px-4 py-3">Task</th>
            <th className="text-left px-4 py-3">Dự án</th>
            <th className="text-left px-4 py-3">Trạng thái</th>
            <th className="text-left px-4 py-3">Ưu tiên</th>
            <th className="text-left px-4 py-3">Phụ trách</th>
            <th className="text-left px-4 py-3">Hạn</th>
            <th className="text-left px-4 py-3">Time</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(t => {
            const overdue = t.dueDate < today && t.status !== 'done'
            const assignee = memberById[t.assigneeId]
            const proj = projectById[t.projectId]
            return (
              <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                  onClick={() => onRow(t)}>
                <td className="px-4 py-3 font-medium text-slate-800">{t.title}</td>
                <td className="px-4 py-3 text-xs">
                  {proj && <span className="font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{proj.code}</span>}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${taskStatusMeta[t.status].dot}`} />
                    <span>{taskStatusMeta[t.status].label}</span>
                  </span>
                </td>
                <td className="px-4 py-3"><Badge className={priorityMeta[t.priority].color}>{priorityMeta[t.priority].label}</Badge></td>
                <td className="px-4 py-3">
                  {assignee && (
                    <div className="flex items-center gap-2">
                      <Avatar name={assignee.name} size="xs" />
                      <span className="text-xs">{assignee.name}</span>
                    </div>
                  )}
                </td>
                <td className={classNames('px-4 py-3 text-xs', overdue && 'text-rose-600 font-semibold')}>
                  {fmtDate(t.dueDate)}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{t.spentHours}/{t.estimateHours}h</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </div>
  )
}
