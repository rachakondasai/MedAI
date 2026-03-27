import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Bot, FileText, Building2, Pill,
  Clock, Settings, Shield, X, Sparkles,
  ChevronRight, Heart, Brain, GraduationCap,
  FlaskConical, PackageSearch,
} from 'lucide-react'
import type { AuthUser } from '../lib/auth'
import { getUnseenReportCount } from '../pages/Orders'

// Main 4 tabs (center slot reserved for FAB)
const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Home',     color: 'from-violet-500 to-purple-600',  dot: 'bg-violet-400', notif: false },
  { to: '/reports',   icon: FileText,        label: 'Reports',  color: 'from-blue-500 to-indigo-600',    dot: 'bg-blue-400',   notif: true  },
  // CENTER_FAB placeholder — rendered separately
  { to: '/hospitals', icon: Building2,       label: 'Hospitals',color: 'from-rose-500 to-pink-600',      dot: 'bg-rose-400',   notif: false },
  { to: '/medicines', icon: Pill,            label: 'Pharmacy', color: 'from-amber-500 to-orange-600',   dot: 'bg-amber-400',  notif: false },
]

const USER_MORE_ITEMS = [
  { to: '/ai-doctor',    icon: Brain,         label: 'AI Doctor',     desc: 'Chat with GPT-4o',            color: 'from-emerald-500 to-teal-600' },
  { to: '/orders',       icon: PackageSearch, label: 'My Orders',     desc: 'Track your lab test orders',  color: 'from-indigo-500 to-blue-600' },
  { to: '/history',      icon: Clock,         label: 'History',       desc: 'Past consultations',          color: 'from-blue-500 to-indigo-600' },
  { to: '/settings',     icon: Settings,      label: 'Settings',      desc: 'Account & preferences',       color: 'from-slate-500 to-slate-600' },
]

const ADMIN_MORE_ITEMS = [
  { to: '/admin',        icon: Shield,        label: 'Admin Panel',   desc: 'Manage users & system',       color: 'from-red-500 to-rose-600' },
  { to: '/admin/orders', icon: PackageSearch, label: 'Lab Orders',    desc: 'Manage all lab orders',       color: 'from-orange-500 to-red-600' },
  { to: '/learn',        icon: GraduationCap, label: 'Learning Lab',  desc: 'AI-powered courses',          color: 'from-indigo-500 to-blue-600' },
]

interface Props { user?: AuthUser | null }

