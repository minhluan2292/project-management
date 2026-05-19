// Mock data cho ứng dụng quản lý dự án
// Tất cả dữ liệu hardcode, sẽ thay bằng API khi có backend

export const teams = [
  { id: 't1', name: 'Frontend',   color: '#3563f6' },
  { id: 't2', name: 'Backend',    color: '#10b981' },
  { id: 't3', name: 'Design',     color: '#f59e0b' },
  { id: 't4', name: 'QA',         color: '#ef4444' },
  { id: 't5', name: 'DevOps',     color: '#8b5cf6' },
  { id: 't6', name: 'Product',    color: '#ec4899' },
]

export const members = [
  { id: 'u1',  name: 'Nguyễn Văn An',    role: 'Frontend Lead', teamId: 't1', email: 'an.nguyen@nwa.vn',     avatar: 'AN', capacity: 40 },
  { id: 'u2',  name: 'Trần Thị Bình',    role: 'Frontend Dev',  teamId: 't1', email: 'binh.tran@nwa.vn',    avatar: 'TB', capacity: 40 },
  { id: 'u3',  name: 'Lê Hoàng Cường',   role: 'Backend Lead',  teamId: 't2', email: 'cuong.le@nwa.vn',     avatar: 'LC', capacity: 40 },
  { id: 'u4',  name: 'Phạm Mỹ Dung',     role: 'Backend Dev',   teamId: 't2', email: 'dung.pham@nwa.vn',    avatar: 'PD', capacity: 40 },
  { id: 'u5',  name: 'Hoàng Anh Em',     role: 'Backend Dev',   teamId: 't2', email: 'em.hoang@nwa.vn',     avatar: 'HE', capacity: 40 },
  { id: 'u6',  name: 'Vũ Thị Phương',    role: 'UI/UX Designer',teamId: 't3', email: 'phuong.vu@nwa.vn',    avatar: 'VP', capacity: 40 },
  { id: 'u7',  name: 'Đặng Quốc Gia',    role: 'Product Designer',teamId:'t3',email: 'gia.dang@nwa.vn',     avatar: 'DG', capacity: 40 },
  { id: 'u8',  name: 'Bùi Hữu Hạnh',     role: 'QA Lead',       teamId: 't4', email: 'hanh.bui@nwa.vn',     avatar: 'BH', capacity: 40 },
  { id: 'u9',  name: 'Đỗ Thanh Inh',     role: 'QA Engineer',   teamId: 't4', email: 'inh.do@nwa.vn',       avatar: 'DI', capacity: 40 },
  { id: 'u10', name: 'Ngô Khánh Khoa',   role: 'DevOps',        teamId: 't5', email: 'khoa.ngo@nwa.vn',     avatar: 'NK', capacity: 40 },
  { id: 'u11', name: 'Lý Bảo Long',      role: 'PM',            teamId: 't6', email: 'long.ly@nwa.vn',      avatar: 'LL', capacity: 40 },
  { id: 'u12', name: 'Phan Thúy Mai',    role: 'PO',            teamId: 't6', email: 'mai.phan@nwa.vn',     avatar: 'PM', capacity: 40 },
]

