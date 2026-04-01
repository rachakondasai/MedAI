import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import MobileNav from './components/MobileNav'
import PageTransition from './components/PageTransition'
import OnboardingBanner from './components/OnboardingBanner'
import ToastContainer from './components/Toast'
import Dashboard from './pages/Dashboard'
import AIDoctor from './pages/AIDoctor'
import MedicalReports from './pages/MedicalReports'
import Hospitals from './pages/Hospitals'
import Medicines from './pages/Medicines'
import History from './pages/History'
import Settings from './pages/Settings'
import AdminDashboard from './pages/AdminDashboard'
import Login from './pages/Login'
import Appointments from './pages/Appointments'
import Orders from './pages/Orders'
import AdminOrders from './pages/AdminOrders'
const LearningLab = lazy(() => import('./pages/LearningLab'))
import { isAuthenticated, isAdmin, getStoredUser, type AuthUser } from './lib/auth'
import { useUserLocation } from './lib/useLocation'
import { Menu } from 'lucide-react'

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated())
  const [user, setUser] = useState<AuthUser | null>(getStoredUser())
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 mesh-bg relative overflow-hidden">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar user={user} onLogout={handleLogout} show={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-h-0 relative">
        <Header user={user} userLocation={userLocation} />

        {!sidebarOpen && (
          <button
            className="hidden md:flex fixed top-4 left-4 z-50 bg-white rounded-full p-2 shadow-md"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5 text-slate-500" />
          </button>
        )}

        {/* Main scrollable content — bottom padding clears the mobile nav + safe area */}
        <main
          className="flex-1 overflow-y-auto overscroll-contain md:pb-0 bottom-sheet"
          style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition id="/"><Dashboard userLocation={userLocation} /></PageTransition>} />
              <Route path="/ai-doctor" element={<PageTransition id="/ai-doctor"><AIDoctor userLocation={userLocation} /></PageTransition>} />
              <Route path="/reports" element={<PageTransition id="/reports"><MedicalReports /></PageTransition>} />
              <Route path="/hospitals" element={<PageTransition id="/hospitals"><Hospitals userLocation={userLocation} /></PageTransition>} />
              <Route path="/medicines" element={<PageTransition id="/medicines"><Medicines /></PageTransition>} />
              <Route path="/history" element={<PageTransition id="/history"><History /></PageTransition>} />
              <Route path="/settings" element={<PageTransition id="/settings"><Settings /></PageTransition>} />
              <Route path="/learn" element={
                <PageTransition id="/learn">
                  <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" /></div>}>
                    <LearningLab />
                  </Suspense>
                </PageTransition>
              } />
              <Route path="/appointments" element={<PageTransition id="/appointments"><Appointments /></PageTransition>} />
              <Route path="/orders" element={<PageTransition id="/orders"><Orders /></PageTransition>} />
              {/* Removed: /subscriptions, /referrals, /payments */}
              <Route
                path="/admin"
                element={
                  user?.role === 'admin'
                    ? <PageTransition id="/admin"><AdminDashboard /></PageTransition>
                    : <Navigate to="/" replace />
                }
              />
              <Route
                path="/admin/orders"
                element={
                  user?.role === 'admin'
                    ? <PageTransition id="/admin/orders"><AdminOrders /></PageTransition>
                    : <Navigate to="/" replace />
                }
              />
            </Routes>
          </AnimatePresence>
        </main>
      </div>

      <MobileNav user={user} />
      <OnboardingBanner />
      <ToastContainer />
    </div>
  )
}
