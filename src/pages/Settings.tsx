import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Bell, Shield, Key, CheckCircle, XCircle, Loader2, LogOut, Server,
  Zap, ExternalLink, Sparkles, Crown, Settings2, Lock,
  Activity, ChevronRight, Heart, Phone, Mail, BadgeCheck, Save, Edit3,
} from 'lucide-react'
import { validateApiKey, setApiKey, getStoredApiKey, checkBackendHealth, getUserPreferences, saveUserPreferences } from '../lib/api'
import { getStoredUser } from '../lib/auth'

const DEFAULT_PREFS: Record<string, boolean> = {
  'AI Consultation Alerts': true,
  'Report Analysis Ready': true,
  'Appointment Reminders': true,
  'Health Tips': false,
  'Two-Factor Authentication': true,
  'Share Data with Doctors': false,
}

// ── Premium Toggle ────────────────────────────────────────────────────
function ToggleSwitch({ on, onToggle, color = 'from-emerald-500 to-teal-500' }: {
  on: boolean; onToggle: () => void; color?: string
}) {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.88 }}
      className={`relative w-12 h-6.5 rounded-full transition-all duration-300 flex-shrink-0 ${
        on ? `bg-gradient-to-r ${color} shadow-lg` : 'bg-slate-200'
      }`}
      style={{ height: '26px' }}
    >
      <motion.span
        className="absolute top-[2px] w-[22px] h-[22px] bg-white rounded-full shadow-md"
        animate={{ left: on ? '22px' : '2px' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {on && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
          </motion.div>
        )}
      </motion.span>
    </motion.button>
  )
}

