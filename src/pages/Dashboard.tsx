/**
 * Dashboard.tsx — Unified MedAI Pro Dashboard
 * Tabs: Home | AI Doctor | Reports | Hospitals | Medicines | Book Test
 * Shows health summary, vitals, recent orders, quick actions
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Bot, FileText, Building2, Pill, FlaskConical,
  Heart, Activity, Thermometer, Droplets, Brain, TrendingUp,
  TrendingDown, Clock, ChevronRight, Sparkles, Bell, Search,
  MapPin, Star, ArrowRight, PackageSearch, Plus, Zap, Shield,
  CheckCircle2, AlertCircle, Loader2, RefreshCw, Calendar,
  BarChart2, Award, User, Stethoscope, ChevronLeft, Navigation,
} from 'lucide-react'
import { getStoredUser } from '../lib/auth'
import { getOrders } from './Orders'
import AIDoctor from './AIDoctor'
import MedicalReports from './MedicalReports'
import Hospitals from './Hospitals'
import Medicines from './Medicines'
import Appointments from './Appointments'

interface Props {
  userLocation?: string
}

// ─── TAB CONFIG ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'home',       label: 'Home',         icon: LayoutDashboard },
  { id: 'ai-doctor',  label: 'AI Doctor',    icon: Bot,   badge: 'AI' },
  { id: 'reports',    label: 'Reports',      icon: FileText },
  { id: 'hospitals',  label: 'Hospitals',    icon: Building2 },
  { id: 'medicines',  label: 'Medicines',    icon: Pill },
  { id: 'book-test',  label: 'Book Test',    icon: FlaskConical, badge: 'New' },
]

// ─── ORDER STATUS BADGE ──────────────────────────────────────────────────────
function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending_payment: { label: 'Pending',       color: 'text-amber-700 bg-amber-100' },
    confirmed:       { label: 'Confirmed',     color: 'text-blue-700 bg-blue-100' },
    sample_collected:{ label: 'Collected',     color: 'text-indigo-700 bg-indigo-100' },
    processing:      { label: 'Processing',    color: 'text-purple-700 bg-purple-100' },
    delivered:       { label: 'Report Ready',  color: 'text-emerald-700 bg-emerald-100' },
  }
  const cfg = map[status] || { label: status, color: 'text-slate-700 bg-slate-100' }
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
  )
}

// ─── VITAL MINI CARD (horizontal scroll) ────────────────────────────────────
function VitalChip({ label, value, unit, icon: Icon, color, bg, status }: {
  label: string; value: string; unit: string; icon: any
  color: string; bg: string; status?: 'normal' | 'warning' | 'critical'
}) {
  const statusDot = { normal: 'bg-emerald-400', warning: 'bg-amber-400', critical: 'bg-red-400' }
  return (
    <div className={`flex-shrink-0 w-[130px] ${bg} rounded-2xl p-3.5 border border-white/80 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center shadow-sm">
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        {status && <div className={`w-2 h-2 rounded-full ${statusDot[status]}`} />}
      </div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg font-extrabold text-slate-800 leading-none">{value}</span>
        <span className="text-[9px] text-slate-400 font-medium">{unit}</span>
      </div>
    </div>
  )
}

// ─── QUICK ACTION ────────────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, color, bg, badge, onClick }: {
  icon: any; label: string; color: string; bg: string; badge?: string; onClick: () => void
}) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.04 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl ${bg} border border-white/80 w-full shadow-sm`}
    >
      {badge && (
        <span className="absolute -top-1.5 -right-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-600 text-white shadow z-10">
          {badge}
        </span>
      )}
      <div className="w-11 h-11 rounded-2xl bg-white shadow-md flex items-center justify-center">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">{label}</span>
    </motion.button>
  )
}

// ─── HOME TAB ───────────────────────────────────────────────────────────────
function HomeTab({ user, userLocation, onTabChange }: {
  user: any; userLocation?: string; onTabChange: (tab: string) => void
}) {
  const navigate = useNavigate()
  const orders = getOrders().slice(0, 3)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] || 'there'

  const vitals = [
    { label: 'Heart Rate',   value: '72',     unit: 'bpm',   icon: Heart,      color: 'text-rose-500',   bg: 'bg-rose-50',   status: 'normal' as const },
    { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', icon: Activity,  color: 'text-blue-500',   bg: 'bg-blue-50',   status: 'normal' as const },
    { label: 'Blood Glucose', value: '98',    unit: 'mg/dL', icon: Droplets,   color: 'text-amber-500',  bg: 'bg-amber-50',  status: 'normal' as const },
    { label: 'SpO₂',         value: '99',     unit: '%',     icon: Brain,      color: 'text-teal-500',   bg: 'bg-teal-50',   status: 'normal' as const },
  ]

  return (
    <div className="space-y-5 pb-4">
      {/* ── Hero Welcome Card ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-5 text-white overflow-hidden shadow-xl shadow-blue-500/20"
      >
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/8 rounded-full pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-4 w-20 h-20 bg-indigo-400/20 rounded-full pointer-events-none" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-xs font-semibold text-blue-200">{greeting}</span>
            </div>
            <h2 className="text-[22px] font-extrabold mb-1 leading-tight">{firstName}! 👋</h2>
            <p className="text-blue-200/90 text-xs mb-4 leading-relaxed">
              Your health summary looks great today.
              {userLocation && (
                <span className="flex items-center gap-1 mt-1 text-blue-300">
                  <Navigation className="w-3 h-3" />{userLocation}
                </span>
              )}
            </p>
            {/* CTA buttons */}
            <div className="flex gap-2 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => onTabChange('ai-doctor')}
                className="bg-white text-blue-700 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg"
              >
                <Bot className="w-3.5 h-3.5" /> Ask AI Doctor
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => onTabChange('book-test')}
                className="bg-blue-500/50 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 border border-white/25 backdrop-blur-sm"
              >
                <FlaskConical className="w-3.5 h-3.5" /> Book Test
              </motion.button>
            </div>
          </div>
          {/* Health Score ring */}
          <div className="relative flex-shrink-0">
            <svg viewBox="0 0 44 44" className="w-[68px] h-[68px] -rotate-90">
              <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
              <circle cx="22" cy="22" r="18" fill="none" stroke="white" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 18 * 0.85} ${2 * Math.PI * 18}`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[17px] font-extrabold leading-none text-white">85</span>
              <span className="text-[8px] font-bold text-blue-200 uppercase tracking-wide">Score</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Quick Actions ─────────────────────────────────────────────── */}
      <div>
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-2.5">
          <QuickAction icon={Bot}          label="AI Doctor"  color="text-blue-600"   bg="bg-blue-50"   badge="AI"  onClick={() => onTabChange('ai-doctor')} />
          <QuickAction icon={FileText}     label="Reports"    color="text-indigo-600" bg="bg-indigo-50"             onClick={() => onTabChange('reports')} />
          <QuickAction icon={FlaskConical} label="Book Test"  color="text-teal-600"   bg="bg-teal-50"   badge="New" onClick={() => onTabChange('book-test')} />
          <QuickAction icon={PackageSearch}label="My Orders"  color="text-purple-600" bg="bg-purple-50"             onClick={() => navigate('/orders')} />
        </div>
      </div>

      {/* ── Today's Vitals (horizontal scroll) ───────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Today's Vitals</h3>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
          {vitals.map((v) => (
            <VitalChip key={v.label} {...v} />
          ))}
        </div>
      </div>

      {/* ── Health Score breakdown ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center">
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Health Score</h3>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Excellent</span>
        </div>
        <div className="space-y-2.5">
          {[
            { label: 'Nutrition', value: 80, color: 'bg-emerald-400' },
            { label: 'Activity',  value: 65, color: 'bg-blue-400' },
            { label: 'Sleep',     value: 90, color: 'bg-indigo-400' },
            { label: 'Stress',    value: 75, color: 'bg-amber-400' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500 w-14 font-medium">{item.label}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                  className={`h-full ${item.color} rounded-full`}
                />
              </div>
              <span className="text-[11px] font-bold text-slate-600 w-7 text-right">{item.value}%</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Recent Orders ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <PackageSearch className="w-3.5 h-3.5 text-purple-500" /> Recent Orders
          </h3>
          <button
            onClick={() => navigate('/orders')}
            className="text-[11px] text-blue-600 font-bold flex items-center gap-0.5"
          >
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-6 border border-dashed border-slate-200 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-3">
              <PackageSearch className="w-6 h-6 text-purple-300" />
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">No orders yet</p>
            <p className="text-xs text-slate-400 mb-3">Book your first lab test to get started</p>
            <button
              onClick={() => onTabChange('book-test')}
              className="inline-flex items-center gap-1.5 text-xs text-teal-700 font-bold bg-teal-50 px-4 py-2 rounded-xl hover:bg-teal-100 transition-colors"
            >
              <FlaskConical className="w-3.5 h-3.5" /> Book Lab Test
            </button>
          </motion.div>
        ) : (
          <div className="space-y-2.5">
            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.99 }}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3 active:bg-slate-50 cursor-pointer"
                onClick={() => navigate('/orders')}
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
                  <FlaskConical className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{order.testName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{order.labName || 'Lab to be assigned'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-[11px] font-bold text-slate-500">₹{order.amount}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── AI Health Tip ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-5 text-white shadow-xl shadow-violet-500/20"
      >
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-8 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />
        <div className="relative flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <p className="text-xs font-bold text-violet-200 mb-1">💡 AI Health Tip of the Day</p>
            <p className="text-sm font-semibold text-white leading-relaxed">
              Staying hydrated improves energy & cognitive function. Aim for 8–10 glasses daily. Your glucose is normal — keep it up!
            </p>
            <button
              onClick={() => onTabChange('ai-doctor')}
              className="mt-3 text-xs text-violet-200 font-bold flex items-center gap-1 hover:text-white transition-colors"
            >
              Ask AI for personalized advice <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Health Reminders ──────────────────────────────────────────── */}
      <div>
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-amber-500" /> Health Reminders
        </h3>
        <div className="space-y-2">
          {[
            { label: 'Annual Health Check',  due: 'Overdue by 2 months', icon: FlaskConical, color: 'text-red-500',   bg: 'bg-red-50',   dot: 'bg-red-400' },
            { label: 'Cholesterol Test',      due: 'Due in 2 weeks',      icon: Droplets,    color: 'text-amber-500', bg: 'bg-amber-50', dot: 'bg-amber-400' },
            { label: 'Blood Pressure Check',  due: 'Due next month',      icon: Activity,    color: 'text-blue-500',  bg: 'bg-blue-50',  dot: 'bg-blue-400' },
          ].map((r, i) => (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl p-3.5 border border-slate-100 flex items-center gap-3 shadow-sm"
            >
              <div className={`w-9 h-9 rounded-xl ${r.bg} flex items-center justify-center flex-shrink-0`}>
                <r.icon className={`w-4.5 h-4.5 ${r.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{r.label}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
                  <p className="text-[11px] text-slate-400">{r.due}</p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => onTabChange('book-test')}
                className="text-[11px] font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl whitespace-nowrap hover:bg-teal-100 transition-colors"
              >
                Book →
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Services Promo Row ────────────────────────────────────────── */}
      <div>
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Explore Services</h3>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
          {[
            { icon: Building2,   label: 'Hospitals',  sub: 'Find nearby', color: 'from-blue-500 to-indigo-600',  tab: 'hospitals' },
            { icon: Pill,        label: 'Medicines',  sub: 'AI-powered',  color: 'from-emerald-500 to-teal-600', tab: 'medicines' },
            { icon: Stethoscope, label: 'Doctors',    sub: 'Specialists', color: 'from-violet-500 to-purple-600', tab: 'ai-doctor' },
            { icon: FileText,    label: 'Reports',    sub: 'AI analysis', color: 'from-rose-500 to-pink-600',    tab: 'reports' },
          ].map(s => (
            <motion.button
              key={s.label}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTabChange(s.tab)}
              className="flex-shrink-0 w-[100px] rounded-2xl overflow-hidden shadow-md"
            >
              <div className={`bg-gradient-to-br ${s.color} p-4 flex flex-col items-start gap-3`}>
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{s.label}</p>
                  <p className="text-[10px] text-white/70">{s.sub}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────────
export default function Dashboard({ userLocation }: Props) {
  const [activeTab, setActiveTab] = useState('home')
  const user = getStoredUser()

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col">
      {/* ── Tab Bar ── */}
      <div className="sticky top-0 z-20 bg-white/96 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="flex gap-1 overflow-x-auto no-scrollbar px-3 py-2">
          {TABS.map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              whileTap={{ scale: 0.94 }}
              className={`
                relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0
                ${activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-300/40'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
              `}
            >
              <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`
                  text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none
                  ${activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-600'}
                `}>
                  {tab.badge}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16 }}
          className={activeTab === 'home' ? 'p-4 max-w-xl mx-auto w-full' : ''}
        >
          {activeTab === 'home'      && <HomeTab user={user} userLocation={userLocation} onTabChange={handleTabChange} />}
          {activeTab === 'ai-doctor' && <AIDoctor userLocation={userLocation} />}
          {activeTab === 'reports'   && <MedicalReports />}
          {activeTab === 'hospitals' && <Hospitals userLocation={userLocation} />}
          {activeTab === 'medicines' && <Medicines />}
          {activeTab === 'book-test' && <Appointments />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
