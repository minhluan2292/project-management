import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import {
  projects as initProjects,
  tasks as initTasks,
  events as initEvents,
  members as initMembers,
  teams as initTeams,
  currentUser,
} from '../data/mock'

const StoreCtx = createContext(null)

let _id = 9000
const nextId = (prefix) => `${prefix}-${++_id}`
const nowISO = () => new Date().toISOString()

// --- Seed sample subtasks/comments/activity for richer demo
function seedSubtasks(tasks) {
  const out = []
  tasks.slice(0, 8).forEach((t, idx) => {
    out.push(
      { id: nextId('st'), taskId: t.id, title: 'Định nghĩa yêu cầu', done: true,  createdAt: nowISO() },
      { id: nextId('st'), taskId: t.id, title: 'Implement chính',     done: t.status === 'done', createdAt: nowISO() },
      { id: nextId('st'), taskId: t.id, title: 'Review & QA',         done: t.status === 'done', createdAt: nowISO() },
    )
    if (idx % 2 === 0) out.push({ id: nextId('st'), taskId: t.id, title: 'Viết tài liệu', done: false, createdAt: nowISO() })
  })
  return out
}

function seedComments(tasks, members) {
  const out = []
  const byline = (msg, authorIdx, taskIdx, daysAgo) => ({
    id: nextId('cm'),
    taskId: tasks[taskIdx].id,
    authorId: members[authorIdx % members.length].id,
    body: msg,
    createdAt: new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString(),
  })
  if (tasks[0]) {
    out.push(byline('Em đang làm, bám sát design ở Figma frame 12.', 0, 0, 3))
    out.push(byline('OK, nhớ check lại edge case khi user empty list.', 1, 0, 2))
    out.push(byline('Đã update, mn xem PR #245 giúp ạ.', 0, 0, 1))
  }
  if (tasks[1]) {
    out.push(byline('Cần thêm validation phía server, để mình mở subtask.', 2, 1, 2))
  }
  if (tasks[3]) {
    out.push(byline('Block bởi API team, ETA cuối tuần.', 0, 3, 1))
  }
  return out
}

function seedActivity(tasks) {
  const out = []
  for (const t of tasks.slice(0, 12)) {
    out.push({
      id: nextId('ac'),
      taskId: t.id,
      userId: t.reporterId,
      type: 'created',
      at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      data: { title: t.title },
    })
    if (t.status !== 'todo') {
      out.push({
        id: nextId('ac'),
        taskId: t.id,
        userId: t.assigneeId,
        type: 'status',
        at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
        data: { from: 'todo', to: t.status },
      })
    }
  }
  return out
}

function seedNotifications(tasks, members) {
  const me = currentUser.id
  const out = []
  const myTasks = tasks.filter(t => t.assigneeId === me).slice(0, 5)
  const today = '2026-05-19'

  myTasks.forEach((t, i) => {
    if (t.dueDate < today && t.status !== 'done') {
      out.push({
        id: nextId('nt'),
        type: 'overdue',
        taskId: t.id,
        actorId: t.reporterId,
        body: `Task "${t.title}" đã quá hạn.`,
        at: new Date(Date.now() - (i + 1) * 3600 * 1000).toISOString(),
        read: false,
      })
    } else if (t.dueDate >= today) {
      out.push({
        id: nextId('nt'),
        type: 'assigned',
        taskId: t.id,
        actorId: t.reporterId,
        body: `Bạn được giao task "${t.title}".`,
        at: new Date(Date.now() - (i + 2) * 3600 * 1000).toISOString(),
        read: i > 1,
      })
    }
  })

  // mention
  if (myTasks[0]) {
    out.push({
      id: nextId('nt'),
      type: 'mention',
      taskId: myTasks[0].id,
      actorId: members[1]?.id,
      body: `Đã nhắc bạn trong "${myTasks[0].title}".`,
      at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: false,
    })
  }
  return out
}

