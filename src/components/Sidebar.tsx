import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Bot,
  FileText,
  Building2,
  Pill,
  Clock,
  Settings,
  Heart,
  Shield,
  LogOut,
  BookOpen,
  ChevronRight,
  Sparkles,
  X,
  FlaskConical,
  Crown,
  Gift,
  QrCode,
} from 'lucide-react'
import { logout, type AuthUser } from '../lib/auth'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', badge: null, group: 'core' },
  { to: '/ai-doctor', icon: Bot, label: 'AI Doctor', badge: 'AI', group: 'core' },
  { to: '/reports', icon: FileText, label: 'Medical Reports', badge: null, group: 'core' },
  { to: '/hospitals', icon: Building2, label: 'Hospitals', badge: null, group: 'core' },
  { to: '/medicines', icon: Pill, label: 'Medicines', badge: null, group: 'core' },
  { to: '/history', icon: Clock, label: 'History', badge: null, group: 'core' },
  { to: '/appointments', icon: FlaskConical, label: 'Book Blood Test', badge: 'Pro', group: 'premium' },
  { to: '/payments', icon: QrCode, label: 'Pay via PhonePe', badge: 'UPI', group: 'premium' },
  { to: '/referrals', icon: Gift, label: 'Referral Earnings', badge: 'Elite', group: 'premium' },
  { to: '/subscriptions', icon: Crown, label: 'Plans & Pricing', badge: null, group: 'premium' },
  { to: '/learn', icon: BookOpen, label: 'Learning Lab', badge: '3D', group: 'tools' },
  { to: '/settings', icon: Settings, label: 'Settings', badge: null, group: 'tools' },
]

interface Props {
  user?: AuthUser | null
  onLogout?: () => void
  show: boolean
  onClose: () => void
}

export default function Sidebar({ user, onLogout, show, onClose }: Props) {
  const allItems = user?.role === 'admin'
    ? [...navItems, { to: '/admin', icon: Shield, label: 'Admin Panel', badge: null, group: 'tools' as const }]
    : navItems

  const handleLogout = async () => {
    await logout()
    onLogout?.()
  }

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && show && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      <AnimatePresence>
        {show && (
          <motion.aside
            initial={{ x: isMobile ? -320 : -280 }}
            animate={{ x: 0 }}
            exit={{ x: isMobile ? -320 : -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-[280px] glass-strong border-r border-white/40 flex flex-col h-full shrink-0 relative overflow-hidden z-50 fixed top-0 left-0"
          >
            {/* Close button for mobile */}
            {isMobile && (
              <button
                className="absolute top-4 right-4 z-50 bg-white rounded-full p-2 shadow-md hover:bg-slate-100 transition"
                onClick={onClose}
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            )}

            {/* Premium gradient mesh background */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-transparent" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-blue-50/40 to-transparent rounded-full blur-2xl" />
            </div>

            {/* Logo — Premium Brand */}
            <div className="h-[76px] flex items-center gap-3.5 px-6 border-b border-slate-100/40 relative z-10">
              <motion.div
                whileHover={{ scale: 1.08, rotate: -5 }}
                whileTap={{ scale: 0.92 }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 relative"
              >
                <Heart className="w-5 h-5 text-white" />
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  animate={{ boxShadow: ['0 0 0 0 rgba(16,185,129,0)', '0 0 0 8px rgba(16,185,129,0.1)', '0 0 0 0 rgba(16,185,129,0)'] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
              </motion.div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-extrabold text-slate-900 tracking-tight">Med</span>
                  <span className="text-lg font-extrabold text-gradient tracking-tight">AI</span>
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="ml-0.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </motion.div>
                </div>
                <p className="text-[9px] font-semibold text-slate-400 tracking-widest uppercase">Healthcare Intelligence</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto relative z-10">
              {(['core', 'premium', 'tools'] as const).map((group) => {
                const groupItems = allItems.filter((i) => i.group === group)
                if (!groupItems.length) return null
                const groupLabel = group === 'core' ? 'Core' : group === 'premium' ? 'Premium' : 'Tools'
                return (
                  <div key={group} className="mb-3">
                    <p className="text-[9px] font-bold text-slate-400/80 uppercase tracking-[0.15em] px-3 mb-2">{groupLabel}</p>
                    {groupItems.map((item, navIdx) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                          `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 relative mb-0.5 ${
                            isActive
                              ? 'bg-gradient-to-r from-emerald-50/90 to-teal-50/50 text-emerald-700 shadow-sm shadow-emerald-100/40'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-white/60 hover:shadow-sm'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <motion.div
                                layoutId="activeNavIndicator"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500"
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                              />
                            )}
                            <motion.div
                              whileHover={{ scale: 1.08, rotate: isActive ? 0 : -5 }}
                              whileTap={{ scale: 0.9 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 relative overflow-hidden ${
                                isActive
                                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25'
                                  : group === 'premium'
                                    ? 'bg-gradient-to-br from-violet-50 to-purple-50 group-hover:from-violet-100 group-hover:to-purple-100'
                                    : 'bg-slate-100/60 group-hover:bg-white group-hover:shadow-sm'
                              }`}
                            >
                              <item.icon className={`w-[15px] h-[15px] relative z-10 ${isActive ? 'text-white' : group === 'premium' ? 'text-violet-500' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            </motion.div>
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 22, delay: navIdx * 0.05 }}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  isActive
                                    ? 'bg-emerald-500/15 text-emerald-600'
                                    : item.badge === 'AI'
                                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 ring-1 ring-blue-100/50'
                                      : item.badge === 'Pro'
                                        ? 'bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-600 ring-1 ring-teal-100/50'
                                        : item.badge === 'Elite'
                                          ? 'bg-gradient-to-r from-violet-50 to-purple-50 text-violet-600 ring-1 ring-violet-100/50'
                                          : 'bg-violet-50 text-violet-600 ring-1 ring-violet-100/50'
                                }`}
                              >
                                {item.badge}
                              </motion.span>
                            )}
                            {isActive && (
                              <motion.div
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                              >
                                <ChevronRight className="w-3.5 h-3.5 text-emerald-400 opacity-60" />
                              </motion.div>
                            )}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )
              })}
            </nav>



            {/* User info + Logout */}
            <div className="p-4 border-t border-slate-100/40 relative z-10">
              {user && (
                <div className="flex items-center gap-3 px-1 mb-3">
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-white shadow-lg shadow-emerald-500/20"
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </motion.div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  {user.role === 'admin' && (
                    <span className="text-[8px] font-extrabold bg-gradient-to-r from-red-50 to-orange-50 text-red-600 px-2 py-0.5 rounded-full shrink-0 ring-1 ring-red-100 uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-500 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-rose-500 border border-red-100 hover:border-transparent transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </motion.button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
