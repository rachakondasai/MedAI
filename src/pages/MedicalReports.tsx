import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import {
  Upload, FileText, Loader2, CheckCircle, AlertTriangle, RefreshCw,
  TrendingUp, Shield, Brain, Eye, Sparkles,
  Activity, Clock, ChevronRight, Zap, FileSearch, BarChart3, Trash2, X,
  Plus, ChevronDown,
} from 'lucide-react'
import { uploadReport } from '../lib/api'
import { isAuthenticated, getUserReports, deleteUserReport } from '../lib/auth'

interface ReportMetric {
  name: string
  value: string
  unit: string
  status: 'normal' | 'warning' | 'critical'
  range: string
}

const statusConfig = {
  normal:   { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle,  border: 'border-emerald-200', glow: 'shadow-emerald-100', gradient: 'from-emerald-500 to-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  warning:  { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: AlertTriangle, border: 'border-amber-200',   glow: 'shadow-amber-100',   gradient: 'from-amber-500 to-orange-500',   badge: 'bg-amber-100 text-amber-700' },
  critical: { bg: 'bg-red-50',     text: 'text-red-700',     icon: AlertTriangle, border: 'border-red-200',     glow: 'shadow-red-100',     gradient: 'from-red-500 to-rose-600',       badge: 'bg-red-100 text-red-700' },
}

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444']

export default function MedicalReports() {
  const [uploading, setUploading]           = useState(false)
  const [uploadResult, setUploadResult]     = useState<any>(null)
  const [metrics, setMetrics]               = useState<ReportMetric[]>([])
  const [summary, setSummary]               = useState('')
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [pastReports, setPastReports]       = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [dragActive, setDragActive]         = useState(false)
  const [deletingId, setDeletingId]         = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showHistory, setShowHistory]       = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadPastReports() }, [])

  const loadPastReports = async () => {
    if (!isAuthenticated()) return
    setLoadingHistory(true)
    try {
      const reports = await getUserReports(20)
      setPastReports(reports)
    } catch { /* ignore */ }
    finally { setLoadingHistory(false) }
  }

  const handleDeleteReport = async (reportId: string) => {
    setDeletingId(reportId)
    try {
      await deleteUserReport(reportId)
      setPastReports(prev => prev.filter(r => r.id !== reportId))
      setConfirmDeleteId(null)
    } catch (err: any) {
      alert(err.message || 'Failed to delete report.')
    } finally { setDeletingId(null) }
  }

  const handleFile = async (file: File) => {
    if (!file) return
    setUploading(true); setUploadResult(null)
    try {
      const result = await uploadReport(file)
      setUploadResult(result)
      setSummary(result.analysis?.summary || '')
      setRecommendations(result.analysis?.recommendations || [])
      if (result.analysis?.metrics?.length) {
        setMetrics(result.analysis.metrics.map((m: any) => ({
          name: m.name, value: String(m.value), unit: m.unit || '',
          status: m.status || 'normal', range: m.range || 'N/A',
        })))
      }
      loadPastReports()
    } catch (err: any) {
      setUploadResult({ error: err.message })
    } finally { setUploading(false) }
  }

  const handleUpload  = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f) }
  const handleDrag    = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }, [])
  const handleDrop    = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.toLowerCase().endsWith('.pdf')) handleFile(file)
  }, [])

  // Chart data
  const chartData = metrics.map(m => ({
    name: m.name.length > 10 ? m.name.slice(0, 10) + '…' : m.name,
    value: parseFloat(m.value) || 0, status: m.status,
  }))
  const statusCounts = {
    normal:   metrics.filter(m => m.status === 'normal').length,
    warning:  metrics.filter(m => m.status === 'warning').length,
    critical: metrics.filter(m => m.status === 'critical').length,
  }
  const pieData = [
    { name: 'Normal',   value: statusCounts.normal },
    { name: 'Warning',  value: statusCounts.warning },
    { name: 'Critical', value: statusCounts.critical },
  ].filter(d => d.value > 0)

  return (
    <div className="min-h-full">
      <div className="p-4 space-y-4 max-w-xl mx-auto pb-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0"
            >
              <FileText className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Medical Reports</h2>
              <p className="text-xs text-slate-400">AI-powered analysis with RAG + GPT-4o</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pastReports.length > 0 && (
              <button
                onClick={() => setShowHistory(v => !v)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl border border-blue-100"
              >
                <Clock className="w-3.5 h-3.5" />
                {pastReports.length}
                <ChevronDown className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              </button>
            )}
            <motion.button onClick={loadPastReports} disabled={loadingHistory}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loadingHistory ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>

        {/* ── Upload Zone ─────────────────────────────────────────── */}
        <motion.label
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="block cursor-pointer"
          onDragEnter={handleDrag} onDragLeave={handleDrag}
          onDragOver={handleDrag} onDrop={handleDrop}
        >
          <div className={`relative border-2 border-dashed rounded-3xl p-6 text-center transition-all duration-300 overflow-hidden ${
            dragActive   ? 'border-blue-500 bg-blue-50/60 scale-[1.01]' :
            uploading    ? 'border-blue-400 bg-blue-50/30' :
            'border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 bg-white'
          }`}>
            <div className="absolute inset-0 dot-pattern opacity-20 pointer-events-none" />

            {uploading ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center relative z-10 py-2">
                <div className="relative mb-4">
                  <div className="w-14 h-14 rounded-full border-4 border-slate-100" />
                  <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
                  <Brain className="absolute inset-0 w-5 h-5 m-auto text-blue-500" />
                </div>
                <p className="text-sm font-bold text-blue-700">Analyzing with AI…</p>
                <p className="text-xs text-slate-400 mt-1 mb-3">RAG engine indexing your document</p>
                <div className="flex items-center gap-3">
                  {['Parsing PDF', 'Extracting', 'AI Analysis'].map((step, i) => (
                    <span key={i} className="flex items-center gap-1 text-[10px] text-blue-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                      {step}
                    </span>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="relative z-10">
                <motion.div
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-200 shadow-md shadow-blue-100"
                >
                  {dragActive ? <Plus className="w-7 h-7 text-blue-500" /> : <Upload className="w-7 h-7 text-blue-500" />}
                </motion.div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">
                  {dragActive ? 'Drop to analyze!' : 'Upload Medical Report'}
                </h3>
                <p className="text-xs text-slate-400 mb-3">PDF up to 10MB · Drag & drop or tap to select</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {[
                    { icon: Shield, label: 'Secure' },
                    { icon: Zap,    label: 'AI-powered' },
                    { icon: Brain,  label: 'GPT-4o' },
                  ].map(({ icon: Icon, label }) => (
                    <span key={label} className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                      <Icon className="w-3 h-3" /> {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleUpload} className="hidden" disabled={uploading} />
        </motion.label>

        {/* ── Upload Result ────────────────────────────────────────── */}
        <AnimatePresence>
          {uploadResult && (
            <motion.div
              initial={{ opacity: 0, y: 8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8 }}
              className={`rounded-2xl p-4 ${uploadResult.error ? 'bg-red-50 border border-red-200' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200'}`}
            >
              {uploadResult.error ? (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-700">Upload Failed</p>
                    <p className="text-xs text-red-600 mt-0.5">{uploadResult.error}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-700">{uploadResult.message}</p>
                      <p className="text-xs text-emerald-600">{uploadResult.chunks_indexed} chunks indexed</p>
                    </div>
                  </div>
                  {summary && (
                    <div className="bg-white/70 rounded-xl p-3 border border-emerald-100">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Brain className="w-3.5 h-3.5 text-emerald-600" />
                        <p className="text-xs font-bold text-emerald-800">AI Summary</p>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{summary}</p>
                    </div>
                  )}
                  {recommendations.length > 0 && (
                    <div className="bg-white/70 rounded-xl p-3 border border-emerald-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <p className="text-xs font-bold text-emerald-800">Recommendations</p>
                      </div>
                      <ul className="space-y-1.5">
                        {recommendations.slice(0, 4).map((r, i) => (
                          <motion.li key={i}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="text-xs text-slate-600 flex items-start gap-2">
                            <span className="w-4 h-4 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            {r}
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Metrics Grid ─────────────────────────────────────────── */}
        {metrics.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Lab Results</h3>
              </div>
              <div className="flex items-center gap-1.5">
                {Object.entries(statusCounts).filter(([, v]) => v > 0).map(([key, count]) => {
                  const cfg = statusConfig[key as keyof typeof statusConfig]
                  return (
                    <span key={key} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                      {count} {key}
                    </span>
                  )
                })}
              </div>
            </div>
            {/* Scrollable metric cards */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
              {metrics.map((metric, i) => {
                const s = statusConfig[metric.status] || statusConfig.normal
                const StatusIcon = s.icon
                return (
                  <motion.div key={metric.name}
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex-shrink-0 w-[140px] ${s.bg} border ${s.border} rounded-2xl p-3.5 shadow-sm`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-7 h-7 bg-gradient-to-br ${s.gradient} rounded-lg flex items-center justify-center shadow-sm`}>
                        <StatusIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${s.badge} uppercase tracking-wide`}>
                        {metric.status}
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5 truncate">{metric.name}</p>
                    <div className="flex items-baseline gap-0.5">
                      <span className={`text-xl font-extrabold ${s.text} leading-none`}>{metric.value}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{metric.unit}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> {metric.range}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ── Charts ───────────────────────────────────────────────── */}
        {chartData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="space-y-3">
            {/* Bar chart */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Lab Values Overview</h3>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.96)', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px' }} />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status pie */}
            {pieData.length > 1 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-bold text-slate-900">Status</h3>
                  </div>
                  <div className="space-y-1">
                    {pieData.map((entry, i) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                        <span className="text-[11px] font-medium text-slate-600">{entry.name} ({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={52} paddingAngle={3} dataKey="value">
                        {pieData.map((_e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Empty State ──────────────────────────────────────────── */}
        {metrics.length === 0 && !uploadResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="text-center py-12">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-lg shadow-blue-50"
            >
              <FileSearch className="w-8 h-8 text-blue-300" />
            </motion.div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No Reports Yet</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Upload a PDF report and AI will extract lab values, flag abnormalities, and give personalized recommendations.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {['Extract Lab Values', 'Flag Abnormalities', 'AI Insights'].map((f, i) => (
                <span key={i} className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 font-semibold">
                  <Sparkles className="w-2.5 h-2.5" /> {f}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Past Reports History ─────────────────────────────────── */}
        <AnimatePresence>
          {showHistory && pastReports.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-900">Upload History</h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{pastReports.length}</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-50">
                  {pastReports.map((r, i) => (
                    <motion.div key={r.id || i}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-all group relative"
                    >
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center border border-blue-100 flex-shrink-0">
                        <FileText className="w-4.5 h-4.5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{r.filename}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" /> {r.chunks_indexed} chunks
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Inline delete confirm */}
                      <AnimatePresence>
                        {confirmDeleteId === r.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute right-12 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-2.5 py-1.5 shadow-lg z-10"
                          >
                            <span className="text-[10px] font-bold text-red-700">Delete?</span>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteReport(r.id) }}
                              disabled={deletingId === r.id}
                              className="text-[10px] font-black text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-lg disabled:opacity-50 flex items-center gap-0.5">
                              {deletingId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null) }}
                              className="text-[10px] text-slate-400 hover:text-slate-600 px-1">No</button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(confirmDeleteId === r.id ? null : r.id) }}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>

                      <ChevronRight className="w-3.5 h-3.5 text-slate-200 flex-shrink-0" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
