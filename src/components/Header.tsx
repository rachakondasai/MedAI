import { useState, useRef, useEffect } from 'react'
import { Bell, Search, User, MapPinned, Settings, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { AuthUser } from '../lib/auth'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/ai-doctor': 'AI Doctor',
  '/reports': 'Medical Reports',
  '/hospitals': 'Hospitals',
  '/medicines': 'Medicines',
  '/history': 'History',
  '/settings': 'Settings',
  '/admin': 'Admin Panel',
}

interface Props {
  user?: AuthUser | null
  userLocation?: string
}

export default function Header({ user, userLocation }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const title = pageTitles[location.pathname] || 'Dashboard'
  const [searchValue, setSearchValue] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchValue.trim()
    if (!q) return
    navigate(`/ai-doctor?q=${encodeURIComponent(q)}`)
    setSearchValue('')
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          Welcome back, {user?.name || 'Patient'}
          {userLocation && (
            <span className="inline-flex items-center gap-1 text-blue-500 font-medium ml-1">
              <MapPinned className="w-3 h-3" /> {userLocation}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Ask AI anything… (Enter to search)"
            className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-72 transition-all"
          />
        </form>

        {/* Bell / Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications((v) => !v); setShowUserMenu(false) }}
            className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl shadow-slate-200/50 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                <NotifItem
                  emoji="🤖"
                  title="AI Doctor is ready"
                  desc="Start a new consultation anytime"
                  time="Now"
                  onClick={() => { navigate('/ai-doctor'); setShowNotifications(false) }}
                />
                {userLocation && (
                  <NotifItem
                    emoji="📍"
                    title={`Location: ${userLocation}`}
                    desc="Hospitals & doctors will be shown near you"
                    time="Auto-detected"
                    onClick={() => { navigate('/hospitals'); setShowNotifications(false) }}
                  />
                )}
                <NotifItem
                  emoji="📋"
                  title="Upload a report"
                  desc="Get AI-powered analysis of your lab reports"
                  time=""
                  onClick={() => { navigate('/reports'); setShowNotifications(false) }}
                />
                <NotifItem
                  emoji="💊"
                  title="Medicine search"
                  desc="Find & buy medicines with 1mg & PharmEasy"
                  time=""
                  onClick={() => { navigate('/medicines'); setShowNotifications(false) }}
                />
              </div>
            </div>
          )}
        </div>

        {/* User Avatar / Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => { setShowUserMenu((v) => !v); setShowNotifications(false) }}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center cursor-pointer text-white text-xs font-bold hover:shadow-lg hover:shadow-blue-300/40 transition-all"
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4 text-white" />}
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-12 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl shadow-slate-200/50 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
                {user?.role === 'admin' && (
                  <span className="inline-block mt-1 text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Admin</span>
                )}
              </div>
              <div className="py-1">
                <button
                  onClick={() => { navigate('/settings'); setShowUserMenu(false) }}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" /> Settings
                </button>
                <button
                  onClick={() => { navigate('/history'); setShowUserMenu(false) }}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Bell className="w-4 h-4 text-slate-400" /> History
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => { navigate('/admin'); setShowUserMenu(false) }}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" /> Admin Panel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function NotifItem({ emoji, title, desc, time, onClick }: { emoji: string; title: string; desc: string; time: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
      <span className="text-lg mt-0.5">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 truncate">{title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
      </div>
      {time && <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">{time}</span>}
    </button>
  )
}
