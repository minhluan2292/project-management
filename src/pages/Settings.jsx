import { useState } from 'react'
import { Bell, Lock, User, Palette, Globe, Save } from 'lucide-react'
import { currentUser } from '../data/mock'
import { PageHeader, SectionTitle } from '../components/UI'
import Avatar from '../components/Avatar'
import { classNames } from '../lib/utils'

const tabs = [
  { id: 'profile',       label: 'Hồ sơ',         icon: User },
  { id: 'notifications', label: 'Thông báo',     icon: Bell },
  { id: 'appearance',    label: 'Giao diện',     icon: Palette },
  { id: 'security',      label: 'Bảo mật',       icon: Lock },
  { id: 'workspace',     label: 'Workspace',     icon: Globe },
]

export default function Settings() {
  const [tab, setTab] = useState('profile')

  return (
    <div>
      <PageHeader title="Cài đặt" description="Cấu hình tài khoản và workspace của bạn." />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <aside className="card p-3 h-fit">
          <div className="space-y-0.5">
            {tabs.map(t => (
              <button key={t.id}
                onClick={() => setTab(t.id)}
                className={classNames(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition',
                  tab === t.id ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                )}>
                <t.icon size={16} />{t.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="lg:col-span-3 space-y-4">
          {tab === 'profile' && <ProfileTab />}
          {tab === 'notifications' && <NotificationsTab />}
          {tab === 'appearance' && <AppearanceTab />}
          {tab === 'security' && <SecurityTab />}
          {tab === 'workspace' && <WorkspaceTab />}
        </div>
      </div>
    </div>
  )
}

function ProfileTab() {
  return (
    <div className="card p-6">
      <SectionTitle title="Hồ sơ cá nhân" subtitle="Hiển thị với đồng đội trong workspace." />
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={currentUser.name} size="lg" />
        <div>
          <button className="btn-outline">Đổi ảnh</button>
          <p className="text-xs text-slate-500 mt-1">PNG hoặc JPG, &lt; 1MB.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Họ và tên" defaultValue={currentUser.name} />
        <Field label="Email"     defaultValue={currentUser.email} />
        <Field label="Vai trò"   defaultValue={currentUser.role} />
        <Field label="Số điện thoại" defaultValue="0901 234 567" />
      </div>
      <div className="mt-6 flex justify-end">
        <button className="btn-primary"><Save size={16}/> Lưu thay đổi</button>
      </div>
    </div>
  )
}

function NotificationsTab() {
  return (
    <div className="card p-6 space-y-3">
      <SectionTitle title="Thông báo" subtitle="Chọn nội dung muốn nhận." />
      {[
        ['Khi được giao task mới', true],
        ['Khi task của tôi sắp đến hạn', true],
        ['Khi có comment trong task của tôi', true],
        ['Khi dự án có thay đổi trạng thái', false],
        ['Tóm tắt hằng tuần qua email', true],
      ].map(([label, on]) => <Toggle key={label} label={label} defaultChecked={on} />)}
    </div>
  )
}

function AppearanceTab() {
  return (
    <div className="card p-6 space-y-4">
      <SectionTitle title="Giao diện" subtitle="Tuỳ chỉnh trải nghiệm hiển thị." />
      <div>
        <div className="text-sm font-medium text-slate-700 mb-2">Theme</div>
        <div className="grid grid-cols-3 gap-3">
          {['Sáng','Tối','Tự động'].map((t, i) => (
            <button key={t} className={classNames(
              'p-4 rounded-lg border text-sm font-medium',
              i === 0 ? 'border-brand-500 ring-2 ring-brand-200 bg-brand-50 text-brand-700' : 'border-slate-200 hover:bg-slate-50'
            )}>{t}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-sm font-medium text-slate-700 mb-2">Mật độ hiển thị</div>
        <div className="flex gap-2">
          {['Thoáng','Mặc định','Gọn'].map((t, i) => (
            <button key={t} className={classNames(
              'px-4 py-2 rounded-lg border text-sm',
              i === 1 ? 'border-brand-500 bg-brand-50 text-brand-700 font-semibold' : 'border-slate-200'
            )}>{t}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="card p-6 space-y-4">
      <SectionTitle title="Bảo mật" subtitle="Mật khẩu và xác thực 2 lớp." />
      <Field label="Mật khẩu hiện tại" type="password" />
      <Field label="Mật khẩu mới" type="password" />
      <Field label="Xác nhận mật khẩu mới" type="password" />
      <div className="border-t border-slate-100 pt-4">
        <Toggle label="Bật xác thực 2 lớp (2FA)" />
      </div>
      <div className="flex justify-end">
        <button className="btn-primary">Cập nhật</button>
      </div>
    </div>
  )
}

function WorkspaceTab() {
  return (
    <div className="card p-6 space-y-4">
      <SectionTitle title="Workspace" subtitle="Cấu hình áp dụng cho toàn workspace." />
      <Field label="Tên workspace" defaultValue="NetworldAsia" />
      <Field label="Múi giờ" defaultValue="Asia/Ho_Chi_Minh" />
      <Field label="Ngôn ngữ" defaultValue="Tiếng Việt" />
      <Toggle label="Cho phép thành viên tạo dự án mới" defaultChecked />
      <Toggle label="Yêu cầu phê duyệt khi xoá dự án" defaultChecked />
    </div>
  )
}

function Field({ label, type = 'text', defaultValue }) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-700 mb-1">{label}</div>
      <input type={type} className="input" defaultValue={defaultValue} />
    </label>
  )
}

function Toggle({ label, defaultChecked = false }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <button onClick={() => setOn(v => !v)} className="flex items-center justify-between w-full py-2">
      <span className="text-sm text-slate-700">{label}</span>
      <span className={classNames(
        'relative inline-flex h-5 w-9 rounded-full transition',
        on ? 'bg-brand-600' : 'bg-slate-300'
      )}>
        <span className={classNames(
          'inline-block h-4 w-4 rounded-full bg-white shadow transform transition translate-y-0.5',
          on ? 'translate-x-4' : 'translate-x-0.5'
        )} />
      </span>
    </button>
  )
}
