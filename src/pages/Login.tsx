import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Mail, Lock, User, Loader2, AlertCircle, ArrowRight,
  Sparkles, Brain, Shield, Zap, Bot, Check,
} from 'lucide-react'
import { signup, login, googleSignIn, type GoogleAuthResult } from '../lib/auth'

// Extend Window to include Google's GSI API
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: Record<string, unknown>) => void
          renderButton: (el: HTMLElement, cfg: Record<string, unknown>) => void
          prompt: () => void
        }
      }
    }
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

interface Props {
  onAuth: () => void
}

// ── Floating background orb ──────────────────────────────────────────────────
function FloatingOrb({ delay, size, color, x, y }: {
  delay: number; size: number; color: string; x: string; y: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: [0.1, 0.3, 0.1], scale: [0.8, 1.2, 0.8], y: [0, -20, 0] }}
      transition={{ duration: 6, repeat: Infinity, delay, ease: 'easeInOut' }}
      className="absolute rounded-full blur-3xl pointer-events-none"
      style={{ width: size, height: size, background: color, left: x, top: y }}
    />
  )
}

// ── Username prompt modal (shown when Google sign-in creates a new account) ──
function UsernameModal({
  email,
  suggestedName,
  onConfirm,
  onCancel,
}: {
  email: string
  suggestedName: string
  onConfirm: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(suggestedName)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    onConfirm(name.trim())
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <User className="w-7 h-7 text-white" />
        </div>

        <h2 className="text-xl font-bold text-slate-800 text-center mb-1">What should we call you?</h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          Signing in as <span className="font-medium text-slate-700">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Your Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Jane Smith"
                autoFocus
                required
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={!name.trim() || loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/25"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <><Check className="w-4 h-4" /> Continue to MedAI</>
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ── Main Login Component ─────────────────────────────────────────────────────
export default function Login({ onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [googleMsg, setGoogleMsg] = useState('')

  // Google username prompt state
  const [usernamePrompt, setUsernamePrompt] = useState<{
    email: string; suggestedName: string
  } | null>(null)
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null)

  const googleBtnRef = useRef<HTMLDivElement>(null)

  // ── Google ID token callback ────────────────────────────────────────────
  const handleGoogleCredential = useCallback(async (response: { credential: string }) => {
    const idToken = response.credential
    setGoogleLoading(true)
    setError('')
    try {
      const result: GoogleAuthResult = await googleSignIn(idToken)
      if (result.needs_username) {
        // New user — ask for their preferred name
        setPendingGoogleToken(idToken)
        setUsernamePrompt({ email: result.email!, suggestedName: result.suggested_name || '' })
      } else {
        onAuth()
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.')
    } finally {
      setGoogleLoading(false)
    }
  }, [onAuth])

  // ── Render Google button once GSI is loaded ─────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    const renderBtn = () => {
      if (!window.google || !googleBtnRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      })
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: googleBtnRef.current.offsetWidth || 360,
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'left',
      })
    }

    // If GSI is already loaded
    if (window.google) {
      renderBtn()
    } else {
      // Wait for the script to load
      const interval = setInterval(() => {
        if (window.google) { clearInterval(interval); renderBtn() }
      }, 200)
      return () => clearInterval(interval)
    }
  }, [handleGoogleCredential])

  // ── Custom Google button click (when no GSI Client ID is configured) ──
  const handleGoogleClick = useCallback(() => {
    if (GOOGLE_CLIENT_ID) {
      window.google?.accounts.id.prompt()
      return
    }
    // Show a small inline hint under the button — NOT the red error banner
    setGoogleMsg('Google Sign-In coming soon! Use your email & password below for now.')
    setTimeout(() => setGoogleMsg(''), 4000)
  }, [])

  // ── Username prompt confirmation ────────────────────────────────────────
  const handleUsernameConfirm = async (chosenName: string) => {
    if (!pendingGoogleToken) return
    setGoogleLoading(true)
    try {
      const result = await googleSignIn(pendingGoogleToken, chosenName)
      if (!result.needs_username) {
        setUsernamePrompt(null)
        setPendingGoogleToken(null)
        onAuth()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set username.')
      setUsernamePrompt(null)
    } finally {
      setGoogleLoading(false)
    }
  }

  // ── Email/password form submit ──────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        if (!name.trim()) { setError('Please enter your name.'); setLoading(false); return }
        await signup(email.trim(), name.trim(), password)
      } else {
        await login(email.trim(), password)
      }
      onAuth()
    } catch (err: any) {
      const msg: string = err.message || 'Authentication failed.'
      // If user tried to Sign In but account doesn't exist → auto-switch to signup
      if (mode === 'login' && (msg.toLowerCase().includes('invalid email') || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no account'))) {
        setMode('signup')
        setError('No account found with this email. Please fill in your name and create one!')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Username prompt modal (Google new-user flow) */}
      <AnimatePresence>
        {usernamePrompt && (
          <UsernameModal
            email={usernamePrompt.email}
            suggestedName={usernamePrompt.suggestedName}
            onConfirm={handleUsernameConfirm}
            onCancel={() => { setUsernamePrompt(null); setPendingGoogleToken(null) }}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background orbs */}
        <FloatingOrb delay={0} size={500} color="rgba(16,185,129,0.06)" x="5%" y="15%" />
        <FloatingOrb delay={2} size={450} color="rgba(59,130,246,0.06)" x="55%" y="55%" />
        <FloatingOrb delay={4} size={350} color="rgba(139,92,246,0.05)" x="75%" y="5%" />
        <FloatingOrb delay={1} size={300} color="rgba(6,182,212,0.04)" x="15%" y="65%" />

        {/* Grid overlay */}
        <div className="absolute inset-0 dot-pattern opacity-[0.03] pointer-events-none" />

        {/* Animated top line */}
        <motion.div
          className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 6, repeat: Infinity }}
          style={{ backgroundSize: '200% 200%' }}
        />

        <div className="flex w-full max-w-4xl relative z-10">
          {/* ── Left branding panel (desktop) ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:flex flex-col justify-center flex-1 pr-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30"
            >
              <Heart className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Med<span className="text-gradient">AI</span>
            </h1>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              AI-Powered Healthcare Intelligence Platform
            </p>
            <div className="space-y-4">
              {[
                { icon: Bot, label: 'GPT-4o AI Doctor', desc: 'Real-time medical consultations' },
                { icon: Brain, label: 'RAG-Powered Analysis', desc: 'Upload & analyze medical reports' },
                { icon: Shield, label: 'Secure & Private', desc: 'Your data stays protected' },
                { icon: Zap, label: 'LangChain + LangGraph', desc: 'Multi-agent AI architecture' },
              ].map((feat, i) => (
                <motion.div
                  key={feat.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <feat.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{feat.label}</p>
                    <p className="text-xs text-slate-500">{feat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Right auth card ── */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Mobile logo */}
            <div className="text-center mb-6 lg:hidden">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25"
              >
                <Heart className="w-7 h-7 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white">
                Med<span className="text-gradient">AI</span>
              </h1>
            </div>

            {/* Card */}
            <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl shadow-black/20 overflow-hidden relative">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-400/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-400/5 rounded-full blur-3xl" />

              {/* Tab switcher */}
              <div className="flex border-b border-slate-100/80 bg-gradient-to-r from-slate-50/50 to-white/50">
                {(['login', 'signup'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setMode(tab); setError('') }}
                    className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                      mode === tab ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab === 'login' ? '👋 Sign In' : '🆕 Create Account'}
                    {mode === tab && (
                      <motion.div layoutId="authTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6 space-y-4">
                {/* ── Google Sign-In ── */}
                <div className="space-y-3">
                  {GOOGLE_CLIENT_ID ? (
                    /* Native Google-rendered button (when Client ID is configured) */
                    <div ref={googleBtnRef} className="w-full flex justify-center" />
                  ) : (
                    /* Custom Google button — always visible and clickable */
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.01, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGoogleClick}
                      disabled={googleLoading}
                      className="w-full py-3 flex items-center justify-center gap-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-all shadow-sm disabled:opacity-60"
                    >
                      {googleLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                        </svg>
                      )}
                      {googleLoading ? 'Signing in with Google…' : 'Continue with Google'}
                    </motion.button>
                  )}

                  {/* Friendly inline hint — only shows briefly when Google btn is clicked without Client ID */}
                  <AnimatePresence>
                    {googleMsg && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[11px] text-center text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"
                      >
                        {googleMsg}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {googleLoading && GOOGLE_CLIENT_ID && (
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Signing in with Google…
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs font-medium text-slate-400">or continue with email</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                </div>

                {/* ── Email/password form ── */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence mode="wait">
                    {mode === 'signup' && (
                      <motion.div
                        key="name-field"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Dr. Jane Smith"
                            className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-100"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-xl shadow-emerald-500/25 relative overflow-hidden"
                  >
                    {/* Shimmer effect */}
                    {!loading && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{ x: ['-200%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>

                  {mode === 'login' && (
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => { setMode('signup'); setError('') }}
                        className="w-full py-2.5 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 transition-all text-[13px] font-semibold text-emerald-700"
                      >
                        🆕 New here? Create a free account →
                      </button>
                      <p className="text-[11px] text-slate-400 mt-2">
                        First time? You must create an account before signing in
                      </p>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Bottom feature chips */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: Sparkles, label: 'GPT-4o Chat', color: 'text-blue-400' },
                { icon: Heart, label: 'Health AI', color: 'text-emerald-400' },
                { icon: Lock, label: 'Secure Auth', color: 'text-purple-400' },
              ].map((feat, i) => (
                <motion.div
                  key={feat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10"
                >
                  <feat.icon className={`w-4 h-4 ${feat.color} mx-auto mb-1`} />
                  <p className="text-[10px] font-medium text-slate-400">{feat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
