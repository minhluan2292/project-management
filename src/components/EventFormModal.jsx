import { useState, useEffect } from 'react'
import Modal, { Field } from './Modal'
import { SearchableMultiSelect } from './SearchableSelect'
import DateField from './DateField'
import Avatar from './Avatar'
import { useStore } from '../store/StoreContext'

const empty = {
  title: '', type: 'meeting',
  date: '', time: '09:00', durationMin: 60,
  attendees: [],
}

export default function EventFormModal({ open, onClose, event, defaultDate }) {
  const { upsertEvent, deleteEvent, members } = useStore()
  const isEdit = !!event
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      const base = event ? { ...empty, ...event }
                         : { ...empty, date: defaultDate || '' }
      setForm(base)
      setErrors({})
    }
  }, [open, event, defaultDate])

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const submit = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Bắt buộc'
    if (!form.date)         e.date  = 'Bắt buộc'
    if (!form.time)         e.time  = 'Bắt buộc'
    setErrors(e)
    if (Object.keys(e).length) return
    upsertEvent(form)
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={isEdit ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện'}
      footer={
        <>
          {isEdit && (
            <button
              className="btn-ghost text-rose-600 mr-auto"
              onClick={() => { if (confirm('Xoá sự kiện?')) { deleteEvent(form.id); onClose?.() } }}
            >Xoá</button>
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
        <Field label="Loại">
          <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="meeting">Họp</option>
            <option value="milestone">Milestone</option>
            <option value="release">Release</option>
            <option value="leave">Nghỉ phép</option>
          </select>
        </Field>
        <Field label="Thời lượng (phút)">
          <input type="number" min={5} className="input"
                 value={form.durationMin} onChange={e => set('durationMin', e.target.value)} />
        </Field>
        <Field label="Ngày" required error={errors.date}>
          <DateField value={form.date} onChange={(v) => set('date', v)} />
        </Field>
        <Field label="Giờ" required error={errors.time}>
          <input type="time" className="input" value={form.time}
                 onChange={e => set('time', e.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Người tham dự">
            <SearchableMultiSelect
              value={form.attendees}
              onChange={v => set('attendees', v)}
              placeholder="Tìm và chọn người..."
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
            />
          </Field>
        </div>
      </div>
    </Modal>
  )
}
