import { useEffect, useRef, useState } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Bell, Check, AtSign, Clock, AlertTriangle, UserPlus, MessageSquare } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { useUI } from '../store/UIContext'
import Avatar from './Avatar'
import { classNames } from '../lib/utils'

const TYPE_META = {
  mention:  { icon: AtSign,         color: 'text-violet-600 bg-violet-50' },
  assigned: { icon: UserPlus,       color: 'text-brand-600 bg-brand-50' },
  overdue:  { icon: AlertTriangle,  color: 'text-rose-600 bg-rose-50' },
  comment:  { icon: MessageSquare,  color: 'text-slate-600 bg-slate-100' },
  due_soon: { icon: Clock,          color: 'text-amber-600 bg-amber-50' },
}

export default function NotificationsDropdown() {
  const { notifications, memberById, markNotificationRead, markAllNotificationsRead } = useStore()
  const ui = useUI()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const sorted = [...notifications].sort((a, b) => b.at.localeCompare(a.at))
  const unread = sorted.filter(n => !n.read).length

  const click = (n) => {
    markNotificationRead(n.id)
    if (n.taskId) ui.openTaskDetail(n.taskId)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="btn-ghost relative !p-2" title="Thông báo">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[380px] bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-30">
          <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
            <div>
              <div className="text-sm font-bold text-slate-800">Thông báo</div>
              <div className="text-xs text-slate-500">{unread > 0 ? `${unread} chưa đọc` : 'Đã đọc tất cả'}</div>
            </div>
            {unread > 0 && (
              <button onClick={markAllNotificationsRead}
                className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1">
                <Check size={12} /> Đánh dấu đã đọc
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {sorted.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-slate-400">
                <Bell size={32} className="mx-auto mb-2 opacity-40" />
                Chưa có thông báo nào.
              </div>
            )}
            {sorted.map(n => {
              const meta = TYPE_META[n.type] || TYPE_META.comment
              const Icon = meta.icon
              const actor = memberById[n.actorId]
              const time = formatDistanceToNow(parseISO(n.at), { addSuffix: true, locale: vi })
              return (
                <button key={n.id}
                  onClick={() => click(n)}
                  className={classNames(
                    'w-full text-left px-4 py-3 flex items-start gap-3 border-b border-slate-50 transition',
                    n.read ? 'bg-white hover:bg-slate-50' : 'bg-brand-50/40 hover:bg-brand-50/70'
                  )}>
                  <div className="relative shrink-0">
                    {actor
                      ? <Avatar name={actor.name} size="sm" />
                      : <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <Bell size={14} />
                        </div>}
                    <div className={classNames(
                      'absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white',
                      meta.color
                    )}>
                      <Icon size={10} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={classNames('text-sm', !n.read && 'font-semibold text-slate-800', n.read && 'text-slate-600')}>
                      {n.body}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{time}</div>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-2" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
