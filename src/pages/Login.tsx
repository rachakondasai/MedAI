import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Mail, Lock, User, Loader2, AlertCircle, ArrowRight, Sparkles, Brain, Shield, Zap, Bot } from 'lucide-react'
import { signup, login } from '../lib/auth'

interface Props {
  onAuth: () => void
}

// Animated floating particle
function FloatingOrb({ delay, size, color, x, y }: { delay: number; size: number; color: string; x: string; y: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: [0.1, 0.3, 0.1],
        scale: [0.8, 1.2, 0.8],
        y: [0, -20, 0],
      }}
      transition={{ duration: 6, repeat: Infinity, delay, ease: 'easeInOut' }}
      className="absolute rounded-full blur-3xl pointer-events-none"
      style={{ width: size, height: size, background: color, left: x, top: y }}
    />
  )
}

export default function Login({ onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please enter your name.')
          setLoading(false)
          return
        }
        await signup(email.trim(), name.trim(), password)
      } else {
        await login(email.trim(), password)
      }
      onAuth()
    } catch (err: any) {
      setError(err.message || 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <FloatingOrb delay={0} size={500} color="rgba(16, 185, 129, 0.06)" x="5%" y="15%" />
      <FloatingOrb delay={2} size={450} color="rgba(59, 130, 246, 0.06)" x="55%" y="55%" />
      <FloatingOrb delay={4} size={350} color="rgba(139, 92, 246, 0.05)" x="75%" y="5%" />
      <FloatingOrb delay={1} size={300} color="rgba(6, 182, 212, 0.04)" x="15%" y="65%" />
      <FloatingOrb delay={3} size={200} color="rgba(244, 63, 94, 0.03)" x="90%" y="40%" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 dot-pattern opacity-[0.03] pointer-events-none" />
      
      {/* Animated gradient line */}
      <motion.div
        className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 6, repeat: Infinity }}
        style={{ backgroundSize: '200% 200%' }}
      />

      <div className="flex w-full max-w-4xl relative z-10">
        {/* Left Panel — Branding */}
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

        {/* Right Panel — Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
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
            {/* Ambient glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-400/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-400/5 rounded-full blur-3xl" />
            
            {/* Tab Switcher */}
            <div className="flex border-b border-slate-100/80 bg-gradient-to-r from-slate-50/50 to-white/50">
              {(['login', 'signup'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setMode(tab); setError('') }}
                  className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                    mode === tab ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab === 'login' ? 'Sign In' : 'Create Account'}
                  {mode === tab && (
                    <motion.div layoutId="authTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
                  )}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError('') }}
                    className="text-[12px] text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    Don't have an account?{' '}
                    <span className="font-semibold text-emerald-600 underline underline-offset-2">Sign up free</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Bottom Features */}
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
  )
}
