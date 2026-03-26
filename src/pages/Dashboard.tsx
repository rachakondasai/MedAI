import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  FileText,
  AlertTriangle,
  Zap,
  TrendingUp,
  Heart,
  Thermometer,
  Droplets,
  Bot,
  Building2,
  Pill,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  Loader2,
  Plus,
  Weight,
  Star,
  Brain,
  Crown,
  Verified,
  ChevronRight,
  MapPin,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getHealthSummary, checkBackendHealth, getLatestVitals, getVitals, addVitals, type VitalsEntry } from '../lib/api'
import { isAuthenticated, getUserChatHistory, getUserSearchLogs, getUserReports, getStoredUser } from '../lib/auth'

const quickActions = [
  { label: 'AI Doctor', desc: 'Chat with MedAI', icon: Bot, path: '/ai-doctor', gradient: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/20', accent: 'bg-blue-400' },
  { label: 'Upload Report', desc: 'Analyze with AI', icon: FileText, path: '/reports', gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/20', accent: 'bg-emerald-400' },
  { label: 'Find Hospitals', desc: 'Nearby & rated', icon: Building2, path: '/hospitals', gradient: 'from-indigo-500 to-purple-600', glow: 'shadow-indigo-500/20', accent: 'bg-indigo-400' },
  { label: 'Medicines', desc: 'Search & buy', icon: Pill, path: '/medicines', gradient: 'from-teal-500 to-cyan-600', glow: 'shadow-teal-500/20', accent: 'bg-teal-400' },
]

interface RecentItem {
  action: string
  time: string
  icon: any
  color: string
}

export default function Dashboard({ userLocation = '' }: { userLocation?: string }) {
  const navigate = useNavigate()
  const user = getStoredUser()
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [apiKeyMissing, setApiKeyMissing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [healthSummary, setHealthSummary] = useState<any>(null)
  const [recentActivity, setRecentActivity] = useState<RecentItem[]>([])
  const [stats, setStats] = useState({
    totalChats: 0,
    totalSearches: 0,
    totalReports: 0,
  })
  // Vitals state
  const [latestVitals, setLatestVitals] = useState<VitalsEntry | null>(null)
  const [vitalsHistory, setVitalsHistory] = useState<VitalsEntry[]>([])
  const [showVitalsForm, setShowVitalsForm] = useState(false)
  const [vitalsForm, setVitalsForm] = useState<VitalsEntry>({})
  const [savingVitals, setSavingVitals] = useState(false)

  useEffect(() => {
    checkBackendHealth().then(setBackendOnline)
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load health summary if backend is available
      try {
        const summary = await getHealthSummary()
        setHealthSummary(summary)
        setApiKeyMissing(false)
      } catch (err: any) {
        // Detect API key not configured
        if (err.message?.includes('API key')) {
          setApiKeyMissing(true)
        }
        // Backend may be offline or no API key
      }

      if (isAuthenticated()) {
        const [chats, searches, reports] = await Promise.all([
          getUserChatHistory(10).catch(() => []),
          getUserSearchLogs(10).catch(() => []),
          getUserReports(10).catch(() => []),
        ])

        // Load vitals
        try {
          const [latest, history] = await Promise.all([
            getLatestVitals(),
            getVitals(20),
          ])
          if (latest && latest.id) setLatestVitals(latest)
          if (history && history.length > 0) setVitalsHistory(history)
        } catch {
          // Vitals not available yet
        }

        setStats({
          totalChats: chats.length,
          totalSearches: searches.length,
          totalReports: reports.length,
        })

        // Build recent activity from real data
        const activity: RecentItem[] = []
        for (const r of reports.slice(0, 2)) {
          activity.push({
            action: `Report uploaded: ${r.filename || 'Medical report'}`,
            time: formatRelativeTime(r.created_at),
            icon: FileText,
            color: 'bg-blue-50 text-blue-600',
          })
        }
        for (const c of chats.filter((c: any) => c.role === 'user').slice(0, 2)) {
          activity.push({
            action: `AI consultation: ${(c.content || '').slice(0, 50)}${c.content?.length > 50 ? '…' : ''}`,
            time: formatRelativeTime(c.created_at),
            icon: Bot,
            color: 'bg-emerald-50 text-emerald-600',
          })
        }
        for (const s of searches.slice(0, 2)) {
          activity.push({
            action: `Search: ${(s.query || '').slice(0, 50)}${s.query?.length > 50 ? '…' : ''}`,
            time: formatRelativeTime(s.created_at),
            icon: TrendingUp,
            color: 'bg-purple-50 text-purple-600',
          })
        }
        activity.sort((a, b) => 0) // keep insertion order (already sorted by recency)
        setRecentActivity(activity.slice(0, 5))
      }
    } finally {
      setLoading(false)
    }
  }

  function formatRelativeTime(isoString: string): string {
    try {
      const date = new Date(isoString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins} min ago`
      const diffHrs = Math.floor(diffMins / 60)
      if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`
      const diffDays = Math.floor(diffHrs / 24)
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
      return date.toLocaleDateString()
    } catch {
      return 'Recently'
    }
  }

  const healthScore = healthSummary?.score ?? null
  const riskLevel = healthSummary?.riskLevel ?? null
  const circumference = 2 * Math.PI * 54
  const scorePercent = healthScore !== null ? healthScore : 0
  const strokeDashoffset = circumference - (circumference * scorePercent) / 100

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto relative min-h-[100svh] md:min-h-0">
      {/* Ambient page background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-blue-100/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-[200px] h-[200px] sm:w-[400px] sm:h-[400px] bg-emerald-100/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-[150px] h-[150px] sm:w-[300px] sm:h-[300px] bg-purple-100/10 rounded-full blur-3xl" />
      </div>

      {/* Welcome Banner — Ultra Premium */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl shadow-emerald-500/10"
      >
        {/* Hero animated gradient */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="absolute inset-0 dot-pattern opacity-[0.04]" />

        {/* Animated particle orbs */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10"
            animate={{
              x: [0, (i % 2 === 0 ? 1 : -1) * (20 + i * 8)],
              y: [0, (i % 3 === 0 ? -1 : 1) * (15 + i * 5)],
              opacity: [0.06, 0.18, 0.06],
              scale: [1, 1.3, 1],
            }}
            transition={{ duration: 4 + i * 1.2, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}
            style={{
              left: `${8 + i * 11}%`,
              top: `${10 + (i % 4) * 20}%`,
              width: `${14 + i * 5}px`,
              height: `${14 + i * 5}px`,
            }}
          />
        ))}

        <div className="relative z-10 p-6 sm:p-8 text-white">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center gap-2 mb-4"
          >
            <motion.div
              animate={{ rotate: [0, 18, -18, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-5 h-5 text-emerald-200" />
            </motion.div>
            <span className="text-[10px] font-bold text-emerald-100 tracking-[0.15em] uppercase">AI-Powered Healthcare Platform</span>
            {backendOnline === true && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-300"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                Backend Online
              </span>
            )}
            <span className="flex items-center gap-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-400/20 to-orange-400/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-amber-300/20">
              <Crown className="w-2.5 h-2.5 text-amber-300" /> Premium
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="text-3xl sm:text-4xl font-black tracking-tight"
          >
            {getGreeting()},{' '}
            <span className="text-white/90">{user?.name || 'Patient'}</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-emerald-100/90 mt-2 max-w-lg leading-relaxed"
          >
            Your personal AI health assistant powered by GPT-4o, LangChain, and RAG.
            {userLocation && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-1 ml-1.5 font-bold text-white bg-white/10 px-2 py-0.5 rounded-full text-xs"
              >
                <MapPin className="w-3 h-3" /> {userLocation}
              </motion.span>
            )}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap items-center gap-3 mt-6"
          >
            <motion.button
              whileHover={{ scale: 1.04, y: -2, boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/ai-doctor')}
              className="flex items-center gap-2.5 px-7 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-bold transition-all border border-white/15 shadow-lg shadow-white/5 ripple-btn"
            >
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
                <Brain className="w-4 h-4" />
              </motion.div>
              Start AI Consultation
              <ArrowRight className="w-4 h-4 ml-1" />
            </motion.button>
            {userLocation && (
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/hospitals')}
                className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium transition-all border border-white/5 ripple-btn"
              >
                <Building2 className="w-4 h-4" /> Hospitals near {userLocation}
              </motion.button>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Backend Status Warning */}
      <AnimatePresence>
        {backendOnline === false && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/60 rounded-2xl p-4 text-xs text-red-700 flex items-center gap-3 shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-red-800">Backend is offline</p>
              <p className="text-red-600 mt-0.5">Run <code className="bg-red-100 px-1.5 py-0.5 rounded-md font-mono text-[10px]">cd server && python main.py</code> to enable AI features.</p>
            </div>
          </motion.div>
        )}
        {backendOnline === true && apiKeyMissing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 text-xs text-amber-700 flex items-center gap-3 shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-amber-800">OpenAI API key not configured</p>
              <p className="text-amber-600 mt-0.5">AI features (chat, report analysis, health summary) require an API key. Set <code className="bg-amber-100 px-1.5 py-0.5 rounded-md font-mono text-[10px]">OPENAI_API_KEY</code> in <code className="bg-amber-100 px-1.5 py-0.5 rounded-md font-mono text-[10px]">server/.env</code> or add it in Settings.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/settings')}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/20 whitespace-nowrap"
            >
              Open Settings
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions — Pro-Level Animated Cards */}
      <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {quickActions.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.09, type: 'spring', stiffness: 260, damping: 22 }}
            whileHover={{ y: -8, scale: 1.03, rotateX: 3, rotateY: -3 }}
            whileTap={{ scale: 0.95, rotateX: 0, rotateY: 0 }}
            onClick={() => navigate(action.path)}
            className="glass-card rounded-2xl p-5 text-left transition-all duration-400 group relative overflow-hidden ripple-btn tilt-card"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Gradient overlay on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500 rounded-2xl`} />
            {/* Glowing top-right orb */}
            <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${action.gradient} rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
            {/* Bottom accent line */}
            <motion.div
              className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-100`}
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.3 }}
            />

            <div className="relative z-10">
              <motion.div
                whileHover={{ scale: 1.15, rotate: 8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-xl ${action.glow} mb-3.5`}
              >
                <action.icon className="w-[22px] h-[22px] text-white" />
              </motion.div>
              <p className="text-sm font-black text-slate-900 group-hover:text-slate-800">{action.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{action.desc}</p>
            </div>
            <motion.div
              className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100"
              initial={{ x: -6, opacity: 0 }}
              whileHover={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </motion.div>
          </motion.button>
        ))}
      </div>

      {/* Stats Cards — Pro Animated with count-up */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {[
          {
            title: 'Health Score',
            value: healthScore !== null ? healthScore : null,
            display: healthScore !== null ? `${healthScore}` : '—',
            suffix: healthScore !== null ? '/100' : '',
            subtitle: healthScore !== null
              ? healthScore >= 80 ? 'Excellent condition' : healthScore >= 60 ? 'Good condition' : 'Needs attention'
              : 'Upload a report to calculate',
            icon: Activity,
            color: 'emerald',
            trend: healthScore !== null ? (healthScore >= 80 ? 'Great health!' : 'Keep improving') : 'No data yet',
          },
          {
            title: 'Reports Uploaded',
            value: stats.totalReports,
            display: String(stats.totalReports),
            suffix: '',
            subtitle: 'Medical reports analyzed',
            icon: FileText,
            color: 'blue',
            trend: stats.totalReports > 0 ? 'AI-analyzed with RAG' : 'Upload your first report',
          },
          {
            title: 'Risk Level',
            value: null,
            display: riskLevel || '—',
            suffix: '',
            subtitle: riskLevel ? 'Based on your reports' : 'No reports analyzed yet',
            icon: Shield,
            color: 'amber',
            trend: riskLevel ? `Assessment: ${riskLevel}` : 'Upload a report to assess',
          },
          {
            title: 'AI Consultations',
            value: stats.totalChats,
            display: String(stats.totalChats),
            suffix: '',
            subtitle: `${stats.totalSearches} searches made`,
            icon: Clock,
            color: 'purple',
            trend: stats.totalChats > 0 ? 'Keep consulting MedAI' : 'Start your first consultation',
          },
        ].map((card, i) => {
          const colorClasses: Record<string, { text: string; icon: string; border: string; glow: string; gradient: string; trendColor: string; ring: string }> = {
            emerald: { text: 'text-emerald-700', icon: 'from-emerald-500 to-emerald-600', border: 'border-emerald-100/40', glow: 'shadow-emerald-500/10', gradient: 'from-emerald-50/80 to-white', trendColor: 'text-emerald-600', ring: 'ring-emerald-100/50' },
            blue:    { text: 'text-blue-700',    icon: 'from-blue-500 to-blue-600',       border: 'border-blue-100/40',    glow: 'shadow-blue-500/10',    gradient: 'from-blue-50/80 to-white',    trendColor: 'text-blue-600',    ring: 'ring-blue-100/50' },
            amber:   { text: 'text-amber-700',   icon: 'from-amber-500 to-amber-600',     border: 'border-amber-100/40',   glow: 'shadow-amber-500/10',   gradient: 'from-amber-50/80 to-white',   trendColor: 'text-amber-600',   ring: 'ring-amber-100/50' },
            purple:  { text: 'text-purple-700',  icon: 'from-purple-500 to-purple-600',   border: 'border-purple-100/40',  glow: 'shadow-purple-500/10',  gradient: 'from-purple-50/80 to-white',  trendColor: 'text-purple-600',  ring: 'ring-purple-100/50' },
          }
          const c = colorClasses[card.color]
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.12 + i * 0.09, type: 'spring', stiffness: 240, damping: 22 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className={`bg-gradient-to-br ${c.gradient} backdrop-blur-xl rounded-2xl border ${c.border} p-6 hover:shadow-xl ${c.glow} transition-all duration-500 relative overflow-hidden group cursor-default`}
            >
              {/* Glow orb on hover */}
              <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${c.icon} rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-all duration-700`} />

              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{card.title}</p>
                  <motion.p
                    key={card.display}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={`text-3xl font-black mt-2 ${c.text}`}
                  >
                    {card.display}
                    {card.suffix && <span className="text-base font-semibold text-slate-400 ml-0.5">{card.suffix}</span>}
                  </motion.p>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">{card.subtitle}</p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.12, rotate: 8 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className={`w-12 h-12 bg-gradient-to-br ${c.icon} rounded-xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300`}
                >
                  <card.icon className="w-6 h-6 text-white" />
                </motion.div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100/60 relative z-10">
                <motion.span
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className={`text-xs font-bold ${c.trendColor}`}
                >
                  {card.trend}
                </motion.span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Health Summary + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
        {/* Health Summary Panel — Premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-card rounded-xl sm:rounded-2xl p-3 sm:p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-50/40 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center justify-between mb-5 relative z-10">
            <div>
              <h3 className="font-black text-slate-900 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                  <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>
                AI Health Summary
                <span className="flex items-center gap-0.5 text-[8px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100/50">
                  <Verified className="w-2.5 h-2.5" /> AI
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 ml-[46px]">Based on your uploaded reports & consultations</p>
            </div>
            {healthScore !== null && (
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <motion.circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke={healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-slate-900">{healthScore}</span>
                  <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">Score</span>
                </div>
              </div>
            )}
          </div>

          {healthSummary?.summary && healthSummary.summary !== 'No medical reports uploaded yet. Upload a report to get your AI-powered health summary.' ? (
            <div className="space-y-4 relative z-10">
              <p className="text-sm text-slate-600 leading-relaxed">{healthSummary.summary}</p>

              {healthSummary.keyFindings?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">Key Findings</p>
                  <div className="flex flex-wrap gap-2">
                    {healthSummary.keyFindings.map((f: string, i: number) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 font-semibold"
                      >
                        {f}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {healthSummary.recommendations?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">Recommendations</p>
                  <ul className="space-y-2">
                    {healthSummary.recommendations.map((r: string, i: number) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="text-xs text-slate-600 flex items-start gap-2.5 leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        {r}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center relative z-10">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-18 h-18 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-4 shadow-inner"
              >
                <FileText className="w-8 h-8 text-slate-300" />
              </motion.div>
              <p className="text-sm text-slate-500 font-bold">No health data yet</p>
              <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">
                Upload a medical report or start an AI consultation to see your personalized health summary here.
              </p>
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/reports')}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-xl shadow-blue-500/20 transition-all"
                >
                  Upload Report
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/ai-doctor')}
                  className="px-6 py-2.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100"
                >
                  Start Consultation
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Recent Activity — Premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-6"
        >
          <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Clock className="w-4 h-4 text-white" />
            </div>
            Recent Activity
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-ping" />
              </div>
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-2.5">
              {recentActivity.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ x: 3 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/70 transition-all border border-transparent hover:border-slate-100/50"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700 line-clamp-2 font-semibold">{item.action}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{item.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-xs text-slate-500 font-bold">No recent activity yet.</p>
              <p className="text-[10px] text-slate-400 mt-1">Start using MedAI to see your history here.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Vitals Panel — Premium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-red-50/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-xl shadow-red-500/20"
            >
              <Heart className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h3 className="font-black text-slate-900">My Vitals</h3>
              <p className="text-[10px] text-slate-400 font-medium">Log and track your health vitals</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowVitalsForm((v) => !v)}
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-xl shadow-blue-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Log Vitals
          </motion.button>
        </div>

        {/* Vitals Entry Form */}
        <AnimatePresence>
          {showVitalsForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-5 bg-gradient-to-br from-slate-50/90 to-blue-50/40 backdrop-blur-sm rounded-2xl border border-slate-200/50 relative z-10"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', icon: Heart, placeholder: '72' },
                  { key: 'blood_pressure_sys', label: 'BP Systolic', unit: 'mmHg', icon: Activity, placeholder: '120' },
                  { key: 'blood_pressure_dia', label: 'BP Diastolic', unit: 'mmHg', icon: Activity, placeholder: '80' },
                  { key: 'temperature', label: 'Temperature', unit: '°F', icon: Thermometer, placeholder: '98.6' },
                  { key: 'spo2', label: 'SpO2', unit: '%', icon: Droplets, placeholder: '98' },
                  { key: 'blood_sugar', label: 'Blood Sugar', unit: 'mg/dL', icon: Droplets, placeholder: '100' },
                  { key: 'weight', label: 'Weight', unit: 'kg', icon: TrendingUp, placeholder: '70' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1.5">
                      <field.icon className="w-3 h-3" /> {field.label}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        placeholder={field.placeholder}
                        value={(vitalsForm as any)[field.key] ?? ''}
                        onChange={(e) =>
                          setVitalsForm((prev) => ({
                            ...prev,
                            [field.key]: e.target.value ? parseFloat(e.target.value) : null,
                          }))
                        }
                        className="w-full px-3 py-2.5 text-sm bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">
                        {field.unit}
                      </span>
                    </div>
                  </div>
                ))}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Notes</label>
                  <input
                    type="text"
                    placeholder="Optional notes"
                    value={vitalsForm.notes ?? ''}
                    onChange={(e) => setVitalsForm((prev) => ({ ...prev, notes: e.target.value || null }))}
                    className="w-full px-3 py-2.5 text-sm bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowVitalsForm(false); setVitalsForm({}) }}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    setSavingVitals(true)
                    try {
                      const saved = await addVitals(vitalsForm)
                      setLatestVitals(saved)
                      setVitalsHistory((prev) => [saved, ...prev])
                      setVitalsForm({})
                      setShowVitalsForm(false)
                    } catch {
                    } finally {
                      setSavingVitals(false)
                    }
                  }}
                  disabled={savingVitals}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 disabled:from-slate-300 disabled:to-slate-300 rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {savingVitals ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Vitals
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Latest Vitals Display — Premium Cards */}
        {latestVitals ? (
          <div className="space-y-4 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Heart Rate', value: latestVitals.heart_rate, unit: 'bpm', icon: Heart, color: 'from-red-500 to-rose-600', bg: 'from-red-50/90 to-rose-50/60', text: 'text-red-600', border: 'border-red-100/40' },
                { label: 'Blood Pressure', value: latestVitals.blood_pressure_sys && latestVitals.blood_pressure_dia ? `${latestVitals.blood_pressure_sys}/${latestVitals.blood_pressure_dia}` : null, unit: 'mmHg', icon: Activity, color: 'from-blue-500 to-indigo-600', bg: 'from-blue-50/90 to-indigo-50/60', text: 'text-blue-600', border: 'border-blue-100/40' },
                { label: 'Temperature', value: latestVitals.temperature, unit: '°F', icon: Thermometer, color: 'from-amber-500 to-orange-600', bg: 'from-amber-50/90 to-orange-50/60', text: 'text-amber-600', border: 'border-amber-100/40' },
                { label: 'SpO2', value: latestVitals.spo2, unit: '%', icon: Droplets, color: 'from-cyan-500 to-blue-600', bg: 'from-cyan-50/90 to-blue-50/60', text: 'text-cyan-600', border: 'border-cyan-100/40' },
                { label: 'Blood Sugar', value: latestVitals.blood_sugar, unit: 'mg/dL', icon: Droplets, color: 'from-purple-500 to-violet-600', bg: 'from-purple-50/90 to-violet-50/60', text: 'text-purple-600', border: 'border-purple-100/40' },
                { label: 'Weight', value: latestVitals.weight, unit: 'kg', icon: TrendingUp, color: 'from-emerald-500 to-teal-600', bg: 'from-emerald-50/90 to-teal-50/60', text: 'text-emerald-600', border: 'border-emerald-100/40' },
              ].filter((v) => v.value !== null && v.value !== undefined).map((vital, i) => (
                <motion.div
                  key={vital.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -3, scale: 1.02 }}
                  className={`bg-gradient-to-br ${vital.bg} backdrop-blur-sm rounded-xl p-4 border ${vital.border} hover:shadow-lg transition-all duration-300`}
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${vital.color} flex items-center justify-center mb-2.5 shadow-lg`}>
                    <vital.icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{vital.label}</p>
                  <p className={`text-xl font-black ${vital.text} mt-1`}>
                    {vital.value} <span className="text-[10px] font-medium text-slate-400">{vital.unit}</span>
                  </p>
                </motion.div>
              ))}
            </div>
            {latestVitals.recorded_at && (
              <p className="text-[10px] text-slate-400 font-medium">
                Last recorded: {formatRelativeTime(latestVitals.recorded_at)}
                {latestVitals.notes && ` — ${latestVitals.notes}`}
              </p>
            )}

            {/* Vitals Trend Chart */}
            {vitalsHistory.length >= 2 && (
              <div className="mt-3 p-5 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-100/50 shadow-sm">
                <p className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-white" />
                  </div>
                  Heart Rate Trend
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={[...vitalsHistory].reverse().filter((v) => v.heart_rate).slice(-10)}>
                    <defs>
                      <linearGradient id="heartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="recorded_at"
                      tickFormatter={(t) => {
                        try { return new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' }) } catch { return '' }
                      }}
                      tick={{ fontSize: 9, fill: '#94a3b8' }}
                    />
                    <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', backdropFilter: 'blur(8px)' }}
                      labelFormatter={(t) => { try { return new Date(t).toLocaleString() } catch { return '' } }}
                    />
                    <Area type="monotone" dataKey="heart_rate" stroke="#ef4444" fill="url(#heartGrad)" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-14 relative z-10">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-18 h-18 rounded-3xl bg-gradient-to-br from-red-50 to-rose-50 flex items-center justify-center mx-auto mb-4 shadow-inner"
            >
              <Heart className="w-8 h-8 text-red-200" />
            </motion.div>
            <p className="text-sm text-slate-500 font-bold">No vitals recorded yet</p>
            <p className="text-xs text-slate-400 mt-1.5">Click "Log Vitals" to start tracking your health metrics.</p>
          </div>
        )}
      </motion.div>

      {/* Architecture Info — Premium Dark */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-7 relative overflow-hidden shadow-xl sm:shadow-2xl"
      >
        <div className="absolute inset-0 dot-pattern opacity-5" />
        <motion.div
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500"
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 6, repeat: Infinity }}
          style={{ backgroundSize: '200% 200%' }}
        />
        <div className="absolute top-8 right-8 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-8 left-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Powered By</h3>
              <p className="text-[10px] text-slate-500 font-medium">World-class AI infrastructure</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {[
              { name: 'OpenAI GPT-4o', color: 'from-blue-500/20 to-blue-600/20 text-blue-300 border-blue-500/20' },
              { name: 'LangChain', color: 'from-emerald-500/20 to-emerald-600/20 text-emerald-300 border-emerald-500/20' },
              { name: 'LangGraph', color: 'from-cyan-500/20 to-cyan-600/20 text-cyan-300 border-cyan-500/20' },
              { name: 'FAISS RAG', color: 'from-amber-500/20 to-amber-600/20 text-amber-300 border-amber-500/20' },
              { name: 'FastAPI', color: 'from-purple-500/20 to-purple-600/20 text-purple-300 border-purple-500/20' },
              { name: 'React 18', color: 'from-sky-500/20 to-sky-600/20 text-sky-300 border-sky-500/20' },
              { name: 'TypeScript', color: 'from-blue-500/20 to-blue-600/20 text-blue-300 border-blue-500/20' },
              { name: 'Tailwind CSS', color: 'from-teal-500/20 to-teal-600/20 text-teal-300 border-teal-500/20' },
            ].map((tech, i) => (
              <motion.span
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.04 }}
                whileHover={{ scale: 1.05, y: -1 }}
                className={`text-xs font-bold bg-gradient-to-r ${tech.color} px-4 py-2 rounded-xl border backdrop-blur-sm cursor-default`}
              >
                {tech.name}
              </motion.span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