export default function Settings() {
  const [apiKey, setApiKeyState] = useState(getStoredApiKey())
  const [keyStatus, setKeyStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle')
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [toggles, setToggles] = useState<Record<string, boolean>>(DEFAULT_PREFS)
  const currentUser = getStoredUser()

  // Profile edit state
  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneVal, setPhoneVal] = useState(() => {
    try { return JSON.parse(localStorage.getItem('medai_phone') || '""') } catch { return '' }
  })
  const [phoneSaved, setPhoneSaved] = useState(false)

  const savePhone = () => {
    localStorage.setItem('medai_phone', JSON.stringify(phoneVal))
    setEditingPhone(false)
    setPhoneSaved(true)
    setTimeout(() => setPhoneSaved(false), 2000)
  }

  useEffect(() => {
    checkBackendHealth().then(setBackendOnline)
    if (getStoredApiKey()) setKeyStatus('valid')
    getUserPreferences()
      .then((saved) => {
        if (saved && Object.keys(saved).length > 0) setToggles((prev) => ({ ...prev, ...saved }))
      })
      .catch(() => {})
  }, [])

  const handleToggle = (label: string) => {
    setToggles((prev) => {
      const updated = { ...prev, [label]: !prev[label] }
      saveUserPreferences(updated).catch(() => {})
      return updated
    })
  }

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return
    setKeyStatus('validating')
    try {
      const res = await validateApiKey(apiKey.trim())
      if (res.valid) { setApiKey(apiKey.trim()); setKeyStatus('valid') }
      else setKeyStatus('invalid')
    } catch { setKeyStatus('invalid') }
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-400/6 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-violet-400/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-emerald-400/4 rounded-full blur-3xl" />
      </div>

      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4 pb-24">

        {/* ── Page Header ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 rounded-3xl p-5 overflow-hidden shadow-xl shadow-slate-900/20"
        >
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 left-8 w-36 h-36 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-sm">
              <Settings2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold text-white">Settings</h2>
                <span className="flex items-center gap-1 bg-amber-400/20 text-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-400/30">
                  <Crown className="w-2.5 h-2.5" /> PRO
                </span>
                {keyStatus === 'valid' && (
                  <span className="flex items-center gap-1 bg-emerald-500/15 text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> AI ACTIVE
                  </span>
                )}
                {backendOnline && (
                  <span className="flex items-center gap-1 bg-blue-500/15 text-blue-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-blue-500/20">
                    <Activity className="w-2.5 h-2.5" /> ONLINE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">API keys, notifications, security & account</p>
            </div>
          </div>
        </motion.div>

        {/* ── Profile Card ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <User className="w-4.5 h-4.5 text-white" style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Profile</h3>
              <p className="text-[10px] text-slate-400">Your account details</p>
            </div>
          </div>
          <div className="p-4">
            {/* Avatar + name */}
            <div className="flex items-center gap-3.5 mb-4 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100/60">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-extrabold shadow-lg shadow-blue-500/25 flex-shrink-0">
                {currentUser?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-slate-900 truncate">{currentUser?.name || 'Guest User'}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser?.email || 'Not signed in'}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {currentUser?.role === 'admin' ? (
                    <span className="flex items-center gap-1 text-[9px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      <Shield className="w-2.5 h-2.5" /> ADMIN
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                      <BadgeCheck className="w-2.5 h-2.5" /> VERIFIED
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    <Heart className="w-2.5 h-2.5" /> MedAI Member
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
            </div>

            {/* Quick info rows */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-1">
                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-[11px] text-slate-400 w-14">Email</span>
                <span className="text-[11px] font-semibold text-slate-700 flex-1 truncate">{currentUser?.email || '—'}</span>
              </div>
              <div className="flex items-center gap-3 px-1">
                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-[11px] text-slate-400 w-14">Phone</span>
                <AnimatePresence mode="wait">
                  {editingPhone ? (
                    <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 flex-1">
                      <input
                        autoFocus
                        type="tel"
                        value={phoneVal}
                        onChange={e => setPhoneVal(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit number"
                        className="flex-1 text-[11px] px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <motion.button whileTap={{ scale: 0.95 }} onClick={savePhone}
                        className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                        <Save className="w-3 h-3" />
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 flex-1">
                      <span className="text-[11px] font-semibold text-slate-700 flex-1">{phoneVal || 'Not set'}</span>
                      <motion.button whileTap={{ scale: 0.93 }} onClick={() => setEditingPhone(true)}
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                        <Edit3 className="w-3 h-3" />
                      </motion.button>
                      <AnimatePresence>
                        {phoneSaved && (
                          <motion.span key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">
                            Saved ✓
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── OpenAI API Key ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden"
        >
          <div className="h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Key style={{ width: '18px', height: '18px' }} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                OpenAI API Key
                <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> Required
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">Powers all AI features in MedAI</p>
            </div>
            <AnimatePresence mode="wait">
              {keyStatus === 'valid' && (
                <motion.div key="v" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Active
                </motion.div>
              )}
              {keyStatus === 'invalid' && (
                <motion.div key="i" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  <XCircle className="w-3 h-3" /> Invalid
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              Paste your OpenAI API key to enable AI Doctor, report analysis, and all AI features.{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer"
                className="text-blue-600 underline underline-offset-2 font-medium inline-flex items-center gap-0.5">
                Get a key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => { setApiKeyState(e.target.value); setKeyStatus('idle') }}
                  placeholder="sk-proj-…"
                  className="w-full pl-9 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono transition-all"
                />
              </div>
              <motion.button
                onClick={handleSaveKey}
                disabled={!apiKey.trim() || keyStatus === 'validating'}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-3 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 disabled:opacity-40 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20 flex-shrink-0"
              >
                {keyStatus === 'validating' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                {keyStatus === 'validating' ? 'Checking…' : 'Save'}
              </motion.button>
            </div>
            <AnimatePresence mode="wait">
              {keyStatus === 'valid' && (
                <motion.div key="v" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3.5 py-2.5 rounded-xl">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">API key saved — all AI features are active!</p>
                </motion.div>
              )}
              {keyStatus === 'invalid' && (
                <motion.div key="i" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-100 px-3.5 py-2.5 rounded-xl">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-700 font-medium">Invalid key. Please check and try again.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Backend Status ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${
              backendOnline ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20'
              : backendOnline === false ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/20'
              : 'bg-slate-300'}`}>
              <Server style={{ width: '18px', height: '18px' }} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-800">Backend Status</h3>
              <p className="text-[10px] text-slate-400">FastAPI + LangChain + LangGraph</p>
            </div>
            <div className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full ${
              backendOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              : backendOnline === false ? 'bg-red-50 text-red-600 border border-red-100'
              : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : backendOnline === false ? 'bg-red-500' : 'bg-slate-300 animate-pulse'}`} />
              {backendOnline ? 'Online' : backendOnline === false ? 'Offline' : 'Checking…'}
            </div>
          </div>
          <div className="p-4">
            {backendOnline ? (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3.5">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" style={{ width: '18px', height: '18px' }} />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">All systems operational</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">Backend is running and ready</p>
                </div>
                <div className="ml-auto flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }} />
                  ))}
                </div>
              </div>
            ) : backendOnline === false ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-3.5">
                  <XCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" style={{ width: '18px', height: '18px' }} />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Backend offline</p>
                    <p className="text-[11px] text-red-600 mt-0.5">Start the server to enable AI features</p>
                  </div>
                </div>
                <code className="block text-xs bg-slate-900 text-emerald-400 p-3.5 rounded-xl font-mono border border-slate-700">
                  cd server && python main.py
                </code>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 text-slate-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p className="text-sm">Checking backend connection…</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Notifications ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 flex-shrink-0">
              <Bell style={{ width: '18px', height: '18px' }} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
              <p className="text-[10px] text-slate-400">Control what alerts you receive</p>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              { label: 'AI Consultation Alerts', desc: 'When AI responses are ready', color: 'from-blue-500 to-indigo-500' },
              { label: 'Report Analysis Ready', desc: 'When report analysis completes', color: 'from-violet-500 to-purple-500' },
              { label: 'Appointment Reminders', desc: 'For upcoming lab tests', color: 'from-teal-500 to-cyan-500' },
              { label: 'Health Tips', desc: 'Daily AI health tips', color: 'from-amber-500 to-orange-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                <ToggleSwitch on={!!toggles[item.label]} onToggle={() => handleToggle(item.label)} color={item.color} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Privacy & Security ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 flex-shrink-0">
              <Shield style={{ width: '18px', height: '18px' }} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Privacy & Security</h3>
              <p className="text-[10px] text-slate-400">Manage your data and account security</p>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              { label: 'Two-Factor Authentication', desc: 'Extra layer of account security', color: 'from-emerald-500 to-teal-500' },
              { label: 'Share Data with Doctors', desc: 'Allow doctors to view your reports', color: 'from-blue-500 to-indigo-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                <ToggleSwitch on={!!toggles[item.label]} onToggle={() => handleToggle(item.label)} color={item.color} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── About ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
              <Sparkles style={{ width: '18px', height: '18px' }} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">MedAI Platform</p>
              <p className="text-[10px] text-slate-400">GPT-4o · LangChain · LangGraph · FastAPI</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-extrabold text-slate-600">v2.0</p>
              <p className="text-[10px] text-slate-400">Production</p>
            </div>
          </div>
        </motion.div>

        {/* ── Danger Zone ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden"
        >
          <div className="h-0.5 bg-gradient-to-r from-red-500 to-rose-500" />
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-red-50">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md shadow-red-500/20 flex-shrink-0">
              <LogOut style={{ width: '18px', height: '18px' }} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-800">Danger Zone</h3>
              <p className="text-[10px] text-red-400">Irreversible actions</p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-800 font-semibold">Clear API Key</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Remove saved OpenAI API key from local storage</p>
              </div>
              <motion.button
                onClick={() => { setApiKey(''); setApiKeyState(''); setKeyStatus('idle') }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 px-4 py-2.5 text-xs font-bold text-red-600 border-2 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Clear
              </motion.button>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-red-50">
              <div>
                <p className="text-sm text-slate-800 font-semibold">Sign Out</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Log out of your MedAI account</p>
              </div>
              <motion.button
                onClick={() => {
                  localStorage.removeItem('medai_user')
                  window.location.href = '/login'
                }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-xl shadow-md shadow-red-500/20 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ── App Info Footer ───────────────────────────── */}
        <div className="text-center py-4 space-y-1">
          <p className="text-[10px] text-slate-400 font-medium">MedAI Platform · v2.0 Production</p>
          <p className="text-[9px] text-slate-300">© 2024 MedAI · All rights reserved</p>
        </div>

      </div>
    </div>
  )
}
