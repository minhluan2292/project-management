import { useEffect, useMemo, useState } from 'react'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  X, Pencil, Trash2, Send, Plus, CheckCircle2, Circle,
  ListChecks, MessageSquare, Activity, GitBranch,
  Calendar, Clock, User, Flag, Tag,
} from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { taskStatusMeta, priorityMeta, currentUser } from '../data/mock'
import { fmtDate, classNames } from '../lib/utils'
import Avatar from './Avatar'
import { Badge } from './UI'
import { useUI } from '../store/UIContext'

const STATUS_OPTIONS = ['backlog','todo','in_progress','review','done']
const PRIORITY_OPTIONS = ['low','medium','high','urgent']

export default function TaskDetailDrawer({ taskId, onClose }) {
  const open = !!taskId
  const {
    tasks, projectById, memberById,
    subtasks, comments, activity,
    updateTask, deleteTask,
    addSubtask, toggleSubtask, deleteSubtask, updateSubtask,
    addComment, deleteComment,
  } = useStore()
  const ui = useUI()

  const task = tasks.find(t => t.id === taskId)
  const [tab, setTab] = useState('comments')
  const [newComment, setNewComment] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const [editingSubtaskId, setEditingSubtaskId] = useState(null)
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => { setTab('comments'); setNewComment(''); setNewSubtask('') }, [taskId])

  const taskSubtasks = useMemo(
    () => subtasks.filter(s => s.taskId === taskId),
    [subtasks, taskId]
  )
  const taskComments = useMemo(
    () => comments.filter(c => c.taskId === taskId)
                  .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [comments, taskId]
  )
  const taskActivity = useMemo(
    () => activity.filter(a => a.taskId === taskId)
                  .sort((a, b) => b.at.localeCompare(a.at)),
    [activity, taskId]
  )

  if (!open) return null
  if (!task) {
    return (
      <Overlay onClose={onClose}>
        <div className="p-6 text-sm text-slate-500">Task không tồn tại hoặc đã bị xoá.</div>
      </Overlay>
    )
  }

  const project = projectById[task.projectId]
  const assignee = memberById[task.assigneeId]
  const reporter = memberById[task.reporterId]
  const today = '2026-05-19'
  const overdue = task.dueDate < today && task.status !== 'done'
  const doneSub = taskSubtasks.filter(s => s.done).length
  const subPct = taskSubtasks.length === 0 ? 0 : Math.round((doneSub / taskSubtasks.length) * 100)

  const submitComment = () => {
    if (!newComment.trim()) return
    addComment(task.id, newComment)
    setNewComment('')
  }

  const submitSubtask = () => {
    if (!newSubtask.trim()) return
    addSubtask(task.id, newSubtask)
    setNewSubtask('')
  }

  return (
    <Overlay onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {project && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {project.code}
                </span>
              )}
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-50 text-slate-500">
                {task.id}
              </span>
              {overdue && <Badge className="bg-rose-100 text-rose-700">Quá hạn</Badge>}
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{task.title}</h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => { onClose(); ui.openEditTask(task) }}
              className="btn-ghost !p-1.5" title="Chỉnh sửa đầy đủ">
              <Pencil size={16} />
            </button>
            <button
              onClick={() => {
                if (confirm('Xoá task này?')) { deleteTask(task.id); onClose() }
              }}
              className="btn-ghost !p-1.5 text-rose-500 hover:text-rose-700" title="Xoá">
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} className="btn-ghost !p-1.5" title="Đóng">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick fields */}
        <div className="px-5 py-3 border-b border-slate-100 grid grid-cols-2 gap-y-3 gap-x-4 text-sm bg-slate-50/40">
          <Field label="Trạng thái" icon={Activity}>
            <select className="input !py-1 !h-auto text-sm"
              value={task.status} onChange={e => updateTask(task.id, { status: e.target.value })}>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{taskStatusMeta[s].label}</option>
              ))}
            </select>
          </Field>
          <Field label="Ưu tiên" icon={Flag}>
            <select className="input !py-1 !h-auto text-sm"
              value={task.priority} onChange={e => updateTask(task.id, { priority: e.target.value })}>
              {PRIORITY_OPTIONS.map(p => (
                <option key={p} value={p}>{priorityMeta[p].label}</option>
              ))}
            </select>
          </Field>
          <Field label="Phụ trách" icon={User}>
            {assignee
              ? <div className="flex items-center gap-2">
                  <Avatar name={assignee.name} size="xs" />
                  <span className="truncate">{assignee.name}</span>
                </div>
              : <span className="text-slate-400">Chưa giao</span>}
          </Field>
          <Field label="Người tạo" icon={User}>
            {reporter
              ? <div className="flex items-center gap-2">
                  <Avatar name={reporter.name} size="xs" />
                  <span className="truncate">{reporter.name}</span>
                </div>
              : <span className="text-slate-400">—</span>}
          </Field>
          <Field label="Bắt đầu" icon={Calendar}>{fmtDate(task.startDate)}</Field>
          <Field label="Hạn" icon={Calendar}>
            <span className={overdue ? 'text-rose-600 font-semibold' : ''}>{fmtDate(task.dueDate)}</span>
          </Field>
          <Field label="Time" icon={Clock}>
            {task.spentHours}h / {task.estimateHours}h
          </Field>
          {task.tags?.length > 0 && (
            <Field label="Tags" icon={Tag}>
              <div className="flex flex-wrap gap-1">
                {task.tags.map(t => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {t}
                  </span>
                ))}
              </div>
            </Field>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div className="px-5 py-3 border-b border-slate-100">
            <div className="text-xs uppercase font-semibold text-slate-500 mb-1">Mô tả</div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {/* Subtasks */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase font-semibold text-slate-500 flex items-center gap-1.5">
              <ListChecks size={12} /> Subtasks
              {taskSubtasks.length > 0 && (
                <span className="ml-1 text-slate-400 normal-case font-normal">
                  {doneSub}/{taskSubtasks.length} · {subPct}%
                </span>
              )}
            </div>
          </div>
          {taskSubtasks.length > 0 && (
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-emerald-500" style={{ width: `${subPct}%` }} />
            </div>
          )}
          <ul className="space-y-1.5 mb-2">
            {taskSubtasks.map(s => (
              <li key={s.id} className="flex items-center gap-2 group">
                <button
                  onClick={() => toggleSubtask(s.id)}
                  className="text-slate-400 hover:text-emerald-600">
                  {s.done
                    ? <CheckCircle2 size={16} className="text-emerald-600" />
                    : <Circle size={16} />}
                </button>
                {editingSubtaskId === s.id ? (
                  <input autoFocus
                    value={editingSubtaskTitle}
                    onChange={e => setEditingSubtaskTitle(e.target.value)}
                    onBlur={() => {
                      updateSubtask(s.id, { title: editingSubtaskTitle.trim() || s.title })
                      setEditingSubtaskId(null)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') e.target.blur()
                      if (e.key === 'Escape') setEditingSubtaskId(null)
                    }}
                    className="flex-1 text-sm border-b border-brand-400 focus:outline-none px-1 py-0.5"
                  />
                ) : (
                  <span
                    onClick={() => { setEditingSubtaskId(s.id); setEditingSubtaskTitle(s.title) }}
                    className={classNames(
                      'flex-1 text-sm cursor-text',
                      s.done ? 'line-through text-slate-400' : 'text-slate-700'
                    )}>
                    {s.title}
                  </span>
                )}
                <button
                  onClick={() => deleteSubtask(s.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
            {taskSubtasks.length === 0 && (
              <li className="text-sm text-slate-400">Chưa có subtask.</li>
            )}
          </ul>
          <div className="flex items-center gap-2">
            <Plus size={14} className="text-slate-400" />
            <input
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitSubtask() }}
              placeholder="Thêm subtask..."
              className="flex-1 text-sm bg-transparent border-b border-slate-200 focus:border-brand-400 focus:outline-none py-1"
            />
            {newSubtask.trim() && (
              <button onClick={submitSubtask} className="text-xs text-brand-600 font-medium hover:underline">
                Thêm
              </button>
            )}
          </div>
        </div>

        {/* Tabs: Comments / Activity */}
        <div className="px-5 pt-3">
          <div className="flex items-center gap-3 border-b border-slate-200">
            <TabBtn active={tab === 'comments'} onClick={() => setTab('comments')}
              icon={MessageSquare} label="Bình luận" badge={taskComments.length} />
            <TabBtn active={tab === 'activity'} onClick={() => setTab('activity')}
              icon={Activity} label="Hoạt động" badge={taskActivity.length} />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {tab === 'comments' && (
            <CommentList
              comments={taskComments}
              memberById={memberById}
              onDelete={deleteComment}
            />
          )}
          {tab === 'activity' && (
            <ActivityList items={taskActivity} memberById={memberById} />
          )}
        </div>

        {tab === 'comments' && (
          <div className="border-t border-slate-200 p-3 flex items-end gap-2 bg-white">
            <Avatar name={currentUser.name} size="sm" />
            <textarea
              rows={1}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment()
              }}
              placeholder="Viết bình luận... (Cmd/Ctrl+Enter để gửi, dùng @tên để mention)"
              className="flex-1 min-w-0 input !py-2 resize-none text-sm"
              style={{ maxHeight: 120 }}
            />
            <button
              onClick={submitComment}
              disabled={!newComment.trim()}
              className="btn-primary !p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Gửi">
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
    </Overlay>
  )
}

function Overlay({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 h-full flex flex-col">
        {children}
      </aside>
    </div>
  )
}

function Field({ label, icon: Icon, children }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1 mb-0.5">
        {Icon && <Icon size={10} />} {label}
      </div>
      <div className="text-sm text-slate-700 truncate">{children}</div>
    </div>
  )
}

function TabBtn({ active, onClick, icon: Icon, label, badge }) {
  return (
    <button onClick={onClick}
      className={classNames(
        'px-3 py-2 text-sm font-medium flex items-center gap-1.5 -mb-px border-b-2',
        active
          ? 'text-brand-700 border-brand-600'
          : 'text-slate-500 border-transparent hover:text-slate-700'
      )}>
      <Icon size={14} /> {label}
      {badge > 0 && (
        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{badge}</span>
      )}
    </button>
  )
}

function CommentList({ comments, memberById, onDelete }) {
  if (comments.length === 0) {
    return <div className="text-sm text-slate-400 text-center py-8">Chưa có bình luận. Hãy là người đầu tiên.</div>
  }
  return (
    <div className="space-y-4">
      {comments.map(c => {
        const author = memberById[c.authorId]
        const time = formatDistanceToNow(parseISO(c.createdAt), { addSuffix: true, locale: vi })
        const isMine = c.authorId === currentUser.id
        return (
          <div key={c.id} className="flex items-start gap-3 group">
            {author && <Avatar name={author.name} size="sm" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-slate-800">{author?.name || 'Ẩn danh'}</span>
                <span className="text-xs text-slate-400">{time}</span>
                {isMine && (
                  <button onClick={() => { if (confirm('Xoá bình luận?')) onDelete(c.id) }}
                    className="ml-auto opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <div className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap break-words">
                {renderWithMentions(c.body)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function renderWithMentions(text) {
  const parts = text.split(/(@\w+)/g)
  return parts.map((p, i) =>
    p.startsWith('@')
      ? <span key={i} className="text-brand-700 bg-brand-50 px-1 rounded">{p}</span>
      : <span key={i}>{p}</span>
  )
}

function ActivityList({ items, memberById }) {
  if (items.length === 0) {
    return <div className="text-sm text-slate-400 text-center py-8">Chưa có hoạt động nào.</div>
  }
  return (
    <ol className="relative border-l border-slate-200 ml-2 space-y-3">
      {items.map(a => {
        const user = memberById[a.userId]
        const time = formatDistanceToNow(parseISO(a.at), { addSuffix: true, locale: vi })
        return (
          <li key={a.id} className="ml-4">
            <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-white border-2 border-brand-400" />
            <div className="text-sm text-slate-700">
              <span className="font-medium">{user?.name || 'Hệ thống'}</span>{' '}
              {describeActivity(a)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{time}</div>
          </li>
        )
      })}
    </ol>
  )
}

function describeActivity(a) {
  switch (a.type) {
    case 'created':
      return <>tạo task {a.data?.title && <span className="text-slate-500">"{a.data.title}"</span>}</>
    case 'status':
      return <>chuyển trạng thái <Badge className="bg-slate-100 text-slate-600">{taskStatusMeta[a.data.from]?.label || a.data.from}</Badge> → <Badge className="bg-slate-100 text-slate-600">{taskStatusMeta[a.data.to]?.label || a.data.to}</Badge></>
    case 'assigned':
      return <>thay đổi người phụ trách</>
    case 'comment':
      return <>thêm bình luận</>
    default:
      return <>cập nhật task</>
  }
}
