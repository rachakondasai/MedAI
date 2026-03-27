import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Bot, FileText, Building2, Pill,
  Clock, BookOpen, Settings, Shield, X, Sparkles,
  ChevronRight, Heart, Brain, GraduationCap,
  FlaskConical, Gift, Crown, QrCode, PackageSearch,
} from 'lucide-react'
import type { AuthUser } from '../lib/auth'
import { getUnseenReportCount } from '../pages/Orders'

const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Home',     color: 'from-violet-500 to-purple-600',  dot: 'bg-violet-400' },
  { to: '/reports',   icon: FileText,        label: 'Reports',  color: 'from-blue-500 to-indigo-600',    dot: 'bg-blue-400' },
  { to: '/ai-doctor', icon: Brain,           label: 'AI',       color: 'from-emerald-500 to-teal-600',  dot: 'bg-emerald-400', center: true },
  { to: '/hospitals', icon: Building2,       label: 'Hospitals',color: 'from-rose-500 to-pink-600',     dot: 'bg-rose-400' },
  { to: '/medicines', icon: Pill,            label: 'Pharmacy', color: 'from-amber-500 to-orange-600',  dot: 'bg-amber-400' },
]

// Items for regular users (no Learning Lab)
const USER_MORE_ITEMS = [
  { to: '/appointments', icon: FlaskConical,  label: 'Book Blood Test',   desc: 'Book a lab test near you',    color: 'from-teal-500 to-cyan-600' },
  { to: '/orders',       icon: PackageSearch, label: 'My Orders',         desc: 'Track your lab test orders',  color: 'from-indigo-500 to-blue-600' },
  { to: '/payments',     icon: QrCode,        label: 'Pay via UPI',       desc: 'PhonePe / GPay / Paytm',      color: 'from-purple-500 to-violet-600' },
  { to: '/referrals',    icon: Gift,          label: 'Referral Earnings', desc: 'Earn 15% commissions',        color: 'from-violet-500 to-purple-600' },
  { to: '/subscriptions',icon: Crown,         label: 'Plans & Pricing',   desc: 'Upgrade to Pro or Elite',     color: 'from-amber-500 to-orange-500' },
  { to: '/history',      icon: Clock,         label: 'History',           desc: 'Past consultations',          color: 'from-blue-500 to-indigo-600' },
  { to: '/settings',     icon: Settings,      label: 'Settings',          desc: 'Account & preferences',       color: 'from-slate-500 to-slate-600' },
]

// Extra items shown only for admin
const ADMIN_MORE_ITEMS = [
  { to: '/admin',        icon: Shield,        label: 'Admin Panel',       desc: 'Manage users & system',       color: 'from-red-500 to-rose-600' },
  { to: '/admin/orders', icon: PackageSearch, label: 'Lab Orders',        desc: 'Manage all lab orders',       color: 'from-orange-500 to-red-600' },
  { to: '/learn',        icon: GraduationCap, label: 'Learning Lab',      desc: 'AI-powered courses',          color: 'from-indigo-500 to-blue-600' },
]

interface Props { user?: AuthUser | null }

