import { useState, useEffect } from 'react'
import Modal, { Field } from './Modal'
import { SearchableSelect } from './SearchableSelect'
import Avatar from './Avatar'
import { useStore } from '../store/StoreContext'

const empty = {
  name: '', role: '', email: '',
  teamId: '', capacity: 40,
  avatar: '',
}

export default function MemberFormModal({ open, onClose, member }) {
  const { upsertMember, deleteMember, teams } = useStore()
  const isEdit = !!member
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm(member ? { ...empty, ...member } : empty)
      setErrors({})
    }
  }, [open, member])

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const submit = () => {
    const e = {}
    if (!form.name.trim())  e.name  = 'Bắt buộc'
    if (!form.role.trim())  e.role  = 'Bắt buộc'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ'
    if (!form.teamId)       e.teamId = 'Chọn team'
    if (Number(form.capacity) <= 0) e.capacity = 'Phải > 0'
    setErrors(e)
    if (Object.keys(e).length) return
    upsertMember(form)
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={isEdit ? 'Chỉnh sửa nhân sự' : 'Thêm nhân sự'}
      footer={
        <>
          {isEdit && (
            <button
              className="btn-ghost text-rose-600 mr-auto"
              onClick={() => {
                if (confirm(`Xoá nhân sự "${form.name}"? Task của họ sẽ thành chưa giao.`)) {
                  deleteMember(form.id); onClose?.()
                }
              }}
            >Xoá</button>
          )}
          <button className="btn-outline" onClick={onClose}>Huỷ</button>
          <button className="btn-primary" onClick={submit}>{isEdit ? 'Lưu' : 'Thêm'}</button>
        </>
      }
    >
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={form.name || '?'} size="lg" />
        <div className="text-sm text-slate-500">
          Avatar tự sinh từ tên (chữ cái đầu).
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Field label="Họ và tên" required error={errors.name}>
            <input className="input" value={form.name}
                   onChange={e => set('name', e.target.value)} placeholder="Nguyễn Văn A" />
          </Field>
        </div>
        <Field label="Vai trò" required error={errors.role}>
          <input className="input" value={form.role}
                 onChange={e => set('role', e.target.value)} placeholder="Frontend Dev" />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" className="input" value={form.email}
                 onChange={e => set('email', e.target.value)} placeholder="user@nwa.vn" />
        </Field>
        <Field label="Team" required error={errors.teamId}>
          <SearchableSelect
            value={form.teamId}
            onChange={(v) => set('teamId', v)}
            placeholder="— Chọn team —"
            options={teams.map(t => ({ value: t.id, label: t.name }))}
          />
        </Field>
        <Field label="Capacity (giờ/tuần)" required error={errors.capacity}>
          <input type="number" min={1} max={80} className="input"
                 value={form.capacity}
                 onChange={e => set('capacity', e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
