import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import {
  projects as initProjects,
  tasks as initTasks,
  events as initEvents,
  members as initMembers,
  teams as initTeams,
} from '../data/mock'

const StoreCtx = createContext(null)

let _id = 9000
const nextId = (prefix) => `${prefix}-${++_id}`

export function StoreProvider({ children }) {
  const [projects, setProjects] = useState(initProjects)
  const [tasks, setTasks]       = useState(initTasks)
  const [events, setEvents]     = useState(initEvents)
  const [members, setMembers]   = useState(initMembers)
  const [teams, setTeams]       = useState(initTeams)

  // ---- Projects
  const upsertProject = useCallback((data) => {
    setProjects(prev => {
      const exists = prev.some(p => p.id === data.id)
      const normalized = {
        ...data,
        teamIds:   data.teamIds   || [],
        memberIds: data.memberIds || [],
        tags:      data.tags      || [],
        progress:  Number(data.progress) || 0,
        budget:    Number(data.budget)   || 0,
      }
      if (exists) return prev.map(p => p.id === data.id ? { ...p, ...normalized } : p)
      return [{ ...normalized, id: data.id || nextId('p') }, ...prev]
    })
  }, [])

  const deleteProject = useCallback((id) => {
    setProjects(prev => prev.filter(p => p.id !== id))
    setTasks(prev   => prev.filter(t => t.projectId !== id))
  }, [])

  // ---- Tasks
  const upsertTask = useCallback((data) => {
    setTasks(prev => {
      const exists = prev.some(t => t.id === data.id)
      const normalized = {
        ...data,
        estimateHours: Number(data.estimateHours) || 0,
        spentHours:    Number(data.spentHours) || 0,
        subtaskCount:  Number(data.subtaskCount) || 0,
        commentCount:  Number(data.commentCount) || 0,
        tags: data.tags || [],
      }
      if (exists) return prev.map(t => t.id === data.id ? { ...t, ...normalized } : t)
      return [{ ...normalized, id: data.id || nextId('tk') }, ...prev]
    })
  }, [])

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  // ---- Events
  const upsertEvent = useCallback((data) => {
    setEvents(prev => {
      const exists = prev.some(e => e.id === data.id)
      const normalized = {
        ...data,
        durationMin: Number(data.durationMin) || 60,
        attendees: data.attendees || [],
      }
      if (exists) return prev.map(e => e.id === data.id ? { ...e, ...normalized } : e)
      return [{ ...normalized, id: data.id || nextId('ev') }, ...prev]
    })
  }, [])

  const deleteEvent = useCallback((id) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }, [])

  // ---- Members
  const upsertMember = useCallback((data) => {
    setMembers(prev => {
      const exists = prev.some(m => m.id === data.id)
      const normalized = {
        ...data,
        capacity: Number(data.capacity) || 40,
        avatar: data.avatar || (data.name || '').split(' ').slice(-2).map(s => s[0]).join('').toUpperCase(),
      }
      if (exists) return prev.map(m => m.id === data.id ? { ...m, ...normalized } : m)
      return [...prev, { ...normalized, id: data.id || nextId('u') }]
    })
  }, [])

  const deleteMember = useCallback((id) => {
    setMembers(prev => prev.filter(m => m.id !== id))
    // unassign tasks
    setTasks(prev => prev.map(t => t.assigneeId === id ? { ...t, assigneeId: '' } : t))
    // remove from project memberIds
    setProjects(prev => prev.map(p => ({
      ...p,
      memberIds: p.memberIds.filter(x => x !== id),
      leadId: p.leadId === id ? '' : p.leadId,
    })))
    // remove from event attendees
    setEvents(prev => prev.map(e => ({ ...e, attendees: e.attendees.filter(x => x !== id) })))
  }, [])

  // ---- Teams
  const upsertTeam = useCallback((data) => {
    setTeams(prev => {
      const exists = prev.some(t => t.id === data.id)
      const normalized = {
        ...data,
        color: data.color || '#3563f6',
      }
      if (exists) return prev.map(t => t.id === data.id ? { ...t, ...normalized } : t)
      return [...prev, { ...normalized, id: data.id || nextId('t') }]
    })
  }, [])

  const deleteTeam = useCallback((id) => {
    setTeams(prev => prev.filter(t => t.id !== id))
    // clear teamId on members of this team
    setMembers(prev => prev.map(m => m.teamId === id ? { ...m, teamId: '' } : m))
    // remove from project teamIds
    setProjects(prev => prev.map(p => ({
      ...p,
      teamIds: p.teamIds.filter(x => x !== id),
    })))
  }, [])

  const value = useMemo(() => ({
    // entities
    projects, tasks, events,
    members, teams,
    memberById: Object.fromEntries(members.map(m => [m.id, m])),
    teamById:   Object.fromEntries(teams.map(t => [t.id, t])),
    projectById: Object.fromEntries(projects.map(p => [p.id, p])),
    // actions
    upsertProject, deleteProject,
    upsertTask, deleteTask,
    upsertEvent, deleteEvent,
    upsertMember, deleteMember,
    upsertTeam, deleteTeam,
  }), [projects, tasks, events, members, teams,
       upsertProject, deleteProject,
       upsertTask, deleteTask,
       upsertEvent, deleteEvent,
       upsertMember, deleteMember,
       upsertTeam, deleteTeam])

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
