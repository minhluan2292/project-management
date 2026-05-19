import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, ListChecks, Calendar,
  GanttChartSquare, Users, BarChart3, Settings, Boxes, Gauge, X
} from 'lucide-react'
import { classNames } from '../lib/utils'

const nav = [
  { to: '/',          label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/projects',  label: 'Dự án',       icon: FolderKanban },
  { to: '/tasks',     label: 'Công việc',   icon: ListChecks },
  { to: '/calendar',  label: 'Lịch',        icon: Calendar },
  { to: '/timeline',  label: 'Timeline',    icon: GanttChartSquare },
  { to: '/team',      label: 'Nhân sự',     icon: Users },
  { to: '/workload',  label: 'Workload',    icon: Gauge },
  { to: '/reports',   label: 'Báo cáo',     icon: BarChart3 },
  { to: '/settings',  label: 'Cài đặt',     icon: Settings },
]

export default function Sidebar({ onClose }) {
  return (
    <aside className="w-60 shrink-0 h-full border-r border-slate-200 bg-white flex flex-col">
      <div className="h-16 flex items-center justify-between gap-2 px-5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center">
            <Boxes size={20} />
          </div>
          <div>
            <div className="font-bold text-slate-800 leading-tight">NWA PM</div>
            <div className="text-xs text-slate-500">Project Manager</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600">
            <X size={18}/>
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => classNames(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition',
              isActive
                ? 'bg-brand-50 text-brand-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-200">
        <div className="rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 text-white p-3">
          <div className="text-xs uppercase opacity-80">Beta</div>
          <div className="text-sm font-semibold">Frontend mock data</div>
          <div className="text-xs opacity-80 mt-1">Backend sẽ tích hợp sau.</div>
        </div>
      </div>
    </aside>
  )
}
