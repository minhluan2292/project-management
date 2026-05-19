import { useState, useEffect } from 'react'
import Modal, { Field } from './Modal'
import { SearchableSelect } from './SearchableSelect'
import DateField from './DateField'
import Avatar from './Avatar'
import { useStore } from '../store/StoreContext'

const empty = {
  projectId: '', title: '', description: '',
  status: 'todo', priority: 'medium',
  assigneeId: '', reporterId: '',
  startDate: '', dueDate: '',
  estimateHours: 8, spentHours: 0,
  tags: [], subtaskCount: 0, commentCount: 0,
}

export default function TaskFormModal({ open, onClose, task, defaultProjectId }) {
  const { upsertTask, deleteTask, projects, members } = useStore()
  const isEdit = !!task
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      const base = task ? { ...empty, ...task }
                        : { ...empty, projectId: defaultProjectId || '' }
      setForm(base)
      setErrors({})
    }
  }, [open, task, defaultProjectId])

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const submit = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Bắt buộc'
    if (!form.projectId)    e.projectId = 'Chọn dự án'
    if (!form.assigneeId)   e.assigneeId = 'Chọn người làm'
    if (!form.startDate)    e.startDate = 'Bắt buộc'
    if (!form.dueDate)      e.dueDate = 'Bắt buộc'
    if (form.startDate && form.dueDate && form.startDate > form.dueDate) e.dueDate = 'Phải sau ngày bắt đầu'
    setErrors(e)
    if (Object.keys(e).length) return

    const reporterId = form.reporterId
      || projects.find(p => p.id === form.projectId)?.leadId
      || form.assigneeId
    upsertTask({ ...form, reporterId })
    onClose?.()
  }

  const projectMembers = (() => {
    const proj = projects.find(p => p.id === form.projectId)
    if (proj && proj.memberIds.length) {
      return members.filter(m => proj.memberIds.includes(m.id))
    }
    return members
  })()

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Chỉnh sửa task' : 'Tạo task mới'}
      footer={
        <>
          {isEdit && (
            <button
              className="btn-ghost text-rose-600 mr-auto"
              onClick={() => { if (confirm('Xoá task?')) { deleteTask(form.id); onClose?.() } }}
            >
              Xoá
            </button>
          )}
          <button className="btn-outline" onClick={onClose}>Huỷ</button>
          <button className="btn-primary" onClick={submit}>{isEdit ? 'Lưu' : 'Tạo'}</button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Field label="Tiêu đề" required error={errors.title}>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Mô tả">
            <textarea rows={3} className="input" value={form.description}
                      onChange={e => set('description', e.target.value)} />
          </Field>
        </div>

        <Field label="Dự án" required error={errors.projectId}>
          <SearchableSelect
            value={form.projectId}
            onChange={v => set('projectId', v)}
            placeholder="— Chọn dự án —"
            options={projects.map(p => ({
              value: p.id,
              label: `${p.code} - ${p.name}`,
              sub: p.description,
            }))}
          />
        </Field>
        <Field label="Người làm" required error={errors.assigneeId}>
          <SearchableSelect
            value={form.assigneeId}
            onChange={v => set('assigneeId', v)}
            placeholder="— Chọn người —"
            options={projectMembers.map(m => ({
              value: m.id,
              label: m.name,
              sub: m.role,
            }))}
            renderOption={(o) => (
              <div className="flex items-center gap-2 min-w-0">
                <Avatar name={o.label} size="xs" />
                <div className="min-w-0">
                  <div className="text-sm text-slate-800 truncate">{o.label}</div>
                  <div className="text-xs text-slate-500 truncate">{o.sub}</div>
                </div>
              </div>
            )}
            renderValue={(o) => (
              <span className="flex items-center gap-2">
                <Avatar name={o.label} size="xs" />
                <span className="text-slate-700 truncate">{o.label}</span>
              </span>
            )}
          />
        </Field>

        <Field label="Trạng thái">
          <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="backlog">Backlog</option>
            <option value="todo">To do</option>
            <option value="in_progress">Đang làm</option>
            <option value="review">Review</option>
            <option value="done">Hoàn thành</option>
          </select>
        </Field>
        <Field label="Ưu tiên">
          <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
            <option value="low">Thấp</option>
            <option value="medium">Trung bình</option>
            <option value="high">Cao</option>
            <option value="urgent">Khẩn</option>
          </select>
        </Field>

        <Field label="Bắt đầu" required error={errors.startDate}>
          <DateField value={form.startDate} onChange={(v) => set('startDate', v)} />
        </Field>
        <Field label="Hạn" required error={errors.dueDate}>
          <DateField value={form.dueDate} onChange={(v) => set('dueDate', v)} minDate={form.startDate} />
        </Field>

        <Field label="Ước tính (giờ)">
          <input type="number" min={0} className="input"
                 value={form.estimateHours} onChange={e => set('estimateHours', e.target.value)} />
        </Field>
        <Field label="Đã làm (giờ)">
          <input type="number" min={0} className="input"
                 value={form.spentHours} onChange={e => set('spentHours', e.target.value)} />
        </Field>

        <div className="md:col-span-2">
          <Field label="Tags (cách nhau bởi dấu phẩy)">
            <input className="input"
                   value={form.tags.join(', ')}
                   onChange={e => set('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
          </Field>
        </div>
      </div>
    </Modal>
  )
}
