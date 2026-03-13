import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PieChart, Pie, Cell } from 'recharts'
import {
  Upload, FileText, Loader2, CheckCircle, AlertTriangle, RefreshCw,
  TrendingUp, Shield, Brain, Eye, Download, Sparkles, ArrowRight,
  Activity, Clock, ChevronRight, Zap, FileSearch, BarChart3, Trash2, X,
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
  normal: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle, border: 'border-emerald-200', glow: 'shadow-emerald-100', gradient: 'from-emerald-500 to-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', icon: AlertTriangle, border: 'border-amber-200', glow: 'shadow-amber-100', gradient: 'from-amber-500 to-orange-500', badge: 'bg-amber-100 text-amber-700' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', icon: AlertTriangle, border: 'border-red-200', glow: 'shadow-red-100', gradient: 'from-red-500 to-rose-600', badge: 'bg-red-100 text-red-700' },
}

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444']

export default function MedicalReports() {
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [metrics, setMetrics] = useState<ReportMetric[]>([])
  const [summary, setSummary] = useState('')
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [pastReports, setPastReports] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadPastReports()
  }, [])

  const loadPastReports = async () => {
    if (!isAuthenticated()) return
    setLoadingHistory(true)
    try {
      const reports = await getUserReports(20)
      setPastReports(reports)
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    setDeletingId(reportId)
    try {
      await deleteUserReport(reportId)
      setPastReports(prev => prev.filter(r => r.id !== reportId))
      setConfirmDeleteId(null)
    } catch (err: any) {
      alert(err.message || 'Failed to delete report.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleFile = async (file: File) => {
    if (!file) return
    setUploading(true)
    setUploadResult(null)
    try {
      const result = await uploadReport(file)
      setUploadResult(result)
      setSummary(result.analysis?.summary || '')
      setRecommendations(result.analysis?.recommendations || [])
      if (result.analysis?.metrics?.length) {
        const parsed = result.analysis.metrics.map((m: any) => ({
          name: m.name,
          value: String(m.value),
          unit: m.unit || '',
          status: m.status || 'normal',
          range: m.range || 'N/A',
        }))
        setMetrics(parsed)
      }
      loadPastReports()
    } catch (err: any) {
      setUploadResult({ error: err.message })
    } finally {
      setUploading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.toLowerCase().endsWith('.pdf')) handleFile(file)
  }, [])

  // Chart data
  const chartData = metrics.length > 0
    ? metrics.map((m) => ({
        name: m.name.length > 12 ? m.name.slice(0, 12) + '…' : m.name,
        value: parseFloat(m.value) || 0,
        status: m.status,
      }))
    : []

  // Status distribution for pie
  const statusCounts = {
    normal: metrics.filter(m => m.status === 'normal').length,
    warning: metrics.filter(m => m.status === 'warning').length,
    critical: metrics.filter(m => m.status === 'critical').length,
  }
  const pieData = [
    { name: 'Normal', value: statusCounts.normal },
    { name: 'Warning', value: statusCounts.warning },
    { name: 'Critical', value: statusCounts.critical },
  ].filter(d => d.value > 0)

  return (
    <div className="h-full overflow-y-auto relative">
      {/* Ambient mesh background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-100/30 via-indigo-50/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-violet-100/20 via-purple-50/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-r from-cyan-50/15 via-blue-50/10 to-indigo-50/15 rounded-full blur-3xl" />
      </div>
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header — Premium */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/25"
            >
              <FileText className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Medical Reports</h2>
              <p className="text-xs text-slate-400 mt-0.5">Upload, analyze, and track your health reports with AI</p>
            </div>
          </div>
        </div>
        {pastReports.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
              {pastReports.length} report{pastReports.length !== 1 ? 's' : ''} uploaded
            </span>
            <button
              onClick={loadPastReports}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loadingHistory ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        )}
      </motion.div>

      {/* Upload Zone */}
      <motion.label
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="block cursor-pointer"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 overflow-hidden ${
          dragActive
            ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
            : uploading
            ? 'border-blue-400 bg-blue-50/30'
            : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/20'
        }`}>
          {/* Decorative dots */}
          <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />

          {uploading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center relative z-10"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-200" />
                <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
                <Brain className="absolute inset-0 w-6 h-6 m-auto text-blue-500" />
              </div>
              <p className="text-sm text-blue-600 font-medium mt-4">Analyzing with AI...</p>
              <p className="text-xs text-slate-400 mt-1">RAG engine is indexing your document</p>
              <div className="flex items-center gap-4 mt-3">
                {['Parsing PDF', 'Extracting metrics', 'AI analysis'].map((step, i) => (
                  <span key={i} className="flex items-center gap-1 text-[10px] text-blue-400">
                    <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                    {step}
                  </span>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="relative z-10">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100"
              >
                <Upload className="w-8 h-8 text-blue-500" />
              </motion.div>
              <h3 className="font-semibold text-slate-800 mb-1">
                {dragActive ? 'Drop your file here!' : 'Upload Medical Report'}
              </h3>
              <p className="text-sm text-slate-400">
                Drag & drop or click — AI will analyze with RAG + GPT-4o
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                  <FileText className="w-3 h-3" /> PDF only
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                  <Shield className="w-3 h-3" /> Max 10MB
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                  <Zap className="w-3 h-3" /> AI-powered
                </span>
              </div>
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleUpload} className="hidden" disabled={uploading} />
      </motion.label>

      {/* Upload Result */}
      <AnimatePresence>
        {uploadResult && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-2xl p-5 ${
              uploadResult.error
                ? 'bg-red-50 border border-red-200'
                : 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200'
            }`}
          >
            {uploadResult.error ? (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-700">Upload Failed</p>
                  <p className="text-xs text-red-600 mt-0.5">{uploadResult.error}</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-700">{uploadResult.message}</p>
                    <p className="text-xs text-emerald-600 mt-0.5">{uploadResult.chunks_indexed} chunks indexed in FAISS vector store</p>
                  </div>
                </div>
                {summary && (
                  <div className="bg-white/60 rounded-xl p-4 mt-3 border border-emerald-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Brain className="w-3.5 h-3.5 text-emerald-600" />
                      <p className="text-xs font-semibold text-emerald-800">AI Summary</p>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{summary}</p>
                  </div>
                )}
                {recommendations.length > 0 && (
                  <div className="bg-white/60 rounded-xl p-4 mt-3 border border-emerald-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <p className="text-xs font-semibold text-emerald-800">AI Recommendations</p>
                    </div>
                    <ul className="space-y-1.5">
                      {recommendations.map((r, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="text-xs text-slate-600 flex items-start gap-2"
                        >
                          <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0">
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

      {/* Analysis Results */}
      {metrics.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">AI Report Analysis</h2>
            </div>
            <div className="flex items-center gap-2">
              {Object.entries(statusCounts).filter(([, v]) => v > 0).map(([key, count]) => {
                const cfg = statusConfig[key as keyof typeof statusConfig]
                return (
                  <span key={key} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                    {count} {key}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric, i) => {
              const s = statusConfig[metric.status] || statusConfig.normal
              const StatusIcon = s.icon
              return (
                <motion.div
                  key={metric.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -2, scale: 1.01 }}
                  className={`${s.bg} border ${s.border} rounded-2xl p-5 hover:shadow-lg ${s.glow} transition-all duration-300 relative overflow-hidden group`}
                >
                  {/* Decorative gradient */}
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${s.gradient} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`} />

                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{metric.name}</p>
                      <p className={`text-3xl font-bold ${s.text} mt-1.5 tracking-tight`}>
                        {metric.value}
                        <span className="text-sm font-normal ml-1">{metric.unit}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Normal: {metric.range}
                      </p>
                    </div>
                    <div className={`w-10 h-10 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center shadow-md`}>
                      <StatusIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Charts Row */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Lab Values Overview</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6">Extracted from your uploaded report</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[6, 6, 0, 0]}
                  name="Value"
                  fill="#3b82f6"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status Pie Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-slate-900">Health Status</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Metric distribution</p>
            {pieData.length > 0 && (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-[10px] font-medium text-slate-600">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {metrics.length === 0 && !uploadResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center py-16"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-blue-100"
          >
            <FileSearch className="w-10 h-10 text-blue-300" />
          </motion.div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Reports Analyzed Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Upload a medical report (PDF) and our AI will extract key metrics, flag abnormalities, and provide personalized health recommendations.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            {['Extract Lab Values', 'Flag Abnormalities', 'AI Recommendations'].map((f, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                <Sparkles className="w-3 h-3" /> {f}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Past Reports — Premium Timeline */}
      {pastReports.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-900">Upload History</h3>
              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{pastReports.length}</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-50">
              {pastReports.map((r, i) => (
                <motion.div
                  key={r.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-all group relative"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">{r.filename}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> {r.chunks_indexed} chunks
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Delete confirmation inline */}
                  <AnimatePresence>
                    {confirmDeleteId === r.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute right-14 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5 shadow-lg z-10"
                      >
                        <span className="text-[10px] font-semibold text-red-700">Delete this report?</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteReport(r.id) }}
                          disabled={deletingId === r.id}
                          className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {deletingId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null) }}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-700 px-1.5 py-0.5 rounded-lg transition-colors"
                        >
                          No
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Delete button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmDeleteId(confirmDeleteId === r.id ? null : r.id)
                    }}
                    className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    title="Delete report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
    </div>
  )
}
