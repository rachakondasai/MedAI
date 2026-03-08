import { useState, useEffect } from 'react'
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [searchLogs, setSearchLogs] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  
  // User management state
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [createForm, setCreateForm] = useState({ email: '', name: '', password: '', role: 'user' })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [ov, stats] = await Promise.all([getAdminOverview(), getAdminSearchStats()])
      setOverview(ov)
      setSearchStats(stats)
    } catch (err: any) {
      setError(err.message || 'Failed to load admin data.')
    } finally {
      setLoading(false)
    }
  }

  const loadTab = async (tab: TabKey) => {
    setActiveTab(tab)
    try {
      if (tab === 'users') setUsers(await getAdminUsers())
      if (tab === 'searches' && searchLogs.length === 0) setSearchLogs(await getAdminSearchLogs())
      if (tab === 'sessions' && sessions.length === 0) setSessions(await getAdminSessions())
    } catch (err: any) {
      setError(err.message)
    }
  }

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
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        <span className="ml-2 text-sm text-slate-500">Loading admin dashboard...</span>
      </div>
    )
  }

  if (error && !overview) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={loadData} className="mt-3 text-xs text-blue-600 hover:underline">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const statCards = overview
    ? [
        { label: 'Total Users', value: overview.total_users, icon: Users, color: 'blue', sub: `+${overview.new_users_today} today` },
        { label: 'Active Sessions', value: overview.active_sessions, icon: Globe, color: 'emerald', sub: 'Currently online' },
        { label: 'Total Searches', value: overview.total_searches, icon: Search, color: 'purple', sub: `${overview.today_searches} today` },
        { label: 'Reports Uploaded', value: overview.total_reports, icon: FileText, color: 'amber', sub: `${overview.total_chats} chat messages` },
      ]
    : []

  const colorMap: Record<string, { bg: string; icon: string; badge: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  }

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: Activity },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'searches', label: 'Search Logs', icon: Search },
    { key: 'sessions', label: 'Sessions', icon: Globe },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-xs text-slate-400">Monitor users, sessions, and AI search activity</p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const colors = colorMap[stat.color]
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:shadow-slate-100 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
                  {stat.sub}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => loadTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Search Activity Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">Search Activity (7 days)</h3>
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
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#colorCount)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">
                  No search data yet. Start chatting with MedAI!
                </div>
              )}
            </div>

            {/* Top Queries */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-slate-900">Top Queries</h3>
                {searchStats && (
                  <span className="ml-auto text-[10px] text-slate-400">
                    Avg response: {searchStats.avg_duration_ms}ms
                  </span>
                )}
              </div>
              {searchStats && searchStats.top_queries.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={searchStats.top_queries.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis
                      dataKey="query"
                      type="category"
                      width={120}
                      tick={{ fontSize: 9, fill: '#64748b' }}
                      tickFormatter={(v: string) => (v.length > 20 ? v.slice(0, 20) + '…' : v)}
                    />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">
                  No queries logged yet.
                </div>
              )}
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">Recent Users</h3>
              </div>
              <div className="space-y-3">
                {overview?.recent_users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      u.role === 'admin' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                ))}
                {!overview?.recent_users.length && (
                  <p className="text-xs text-slate-400 text-center py-4">No users yet.</p>
                )}
              </div>
            </div>

            {/* Recent Searches */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">Recent AI Queries</h3>
              </div>
              <div className="space-y-2">
                {overview?.recent_searches.map((s, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-700 line-clamp-1 font-medium">{s.query}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-slate-400">{s.email || 'anonymous'}</span>
                      {s.risk_level && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          s.risk_level.toLowerCase().includes('high')
                            ? 'bg-red-50 text-red-600'
                            : s.risk_level.toLowerCase().includes('moderate')
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {s.risk_level}
                        </span>
                      )}
                      {s.duration_ms && (
                        <span className="text-[10px] text-slate-400">{s.duration_ms}ms</span>
                      )}
                    </div>
                  </div>
                ))}
                {!overview?.recent_searches.length && (
                  <p className="text-xs text-slate-400 text-center py-4">No searches yet.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900">All Users ({users.length})</h3>
              <div className="ml-auto">
                <button
                  onClick={() => setShowCreateUser(!showCreateUser)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  {showCreateUser ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  {showCreateUser ? 'Cancel' : 'Add User'}
                </button>
              </div>
            </div>

            {/* Create User Form */}
            <AnimatePresence>
              {showCreateUser && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handleCreateUser} className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                    <p className="text-xs font-semibold text-blue-900 mb-3">Create New User</p>
                    {createError && (
                      <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{createError}</div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        required
                        className="px-3 py-2 text-xs bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        required
                        className="px-3 py-2 text-xs bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                      <input
                        type="password"
                        placeholder="Password (min 6 chars)"
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        required
                        minLength={6}
                        className="px-3 py-2 text-xs bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                      <div className="flex gap-2">
                        <select
                          value={createForm.role}
                          onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                          className="flex-1 px-3 py-2 text-xs bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          type="submit"
                          disabled={createLoading}
                          className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-lg transition-colors flex items-center gap-1"
                        >
                          {createLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                          Create
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Joined</th>
                    <th className="px-6 py-3">Last Login</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-900">{u.name}</p>
                            <p className="text-[10px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          u.role === 'admin' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">
                        {u.last_login ? new Date(u.last_login).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleRole(u.id)}
                            disabled={actionLoading === u.id}
                            className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
                            title={`Switch to ${u.role === 'admin' ? 'user' : 'admin'}`}
                          >
                            {actionLoading === u.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : u.role === 'admin' ? (
                              <ToggleRight className="w-3 h-3" />
                            ) : (
                              <ToggleLeft className="w-3 h-3" />
                            )}
                            {u.role === 'admin' ? 'Demote' : 'Promote'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            disabled={actionLoading === u.id}
                            className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
                            title="Delete user"
                          >
                            {actionLoading === u.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">No users found.</div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'searches' && (
          <motion.div
            key="searches"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900">Search Logs ({searchLogs.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-3">Query</th>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Risk</th>
                    <th className="px-6 py-3">Duration</th>
                    <th className="px-6 py-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {searchLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <p className="text-xs text-slate-700 max-w-xs truncate" title={log.query}>
                          {log.query}
                        </p>
                        {log.response_preview && (
                          <p className="text-[10px] text-slate-400 max-w-xs truncate mt-0.5">
                            → {log.response_preview}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">
                        {log.email || <span className="text-slate-300">anon</span>}
                      </td>
                      <td className="px-6 py-3">
                        {log.risk_level ? (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            log.risk_level.toLowerCase().includes('high')
                              ? 'bg-red-50 text-red-600'
                              : log.risk_level.toLowerCase().includes('moderate')
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {log.risk_level}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500">
                        {log.duration_ms ? `${log.duration_ms}ms` : '—'}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {searchLogs.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">No search logs yet.</div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'sessions' && (
          <motion.div
            key="sessions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900">Sessions ({sessions.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">IP Address</th>
                    <th className="px-6 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <div>
                          <p className="text-xs font-medium text-slate-900">{s.name || 'Unknown'}</p>
                          <p className="text-[10px] text-slate-400">{s.email || s.user_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          s.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          {s.is_active ? 'Active' : 'Expired'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500 font-mono">
                        {s.ip_address || '—'}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-400">
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sessions.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">No sessions found.</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
