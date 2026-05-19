import { useState, useEffect } from 'react'
import Modal, { Field } from './Modal'
import { useStore } from '../store/StoreContext'
import { classNames } from '../lib/utils'

const empty = { name: '', color: '#3563f6' }

const COLOR_PRESETS = [
  '#3563f6', // brand blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#0ea5e9', // sky
  '#22c55e', // green
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#64748b', // slate
]

export default function TeamFormModal({ open, onClose, team }) {
  const { upsertTeam, deleteTeam, members } = useStore()
  const isEdit = !!team
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm(team ? { ...empty, ...team } : empty)
      setErrors({})
    }
  }, [open, team])

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const submit = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Bắt buộc'
    setErrors(e)
    if (Object.keys(e).length) return
    upsertTeam(form)
    onClose?.()
  }

  const memberCount = isEdit ? members.filter(m => m.teamId === team.id).length : 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={isEdit ? 'Chỉnh sửa team' : 'Tạo team mới'}
      footer={
        <>
          {isEdit && (
            <button
              className="btn-ghost text-rose-600 mr-auto"
              onClick={() => {
                if (confirm(`Xoá team "${form.name}"? ${memberCount} thành viên sẽ chuyển về chưa có team.`)) {
                  deleteTeam(form.id); onClose?.()
                }
              }}
            >Xoá team</button>
          )}
          <button className="btn-outline" onClick={onClose}>Huỷ</button>
          <button className="btn-primary" onClick={submit}>{isEdit ? 'Lưu' : 'Tạo'}</button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Tên team" required error={errors.name}>
          <input className="input" value={form.name}
                 onChange={e => set('name', e.target.value)} placeholder="Frontend, Backend, Design..." />
        </Field>

        <Field label="Màu nhận diện">
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => set('color', c)}
                style={{ backgroundColor: c }}
                className={classNames(
                  'w-8 h-8 rounded-lg ring-offset-2 transition',
                  form.color === c ? 'ring-2 ring-slate-700' : 'ring-0 hover:scale-110'
                )}
                title={c}
              />
            ))}
            <label className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50">
              <input
                type="color"
                value={form.color}
                onChange={e => set('color', e.target.value)}
                className="opacity-0 w-0 h-0"
              />
              <span className="text-[10px] text-slate-400">+</span>
            </label>
          </div>
        </Field>

        <div className="rounded-lg bg-slate-50 p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
               style={{ backgroundColor: form.color }}>
            {(form.name || '?').slice(0,1).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">{form.name || 'Tên team'}</div>
            {isEdit && <div className="text-xs text-slate-500">{memberCount} thành viên</div>}
          </div>
        </div>
      </div>
    </Modal>
  )
}
