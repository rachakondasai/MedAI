import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  Activity,
  FileText,
  MessageSquare,
  Shield,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2,
  ChevronDown,
  RefreshCw,
  Globe,
  Zap,
  Trash2,
  UserPlus,
  ToggleLeft,
  ToggleRight,
  X,
  BarChart3,
  Eye,
  Calendar,
  Hash,
  Timer,
  ShieldCheck,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  getAdminOverview,
  getAdminSearchStats,
  getAdminSearchLogs,
  getAdminUsers,
  getAdminSessions,
  adminCreateUser,
  adminDeleteUser,
  adminToggleUserRole,
  type AdminOverview,
  type SearchStats,
} from '../lib/auth'

type TabKey = 'overview' | 'users' | 'searches' | 'sessions'

// ═══════════════════════════════════════════════════════════════
// Reusable Mini Components
// ═══════════════════════════════════════════════════════════════

function StatCard({
  label, value, icon: Icon, color, sub, trend, delay = 0,
}: {
  label: string; value: number | string; icon: any; color: string; sub: string; trend?: 'up' | 'down' | 'neutral'; delay?: number
}) {
  const themes: Record<string, { gradient: string; iconGradient: string; badge: string; border: string; glow: string }> = {
    blue:    { gradient: 'from-blue-50 to-white',    iconGradient: 'from-blue-500 to-blue-600',       badge: 'bg-blue-100/80 text-blue-700',       border: 'border-blue-100',    glow: 'hover:shadow-blue-500/10' },
    emerald: { gradient: 'from-emerald-50 to-white', iconGradient: 'from-emerald-500 to-emerald-600', badge: 'bg-emerald-100/80 text-emerald-700', border: 'border-emerald-100', glow: 'hover:shadow-emerald-500/10' },
    purple:  { gradient: 'from-purple-50 to-white',  iconGradient: 'from-purple-500 to-purple-600',   badge: 'bg-purple-100/80 text-purple-700',   border: 'border-purple-100',  glow: 'hover:shadow-purple-500/10' },
    amber:   { gradient: 'from-amber-50 to-white',   iconGradient: 'from-amber-500 to-amber-600',     badge: 'bg-amber-100/80 text-amber-700',     border: 'border-amber-100',   glow: 'hover:shadow-amber-500/10' },
    rose:    { gradient: 'from-rose-50 to-white',    iconGradient: 'from-rose-500 to-rose-600',       badge: 'bg-rose-100/80 text-rose-700',       border: 'border-rose-100',    glow: 'hover:shadow-rose-500/10' },
    cyan:    { gradient: 'from-cyan-50 to-white',    iconGradient: 'from-cyan-500 to-cyan-600',       badge: 'bg-cyan-100/80 text-cyan-700',       border: 'border-cyan-100',    glow: 'hover:shadow-cyan-500/10' },
  }
  const t = themes[color] || themes.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ y: -2 }}
      className={`bg-gradient-to-br ${t.gradient} rounded-2xl border ${t.border} p-5 hover:shadow-lg ${t.glow} transition-all group relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/40 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.iconGradient} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${t.badge} backdrop-blur-sm flex items-center gap-1`}>
          {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
          {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
          {sub}
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-900 tracking-tight relative z-10">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-slate-500 mt-0.5 font-medium relative z-10">{label}</p>
    </motion.div>
  )
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-600 mb-1">{title}</p>
      <p className="text-xs text-slate-400 max-w-xs text-center">{description}</p>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
      role === 'admin'
        ? 'bg-gradient-to-r from-red-50 to-orange-50 text-red-600 ring-1 ring-red-200'
        : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 ring-1 ring-blue-200'
    }`}>
      {role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Users className="w-3 h-3" />}
      {role}
    </span>
  )
}

function RiskBadge({ level }: { level: string | null }) {
  if (!level) return <span className="text-[10px] text-slate-300">—</span>
  const lower = level.toLowerCase()
  const cls = lower.includes('high')
    ? 'bg-red-50 text-red-600 ring-red-200'
    : lower.includes('moderate')
      ? 'bg-amber-50 text-amber-600 ring-amber-200'
      : 'bg-emerald-50 text-emerald-600 ring-emerald-200'
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ring-1 ${cls}`}>
      {level}
    </span>
  )
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
      active ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-400 ring-1 ring-slate-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
      {active ? 'Active' : 'Expired'}
    </span>
  )
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

