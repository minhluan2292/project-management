import { createContext, useContext, useState, useCallback } from 'react'
import ProjectFormModal from '../components/ProjectFormModal'
import TaskFormModal from '../components/TaskFormModal'
import EventFormModal from '../components/EventFormModal'

const UICtx = createContext(null)

export function UIProvider({ children }) {
  const [projectModal, setProjectModal] = useState({ open: false })
  const [taskModal, setTaskModal]       = useState({ open: false })
  const [eventModal, setEventModal]     = useState({ open: false })

  const openCreateProject = useCallback(() => setProjectModal({ open: true }), [])
  const openEditProject   = useCallback((project) => setProjectModal({ open: true, project }), [])
  const openCreateTask    = useCallback((defaultProjectId) => setTaskModal({ open: true, defaultProjectId }), [])
  const openEditTask      = useCallback((task) => setTaskModal({ open: true, task }), [])
  const openCreateEvent   = useCallback((defaultDate) => setEventModal({ open: true, defaultDate }), [])
  const openEditEvent     = useCallback((event) => setEventModal({ open: true, event }), [])

  const value = {
    openCreateProject, openEditProject,
    openCreateTask, openEditTask,
    openCreateEvent, openEditEvent,
  }

  return (
    <UICtx.Provider value={value}>
      {children}
      <ProjectFormModal
        open={projectModal.open}
        project={projectModal.project}
        onClose={() => setProjectModal({ open: false })}
      />
      <TaskFormModal
        open={taskModal.open}
        task={taskModal.task}
        defaultProjectId={taskModal.defaultProjectId}
        onClose={() => setTaskModal({ open: false })}
      />
      <EventFormModal
        open={eventModal.open}
        event={eventModal.event}
        defaultDate={eventModal.defaultDate}
        onClose={() => setEventModal({ open: false })}
      />
    </UICtx.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UICtx)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