export const projects = [
  {
    id: 'p1',
    code: 'ADX',
    name: 'AdServer DSP Platform',
    description: 'Nền tảng quản lý chiến dịch quảng cáo DSP cho thị trường Đông Nam Á.',
    status: 'in_progress',
    priority: 'high',
    progress: 62,
    startDate: '2026-02-01',
    endDate:   '2026-08-15',
    leadId: 'u11',
    teamIds: ['t1','t2','t3','t5'],
    memberIds: ['u1','u2','u3','u4','u6','u10','u11'],
    budget: 850000000,
    tags: ['Adtech','SaaS','Priority'],
  },
  {
    id: 'p2',
    code: 'CMS',
    name: 'Content Management Refactor',
    description: 'Tái kiến trúc CMS cũ, tách module và migrate sang stack mới.',
    status: 'in_progress',
    priority: 'medium',
    progress: 38,
    startDate: '2026-03-10',
    endDate:   '2026-07-30',
    leadId: 'u3',
    teamIds: ['t1','t2','t4'],
    memberIds: ['u2','u4','u5','u8','u9'],
    budget: 320000000,
    tags: ['Refactor','CMS'],
  },
  {
    id: 'p3',
    code: 'BUZ',
    name: 'BuzzX Influencer Hub',
    description: 'Hệ thống quản lý KOL/KOC, đo lường hiệu quả campaign.',
    status: 'planning',
    priority: 'high',
    progress: 12,
    startDate: '2026-05-05',
    endDate:   '2026-11-20',
    leadId: 'u12',
    teamIds: ['t1','t2','t3','t6'],
    memberIds: ['u1','u5','u7','u11','u12'],
    budget: 1200000000,
    tags: ['Marketing','Influencer'],
  },
  {
    id: 'p4',
    code: 'DSP',
    name: 'DSP Reporting V2',
    description: 'Báo cáo realtime cho khách hàng DSP, BI integration.',
    status: 'on_hold',
    priority: 'low',
    progress: 45,
    startDate: '2026-01-15',
    endDate:   '2026-06-30',
    leadId: 'u3',
    teamIds: ['t2','t5'],
    memberIds: ['u3','u4','u10'],
    budget: 180000000,
    tags: ['Reporting','BI'],
  },
  {
    id: 'p5',
    code: 'GHC',
    name: 'Go HTMX Chat',
    description: 'Hệ thống chat nội bộ realtime cho team operation.',
    status: 'completed',
    priority: 'medium',
    progress: 100,
    startDate: '2025-10-01',
    endDate:   '2026-02-28',
    leadId: 'u3',
    teamIds: ['t2','t3'],
    memberIds: ['u3','u5','u6'],
    budget: 95000000,
    tags: ['Internal','Chat'],
  },
  {
    id: 'p6',
    code: 'BCX',
    name: 'BrandCherX Dashboard',
    description: 'Dashboard thống kê thương hiệu, tích hợp social listening.',
    status: 'in_progress',
    priority: 'medium',
    progress: 70,
    startDate: '2026-02-20',
    endDate:   '2026-06-10',
    leadId: 'u11',
    teamIds: ['t1','t3','t4'],
    memberIds: ['u1','u2','u6','u7','u8'],
    budget: 240000000,
    tags: ['Dashboard','Brand'],
  },
  {
    id: 'p7',
    code: 'INF',
    name: 'Infrastructure Hardening',
    description: 'Nâng cấp hạ tầng, K8s migration, cải thiện security.',
    status: 'planning',
    priority: 'high',
    progress: 5,
    startDate: '2026-06-01',
    endDate:   '2026-12-15',
    leadId: 'u10',
    teamIds: ['t5'],
    memberIds: ['u10','u3','u11'],
    budget: 600000000,
    tags: ['DevOps','Security'],
  },
]

const TASK_STATUS = ['backlog','todo','in_progress','review','done']
const PRIORITIES  = ['low','medium','high','urgent']

const taskTitles = {
  p1: [
    'Thiết kế kiến trúc Bidder',
    'Tích hợp OpenRTB v2.6',
    'Build campaign builder UI',
    'API quản lý creative',
    'Realtime bidding metrics',
    'Tối ưu Redis cache',
    'Logging hệ thống bid',
    'Audit pixel tracking',
    'Frontend dashboard advertiser',
    'Permissions & roles',
  ],
  p2: [
    'Audit module hiện tại',
    'Tách monolith → service',
    'Migrate DB schema',
    'Test regression core',
    'Refactor editor block',
    'Tối ưu media library',
  ],
  p3: [
    'Khảo sát đối tượng KOL',
    'Wireframe luồng booking',
    'API matching KOL',
    'Onboarding KOL flow',
    'Campaign report builder',
    'Tích hợp social API',
  ],
  p4: [
    'Refactor query layer',
    'Pipeline aggregation',
    'BI dashboard render',
    'Export Excel/PDF',
  ],
  p5: [
    'WebSocket layer',
    'UI chat panel',
    'Notification service',
  ],
  p6: [
    'Crawler social listening',
    'Sentiment chart',
    'Brand health score',
    'Filter & segment',
    'Export report PDF',
  ],
  p7: [
    'Lập kế hoạch K8s migration',
    'Setup VPC mới',
    'Audit IAM',
  ],
}

function buildTasks() {
  const all = []
  let idx = 1
  for (const p of projects) {
    const titles = taskTitles[p.id] || []
    titles.forEach((title, i) => {
      const startOffset = i * 7
      const start = addDaysISO(p.startDate, startOffset)
      const end   = addDaysISO(start, 5 + (i % 7))
      const memberPool = p.memberIds
      const assigneeId = memberPool[i % memberPool.length]
      const status = pickTaskStatus(p, i, titles.length)
      all.push({
        id: `tk-${idx++}`,
        projectId: p.id,
        title,
        description: `${title} - thuộc dự án ${p.name}.`,
        status,
        priority: PRIORITIES[(i + p.code.length) % PRIORITIES.length],
        assigneeId,
        reporterId: p.leadId,
        startDate: start,
        dueDate:   end,
        estimateHours: 6 + (i % 5) * 4,
        spentHours:   status === 'done' ? 6 + (i % 5) * 4 : (i % 8),
        tags: [p.code, status],
        subtaskCount: i % 4,
        commentCount: (i * 3) % 7,
      })
    })
  }
  return all
}