// ═══════════════════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [searchLogs, setSearchLogs] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  // User management state
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [createForm, setCreateForm] = useState({ email: '', name: '', password: '', role: 'user' })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [tabLoading, setTabLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [ov, stats] = await Promise.all([getAdminOverview(), getAdminSearchStats()])
      setOverview(ov)
      setSearchStats(stats)
      setLastRefreshed(new Date())
    } catch (err: any) {
      console.error('[AdminDashboard] loadData error:', err)
      setError(err.message || 'Failed to load admin data. Make sure you are logged in as admin.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTab = useCallback(async (tab: TabKey) => {
    setActiveTab(tab)
    setTabLoading(true)
    try {
      if (tab === 'users') setUsers(await getAdminUsers())
      if (tab === 'searches') setSearchLogs(await getAdminSearchLogs())
      if (tab === 'sessions') setSessions(await getAdminSessions())
    } catch (err: any) {
      console.error(`[AdminDashboard] loadTab(${tab}) error:`, err)
      setError(err.message || `Failed to load ${tab}.`)
    } finally {
      setTabLoading(false)
    }
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError('')
    try {
      await adminCreateUser(createForm.email, createForm.name, createForm.password, createForm.role)
      setShowCreateUser(false)
      setCreateForm({ email: '', name: '', password: '', role: 'user' })
      setUsers(await getAdminUsers())
      loadData()
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create user.')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This cannot be undone.`)) return
    setActionLoading(userId)
    try {
      await adminDeleteUser(userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete user.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleRole = async (userId: string) => {
    setActionLoading(userId)
    try {
      const result = await adminToggleUserRole(userId)
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: result.role } : u)))
    } catch (err: any) {
      alert(err.message || 'Failed to change role.')
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) loadData()
    }, 30000)
    return () => clearInterval(interval)
  }, [loading, loadData])

  // ─── Loading State ───
  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-slate-200" />
            <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
            <Shield className="absolute inset-0 w-5 h-5 m-auto text-blue-500" />
          </div>
          <p className="text-sm font-medium text-slate-600">Loading admin dashboard…</p>
          <p className="text-[10px] text-slate-400">Fetching stats from backend</p>
        </motion.div>
      </div>
    )
  }

  // ─── Error State ───
  if (error && !overview) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm font-semibold text-slate-900 mb-1">Admin Panel Error</p>
          <p className="text-xs text-red-500 mb-1 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
            {error}
          </p>
          <p className="text-[10px] text-slate-400 mb-4">
            Make sure you are logged in as <strong>admin@medai.com</strong> and the backend is running.
          </p>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </motion.div>
      </div>
    )
  }

  const statCards = overview
    ? [
        { label: 'Total Users', value: overview.total_users, icon: Users, color: 'blue', sub: `+${overview.new_users_today} today`, trend: overview.new_users_today > 0 ? 'up' as const : 'neutral' as const },
        { label: 'Active Sessions', value: overview.active_sessions, icon: Globe, color: 'emerald', sub: 'Online now', trend: 'up' as const },
        { label: 'Total Searches', value: overview.total_searches, icon: Search, color: 'purple', sub: `${overview.today_searches} today`, trend: overview.today_searches > 0 ? 'up' as const : 'neutral' as const },
        { label: 'Reports Uploaded', value: overview.total_reports, icon: FileText, color: 'amber', sub: `${overview.total_chats} chats`, trend: 'neutral' as const },
      ]
    : []

  const tabs: { key: TabKey; label: string; icon: any; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: Activity },
    { key: 'users', label: 'Users', icon: Users, count: overview?.total_users },
    { key: 'searches', label: 'Search Logs', icon: Search, count: overview?.total_searches },
    { key: 'sessions', label: 'Sessions', icon: Globe, count: overview?.active_sessions },
  ]

  // Role distribution for pie chart
  const roleData = users.length > 0
    ? [
        { name: 'Users', value: users.filter((u) => u.role === 'user').length },
        { name: 'Admins', value: users.filter((u) => u.role === 'admin').length },
      ]
    : []

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* ═══ Header ═══ */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-xl shadow-slate-900/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                Monitor users, sessions, and AI search activity
                {lastRefreshed && (
                  <span className="text-[10px] text-slate-300">
                    · Updated {lastRefreshed.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </motion.div>

        {/* Inline error banner */}
        {error && overview && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3"
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-600 flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ═══ Stat Cards ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <StatCard key={stat.label} {...stat} delay={i * 0.08} />
          ))}
        </div>

        {/* ═══ Tabs ═══ */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => tab.key === 'overview' ? setActiveTab('overview') : loadTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Tab loading indicator */}
        {tabLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
            <span className="text-xs text-slate-500">Loading…</span>
          </div>
        )}

        {/* ═══ TAB: OVERVIEW ═══ */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && !tabLoading && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Search Activity Chart */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">Search Activity</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">Last 7 days</span>
                </div>
                {searchStats && searchStats.daily_counts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={searchStats.daily_counts}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#colorCount)" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={BarChart3} title="No search data yet" description="Start chatting with the AI Doctor to generate analytics." />
                )}
              </div>

              {/* Top Queries Chart */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">Top Queries</h3>
                  </div>
                  {searchStats && (
                    <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg flex items-center gap-1">
                      <Timer className="w-3 h-3" /> Avg: {searchStats.avg_duration_ms}ms
                    </span>
                  )}
                </div>
                {searchStats && searchStats.top_queries.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={searchStats.top_queries.slice(0, 6)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis dataKey="query" type="category" width={130} tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v: string) => (v.length > 22 ? v.slice(0, 22) + '…' : v)} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e2e8f0' }} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={Search} title="No queries yet" description="Queries appear once users start searching." />
                )}
              </div>

              {/* Recent Users */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Recent Users</h3>
                  <button onClick={() => loadTab('users')} className="ml-auto text-[10px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5">
                    View all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {overview?.recent_users.map((u, i) => (
                    <motion.div key={u.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{u.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                      </div>
                      <RoleBadge role={u.role} />
                    </motion.div>
                  ))}
                  {!overview?.recent_users.length && <EmptyState icon={Users} title="No users yet" description="Users appear after sign up." />}
                </div>
              </div>

              {/* Recent AI Queries */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Recent AI Queries</h3>
                  <button onClick={() => loadTab('searches')} className="ml-auto text-[10px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5">
                    View all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {overview?.recent_searches.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <p className="text-xs text-slate-700 line-clamp-1 font-medium">{s.query}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-slate-400">{s.email || 'anonymous'}</span>
                        <RiskBadge level={s.risk_level} />
                        {s.duration_ms && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Timer className="w-3 h-3" /> {s.duration_ms}ms
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {!overview?.recent_searches.length && <EmptyState icon={Search} title="No searches yet" description="Queries show up once users start chatting." />}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ TAB: USERS ═══ */}
          {activeTab === 'users' && !tabLoading && (
            <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">All Users ({users.length})</h3>
                  {roleData.length > 0 && (
                    <div className="ml-4 flex items-center gap-2">
                      {roleData.map((r, i) => (
                        <span key={r.name} className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                          {r.value} {r.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => loadTab('users')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                    <button onClick={() => setShowCreateUser(!showCreateUser)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${showCreateUser ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-white bg-blue-600 hover:bg-blue-700'}`}>
                      {showCreateUser ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                      {showCreateUser ? 'Cancel' : 'Add User'}
                    </button>
                  </div>
                </div>

                {/* Create User Form */}
                <AnimatePresence>
                  {showCreateUser && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <form onSubmit={handleCreateUser} className="px-6 py-4 bg-blue-50/50 border-b border-blue-100">
                        <p className="text-xs font-semibold text-blue-900 mb-3">Create New User</p>
                        {createError && (
                          <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg flex items-center gap-2">
                            <XCircle className="w-3.5 h-3.5 shrink-0" /> {createError}
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          <input type="text" placeholder="Full Name" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required className="px-3 py-2.5 text-xs bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" />
                          <input type="email" placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required className="px-3 py-2.5 text-xs bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" />
                          <input type="password" placeholder="Password (min 6 chars)" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required minLength={6} className="px-3 py-2.5 text-xs bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" />
                          <div className="flex gap-2">
                            <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} className="flex-1 px-3 py-2.5 text-xs bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all">
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button type="submit" disabled={createLoading} className="px-4 py-2.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl transition-colors flex items-center gap-1 shadow-sm">
                              {createLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />} Create
                            </button>
                          </div>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Role</th>
                        <th className="px-6 py-3">Joined</th>
                        <th className="px-6 py-3">Last Login</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.map((u, i) => (
                        <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-900">{u.name}</p>
                                <p className="text-[10px] text-slate-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5"><RoleBadge role={u.role} /></td>
                          <td className="px-6 py-3.5 text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-3.5 text-xs text-slate-500">{u.last_login ? new Date(u.last_login).toLocaleString() : '—'}</td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleToggleRole(u.id)} disabled={actionLoading === u.id} className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50" title={`Switch to ${u.role === 'admin' ? 'user' : 'admin'}`}>
                                {actionLoading === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : u.role === 'admin' ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                                {u.role === 'admin' ? 'Demote' : 'Promote'}
                              </button>
                              <button onClick={() => handleDeleteUser(u.id, u.name)} disabled={actionLoading === u.id} className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50" title="Delete user">
                                {actionLoading === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Delete
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && <EmptyState icon={Users} title="No users found" description="Create your first user using the button above." />}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ TAB: SEARCH LOGS ═══ */}
          {activeTab === 'searches' && !tabLoading && (
            <motion.div key="searches" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Search className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Search Logs ({searchLogs.length})</h3>
                  <button onClick={() => loadTab('searches')} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                        <th className="px-6 py-3">Query</th>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Risk</th>
                        <th className="px-6 py-3">Duration</th>
                        <th className="px-6 py-3">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {searchLogs.map((log, i) => (
                        <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5">
                            <p className="text-xs text-slate-700 max-w-xs truncate font-medium" title={log.query}>{log.query}</p>
                            {log.response_preview && <p className="text-[10px] text-slate-400 max-w-xs truncate mt-0.5">→ {log.response_preview}</p>}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-slate-500">{log.email || <span className="text-slate-300 italic">anon</span>}</td>
                          <td className="px-6 py-3.5"><RiskBadge level={log.risk_level} /></td>
                          <td className="px-6 py-3.5 text-xs text-slate-500 font-mono">{log.duration_ms ? `${log.duration_ms}ms` : '—'}</td>
                          <td className="px-6 py-3.5 text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {searchLogs.length === 0 && <EmptyState icon={Search} title="No search logs yet" description="Logs appear after users interact with the AI Doctor." />}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ TAB: SESSIONS ═══ */}
          {activeTab === 'sessions' && !tabLoading && (
            <motion.div key="sessions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Sessions ({sessions.length})</h3>
                  <span className="text-[10px] text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full font-medium ml-1">
                    {sessions.filter((s) => s.is_active).length} active
                  </span>
                  <button onClick={() => loadTab('sessions')} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">IP Address</th>
                        <th className="px-6 py-3">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {sessions.map((s, i) => (
                        <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5">
                            <div>
                              <p className="text-xs font-semibold text-slate-900">{s.name || 'Unknown'}</p>
                              <p className="text-[10px] text-slate-400">{s.email || s.user_id}</p>
                            </div>
                          </td>
                          <td className="px-6 py-3.5"><StatusDot active={!!s.is_active} /></td>
                          <td className="px-6 py-3.5 text-xs text-slate-500 font-mono">{s.ip_address || '—'}</td>
                          <td className="px-6 py-3.5 text-xs text-slate-400">{new Date(s.created_at).toLocaleString()}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {sessions.length === 0 && <EmptyState icon={Globe} title="No sessions found" description="Sessions are created when users log in." />}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
