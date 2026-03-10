import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
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

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated())
  const [user, setUser] = useState<AuthUser | null>(getStoredUser())

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
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} userLocation={userLocation} />
        <main className="flex-1 overflow-y-auto">
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
    </div>
  )
}