function pickTaskStatus(project, i, total) {
  if (project.status === 'completed') return 'done'
  if (project.status === 'planning')  return i < total / 2 ? 'backlog' : 'todo'
  if (project.status === 'on_hold')   return TASK_STATUS[i % 3]
  // in_progress: distribute across statuses
  const order = ['done','done','in_progress','review','todo','backlog']
  return order[i % order.length]
}

function addDaysISO(iso, days) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const tasks = buildTasks()

// Calendar events (meetings, milestones, leaves)
export const events = [
  { id: 'ev1', title: 'Sprint Planning ADX',   type: 'meeting',   date: '2026-05-19', time: '09:00', durationMin: 60, attendees: ['u1','u3','u11'] },
  { id: 'ev2', title: 'Demo BuzzX MVP',        type: 'milestone', date: '2026-05-22', time: '14:00', durationMin: 90, attendees: ['u1','u5','u7','u11','u12'] },
  { id: 'ev3', title: 'Retro CMS',             type: 'meeting',   date: '2026-05-20', time: '15:30', durationMin: 60, attendees: ['u2','u4','u8','u9'] },
  { id: 'ev4', title: 'Release ADX v0.8',      type: 'release',   date: '2026-05-28', time: '10:00', durationMin: 30, attendees: ['u1','u2','u3','u10','u11'] },
  { id: 'ev5', title: 'Phương nghỉ phép',      type: 'leave',     date: '2026-05-21', time: '00:00', durationMin: 480, attendees: ['u6'] },
  { id: 'ev6', title: 'Workshop OKR Q3',       type: 'meeting',   date: '2026-05-26', time: '13:30', durationMin: 120, attendees: ['u11','u12','u1','u3','u8','u10'] },
  { id: 'ev7', title: 'Kickoff INF',           type: 'milestone', date: '2026-06-01', time: '09:30', durationMin: 90, attendees: ['u3','u10','u11'] },
  { id: 'ev8', title: 'Daily Standup ADX',     type: 'meeting',   date: '2026-05-19', time: '08:30', durationMin: 15, attendees: ['u1','u2','u3','u4'] },
  { id: 'ev9', title: 'UAT BCX',               type: 'milestone', date: '2026-05-25', time: '10:00', durationMin: 120, attendees: ['u1','u6','u8','u11'] },
  { id: 'ev10',title: 'CMS Code Review',       type: 'meeting',   date: '2026-05-23', time: '14:00', durationMin: 60, attendees: ['u2','u3','u4','u5'] },
]

// Mapping helpers
export const memberById  = Object.fromEntries(members.map(m => [m.id, m]))
export const teamById    = Object.fromEntries(teams.map(t => [t.id, t]))
export const projectById = Object.fromEntries(projects.map(p => [p.id, p]))

// Status meta
export const projectStatusMeta = {
  planning:    { label: 'Lên kế hoạch', color: 'bg-slate-100 text-slate-700' },
  in_progress: { label: 'Đang chạy',     color: 'bg-blue-100 text-blue-700' },
  on_hold:     { label: 'Tạm dừng',      color: 'bg-amber-100 text-amber-700' },
  completed:   { label: 'Hoàn thành',    color: 'bg-emerald-100 text-emerald-700' },
  cancelled:   { label: 'Đã huỷ',        color: 'bg-rose-100 text-rose-700' },
}

export const taskStatusMeta = {
  backlog:     { label: 'Backlog',     color: 'bg-slate-100 text-slate-700',  dot: 'bg-slate-400' },
  todo:        { label: 'To do',       color: 'bg-sky-100 text-sky-700',      dot: 'bg-sky-500' },
  in_progress: { label: 'Đang làm',    color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  review:      { label: 'Review',      color: 'bg-violet-100 text-violet-700',dot: 'bg-violet-500' },
  done:        { label: 'Hoàn thành',  color: 'bg-emerald-100 text-emerald-700',dot:'bg-emerald-500' },
}

export const priorityMeta = {
  low:    { label: 'Thấp',     color: 'bg-slate-100 text-slate-700' },
  medium: { label: 'Trung bình',color: 'bg-sky-100 text-sky-700' },
  high:   { label: 'Cao',      color: 'bg-amber-100 text-amber-700' },
  urgent: { label: 'Khẩn',     color: 'bg-rose-100 text-rose-700' },
}

export const eventTypeMeta = {
  meeting:   { label: 'Họp',     color: 'bg-blue-100 text-blue-700',     border: 'border-blue-300' },
  milestone: { label: 'Milestone',color:'bg-violet-100 text-violet-700', border: 'border-violet-300' },
  release:   { label: 'Release', color: 'bg-emerald-100 text-emerald-700',border:'border-emerald-300' },
  leave:     { label: 'Nghỉ phép',color: 'bg-amber-100 text-amber-700', border: 'border-amber-300' },
}

// Current logged-in user (mock)
export const currentUser = members[0]
