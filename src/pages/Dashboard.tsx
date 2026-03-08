import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getHealthSummary, checkBackendHealth, getLatestVitals, getVitals, addVitals, type VitalsEntry } from '../lib/api'
import { isAuthenticated, getUserChatHistory, getUserSearchLogs, getUserReports, getStoredUser } from '../lib/auth'

const quickActions = [
  { label: 'AI Doctor', desc: 'Chat with MedAI', icon: Bot, path: '/ai-doctor', gradient: 'from-blue-500 to-blue-700' },
  { label: 'Upload Report', desc: 'Analyze with AI', icon: FileText, path: '/reports', gradient: 'from-emerald-500 to-emerald-700' },
  { label: 'Find Hospitals', desc: 'Nearby & rated', icon: Building2, path: '/hospitals', gradient: 'from-indigo-500 to-indigo-700' },
  { label: 'Medicines', desc: 'Search & buy', icon: Pill, path: '/medicines', gradient: 'from-teal-500 to-teal-700' },
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
      } catch {
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-emerald-200" />
            <span className="text-xs font-medium text-emerald-100">AI-Powered Healthcare</span>
          </div>
          <h2 className="text-2xl font-bold">Welcome back, {user?.name || 'Patient'}</h2>
          <p className="text-sm text-emerald-100 mt-1 max-w-md">
            Your AI health assistant powered by GPT-4o, LangChain, and RAG. Describe symptoms, upload reports, and get instant medical insights.
            {userLocation && (
              <span className="inline-flex items-center gap-1 ml-1 text-white font-semibold">
                📍 {userLocation}
              </span>
            )}
          </p>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => navigate('/ai-doctor')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl text-sm font-semibold transition-colors"
            >
              Start AI Consultation <ArrowRight className="w-4 h-4" />
            </button>
            {userLocation && (
              <button
                onClick={() => navigate('/hospitals')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl text-sm font-medium transition-colors"
              >
                <Building2 className="w-4 h-4" /> Hospitals near {userLocation}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Backend Status Warning */}
      {backendOnline === false && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Backend is offline — run <code className="bg-red-100 px-1 rounded">cd server && python main.py</code> to enable AI features.
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => navigate(action.path)}
            className="bg-white rounded-2xl border border-slate-200 p-5 text-left hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg mb-3 group-hover:scale-110 transition-transform`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-semibold text-slate-900">{action.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{action.desc}</p>
          </motion.button>
        ))}
      </div>

      {/* Dynamic Health/Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Health Score',
            value: healthScore !== null ? `${healthScore}/100` : '—',
            subtitle: healthScore !== null
              ? healthScore >= 80 ? 'Excellent condition' : healthScore >= 60 ? 'Good condition' : 'Needs attention'
              : 'Upload a report to calculate',
            icon: Activity,
            color: 'emerald',
            trend: healthScore !== null ? (healthScore >= 80 ? 'Great health!' : 'Keep improving') : 'No data yet',
          },
          {
            title: 'Reports Uploaded',
            value: String(stats.totalReports),
            subtitle: 'Medical reports analyzed',
            icon: FileText,
            color: 'blue',
            trend: stats.totalReports > 0 ? 'AI-analyzed with RAG' : 'Upload your first report',
          },
          {
            title: 'Risk Level',
            value: riskLevel || '—',
            subtitle: riskLevel ? 'Based on your reports' : 'No reports analyzed yet',
            icon: Shield,
            color: 'amber',
            trend: riskLevel ? `Assessment: ${riskLevel}` : 'Upload a report to assess',
          },
          {
            title: 'AI Consultations',
            value: String(stats.totalChats),
            subtitle: `${stats.totalSearches} searches made`,
            icon: Clock,
            color: 'purple',
            trend: stats.totalChats > 0 ? 'Keep consulting MedAI' : 'Start your first consultation',
          },
        ].map((card, i) => {
          const colorClasses: Record<string, { bg: string; text: string; icon: string; border: string }> = {
            emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'bg-emerald-500', border: 'border-emerald-100' },
            blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'bg-blue-500', border: 'border-blue-100' },
            amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'bg-amber-500', border: 'border-amber-100' },
            purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'bg-purple-500', border: 'border-purple-100' },
          }
          const c = colorClasses[card.color]
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className={`bg-white rounded-2xl border ${c.border} p-6 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.title}</p>
                  <p className={`text-3xl font-bold mt-2 ${c.text}`}>{card.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{card.subtitle}</p>
                </div>
                <div className={`w-12 h-12 ${c.icon} rounded-xl flex items-center justify-center shadow-lg`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-xs font-medium text-emerald-600">{card.trend}</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Health Summary + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Summary Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">AI Health Summary</h3>
              <p className="text-xs text-slate-400 mt-0.5">Based on your uploaded reports & consultations</p>
            </div>
            <Sparkles className="w-5 h-5 text-blue-500" />
          </div>

          {healthSummary?.summary && healthSummary.summary !== 'No medical reports uploaded yet. Upload a report to get your AI-powered health summary.' ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">{healthSummary.summary}</p>

              {healthSummary.keyFindings?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Key Findings</p>
                  <div className="flex flex-wrap gap-2">
                    {healthSummary.keyFindings.map((f: string, i: number) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">{f}</span>
                    ))}
                  </div>
                </div>
              )}

              {healthSummary.recommendations?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Recommendations</p>
                  <ul className="space-y-1">
                    {healthSummary.recommendations.map((r: string, i: number) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-sm text-slate-500 font-medium">No health data yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Upload a medical report or start an AI consultation to see your personalized health summary here.
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => navigate('/reports')}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Upload Report
                </button>
                <button
                  onClick={() => navigate('/ai-doctor')}
                  className="px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Start Consultation
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 p-6"
        >
          <h3 className="font-semibold text-slate-900 mb-4">Recent Activity</h3>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-700 line-clamp-2">{item.action}</p>
                    <p className="text-xs text-slate-400">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No recent activity yet.</p>
              <p className="text-xs text-slate-400">Start using MedAI to see your history here.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Vitals Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl border border-slate-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">My Vitals</h3>
            <p className="text-xs text-slate-400 mt-0.5">Log and track your health vitals manually</p>
          </div>
          <button
            onClick={() => setShowVitalsForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Log Vitals
          </button>
        </div>

        {/* Vitals Entry Form */}
        {showVitalsForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
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
                  <label className="text-[10px] font-medium text-slate-500 flex items-center gap-1 mb-1">
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
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                      {field.unit}
                    </span>
                  </div>
                </div>
              ))}
              <div>
                <label className="text-[10px] font-medium text-slate-500 mb-1 block">Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes"
                  value={vitalsForm.notes ?? ''}
                  onChange={(e) => setVitalsForm((prev) => ({ ...prev, notes: e.target.value || null }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowVitalsForm(false); setVitalsForm({}) }}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setSavingVitals(true)
                  try {
                    const saved = await addVitals(vitalsForm)
                    setLatestVitals(saved)
                    setVitalsHistory((prev) => [saved, ...prev])
                    setVitalsForm({})
                    setShowVitalsForm(false)
                  } catch {
                    // silently fail
                  } finally {
                    setSavingVitals(false)
                  }
                }}
                disabled={savingVitals}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-lg transition-colors"
              >
                {savingVitals ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save Vitals
              </button>
            </div>
          </motion.div>
        )}

        {/* Latest Vitals Display */}
        {latestVitals ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Heart Rate', value: latestVitals.heart_rate, unit: 'bpm', icon: Heart, color: 'text-red-500 bg-red-50' },
                { label: 'Blood Pressure', value: latestVitals.blood_pressure_sys && latestVitals.blood_pressure_dia ? `${latestVitals.blood_pressure_sys}/${latestVitals.blood_pressure_dia}` : null, unit: 'mmHg', icon: Activity, color: 'text-blue-500 bg-blue-50' },
                { label: 'Temperature', value: latestVitals.temperature, unit: '°F', icon: Thermometer, color: 'text-amber-500 bg-amber-50' },
                { label: 'SpO2', value: latestVitals.spo2, unit: '%', icon: Droplets, color: 'text-cyan-500 bg-cyan-50' },
                { label: 'Blood Sugar', value: latestVitals.blood_sugar, unit: 'mg/dL', icon: Droplets, color: 'text-purple-500 bg-purple-50' },
                { label: 'Weight', value: latestVitals.weight, unit: 'kg', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50' },
              ].filter((v) => v.value !== null && v.value !== undefined).map((vital) => (
                <div key={vital.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${vital.color}`}>
                    <vital.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">{vital.label}</p>
                    <p className="text-sm font-bold text-slate-900">
                      {vital.value} <span className="text-[10px] font-normal text-slate-400">{vital.unit}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {latestVitals.recorded_at && (
              <p className="text-[10px] text-slate-400">
                Last recorded: {formatRelativeTime(latestVitals.recorded_at)}
                {latestVitals.notes && ` — ${latestVitals.notes}`}
              </p>
            )}

            {/* Vitals Trend Chart */}
            {vitalsHistory.length >= 2 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-slate-700 mb-2">Heart Rate Trend</p>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={[...vitalsHistory].reverse().filter((v) => v.heart_rate).slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="recorded_at"
                      tickFormatter={(t) => {
                        try { return new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' }) } catch { return '' }
                      }}
                      tick={{ fontSize: 9 }}
                    />
                    <YAxis tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      labelFormatter={(t) => { try { return new Date(t).toLocaleString() } catch { return '' } }}
                    />
                    <Area type="monotone" dataKey="heart_rate" stroke="#ef4444" fill="#fef2f2" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10">
            <Heart className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No vitals recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">Click "Log Vitals" to start tracking your health metrics.</p>
          </div>
        )}
      </motion.div>

      {/* Architecture Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200 p-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900">Powered By</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {['OpenAI GPT-4o', 'LangChain', 'LangGraph', 'FAISS RAG', 'FastAPI', 'React 18', 'TypeScript', 'Tailwind CSS'].map((tech) => (
            <span key={tech} className="text-xs font-medium bg-white text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
              {tech}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
