import { useState, useRef, useEffect } from 'react'
import {
  Search, Plus, FolderKanban, ListChecks,
  Calendar as CalIcon, ChevronDown, Menu,
} from 'lucide-react'
import Avatar from './Avatar'
import { currentUser } from '../data/mock'
import { useUI } from '../store/UIContext'
import NotificationsDropdown from './NotificationsDropdown'
import CommandPalette from './CommandPalette'

export default function Topbar({ onOpenMenu }) {
  const ui = useUI()
  const [openMenu, setOpenMenu] = useState(false)
  const [openPalette, setOpenPalette] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpenMenu(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // Cmd+K / Ctrl+K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setOpenPalette(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const action = (fn) => () => { setOpenMenu(false); fn() }

  return (
    <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-3 sm:px-4 lg:px-6 flex items-center gap-2 sm:gap-3 relative">
      <button
        onClick={onOpenMenu}
        className="lg:hidden btn-ghost p-2"
        aria-label="Mở menu">
        <Menu size={20} />
      </button>

      {/* Search trigger — opens palette */}
      <button
        onClick={() => setOpenPalette(true)}
        className="hidden md:flex items-center gap-2 text-sm flex-1 max-w-xl h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-400">
        <Search size={16} />
        <span>Tìm dự án, công việc, thành viên...</span>
        <span className="ml-auto text-[10px] flex items-center gap-1">
          <kbd className="border border-slate-200 rounded px-1 py-0.5 bg-slate-50">⌘</kbd>
          <kbd className="border border-slate-200 rounded px-1 py-0.5 bg-slate-50">K</kbd>
        </span>
      </button>

      <div className="flex-1 md:hidden" />

      <button
        className="md:hidden btn-ghost p-2"
        onClick={() => setOpenPalette(true)}
        aria-label="Tìm kiếm">
        <Search size={18} />
      </button>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="relative" ref={ref}>
          <button className="btn-primary !px-2 sm:!px-3" onClick={() => setOpenMenu(v => !v)}>
            <Plus size={16} />
            <span className="hidden sm:inline">Tạo mới</span>
            <ChevronDown size={14} className="opacity-80 hidden sm:inline"/>
          </button>
          {openMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30">
              <button onClick={action(ui.openCreateProject)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
                <FolderKanban size={14}/> Dự án mới
              </button>
              <button onClick={action(() => ui.openCreateTask())}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
                <ListChecks size={14}/> Task mới
              </button>
              <button onClick={action(() => ui.openCreateEvent())}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
                <CalIcon size={14}/> Sự kiện mới
              </button>
            </div>
          )}
        </div>
        <NotificationsDropdown />
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 ml-1">
          <Avatar name={currentUser.name} size="sm" />
          <div className="leading-tight hidden lg:block">
            <div className="text-sm font-medium text-slate-800">{currentUser.name}</div>
            <div className="text-xs text-slate-500">{currentUser.role}</div>
          </div>
        </div>
      </div>

      <CommandPalette open={openPalette} onClose={() => setOpenPalette(false)} />
    </header>
  )
}
