import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, User, MapPinned, Settings, X, Sparkles, Command, ArrowRight, Bot, MapPin, ClipboardList, Pill } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { AuthUser } from '../lib/auth'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Your health at a glance' },
  '/ai-doctor': { title: 'AI Doctor', subtitle: 'Chat with GPT-4o health assistant' },
  '/reports': { title: 'Medical Reports', subtitle: 'Upload & analyze with RAG' },
  '/hospitals': { title: 'Hospitals', subtitle: 'AI-powered hospital finder' },
  '/medicines': { title: 'Medicines', subtitle: 'Smart medicine recommendations' },
  '/history': { title: 'History', subtitle: 'Your activity timeline' },
  '/settings': { title: 'Settings', subtitle: 'Configure your account' },
  '/admin': { title: 'Admin Panel', subtitle: 'System management' },
  '/learn': { title: 'Learning Lab', subtitle: 'Explore the architecture' },
}

interface Props {
  user?: AuthUser | null
  userLocation?: string
}

export default function Header({ user, userLocation }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const pageInfo = pageTitles[location.pathname] || { title: 'Dashboard', subtitle: 'Your health at a glance' }
  const [searchValue, setSearchValue] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchValue.trim()
    if (!q) return
    navigate(`/ai-doctor?q=${encodeURIComponent(q)}`)
    setSearchValue('')
    setSearchFocused(false)
  }

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <header className="h-[64px] md:h-[76px] glass-strong border-b border-white/40 flex items-center justify-between px-4 md:px-6 shrink-0 relative z-20">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-base md:text-lg font-extrabold text-slate-900 tracking-tight">{pageInfo.title}</h1>
          {location.pathname === '/' && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[9px] font-bold bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-600 px-2.5 py-0.5 rounded-full ring-1 ring-emerald-200/60 flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </motion.span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
          {location.pathname === '/' ? `${greeting}, ${user?.name || 'Patient'}` : pageInfo.subtitle}
          {userLocation && (
            <span className="inline-flex items-center gap-1 text-blue-600 font-semibold ml-1.5 bg-blue-50/80 px-2 py-0.5 rounded-full text-[10px] ring-1 ring-blue-100/50">
              <MapPinned className="w-3 h-3" /> {userLocation}
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Search — hidden on mobile */}
        <form onSubmit={handleSearchSubmit} className="relative group hidden md:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <input
            ref={searchRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Ask AI anything..."
            className={`pl-10 pr-20 py-2.5 text-sm bg-slate-50/60 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-300 w-72 transition-all duration-500 input-premium ${
              searchFocused ? 'border-emerald-200 bg-white shadow-xl shadow-emerald-100/20 w-96' : 'border-slate-200/80 hover:border-slate-300'
            }`}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
            {searchFocused && searchValue && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] font-medium text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">
                Enter ↵
              </motion.span>
            )}
            <kbd className="text-[9px] font-semibold text-slate-400 bg-white/80 px-1.5 py-0.5 rounded-md border border-slate-200/80 shadow-sm">
              ⌘K
            </kbd>
          </div>
        </form>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowNotifications((v) => !v); setShowUserMenu(false) }}
            className="relative p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
          >
            <Bell className="w-5 h-5" />
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"
            />
          </motion.button>
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-14 w-80 glass-strong border border-white/50 rounded-2xl shadow-premium-xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">Notifications</p>
                    <span className="text-[9px] font-semibold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">4</span>
                  </div>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  <NotifItem
                    icon={Bot}
                    title="AI Doctor is ready"
                    desc="Start a new consultation anytime"
                    time="Now"
                    isNew
                    onClick={() => { navigate('/ai-doctor'); setShowNotifications(false) }}
                  />
                  {userLocation && (
                    <NotifItem
                      icon={MapPin}
                      title={`Location: ${userLocation}`}
                      desc="Hospitals & doctors will be shown near you"
                      time="Auto"
                      isNew
                      onClick={() => { navigate('/hospitals'); setShowNotifications(false) }}
                    />
                  )}
                  <NotifItem
                    icon={ClipboardList}
                    title="Upload a report"
                    desc="Get AI-powered analysis of your lab reports"
                    time=""
                    onClick={() => { navigate('/reports'); setShowNotifications(false) }}
                  />
                  <NotifItem
                    icon={Pill}
                    title="Medicine search"
                    desc="Find & buy medicines with 1mg & PharmEasy"
                    time=""
                    onClick={() => { navigate('/medicines'); setShowNotifications(false) }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar */}
        <div className="relative" ref={userMenuRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowUserMenu((v) => !v); setShowNotifications(false) }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 flex items-center justify-center cursor-pointer text-white text-sm font-bold shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/35 transition-all duration-300 ring-2 ring-white/80"
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4 text-white" />}
          </motion.button>
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-14 w-64 glass-strong border border-white/50 rounded-2xl shadow-premium-xl z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-emerald-50/30">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email || ''}</p>
                  {user?.role === 'admin' && (
                    <span className="inline-block mt-1 text-[9px] font-bold bg-gradient-to-r from-red-50 to-orange-50 text-red-600 px-2 py-0.5 rounded-full ring-1 ring-red-100">
                      Administrator
                    </span>
                  )}
                </div>
                <div className="py-1">
                  {[
                    { label: 'Settings', icon: Settings, path: '/settings' },
                    { label: 'History', icon: Bell, path: '/history' },
                    ...(user?.role === 'admin' ? [{ label: 'Admin Panel', icon: User, path: '/admin' }] : []),
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { navigate(item.path); setShowUserMenu(false) }}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
                    >
                      <item.icon className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                      {item.label}
                      <ArrowRight className="w-3 h-3 text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

function NotifItem({ icon: Icon, title, desc, time, isNew, onClick }: {
  icon: any; title: string; desc: string; time: string; isNew?: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick} className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-slate-50/80 transition-colors group">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 flex items-center justify-center mt-0.5 shrink-0">
        <Icon className="w-3.5 h-3.5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-slate-800 truncate">{title}</p>
          {isNew && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          )}
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
      </div>
      {time && <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">{time}</span>}
    </button>
  )
}
