import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Calendar, Users, Wallet, Tag, Clock,
  CheckCircle2, ListChecks, AlertTriangle, Pencil, Plus
} from 'lucide-react'
import { useStore } from '../store/StoreContext'
import {
  projectStatusMeta, taskStatusMeta, priorityMeta,
} from '../data/mock'
import { fmtDate, fmtCurrency, daysBetween } from '../lib/utils'
import { PageHeader, ProgressBar, StatusBadge, Badge, SectionTitle, EmptyState } from '../components/UI'
import Avatar from '../components/Avatar'
import ProjectFormModal from '../components/ProjectFormModal'
import TaskFormModal from '../components/TaskFormModal'

export default function ProjectDetail() {
  const { id } = useParams()
  const { projectById, tasks, memberById, teamById } = useStore()
  const project = projectById[id]
  const projTasks = useMemo(() => tasks.filter(t => t.projectId === id), [tasks, id])

  const [editProject, setEditProject] = useState(false)
  const [taskEdit, setTaskEdit] = useState(null) // null|undefined|task

  if (!project) {
    return <EmptyState title="Không tìm thấy dự án" description="Dự án có thể đã bị xoá." icon={AlertTriangle} />
  }

  const today = '2026-05-19'
  const totalDays = daysBetween(project.startDate, project.endDate)
  const passedDays = Math.max(0, daysBetween(project.startDate, today))
  const dueSoon = projTasks.filter(t => t.status !== 'done' && t.dueDate >= today && daysBetween(today, t.dueDate) <= 7)
  const overdue = projTasks.filter(t => t.status !== 'done' && t.dueDate < today)
  const doneCount = projTasks.filter(t => t.status === 'done').length

  return (
    <div>
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3">
        <ArrowLeft size={14} /> Tất cả dự án
      </Link>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="text-xs font-mono px-2 py-1 rounded bg-slate-100 text-slate-600">{project.code}</span>
            <span>{project.name}</span>
          </span>
        }
        description={project.description}
        actions={
          <>
            <button className="btn-outline" onClick={() => setEditProject(true)}>
              <Pencil size={14}/> Chỉnh sửa
            </button>
            <button className="btn-primary" onClick={() => setTaskEdit(undefined)}>
              <Plus size={14}/> Thêm task
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2">
              <StatusBadge meta={projectStatusMeta[project.status]} />
              <Badge className={priorityMeta[project.priority].color}>Ưu tiên: {priorityMeta[project.priority].label}</Badge>
              {project.tags.map(t => (
                <Badge key={t} className="bg-slate-100 text-slate-600">
                  <Tag size={10} className="mr-1"/>{t}
                </Badge>
              ))}
            </div>
            <div className="text-sm text-slate-600 font-semibold">{project.progress}%</div>
          </div>
          <ProgressBar value={project.progress} />
          <div className="text-xs text-slate-500 mt-2">
            Đã trôi qua {passedDays}/{totalDays} ngày
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Stat icon={ListChecks} label="Tổng task" value={projTasks.length} />
            <Stat icon={CheckCircle2} label="Đã hoàn thành" value={doneCount} color="text-emerald-600" />
            <Stat icon={Clock} label="Sắp đến hạn" value={dueSoon.length} color="text-amber-600" />
            <Stat icon={AlertTriangle} label="Quá hạn" value={overdue.length} color="text-rose-600" />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <Info icon={Calendar} label="Thời gian">
            <div>{fmtDate(project.startDate)} → {fmtDate(project.endDate)}</div>
            <div className="text-xs text-slate-500">{totalDays} ngày</div>
          </Info>
          <Info icon={Users} label="Phụ trách">
            {memberById[project.leadId] && (
              <div className="flex items-center gap-2">
                <Avatar name={memberById[project.leadId].name} size="sm" />
                <div>
                  <div className="text-sm">{memberById[project.leadId].name}</div>
                  <div className="text-xs text-slate-500">{memberById[project.leadId].role}</div>
                </div>
              </div>
            )}
          </Info>
          <Info icon={Wallet} label="Ngân sách">
            <div>{fmtCurrency(project.budget)}</div>
          </Info>
          <Info icon={Tag} label="Team tham gia">
            <div className="flex flex-wrap gap-1">
              {project.teamIds.map(tid => teamById[tid] && (
                <span key={tid}
                  style={{ borderColor: teamById[tid].color, color: teamById[tid].color }}
                  className="text-[10px] uppercase font-semibold border px-1.5 py-0.5 rounded">
                  {teamById[tid].name}
                </span>
              ))}
            </div>
          </Info>
        </div>
      </div>

      {/* Members */}
      <div className="card p-5 mb-6">
        <SectionTitle title="Thành viên" subtitle={`${project.memberIds.length} người`} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {project.memberIds.map(uid => {
            const m = memberById[uid]
            if (!m) return null
            const myTasks = projTasks.filter(t => t.assigneeId === uid)
            const myDone  = myTasks.filter(t => t.status === 'done').length
            return (
              <div key={uid} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                <Avatar name={m.name} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-800 truncate">{m.name}</div>
                  <div className="text-xs text-slate-500 truncate">{m.role}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {myDone}/{myTasks.length} task hoàn thành
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tasks */}
      <div className="card p-5">
        <SectionTitle
          title="Công việc"
          subtitle={`${projTasks.length} task`}
          action={
            <button className="btn-outline" onClick={() => setTaskEdit(undefined)}>
              <Plus size={14}/> Thêm task
            </button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left py-2">Tiêu đề</th>
                <th className="text-left py-2">Trạng thái</th>
                <th className="text-left py-2">Ưu tiên</th>
                <th className="text-left py-2">Phụ trách</th>
                <th className="text-left py-2">Hạn</th>
                <th className="text-left py-2">Time</th>
                <th className="text-left py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {projTasks.map(t => (
                <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => setTaskEdit(t)}>
                  <td className="py-2.5 pr-3 font-medium text-slate-800">{t.title}</td>
                  <td className="py-2.5 pr-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${taskStatusMeta[t.status].dot}`} />
                      <span className="text-slate-600">{taskStatusMeta[t.status].label}</span>
                    </span>
                  </td>
                  <td className="py-2.5 pr-3"><Badge className={priorityMeta[t.priority].color}>{priorityMeta[t.priority].label}</Badge></td>
                  <td className="py-2.5 pr-3">
                    {memberById[t.assigneeId] && (
                      <div className="flex items-center gap-2">
                        <Avatar name={memberById[t.assigneeId].name} size="xs" />
                        <span className="text-xs text-slate-600">{memberById[t.assigneeId].name}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-slate-600">{fmtDate(t.dueDate)}</td>
                  <td className="py-2.5 text-xs text-slate-600">{t.spentHours}/{t.estimateHours}h</td>
                  <td className="py-2.5"><Pencil size={14} className="text-slate-400" /></td>
                </tr>
              ))}
              {projTasks.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-sm text-slate-400">Chưa có task. Bấm “Thêm task” để bắt đầu.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProjectFormModal
        open={editProject}
        onClose={() => setEditProject(false)}
        project={project}
      />
      <TaskFormModal
        open={taskEdit !== null}
        onClose={() => setTaskEdit(null)}
        task={taskEdit}
        defaultProjectId={project.id}
      />
    </div>
  )
}

function Stat({ icon: Icon, label, value, color = 'text-slate-700' }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Icon size={14} /> {label}
      </div>
      <div className={`text-2xl font-bold ${color} mt-1`}>{value}</div>
    </div>
  )
}

function Info({ icon: Icon, label, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs uppercase text-slate-400 mb-1">
        <Icon size={12} /> {label}
      </div>
      <div className="text-sm text-slate-700">{children}</div>
    </div>
  )
}
