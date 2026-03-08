import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Shield, Key, CheckCircle, XCircle, Loader2, LogOut, Server } from 'lucide-react'
import { validateApiKey, setApiKey, getStoredApiKey, checkBackendHealth, getUserPreferences, saveUserPreferences } from '../lib/api'
import { getStoredUser } from '../lib/auth'

// Default toggle values — used when user has no saved prefs
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
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const currentUser = getStoredUser()

  useEffect(() => {
    checkBackendHealth().then(setBackendOnline)
    if (getStoredApiKey()) setKeyStatus('valid')
    // Load saved preferences
    getUserPreferences()
      .then((saved) => {
        if (saved && Object.keys(saved).length > 0) {
          setToggles((prev) => ({ ...prev, ...saved }))
        }
      })
      .catch(() => {})
      .finally(() => setPrefsLoaded(true))
  }, [])

  const handleToggle = (label: string) => {
    setToggles((prev) => {
      const updated = { ...prev, [label]: !prev[label] }
      // Persist to backend (fire-and-forget)
      saveUserPreferences(updated).catch(() => {})
      return updated
    })
  }

  useEffect(() => {
    checkBackendHealth().then(setBackendOnline)
    if (getStoredApiKey()) setKeyStatus('valid')
  }, [])

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return
    setKeyStatus('validating')
    try {
      const res = await validateApiKey(apiKey.trim())
      if (res.valid) {
        setApiKey(apiKey.trim())
        setKeyStatus('valid')
      } else {
        setKeyStatus('invalid')
      }
    } catch {
      setKeyStatus('invalid')
    }
  }

  const settingsSections = [
    {
      title: 'Profile',
      icon: User,
      items: [
        { label: 'Full Name', value: currentUser?.name || 'Not logged in', type: 'text' as const },
        { label: 'Email', value: currentUser?.email || 'Not logged in', type: 'text' as const },
        { label: 'Role', value: currentUser?.role === 'admin' ? 'Administrator' : 'User', type: 'text' as const },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'AI Consultation Alerts', type: 'toggle' as const },
        { label: 'Report Analysis Ready', type: 'toggle' as const },
        { label: 'Appointment Reminders', type: 'toggle' as const },
        { label: 'Health Tips', type: 'toggle' as const },
      ],
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      items: [
        { label: 'Two-Factor Authentication', type: 'toggle' as const },
        { label: 'Share Data with Doctors', type: 'toggle' as const },
      ],
    },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* API Key Section — MOST IMPORTANT */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border-2 border-blue-200 overflow-hidden"
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-blue-100 bg-blue-50">
          <Key className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">OpenAI API Key</h3>
          {keyStatus === 'valid' && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />}
          {keyStatus === 'invalid' && <XCircle className="w-4 h-4 text-red-500 ml-auto" />}
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Paste your OpenAI API key to enable AI Doctor, report analysis, and all AI features.
            Get a key from{' '}
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-600 underline">
              platform.openai.com/api-keys
            </a>
          </p>
          <div className="flex gap-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKeyState(e.target.value); setKeyStatus('idle') }}
              placeholder="sk-proj-..."
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono transition-all"
            />
            <button
              onClick={handleSaveKey}
              disabled={!apiKey.trim() || keyStatus === 'validating'}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg flex items-center gap-2 transition-colors"
            >
              {keyStatus === 'validating' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {keyStatus === 'validating' ? 'Validating...' : 'Save & Validate'}
            </button>
          </div>
          {keyStatus === 'valid' && (
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> API key is valid and saved. AI features are active!
            </p>
          )}
          {keyStatus === 'invalid' && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Invalid API key. Please check and try again.
            </p>
          )}
        </div>
      </motion.div>

      {/* Backend Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <Server className="w-5 h-5 text-slate-400" />
          <h3 className="font-semibold text-slate-900">Backend Status</h3>
          <span className={`ml-auto w-2.5 h-2.5 rounded-full ${backendOnline ? 'bg-emerald-500' : backendOnline === false ? 'bg-red-500' : 'bg-slate-300'}`} />
        </div>
        <div className="p-6">
          {backendOnline ? (
            <p className="text-sm text-emerald-600">✅ Backend is online (FastAPI + LangChain + LangGraph + RAG)</p>
          ) : backendOnline === false ? (
            <div className="space-y-2">
              <p className="text-sm text-red-600">❌ Backend is offline</p>
              <p className="text-xs text-slate-500">Start it with:</p>
              <code className="block text-xs bg-slate-100 p-3 rounded-lg text-slate-700">
                cd server && pip install -r requirements.txt && python main.py
              </code>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Checking...</p>
          )}
        </div>
      </motion.div>

      {/* Standard Settings Sections */}
      {settingsSections.map((section, si) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + si * 0.05 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <section.icon className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-slate-900">{section.title}</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {section.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-slate-700">{item.label}</span>
                {item.type === 'toggle' ? (
                  <button
                    onClick={() => handleToggle(item.label)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${toggles[item.label] ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${toggles[item.label] ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                ) : (
                  <span className="text-sm text-slate-500">{String((item as any).value)}</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-red-200 overflow-hidden"
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-red-100">
          <LogOut className="w-5 h-5 text-red-400" />
          <h3 className="font-semibold text-red-700">Danger Zone</h3>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-700">Delete API Key</p>
            <p className="text-xs text-slate-400">Remove your saved OpenAI API key</p>
          </div>
          <button
            onClick={() => { setApiKey(''); setApiKeyState(''); setKeyStatus('idle') }}
            className="px-4 py-2 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
          >
            Clear Key
          </button>
        </div>
      </motion.div>
    </div>
  )
}
