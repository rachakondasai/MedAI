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
  BarChart2, Award, User,
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

// ─── VITAL CARD ─────────────────────────────────────────────────────────────
interface VitalCardProps {
  label: string
  value: string
  unit: string
  icon: any
  color: string
  bg: string
  trend?: 'up' | 'down' | 'stable'
  trendText?: string
  status?: 'normal' | 'warning' | 'critical'
}

function VitalCard({ label, value, unit, icon: Icon, color, bg, trend, trendText, status }: VitalCardProps) {
  const statusColors = {
    normal: 'text-emerald-600 bg-emerald-50',
    warning: 'text-amber-600 bg-amber-50',
    critical: 'text-red-600 bg-red-50',
  }
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {status && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-800">{value}</span>
          <span className="text-xs text-slate-500">{unit}</span>
        </div>
      </div>
      {trendText && (
        <div className="flex items-center gap-1">
          {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
          {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-blue-500" />}
          <span className="text-xs text-slate-500">{trendText}</span>
        </div>
      )}
    </motion.div>
  )
}

// ─── QUICK ACTION BUTTON ────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, color, bg, onClick }: {
  icon: any; label: string; color: string; bg: string; onClick: () => void
}) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-3 rounded-xl ${bg} border border-slate-100 w-full`}
    >
      <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <span className="text-xs font-medium text-slate-700 text-center leading-tight">{label}</span>
    </motion.button>
  )
}

// ─── ORDER STATUS BADGE ──────────────────────────────────────────────────────
function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending_payment: { label: 'Pending Payment', color: 'text-amber-700 bg-amber-100' },
    confirmed:       { label: 'Confirmed',        color: 'text-blue-700 bg-blue-100' },
    sample_collected:{ label: 'Sample Collected', color: 'text-indigo-700 bg-indigo-100' },
    processing:      { label: 'Processing',       color: 'text-purple-700 bg-purple-100' },
    delivered:       { label: 'Report Ready',     color: 'text-emerald-700 bg-emerald-100' },
  }
  const cfg = map[status] || { label: status, color: 'text-slate-700 bg-slate-100' }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
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

  const vitals: VitalCardProps[] = [
    { label: 'Heart Rate', value: '72', unit: 'bpm', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', trend: 'stable', trendText: 'Normal range', status: 'normal' },
    { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50', trend: 'stable', trendText: 'Optimal', status: 'normal' },
    { label: 'Blood Glucose', value: '98', unit: 'mg/dL', icon: Droplets, color: 'text-amber-500', bg: 'bg-amber-50', trend: 'down', trendText: 'Fasting normal', status: 'normal' },
    { label: 'Oxygen Level', value: '99', unit: '%', icon: Brain, color: 'text-teal-500', bg: 'bg-teal-50', trend: 'stable', trendText: 'Excellent', status: 'normal' },
  ]

  return (
    <div className="space-y-6">
      {/* Hero welcome card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-5 text-white overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-medium text-blue-100">{greeting},</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">{firstName}! 👋</h2>
          <p className="text-blue-200 text-sm mb-4">
            Your health summary looks good today.
            {userLocation && <span> · {userLocation}</span>}
          </p>
          <div className="flex gap-3 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onTabChange('ai-doctor')}
              className="bg-white text-blue-700 font-semibold text-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow"
            >
              <Bot className="w-4 h-4" />
              Ask AI Doctor
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onTabChange('book-test')}
              className="bg-blue-500/40 text-white font-semibold text-sm px-4 py-2 rounded-xl flex items-center gap-2 border border-white/30"
            >
              <FlaskConical className="w-4 h-4" />
              Book Blood Test
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-3">
          <QuickAction icon={Bot} label="AI Doctor" color="text-blue-600" bg="bg-blue-50" onClick={() => onTabChange('ai-doctor')} />
          <QuickAction icon={FileText} label="Reports" color="text-indigo-600" bg="bg-indigo-50" onClick={() => onTabChange('reports')} />
          <QuickAction icon={FlaskConical} label="Book Test" color="text-teal-600" bg="bg-teal-50" onClick={() => onTabChange('book-test')} />
          <QuickAction icon={PackageSearch} label="My Orders" color="text-purple-600" bg="bg-purple-50" onClick={() => navigate('/orders')} />
        </div>
      </div>

      {/* Health Vitals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-600">Today's Vitals</h3>
          <span className="text-xs text-slate-400">Last updated: just now</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {vitals.map((v) => (
            <VitalCard key={v.label} {...v} />
          ))}
        </div>
      </div>

      {/* Health Score */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-700">Health Score</h3>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Weekly
          </span>
        </div>
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3"
                strokeDasharray="85 100" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-slate-800">85</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {[
              { label: 'Nutrition', value: 80, color: 'bg-emerald-500' },
              { label: 'Activity', value: 65, color: 'bg-blue-500' },
              { label: 'Sleep', value: 90, color: 'bg-indigo-500' },
              { label: 'Stress', value: 75, color: 'bg-amber-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-16">{item.label}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                </div>
                <span className="text-xs font-medium text-slate-600 w-7 text-right">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
            <PackageSearch className="w-4 h-4 text-purple-500" />
            Recent Orders
          </h3>
          <button
            onClick={() => navigate('/orders')}
            className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline"
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
            <PackageSearch className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No orders yet</p>
            <button
              onClick={() => onTabChange('book-test')}
              className="mt-3 text-xs text-blue-600 font-semibold hover:underline"
            >
              Book your first blood test →
            </button>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {orders.map(order => (
              <motion.div
                key={order.id}
                whileHover={{ x: 2 }}
                className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-3 cursor-pointer"
                onClick={() => navigate('/orders')}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FlaskConical className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{order.testName}</p>
                    <p className="text-xs text-slate-400 truncate">{order.labName || 'Lab to be assigned'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-xs text-slate-400">₹{order.amount}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* AI Tip Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-800 mb-0.5">AI Health Tip 💡</p>
            <p className="text-xs text-indigo-700 leading-relaxed">
              Staying hydrated improves energy levels and cognitive function. Aim for 8–10 glasses of water daily. Your glucose levels look normal — keep it up!
            </p>
            <button
              onClick={() => onTabChange('ai-doctor')}
              className="mt-2 text-xs text-indigo-700 font-semibold flex items-center gap-1 hover:underline"
            >
              Ask AI Doctor for personalized advice <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Upcoming reminders */}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" />
          Health Reminders
        </h3>
        <div className="space-y-2">
          {[
            { label: 'Annual Health Check', due: 'Overdue by 2 months', icon: FlaskConical, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Cholesterol Test', due: 'Due in 2 weeks', icon: Droplets, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Blood Pressure Check', due: 'Due next month', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
          ].map((r, i) => (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl p-3 border border-slate-100 flex items-center gap-3"
            >
              <div className={`w-8 h-8 rounded-lg ${r.bg} flex items-center justify-center flex-shrink-0`}>
                <r.icon className={`w-4 h-4 ${r.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{r.label}</p>
                <p className="text-xs text-slate-400">{r.due}</p>
              </div>
              <button
                onClick={() => onTabChange('book-test')}
                className="text-xs text-blue-600 font-semibold whitespace-nowrap hover:underline"
              >
                Book →
              </button>
            </motion.div>
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

  // Handle tab change from child components
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Scroll to top on tab switch
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 shadow-sm">
        <div className="flex gap-1 overflow-x-auto no-scrollbar py-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0
                ${activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
              `}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`
                  text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5
                  ${activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-100 text-blue-600'}
                `}>
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-blue-600 rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className={activeTab === 'home' ? 'p-4 max-w-2xl mx-auto' : ''}
          >
            {activeTab === 'home' && (
              <HomeTab user={user} userLocation={userLocation} onTabChange={handleTabChange} />
            )}
            {activeTab === 'ai-doctor' && (
              <AIDoctor userLocation={userLocation} />
            )}
            {activeTab === 'reports' && (
              <MedicalReports />
            )}
            {activeTab === 'hospitals' && (
              <Hospitals userLocation={userLocation} />
            )}
            {activeTab === 'medicines' && (
              <Medicines />
            )}
            {activeTab === 'book-test' && (
              <Appointments />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