export function StoreProvider({ children }) {
  const [projects, setProjects] = useState(initProjects)
  const [tasks, setTasks]       = useState(initTasks)
  const [events, setEvents]     = useState(initEvents)
  const [members, setMembers]   = useState(initMembers)
  const [teams, setTeams]       = useState(initTeams)
  const [subtasks, setSubtasks] = useState(() => seedSubtasks(initTasks))
  const [comments, setComments] = useState(() => seedComments(initTasks, initMembers))
  const [activity, setActivity] = useState(() => seedActivity(initTasks))
  const [notifications, setNotifications] = useState(() => seedNotifications(initTasks, initMembers))

  const logActivity = useCallback((entry) => {
    setActivity(prev => [{ id: nextId('ac'), at: nowISO(), userId: currentUser.id, ...entry }, ...prev])
  }, [])

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
        tags: data.tags || [],
      }
      if (exists) {
        const old = prev.find(t => t.id === data.id)
        // log status change
        if (old && old.status !== normalized.status) {
          setTimeout(() => logActivity({
            taskId: data.id, type: 'status',
            data: { from: old.status, to: normalized.status },
          }), 0)
        }
        return prev.map(t => t.id === data.id ? { ...t, ...normalized } : t)
      }
      const newId = data.id || nextId('tk')
      setTimeout(() => logActivity({
        taskId: newId, type: 'created', data: { title: normalized.title },
      }), 0)
      return [{ ...normalized, id: newId }, ...prev]
    })
  }, [logActivity])

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    setSubtasks(prev => prev.filter(s => s.taskId !== id))
    setComments(prev => prev.filter(c => c.taskId !== id))
    setActivity(prev => prev.filter(a => a.taskId !== id))
  }, [])

  // Update single fields (used by Kanban DnD, bulk)
  const updateTask = useCallback((id, patch) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const updated = { ...t, ...patch }
      if (patch.status && patch.status !== t.status) {
        setTimeout(() => logActivity({
          taskId: id, type: 'status', data: { from: t.status, to: patch.status },
        }), 0)
      }
      if (patch.assigneeId && patch.assigneeId !== t.assigneeId) {
        setTimeout(() => logActivity({
          taskId: id, type: 'assigned', data: { from: t.assigneeId, to: patch.assigneeId },
        }), 0)
      }
      return updated
    }))
  }, [logActivity])

  // ---- Subtasks
  const addSubtask = useCallback((taskId, title) => {
    if (!title?.trim()) return
    setSubtasks(prev => [...prev, {
      id: nextId('st'), taskId, title: title.trim(), done: false, createdAt: nowISO(),
    }])
  }, [])
  const toggleSubtask = useCallback((id) => {
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, done: !s.done } : s))
  }, [])
  const updateSubtask = useCallback((id, patch) => {
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }, [])
  const deleteSubtask = useCallback((id) => {
    setSubtasks(prev => prev.filter(s => s.id !== id))
  }, [])

  // ---- Comments
  const addComment = useCallback((taskId, body) => {
    if (!body?.trim()) return
    const id = nextId('cm')
    setComments(prev => [...prev, {
      id, taskId, authorId: currentUser.id, body: body.trim(), createdAt: nowISO(),
    }])
    // mention parsing: @name → notification (very loose)
    const mentions = (body.match(/@\w+/g) || []).map(m => m.slice(1).toLowerCase())
    if (mentions.length) {
      const matched = initMembers.filter(m =>
        mentions.some(mn => m.name.toLowerCase().includes(mn))
      )
      if (matched.length) {
        setNotifications(prev => [
          ...matched
            .filter(m => m.id !== currentUser.id)
            .map(m => ({
              id: nextId('nt'),
              type: 'mention',
              taskId,
              actorId: currentUser.id,
              body: `${currentUser.name} đã nhắc bạn.`,
              targetUserId: m.id,
              at: nowISO(),
              read: false,
            })),
          ...prev,
        ])
      }
    }
    setTimeout(() => logActivity({
      taskId, type: 'comment', data: { commentId: id },
    }), 0)
  }, [logActivity])

  const deleteComment = useCallback((id) => {
    setComments(prev => prev.filter(c => c.id !== id))
  }, [])

  // ---- Notifications
  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])
  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
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
    setTasks(prev => prev.map(t => t.assigneeId === id ? { ...t, assigneeId: '' } : t))
    setProjects(prev => prev.map(p => ({
      ...p,
      memberIds: p.memberIds.filter(x => x !== id),
      leadId: p.leadId === id ? '' : p.leadId,
    })))
    setEvents(prev => prev.map(e => ({ ...e, attendees: e.attendees.filter(x => x !== id) })))
  }, [])

  // ---- Teams
  const upsertTeam = useCallback((data) => {
    setTeams(prev => {
      const exists = prev.some(t => t.id === data.id)
      const normalized = { ...data, color: data.color || '#3563f6' }
      if (exists) return prev.map(t => t.id === data.id ? { ...t, ...normalized } : t)
      return [...prev, { ...normalized, id: data.id || nextId('t') }]
    })
  }, [])

  const deleteTeam = useCallback((id) => {
    setTeams(prev => prev.filter(t => t.id !== id))
    setMembers(prev => prev.map(m => m.teamId === id ? { ...m, teamId: '' } : m))
    setProjects(prev => prev.map(p => ({ ...p, teamIds: p.teamIds.filter(x => x !== id) })))
  }, [])

  const value = useMemo(() => ({
    projects, tasks, events,
    members, teams,
    subtasks, comments, activity, notifications,
    memberById:  Object.fromEntries(members.map(m => [m.id, m])),
    teamById:    Object.fromEntries(teams.map(t => [t.id, t])),
    projectById: Object.fromEntries(projects.map(p => [p.id, p])),
    upsertProject, deleteProject,
    upsertTask, deleteTask, updateTask,
    upsertEvent, deleteEvent,
    upsertMember, deleteMember,
    upsertTeam, deleteTeam,
    addSubtask, toggleSubtask, updateSubtask, deleteSubtask,
    addComment, deleteComment,
    markNotificationRead, markAllNotificationsRead,
  }), [projects, tasks, events, members, teams, subtasks, comments, activity, notifications,
       upsertProject, deleteProject,
       upsertTask, deleteTask, updateTask,
       upsertEvent, deleteEvent,
       upsertMember, deleteMember,
       upsertTeam, deleteTeam,
       addSubtask, toggleSubtask, updateSubtask, deleteSubtask,
       addComment, deleteComment,
       markNotificationRead, markAllNotificationsRead])

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
