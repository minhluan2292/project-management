import { useState, useEffect } from 'react'
import Modal, { Field } from './Modal'
import { SearchableSelect, SearchableMultiSelect } from './SearchableSelect'
import DateField from './DateField'
import Avatar from './Avatar'
import { useStore } from '../store/StoreContext'

const empty = {
  code: '', name: '', description: '',
  status: 'planning', priority: 'medium', progress: 0,
  startDate: '', endDate: '',
  leadId: '', teamIds: [], memberIds: [],
  budget: 0, tags: [],
}

export default function ProjectFormModal({ open, onClose, project }) {
  const { upsertProject, deleteProject, members, teams } = useStore()
  const isEdit = !!project
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm(project ? { ...empty, ...project } : empty)
      setErrors({})
    }
  }, [open, project])

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const submit = () => {
    const e = {}
    if (!form.name.trim())  e.name  = 'Bắt buộc'
    if (!form.code.trim())  e.code  = 'Bắt buộc'
    if (!form.startDate)    e.startDate = 'Bắt buộc'
    if (!form.endDate)      e.endDate   = 'Bắt buộc'
    if (form.startDate && form.endDate && form.startDate > form.endDate) e.endDate = 'Phải sau ngày bắt đầu'
    if (!form.leadId)       e.leadId    = 'Chọn người phụ trách'
    setErrors(e)
    if (Object.keys(e).length) return
    upsertProject(form)
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Chỉnh sửa dự án' : 'Tạo dự án mới'}
      footer={
        <>
          {isEdit && (
            <button
              className="btn-ghost text-rose-600 mr-auto"
              onClick={() => { if (confirm('Xoá dự án?')) { deleteProject(form.id); onClose?.() } }}
            >
              Xoá dự án
            </button>
          )}
          <button className="btn-outline" onClick={onClose}>Huỷ</button>
          <button className="btn-primary" onClick={submit}>{isEdit ? 'Lưu' : 'Tạo'}</button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Mã" required error={errors.code}>
          <input className="input uppercase" maxLength={6}
                 value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} />
        </Field>
        <Field label="Tên dự án" required error={errors.name}>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Mô tả">
            <textarea rows={3} className="input" value={form.description}
                      onChange={e => set('description', e.target.value)} />
          </Field>
        </div>

        <Field label="Trạng thái">
          <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="planning">Lên kế hoạch</option>
            <option value="in_progress">Đang chạy</option>
            <option value="on_hold">Tạm dừng</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã huỷ</option>
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
        <Field label="Kết thúc" required error={errors.endDate}>
          <DateField value={form.endDate} onChange={(v) => set('endDate', v)} minDate={form.startDate} />
        </Field>

        <Field label="Tiến độ (%)">
          <input type="number" min={0} max={100} className="input"
                 value={form.progress} onChange={e => set('progress', e.target.value)} />
        </Field>
        <Field label="Ngân sách (VND)">
          <input type="number" min={0} className="input"
                 value={form.budget} onChange={e => set('budget', e.target.value)} />
        </Field>

        <Field label="Người phụ trách" required error={errors.leadId}>
          <SearchableSelect
            value={form.leadId}
            onChange={(v) => set('leadId', v)}
            placeholder="— Chọn người phụ trách —"
            options={members.map(m => ({
              value: m.id,
              label: m.name,
              sub: `${m.role} · ${m.email}`,
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
        <Field label="Tags (cách nhau bởi dấu phẩy)">
          <input className="input"
                 value={form.tags.join(', ')}
                 onChange={e => set('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
        </Field>

        <div className="md:col-span-1">
          <Field label="Teams tham gia">
            <SearchableMultiSelect
              value={form.teamIds}
              onChange={v => set('teamIds', v)}
              placeholder="Chọn team..."
              options={teams.map(t => ({ value: t.id, label: t.name }))}
            />
          </Field>
        </div>
        <div className="md:col-span-1">
          <Field label="Thành viên">
            <SearchableMultiSelect
              value={form.memberIds}
              onChange={v => set('memberIds', v)}
              placeholder="Chọn thành viên..."
              options={members
                .filter(m => form.teamIds.length === 0 || form.teamIds.includes(m.teamId))
                .map(m => ({ value: m.id, label: m.name, sub: m.role }))}
              renderOption={(o) => (
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={o.label} size="xs" />
                  <div className="min-w-0">
                    <div className="text-sm text-slate-800 truncate">{o.label}</div>
                    <div className="text-xs text-slate-500 truncate">{o.sub}</div>
                  </div>
                </div>
              )}
            />
          </Field>
        </div>
      </div>
    </Modal>
  )
}