export default function MobileNav({ user }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const [showMore, setShowMore] = useState(false)
  const [tappedIndex, setTappedIndex] = useState<number | null>(null)
  const [unseenReports, setUnseenReports] = useState(0)

  useEffect(() => {
    const refresh = () => setUnseenReports(getUnseenReportCount(user?.id))
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [user?.id])

  const allMore = user?.role === 'admin'
    ? [...USER_MORE_ITEMS, ...ADMIN_MORE_ITEMS]
    : USER_MORE_ITEMS

  const moreActive = allMore.some(i => location.pathname === i.to)

  const handleTap = (index: number) => {
    setTappedIndex(index)
    setTimeout(() => setTappedIndex(null), 600)
  }

  return (
    <>
      {/* ── Backdrop for More drawer ─────────────────────────────── */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMore(false)}
          />
        )}
      </AnimatePresence>

      {/* ── More Drawer ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ y: '100%', opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="fixed bottom-[62px] left-0 right-0 z-50 bg-white rounded-t-[2rem] shadow-[0_-16px_48px_-8px_rgba(0,0,0,0.18)] max-h-[72dvh] overflow-y-auto"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">More Features</p>
                  <p className="text-[10px] text-slate-400">All MedAI tools</p>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.88, rotate: 90 }} onClick={() => setShowMore(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500" />
              </motion.button>
            </div>

            {/* Drawer items */}
            <div className="px-4 py-3 space-y-2">
              {allMore.map((item, idx) => {
                const isActive = location.pathname === item.to
                return (
                  <motion.div key={item.to}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, type: 'spring', stiffness: 320, damping: 28 }}
                  >
                    <NavLink to={item.to} onClick={() => setShowMore(false)}
                      className={`flex items-center gap-3.5 p-3.5 rounded-2xl transition-all ${isActive ? 'bg-slate-50 ring-1 ring-slate-200' : ''}`}>
                      <motion.div whileTap={{ scale: 0.88 }}
                        className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <item.icon className="w-5 h-5 text-white" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>{item.label}</p>
                        <p className="text-[11px] text-slate-400 truncate">{item.desc}</p>
                      </div>
                      {item.to === '/orders' && unseenReports > 0 && (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center">
                          {unseenReports}
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'text-slate-300'}`} />
                    </NavLink>
                  </motion.div>
                )
              })}
            </div>

            <div className="px-5 py-3 flex items-center justify-center gap-1.5">
              <Heart className="w-3 h-3 text-rose-400" />
              <p className="text-[10px] text-slate-400 font-medium">Powered by GPT-4o & LangChain</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom Nav Bar ───────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 mobile-nav-bar">
        <div
          className="flex items-center justify-around"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)', paddingTop: '6px', minHeight: '62px' }}
        >
          {/* Left two nav items */}
          {NAV_ITEMS.slice(0, 2).map((item, idx) => {
            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to)
            const isTapped = tappedIndex === idx
            const showNotif = item.notif && unseenReports > 0 && !isActive

            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => handleTap(idx)}
                className="flex flex-col items-center py-1 px-3 min-w-[56px] relative group">
                <div className="relative flex flex-col items-center">
                  <AnimatePresence>
                    {isActive && (
                      <motion.div layoutId="mobileNavPill"
                        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        className={`absolute -inset-2 rounded-2xl bg-gradient-to-br ${item.color} opacity-10`} />
                    )}
                  </AnimatePresence>
                  <motion.div
                    whileTap={{ scale: 0.8, rotate: -5 }}
                    animate={isTapped ? { y: [0, -8, 0] } : {}}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    className="relative z-10 w-7 h-7 flex items-center justify-center"
                  >
                    <item.icon className={`w-[22px] h-[22px] transition-all duration-300 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                    {showNotif && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                        {unseenReports > 9 ? '9+' : unseenReports}
                      </span>
                    )}
                  </motion.div>
                  {isActive && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${item.dot}`} />
                  )}
                </div>
                <motion.span animate={{ color: isActive ? '#0f172a' : '#94a3b8', fontWeight: isActive ? 700 : 500 }}
                  className="text-[9px] mt-0.5 leading-none">
                  {item.label}
                </motion.span>
              </NavLink>
            )
          })}

          {/* ── Center FAB — Book Lab Test ──────────────────────── */}
          <div className="flex flex-col items-center relative -mt-5">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                handleTap(99)
                navigate('/appointments')
              }}
              className="relative w-[58px] h-[58px] rounded-[20px] bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-xl shadow-teal-500/40"
            >
              {/* shimmer */}
              <div className="absolute inset-0 rounded-[20px] overflow-hidden">
                <div className="absolute inset-0 shimmer-premium opacity-60" />
              </div>
              {/* ping ring */}
              {location.pathname === '/appointments' && (
                <motion.div
                  className="absolute inset-0 rounded-[20px] border-2 border-teal-300"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <FlaskConical className="w-6 h-6 text-white relative z-10" />
              {/* New badge */}
              <span className="absolute -top-1.5 -right-1.5 text-[8px] font-black bg-amber-400 text-white px-1.5 py-0.5 rounded-full shadow leading-none z-20">
                NEW
              </span>
            </motion.button>
            <motion.span
              animate={{ color: location.pathname === '/appointments' ? '#0d9488' : '#64748b' }}
              className="text-[9px] font-extrabold mt-1.5 leading-none"
            >
              Book Test
            </motion.span>
          </div>

          {/* Right two nav items */}
          {NAV_ITEMS.slice(2).map((item, idx) => {
            const actualIdx = idx + 3
            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to)
            const isTapped = tappedIndex === actualIdx

            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => handleTap(actualIdx)}
                className="flex flex-col items-center py-1 px-3 min-w-[56px] relative group">
                <div className="relative flex flex-col items-center">
                  <AnimatePresence>
                    {isActive && (
                      <motion.div layoutId={`mobileNavPill-right-${item.to}`}
                        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        className={`absolute -inset-2 rounded-2xl bg-gradient-to-br ${item.color} opacity-10`} />
                    )}
                  </AnimatePresence>
                  <motion.div
                    whileTap={{ scale: 0.8, rotate: -5 }}
                    animate={isTapped ? { y: [0, -8, 0] } : {}}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    className="relative z-10 w-7 h-7 flex items-center justify-center"
                  >
                    <item.icon className={`w-[22px] h-[22px] transition-all duration-300 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                  </motion.div>
                  {isActive && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${item.dot}`} />
                  )}
                </div>
                <motion.span animate={{ color: isActive ? '#0f172a' : '#94a3b8', fontWeight: isActive ? 700 : 500 }}
                  className="text-[9px] mt-0.5 leading-none">
                  {item.label}
                </motion.span>
              </NavLink>
            )
          })}

          {/* More Button */}
          <button onClick={() => setShowMore(v => !v)}
            className="flex flex-col items-center py-1 px-3 min-w-[56px] relative group">
            <div className="relative flex flex-col items-center">
              <AnimatePresence>
                {moreActive && (
                  <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                    className="absolute -inset-2 rounded-2xl bg-slate-400/10" />
                )}
              </AnimatePresence>
              <motion.div
                animate={showMore ? { rotate: 45, scale: 1.1 } : { rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                whileTap={{ scale: 0.8 }}
                className="relative z-10 w-7 h-7 flex items-center justify-center"
              >
                <div className="flex flex-col gap-[3.5px] items-center">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i}
                      animate={showMore
                        ? { rotate: i===0?45:i===1?0:-45, y: i===0?7:i===1?0:-7, opacity: i===1?0:1 }
                        : { rotate: 0, y: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                      className={`h-[2px] rounded-full transition-all ${moreActive||showMore ? 'bg-slate-800' : 'bg-slate-400'}`}
                      style={{ width: i === 1 ? '12px' : '16px' }}
                    />
                  ))}
                </div>
              </motion.div>
              {(moreActive) && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="w-1.5 h-1.5 rounded-full mt-0.5 bg-slate-400" />
              )}
            </div>
            <motion.span animate={{ color: moreActive||showMore ? '#0f172a' : '#94a3b8' }}
              className="text-[9px] mt-0.5 leading-none font-medium">
              More
            </motion.span>
          </button>
        </div>
      </nav>
    </>
  )
}
