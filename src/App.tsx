import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import MobileNav from './components/MobileNav'
import Dashboard from './pages/Dashboard'
import AIDoctor from './pages/AIDoctor'
import MedicalReports from './pages/MedicalReports'
import Hospitals from './pages/Hospitals'
import Medicines from './pages/Medicines'
import History from './pages/History'
import Settings from './pages/Settings'
import AdminDashboard from './pages/AdminDashboard'
import Login from './pages/Login'
import LearningLab from './pages/LearningLab'
import { isAuthenticated, isAdmin, getStoredUser, type AuthUser } from './lib/auth'
import { useUserLocation } from './lib/useLocation'
import { Menu } from 'lucide-react'

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated())
  const [user, setUser] = useState<AuthUser | null>(getStoredUser())

  // Sidebar open state
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Global location detection — runs once on app load
  const geo = useUserLocation()
  const userLocation = geo.city

  const handleAuth = () => {
    setAuthed(true)
    setUser(getStoredUser())
  }

  const handleLogout = () => {
    setAuthed(false)
    setUser(null)
  }

  if (!authed) {
    return <Login onAuth={handleAuth} />
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 mesh-bg relative">
      {/* Sidebar — hidden on mobile, shown on md+ */}
      <div className="hidden md:block">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          show={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header user={user} userLocation={userLocation} />
        {/* Hamburger for md+ when sidebar is closed */}
        {!sidebarOpen && (
          <button
            className="hidden md:flex fixed top-4 left-4 z-50 bg-white rounded-full p-2 shadow-md"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5 text-slate-500" />
          </button>
        )}
        {/* Main content — extra bottom padding on mobile for nav bar */}
        <main className="flex-1 overflow-y-auto relative pb-[72px] md:pb-0">
          <Routes>
            <Route path="/" element={<Dashboard userLocation={userLocation} />} />
            <Route path="/ai-doctor" element={<AIDoctor userLocation={userLocation} />} />
            <Route path="/reports" element={<MedicalReports />} />
            <Route path="/hospitals" element={<Hospitals userLocation={userLocation} />} />
            <Route path="/medicines" element={<Medicines />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/learn" element={<LearningLab />} />
            <Route
              path="/admin"
              element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" replace />}
            />
          </Routes>
        </main>
      </div>
      {/* Mobile bottom navigation — only shown on mobile */}
      <MobileNav user={user} />
    </div>
  )
}
