import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Tasks from './pages/Tasks'
import Calendar from './pages/Calendar'
import Timeline from './pages/Timeline'
import Team from './pages/Team'
import Workload from './pages/Workload'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"                index element={<Dashboard />} />
        <Route path="/projects"        element={<Projects />} />
        <Route path="/projects/:id"    element={<ProjectDetail />} />
        <Route path="/tasks"           element={<Tasks />} />
        <Route path="/calendar"        element={<Calendar />} />
        <Route path="/timeline"        element={<Timeline />} />
        <Route path="/team"            element={<Team />} />
        <Route path="/workload"        element={<Workload />} />
        <Route path="/reports"         element={<Reports />} />
        <Route path="/settings"        element={<Settings />} />
      </Route>
    </Routes>
  )
}