export default function MobileNav({ user }: Props) {
  const location = useLocation()
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
      {/* Backdrop */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md"
            onClick={() => setShowMore(false)}
          />
        )}
      </AnimatePresence>

      {/* More Drawer */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed bottom-[60px] left-0 right-0 z-50 bg-white/98 backdrop-blur-2xl rounded-t-[2rem] shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.18)] max-h-[75dvh] overflow-y-auto"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">More Features</p>
                  <p className="text-[10px] text-slate-400">All MedAI tools</p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9, rotate: 90 }}
                onClick={() => setShowMore(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-slate-500" />
              </motion.button>
            </div>

            <div className="px-4 py-4 space-y-2">
              {allMore.map((item, idx) => {
                const isActive = location.pathname === item.to
                return (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
                  >
                    <NavLink
                      to={item.to}
                      onClick={() => setShowMore(false)}
                      className={`flex items-center gap-3.5 p-3.5 rounded-2xl transition-all ${isActive ? 'bg-slate-50 ring-1 ring-slate-200' : ''}`}
                    >
                      <motion.div
                        whileTap={{ scale: 0.88 }}
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg flex-shrink-0`}
                      >
                        <item.icon className="w-5 h-5 text-white" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>{item.label}</p>
                        <p className="text-[11px] text-slate-400 truncate">{item.desc}</p>
                      </div>
                      {item.to === '/orders' && unseenReports > 0 && (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center mr-1">
                          {unseenReports}
                        </span>
                      )}
                      <motion.div animate={isActive ? { x: [0, 3, 0] } : {}} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <ChevronRight className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'text-slate-300'}`} />
                      </motion.div>
                    </NavLink>
                  </motion.div>
                )
              })}
            </div>

            <div className="px-5 pb-4 pt-1 flex items-center justify-center gap-1.5">
              <Heart className="w-3 h-3 text-rose-400" />
              <p className="text-[10px] text-slate-400 font-medium">Powered by GPT-4o & LangChain</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 mobile-nav-bar">
        <div
          className="flex items-center justify-around px-1"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)', paddingTop: '6px', minHeight: '60px' }}
        >
          {NAV_ITEMS.map((item, idx) => {
            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to)
            const isTapped = tappedIndex === idx

            if (item.center) {
              return (
                <div key={item.to} className="flex flex-col items-center relative -mt-4">
                  <NavLink
                    to={item.to}
                    onClick={() => handleTap(idx)}
                    className="flex flex-col items-center"
                  >
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl bg-emerald-400/30"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ margin: '-4px' }}
                      />
                    )}
                    <motion.div
                      whileTap={{ scale: 0.88 }}
                      animate={isTapped ? { y: [-6, 0] } : {}}
                      transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                      className={`w-[54px] h-[54px] rounded-2xl flex items-center justify-center shadow-xl relative z-10 transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-500/40'
                          : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30'
                      }`}
                    >
                      <div className="absolute inset-0 rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 shimmer-premium opacity-50" />
                      </div>
                      <item.icon className="w-6 h-6 text-white relative z-10" />
                    </motion.div>
                    <motion.span
                      animate={{ color: isActive ? '#059669' : '#94a3b8' }}
                      className="text-[9px] font-extrabold mt-1 tracking-wide"
                    >
                      {item.label}
                    </motion.span>
                  </NavLink>
                </div>
              )
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => handleTap(idx)}
                className="flex flex-col items-center py-1 px-2 min-w-[56px] relative group"
              >
                <div className="relative flex flex-col items-center">
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="mobileNavPill"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        className={`absolute -inset-1.5 rounded-2xl bg-gradient-to-br ${item.color} opacity-10`}
                      />
                    )}
                  </AnimatePresence>
                  <motion.div
                    whileTap={{ scale: 0.8, rotate: -5 }}
                    animate={isTapped ? { y: [0, -8, 0], rotate: [0, -10, 10, 0] } : {}}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    className="relative z-10 w-7 h-7 flex items-center justify-center"
                  >
                    <item.icon className={`w-[22px] h-[22px] transition-all duration-300 ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  </motion.div>
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                        className={`w-1 h-1 rounded-full mt-0.5 ${item.dot}`}
                      />
                    )}
                  </AnimatePresence>
                </div>
                <motion.span
                  animate={{ color: isActive ? '#0f172a' : '#94a3b8', fontWeight: isActive ? 700 : 500 }}
                  className="text-[9px] mt-0.5 leading-none"
                >
                  {item.label}
                </motion.span>
              </NavLink>
            )
          })}

          {/* More Button */}
          <button
            onClick={() => { setShowMore(v => !v); handleTap(99) }}
            className="flex flex-col items-center py-1 px-2 min-w-[56px] relative group"
          >
            <div className="relative flex flex-col items-center">
              <AnimatePresence>
                {moreActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    className="absolute -inset-1.5 rounded-2xl bg-slate-400/10"
                  />
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
                    <motion.div
                      key={i}
                      animate={showMore ? {
                        rotate: i === 0 ? 45 : i === 1 ? 0 : -45,
                        y: i === 0 ? 7 : i === 1 ? 0 : -7,
                        opacity: i === 1 ? 0 : 1,
                      } : { rotate: 0, y: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                      className={`h-[2px] rounded-full transition-all ${moreActive ? 'bg-slate-800' : 'bg-slate-400'}`}
                      style={{ width: i === 1 ? '12px' : '16px' }}
                    />
                  ))}
                </div>
              </motion.div>
              {moreActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-1 h-1 rounded-full mt-0.5 bg-slate-400"
                />
              )}
            </div>
            <motion.span
              animate={{ color: moreActive || showMore ? '#0f172a' : '#94a3b8' }}
              className="text-[9px] mt-0.5 leading-none font-medium"
            >
              More
            </motion.span>
          </button>
        </div>
      </nav>
    </>
  )
}
