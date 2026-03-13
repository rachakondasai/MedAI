import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Bell, Shield, Key, CheckCircle, XCircle, Loader2, LogOut, Server,
  Palette, Zap, ExternalLink, Sparkles, Crown, Settings2, Globe, Lock,
  ChevronRight, Activity,
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

export default function Settings() {
  const [apiKey, setApiKeyState] = useState(getStoredApiKey())
  const [keyStatus, setKeyStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle')
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [toggles, setToggles] = useState<Record<string, boolean>>(DEFAULT_PREFS)
  const currentUser = getStoredUser()

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

  const settingsSections = [
    {
      title: 'Profile', icon: User, gradient: 'from-blue-500 to-indigo-600',
      desc: 'Your account information',
      items: [
        { label: 'Full Name', value: currentUser?.name || 'Not logged in', type: 'text' as const, desc: '' },
        { label: 'Email', value: currentUser?.email || 'Not logged in', type: 'text' as const, desc: '' },
        { label: 'Role', value: currentUser?.role === 'admin' ? 'Administrator' : 'User', type: 'text' as const, desc: '' },
      ],
    },
    {
      title: 'Notifications', icon: Bell, gradient: 'from-amber-500 to-orange-500',
      desc: 'Control what alerts you receive',
      items: [
        { label: 'AI Consultation Alerts', desc: 'Get notified when AI responses are ready', type: 'toggle' as const },
        { label: 'Report Analysis Ready', desc: 'Notify when report analysis completes', type: 'toggle' as const },
        { label: 'Appointment Reminders', desc: 'Reminders for upcoming appointments', type: 'toggle' as const },
        { label: 'Health Tips', desc: 'Daily AI-powered health tips', type: 'toggle' as const },
      ],
    },
    {
      title: 'Privacy & Security', icon: Shield, gradient: 'from-emerald-500 to-teal-600',
      desc: 'Manage your data and security',
      items: [
        { label: 'Two-Factor Authentication', desc: 'Add extra layer of security', type: 'toggle' as const },
        { label: 'Share Data with Doctors', desc: 'Allow doctors to view your reports', type: 'toggle' as const },
      ],
    },
  ]

  return (
    <div className="h-full overflow-y-auto">
      {/* Ambient mesh background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-100/40 via-indigo-50/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-violet-100/30 via-purple-50/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-emerald-50/20 via-cyan-50/10 to-blue-50/20 rounded-full blur-3xl" />
      </div>

      <div className="p-6 max-w-3xl mx-auto space-y-6 pb-12">
        {/* Premium Page Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 rounded-3xl p-6 overflow-hidden shadow-2xl shadow-slate-900/30">
            {/* Animated background effects */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute w-72 h-72 rounded-full bg-blue-500/10 blur-3xl"
                animate={{ x: [-20, 20, -20], y: [-15, 15, -15] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                style={{ top: '-20%', right: '-5%' }}
              />
              <motion.div
                className="absolute w-48 h-48 rounded-full bg-violet-500/10 blur-3xl"
                animate={{ x: [15, -15, 15], y: [10, -10, 10] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                style={{ bottom: '-15%', left: '10%' }}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(99,102,241,0.08),transparent_50%)]" />
            </div>

            <div className="relative z-10 flex items-center gap-4">
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/15 shadow-lg"
              >
                <Settings2 className="w-7 h-7 text-white" />
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">Settings</h2>
                  <span className="flex items-center gap-1 bg-white/10 backdrop-blur-sm text-[10px] font-bold text-white/70 px-2 py-0.5 rounded-full border border-white/10">
                    <Crown className="w-3 h-3 text-amber-400" /> Pro
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-0.5">Manage your account, API keys, and preferences</p>
              </div>
              <div className="flex items-center gap-2">
                {keyStatus === 'valid' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1.5 bg-emerald-500/15 backdrop-blur-sm text-emerald-300 text-[11px] font-bold px-3 py-1.5 rounded-full border border-emerald-500/20"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    AI Active
                  </motion.div>
                )}
                {backendOnline && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-1.5 bg-blue-500/15 backdrop-blur-sm text-blue-300 text-[11px] font-bold px-3 py-1.5 rounded-full border border-blue-500/20"
                  >
                    <Activity className="w-3 h-3" />
                    Online
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* API Key Section — Premium Glass Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl border border-blue-200/60 overflow-hidden shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 group">
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

            <div className="flex items-center gap-3 px-6 py-4 border-b border-blue-100/60">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
              >
                <Key className="w-5 h-5 text-white" />
              </motion.div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  OpenAI API Key
                  <span className="flex items-center gap-1 text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" /> Required
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Powers all AI features in MedAI</p>
              </div>
              <AnimatePresence mode="wait">
                {keyStatus === 'valid' && (
                  <motion.span
                    key="valid"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Active
                  </motion.span>
                )}
                {keyStatus === 'invalid' && (
                  <motion.span
                    key="invalid"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-1.5 bg-red-100 text-red-700 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Invalid
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Paste your OpenAI API key to enable all AI features including chat, report analysis, and medical recommendations.{' '}
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 underline underline-offset-2 inline-flex items-center gap-0.5 font-medium transition-colors">
                  Get a key <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => { setApiKeyState(e.target.value); setKeyStatus('idle') }}
                    placeholder="sk-proj-..."
                    className="w-full pl-10 pr-4 py-3.5 text-sm bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white font-mono transition-all duration-300 placeholder:text-slate-300"
                  />
                </div>
                <motion.button
                  onClick={handleSaveKey}
                  disabled={!apiKey.trim() || keyStatus === 'validating'}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg shadow-blue-500/25 disabled:shadow-none relative overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-700" />
                  {keyStatus === 'validating' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {keyStatus === 'validating' ? 'Validating...' : 'Save & Validate'}
                </motion.button>
              </div>
              <AnimatePresence mode="wait">
                {keyStatus === 'valid' && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 px-4 py-3 rounded-xl"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <p className="text-xs text-emerald-700 font-medium">API key is valid — all AI features are now active!</p>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
                  </motion.div>
                )}
                {keyStatus === 'invalid' && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 bg-red-50/80 backdrop-blur-sm border border-red-200/60 px-4 py-3 rounded-xl"
                  >
                    <XCircle className="w-4 h-4 text-red-500" />
                    <p className="text-xs text-red-700 font-medium">Invalid API key. Please check and try again.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Backend Status — Premium Glass Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 overflow-hidden shadow-lg shadow-slate-500/5 hover:shadow-xl transition-all duration-500">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100/60">
              <motion.div
                animate={backendOnline ? { boxShadow: ['0 0 0 0 rgba(16,185,129,0)', '0 0 0 8px rgba(16,185,129,0.15)', '0 0 0 0 rgba(16,185,129,0)'] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-10 h-10 rounded-xl ${backendOnline ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : backendOnline === false ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-slate-300'} flex items-center justify-center shadow-lg`}
              >
                <Server className="w-5 h-5 text-white" />
              </motion.div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-sm">Backend Status</h3>
                <p className="text-[11px] text-slate-400">FastAPI + LangChain + LangGraph</p>
              </div>
              <div className={`flex items-center gap-2 text-[11px] font-bold px-3 py-1.5 rounded-full ${
                backendOnline ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60' :
                backendOnline === false ? 'bg-red-50 text-red-600 ring-1 ring-red-200/60' :
                'bg-slate-100 text-slate-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : backendOnline === false ? 'bg-red-500' : 'bg-slate-300 animate-pulse'}`} />
                {backendOnline ? 'Online' : backendOnline === false ? 'Offline' : 'Checking…'}
              </div>
            </div>
            <div className="p-6">
              {backendOnline ? (
                <div className="flex items-center gap-3 bg-emerald-50/60 backdrop-blur-sm border border-emerald-200/50 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">All systems operational</p>
                    <p className="text-[11px] text-emerald-600">Backend is online and ready to serve requests</p>
                  </div>
                  <div className="ml-auto flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                      />
                    ))}
                  </div>
                </div>
              ) : backendOnline === false ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-red-50/60 backdrop-blur-sm border border-red-200/50 rounded-xl p-4">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-800">Backend is offline</p>
                      <p className="text-[11px] text-red-600">Start the server to enable AI features</p>
                    </div>
                  </div>
                  <code className="block text-xs bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono border border-slate-700">
                    cd server && pip install -r requirements.txt && python main.py
                  </code>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <p className="text-sm">Checking backend connection...</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Settings Sections — Premium Glass Cards */}
        {settingsSections.map((section, si) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + si * 0.06 }}
          >
            <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 overflow-hidden shadow-lg shadow-slate-500/5 hover:shadow-xl transition-all duration-500 group">
              {/* Gradient accent on top */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${section.gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100/60">
                <motion.div
                  whileHover={{ rotate: [0, -8, 8, 0] }}
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-lg`}
                >
                  <section.icon className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{section.title}</h3>
                  <p className="text-[11px] text-slate-400">{section.desc}</p>
                </div>
              </div>
              <div className="divide-y divide-slate-100/60">
                {section.items.map((item, ii) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + si * 0.06 + ii * 0.03 }}
                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/40 transition-all duration-300 group/item"
                  >
                    <div className="flex-1">
                      <span className="text-sm text-slate-700 font-semibold group-hover/item:text-slate-900 transition-colors">{item.label}</span>
                      {item.desc && <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>}
                    </div>
                    {item.type === 'toggle' ? (
                      <motion.button
                        onClick={() => handleToggle(item.label)}
                        whileTap={{ scale: 0.9 }}
                        className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                          toggles[item.label]
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25'
                            : 'bg-slate-200 hover:bg-slate-300'
                        }`}
                      >
                        <motion.span
                          className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center"
                          animate={{ left: toggles[item.label] ? 22 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        >
                          {toggles[item.label] && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2.5 h-2.5 rounded-full bg-emerald-500"
                            />
                          )}
                        </motion.span>
                      </motion.button>
                    ) : (
                      <span className="text-sm text-slate-600 font-medium bg-slate-50/80 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-slate-200/60">
                        {String((item as any).value)}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Danger Zone — Premium */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl border border-red-200/60 overflow-hidden shadow-lg hover:shadow-xl hover:shadow-red-500/5 transition-all duration-500">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-rose-500" />
            <div className="flex items-center gap-3 px-6 py-4 border-b border-red-100/60">
              <motion.div
                whileHover={{ rotate: [0, -8, 8, 0] }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30"
              >
                <LogOut className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h3 className="font-bold text-red-800 text-sm">Danger Zone</h3>
                <p className="text-[11px] text-red-400">Irreversible actions</p>
              </div>
            </div>
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700 font-semibold">Delete API Key</p>
                <p className="text-xs text-slate-400 mt-0.5">Remove your saved OpenAI API key from local storage</p>
              </div>
              <motion.button
                onClick={() => { setApiKey(''); setApiKeyState(''); setKeyStatus('idle') }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-2.5 text-xs font-bold text-red-600 border-2 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl transition-all duration-300 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Clear Key
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
