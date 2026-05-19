import { useMemo, useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, format, parseISO, isSameMonth, isSameDay
} from 'date-fns'
import { vi } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Filter } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { eventTypeMeta, currentUser } from '../data/mock'
import { classNames, fmtDate } from '../lib/utils'
import { PageHeader, Badge, SectionTitle } from '../components/UI'
import Avatar from '../components/Avatar'
import EventFormModal from '../components/EventFormModal'

export default function Calendar() {
  const { events, tasks, memberById } = useStore()
  const [cursor, setCursor] = useState(new Date('2026-05-19'))
  const [scope, setScope]   = useState('me')
  const [type, setType]     = useState('all')
  const [eventEdit, setEventEdit] = useState(null)
  const [defaultDate, setDefaultDate] = useState(null)

  const monthStart = startOfMonth(cursor)
  const monthEnd   = endOfMonth(cursor)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd    = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = useMemo(() => {
    const arr = []
    let d = gridStart
    while (d <= gridEnd) { arr.push(d); d = addDays(d, 1) }
    return arr
  }, [gridStart, gridEnd])

  const myTeamId = currentUser.teamId
  const matches = (e) => {
    if (type !== 'all' && e.type !== type) return false
    if (scope === 'me')   return e.attendees.includes(currentUser.id)
    if (scope === 'team') return e.attendees.some(uid => memberById[uid]?.teamId === myTeamId)
    return true
  }

  const filteredEvents = events.filter(matches)
  const eventsByDate = useMemo(() => {
    const m = {}
    for (const e of filteredEvents) (m[e.date] ||= []).push(e)
    return m
  }, [filteredEvents])

  const taskDeadlines = useMemo(() => {
    const map = {}
    const filterTask = (t) => {
      if (scope === 'me')   return t.assigneeId === currentUser.id
      if (scope === 'team') return memberById[t.assigneeId]?.teamId === myTeamId
      return true
    }
    for (const t of tasks.filter(filterTask)) (map[t.dueDate] ||= []).push(t)
    return map
  }, [tasks, scope, memberById, myTeamId])

  const openCreate = (iso) => {
    setEventEdit(undefined)
    setDefaultDate(iso || null)
  }
  const openEdit = (ev) => {
    setEventEdit(ev)
    setDefaultDate(null)
  }
  const closeModal = () => { setEventEdit(null); setDefaultDate(null) }

  return (
    <div>
      <PageHeader
        title="Lịch"
        description="Sự kiện, deadline cá nhân và team trong một góc nhìn."
        actions={<button className="btn-primary" onClick={() => openCreate()}><Plus size={16}/> Sự kiện</button>}
      />

      <div className="card p-3 mb-5 flex flex-col md:flex-row md:items-center gap-2 md:gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <button className="btn-ghost !p-1.5" onClick={() => setCursor(subMonths(cursor, 1))}><ChevronLeft size={18}/></button>
          <button className="btn-outline" onClick={() => setCursor(new Date('2026-05-19'))}>Hôm nay</button>
          <button className="btn-ghost !p-1.5" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight size={18}/></button>
        </div>
        <div className="text-base sm:text-lg font-bold text-slate-800 capitalize">
          {format(cursor, 'MMMM yyyy', { locale: vi })}
        </div>
        <div className="flex items-center gap-2 md:ml-auto flex-wrap overflow-x-auto -mx-1 px-1">
          <Filter size={14} className="text-slate-400 shrink-0" />
          {[
            { v: 'me',   label: 'Của tôi' },
            { v: 'team', label: 'Team của tôi' },
            { v: 'all',  label: 'Toàn công ty' },
          ].map(opt => (
            <button key={opt.v}
              onClick={() => setScope(opt.v)}
              className={classNames(
                'px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap shrink-0',
                scope === opt.v
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}>
              {opt.label}
            </button>
          ))}
          <select className="input w-auto md:w-36 shrink-0" value={type} onChange={e => setType(e.target.value)}>
            <option value="all">Mọi loại</option>
            {Object.entries(eventTypeMeta).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <div className="card overflow-hidden">
            <div className="grid grid-cols-7 bg-slate-50 text-[10px] sm:text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              {['T2','T3','T4','T5','T6','T7','CN'].map((d, i) => (
                <div key={d} className="py-2 text-center">
                  <span className="sm:hidden">{d}</span>
                  <span className="hidden sm:inline">{['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','CN'][i]}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map(d => {
                const iso = format(d, 'yyyy-MM-dd')
                const inMonth = isSameMonth(d, cursor)
                const today = isSameDay(d, new Date('2026-05-19'))
                const dEvents = eventsByDate[iso] || []
                const dTasks  = taskDeadlines[iso] || []
                return (
                  <div key={iso}
                    onDoubleClick={() => openCreate(iso)}
                    className={classNames(
                      'min-h-[80px] sm:min-h-[110px] p-1 sm:p-2 border-b border-r border-slate-100 group',
                      !inMonth && 'bg-slate-50 text-slate-400'
                    )}>
                    <div className="flex items-center justify-between mb-1">
                      <div className={classNames(
                        'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full',
                        today ? 'bg-brand-600 text-white' : 'text-slate-700'
                      )}>
                        {format(d, 'd')}
                      </div>
                      <button
                        onClick={() => openCreate(iso)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition"
                        title="Thêm sự kiện">
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {dEvents.slice(0, 3).map(e => (
                        <button key={e.id}
                          onClick={() => openEdit(e)}
                          title={e.title}
                          className={classNames(
                            'w-full text-left text-[10px] sm:text-[11px] px-1 sm:px-1.5 py-0.5 rounded border-l-2 truncate',
                            eventTypeMeta[e.type].color,
                            eventTypeMeta[e.type].border
                          )}>
                          <span className="opacity-70 mr-1 hidden sm:inline">{e.time}</span>{e.title}
                        </button>
                      ))}
                      {dEvents.length > 3 && (
                        <div className="text-[10px] text-slate-500">+{dEvents.length - 3} khác</div>
                      )}
                      {dTasks.slice(0, 2).map(t => (
                        <div key={t.id} title={t.title}
                          className="text-[10px] sm:text-[11px] px-1 sm:px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 truncate border-l-2 border-slate-300">
                          ⏱ {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <SectionTitle title="Sắp tới" subtitle={`${filteredEvents.length} sự kiện trong khung thời gian`} />
            <div className="space-y-2">
              {filteredEvents
                .filter(e => parseISO(e.date) >= new Date('2026-05-19'))
                .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
                .slice(0, 8)
                .map(e => (
                  <button key={e.id} onClick={() => openEdit(e)}
                    className="w-full text-left p-2 rounded hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Badge className={eventTypeMeta[e.type].color}>{eventTypeMeta[e.type].label}</Badge>
                      <span className="text-xs text-slate-500">{fmtDate(e.date)} · {e.time}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-800 mt-1">{e.title}</div>
                    <div className="flex -space-x-1.5 mt-1">
                      {e.attendees.slice(0, 4).map(uid => memberById[uid] && (
                        <Avatar key={uid} name={memberById[uid].name} size="xs" />
                      ))}
                      {e.attendees.length > 4 && (
                        <span className="text-[10px] ml-2 text-slate-500">+{e.attendees.length - 4}</span>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          </div>

          <div className="card p-5">
            <SectionTitle title="Chú thích" />
            <div className="space-y-2 text-sm">
              {Object.entries(eventTypeMeta).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className={classNames('w-2 h-2 rounded-full',
                    k === 'meeting' ? 'bg-blue-500' :
                    k === 'milestone' ? 'bg-violet-500' :
                    k === 'release' ? 'bg-emerald-500' : 'bg-amber-500'
                  )} />
                  <span className="text-slate-600">{v.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-slate-600">Deadline task</span>
              </div>
              <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                Mẹo: nhấp đúp ngày để tạo sự kiện nhanh.
              </div>
            </div>
          </div>
        </div>
      </div>

      <EventFormModal
        open={eventEdit !== null}
        onClose={closeModal}
        event={eventEdit}
        defaultDate={defaultDate}
      />
    </div>
  )
}
