import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, FolderKanban, ListChecks, User as UserIcon,
  ArrowRight, Command,
} from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { useUI } from '../store/UIContext'
import { taskStatusMeta, priorityMeta } from '../data/mock'
import { fmtDate, classNames } from '../lib/utils'
import Avatar from './Avatar'

export default function CommandPalette({ open, onClose }) {
  const { projects, tasks, members, projectById } = useStore()
  const ui = useUI()
  const navigate = useNavigate()

  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (open) {
      setQ(''); setActive(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const results = useMemo(() => {
    const k = q.trim().toLowerCase()
    if (!k) {
      // default: actions + recent
      return [
        { id: 'a-create-task',    type: 'action', label: 'Tạo task mới',    icon: ListChecks,    run: () => ui.openCreateTask() },
        { id: 'a-create-project', type: 'action', label: 'Tạo dự án mới',   icon: FolderKanban,  run: () => ui.openCreateProject() },
        { id: 'a-create-event',   type: 'action', label: 'Tạo sự kiện',     icon: Command,       run: () => ui.openCreateEvent() },
        { id: 'a-go-mytasks',     type: 'action', label: 'Đi tới Việc của tôi', icon: ArrowRight, run: () => navigate('/my-tasks') },
        { id: 'a-go-projects',    type: 'action', label: 'Đi tới Dự án',    icon: ArrowRight, run: () => navigate('/projects') },
        { id: 'a-go-workload',    type: 'action', label: 'Đi tới Workload', icon: ArrowRight, run: () => navigate('/workload') },
      ]
    }
    const projHits = projects
      .filter(p => `${p.name} ${p.code} ${p.description}`.toLowerCase().includes(k))
      .slice(0, 5)
      .map(p => ({
        id: 'p-' + p.id, type: 'project', label: p.name, sub: p.code, raw: p,
        run: () => navigate(`/projects/${p.id}`),
      }))
    const taskHits = tasks
      .filter(t => t.title.toLowerCase().includes(k) || t.id.toLowerCase().includes(k))
      .slice(0, 8)
      .map(t => ({
        id: 't-' + t.id, type: 'task', label: t.title,
        sub: `${projectById[t.projectId]?.code || ''} · ${taskStatusMeta[t.status]?.label}`,
        raw: t,
        run: () => ui.openTaskDetail(t.id),
      }))
    const memHits = members
      .filter(m => `${m.name} ${m.email} ${m.role}`.toLowerCase().includes(k))
      .slice(0, 5)
      .map(m => ({
        id: 'm-' + m.id, type: 'member', label: m.name, sub: m.role, raw: m,
        run: () => navigate(`/team`),
      }))
    return [...projHits, ...taskHits, ...memHits]
  }, [q, projects, tasks, members, projectById, ui, navigate])

  useEffect(() => { setActive(0) }, [q])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
      if (e.key === 'Enter') {
        e.preventDefault()
        const r = results[active]
        if (r) { r.run(); onClose() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, active, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
         onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <Search size={16} className="text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm dự án, công việc, thành viên..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <kbd className="hidden sm:inline-block text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-1">
          {results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">Không tìm thấy</div>
          )}
          {results.map((r, i) => (
            <button
              key={r.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => { r.run(); onClose() }}
              className={classNames(
                'w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm',
                i === active ? 'bg-brand-50' : 'hover:bg-slate-50'
              )}>
              <Glyph item={r} />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-slate-800 truncate">{r.label}</div>
                {r.sub && <div className="text-xs text-slate-500 truncate">{r.sub}</div>}
              </div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 shrink-0">
                {r.type}
              </span>
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-3">
          <span><kbd className="border border-slate-200 rounded px-1">↑↓</kbd> điều hướng</span>
          <span><kbd className="border border-slate-200 rounded px-1">Enter</kbd> chọn</span>
          <span className="ml-auto"><kbd className="border border-slate-200 rounded px-1">Cmd</kbd>+<kbd className="border border-slate-200 rounded px-1">K</kbd> bật/tắt</span>
        </div>
      </div>
    </div>
  )
}

function Glyph({ item }) {
  if (item.type === 'project') {
    return <span className="w-7 h-7 rounded bg-brand-100 text-brand-700 flex items-center justify-center"><FolderKanban size={14}/></span>
  }
  if (item.type === 'task') {
    return <span className="w-7 h-7 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center"><ListChecks size={14}/></span>
  }
  if (item.type === 'member') {
    return <Avatar name={item.label} size="sm" />
  }
  // action
  const Icon = item.icon || ArrowRight
  return <span className="w-7 h-7 rounded bg-slate-100 text-slate-600 flex items-center justify-center"><Icon size={14}/></span>
}
