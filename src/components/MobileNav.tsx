import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Bot, FileText, Building2, Pill,
  Clock, BookOpen, Settings, Shield,
} from 'lucide-react'
import type { AuthUser } from '../lib/auth'

const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Home'     },
  { to: '/ai-doctor', icon: Bot,             label: 'AI Doctor', highlight: true },
  { to: '/reports',   icon: FileText,        label: 'Reports'  },
  { to: '/hospitals', icon: Building2,       label: 'Hospitals'},
  { to: '/medicines', icon: Pill,            label: 'Medicines'},
]

const MORE_ITEMS = [
  { to: '/learn',    icon: BookOpen, label: 'Learn'   },
  { to: '/history',  icon: Clock,    label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings'},
]

interface Props {
  user?: AuthUser | null
}

export default function MobileNav({ user }: Props) {
  const location = useLocation()

  const allMore = user?.role === 'admin'
    ? [...MORE_ITEMS, { to: '/admin', icon: Shield, label: 'Admin' }]
    : MORE_ITEMS

  // Show "More" as active if current path is in the more list
  const moreActive = allMore.some(i => location.pathname === i.to)

  const [showMore, setShowMore] = useState(false)

  return (
    <>
      {/* More drawer overlay */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowMore(false)}
          />
        )}
      </AnimatePresence>

      {/* More drawer */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed bottom-[72px] left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/60 rounded-t-3xl shadow-2xl px-4 py-4"
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">More</p>
            <div className="grid grid-cols-4 gap-2">
              {allMore.map(item => {
                const isActive = location.pathname === item.to
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setShowMore(false)}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25'
                        : 'bg-slate-100'
                    }`}>
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    </div>
                    <span className={`text-[10px] font-semibold ${isActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {item.label}
                    </span>
                  </NavLink>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {NAV_ITEMS.map(item => {
            const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)

            if (item.highlight) {
              // AI Doctor — special pill button in center
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center -mt-5"
                >
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30'
                    }`}
                  >
                    <item.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <span className={`text-[9px] font-bold mt-1 ${isActive ? 'text-blue-600' : 'text-emerald-600'}`}>
                    {item.label}
                  </span>
                </NavLink>
              )
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className="flex flex-col items-center py-2 px-3 min-w-[52px] relative"
              >
                <motion.div whileTap={{ scale: 0.9 }} className="relative">
                  <div className={`w-6 h-6 flex items-center justify-center transition-all`}>
                    <item.icon className={`w-5 h-5 transition-all ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="mobileNavDot"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500"
                    />
                  )}
                </motion.div>
                <span className={`text-[9px] font-semibold mt-1.5 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </NavLink>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(v => !v)}
            className="flex flex-col items-center py-2 px-3 min-w-[52px] relative"
          >
            <motion.div whileTap={{ scale: 0.9 }} className="relative">
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="flex flex-col gap-[3px] items-center">
                  <div className={`w-4 h-[2px] rounded-full transition-colors ${moreActive || showMore ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <div className={`w-3 h-[2px] rounded-full transition-colors ${moreActive || showMore ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                </div>
              </div>
              {(moreActive || showMore) && (
                <motion.div
                  layoutId="mobileNavDot"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500"
                />
              )}
            </motion.div>
            <span className={`text-[9px] font-semibold mt-1.5 transition-colors ${moreActive || showMore ? 'text-emerald-600' : 'text-slate-400'}`}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}

// Need to import useState
