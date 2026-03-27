/**
 * OnboardingBanner.tsx
 * A beautiful first-launch welcome + feature-tour banner.
 * Shows once per device, dismissible, with smooth animations.
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, FlaskConical, Bot, FileText, Building2,
  Sparkles, ChevronRight, Check, Heart,
} from 'lucide-react'

const STORAGE_KEY = 'medai_onboarding_dismissed_v2'

const STEPS = [
  {
    icon: Heart,
    emoji: '👋',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    title: 'Welcome to MedAI!',
    desc: 'Your personal AI-powered health companion. Let\'s show you around in 3 quick steps.',
  },
  {
    icon: Bot,
    emoji: '🤖',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    title: 'AI Doctor — Ask Anything',
    desc: 'Chat with GPT-4o about symptoms, medications, lab results, or health questions — in your language.',
  },
  {
    icon: FlaskConical,
    emoji: '🧪',
    color: 'from-teal-500 to-cyan-600',
    bg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    title: 'Book Lab Tests Near You',
    desc: 'GPS-powered lab discovery. Select a test, pick a nearby lab, and we\'ll notify the admin on WhatsApp.',
  },
  {
    icon: Building2,
    emoji: '🏥',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    title: 'Hospitals & Medicines',
    desc: 'Describe symptoms and get AI-recommended hospitals and medicines with directions and buy links.',
  },
  {
    icon: FileText,
    emoji: '📊',
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    title: 'Upload & Analyse Reports',
    desc: 'Upload your medical reports (PDF or image) and get an instant AI-powered analysis and explanation.',
  },
]

export default function OnboardingBanner() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (!dismissed) {
      // Small delay so it feels intentional
      const t = setTimeout(() => setVisible(true), 900)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = () => {
    setExiting(true)
    localStorage.setItem(STORAGE_KEY, '1')
    setTimeout(() => setVisible(false), 350)
  }

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      dismiss()
    }
  }

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: exiting ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0.8 }}
            animate={{ y: exiting ? '100%' : 0, opacity: exiting ? 0 : 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className="fixed bottom-0 left-0 right-0 z-[61] bg-white rounded-t-[2.5rem] shadow-2xl overflow-hidden max-h-[80dvh]"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Gradient top bar */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${current.color}`} />

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            <div className="px-6 pt-3 pb-5">
              {/* Close */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex gap-1.5">
                  {STEPS.map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ width: i === step ? 20 : 6, opacity: i === step ? 1 : 0.3 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      className={`h-1.5 rounded-full bg-gradient-to-r ${current.color}`}
                    />
                  ))}
                </div>
                <button
                  onClick={dismiss}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.97 }}
                  transition={{ duration: 0.22, type: 'spring', stiffness: 320, damping: 28 }}
                  className="text-center"
                >
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                    className={`w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br ${current.color} flex items-center justify-center shadow-2xl`}
                    style={{ boxShadow: `0 16px 48px -8px rgba(0,0,0,0.2)` }}
                  >
                    <Icon className="w-9 h-9 text-white" />
                  </motion.div>

                  {/* Emoji badge */}
                  <div className="text-3xl mb-3">{current.emoji}</div>

                  <h2 className="text-xl font-extrabold text-slate-900 mb-2 leading-tight">{current.title}</h2>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{current.desc}</p>
                </motion.div>
              </AnimatePresence>

              {/* Step features (only on first step) */}
              {step === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="mt-5 grid grid-cols-2 gap-2"
                >
                  {[
                    { emoji: '🤖', text: 'GPT-4o AI Doctor' },
                    { emoji: '🧪', text: 'GPS Lab Booking' },
                    { emoji: '🏥', text: 'Hospital Finder' },
                    { emoji: '💊', text: 'Medicine AI' },
                  ].map(f => (
                    <div key={f.text} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                      <span className="text-base">{f.emoji}</span>
                      <span className="text-xs font-semibold text-slate-700">{f.text}</span>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Buttons */}
              <div className="mt-6 flex gap-2.5">
                {step > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setStep(s => s - 1)}
                    className="flex-shrink-0 px-5 py-3.5 rounded-2xl bg-slate-100 text-slate-600 text-sm font-bold"
                  >
                    Back
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={next}
                  className={`flex-1 py-3.5 rounded-2xl text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg bg-gradient-to-r ${current.color}`}
                >
                  {isLast ? (
                    <><Check className="w-4 h-4" /> Get Started</>
                  ) : (
                    <>Next <ChevronRight className="w-4 h-4" /></>
                  )}
                </motion.button>
              </div>

              {step === 0 && (
                <button onClick={dismiss} className="w-full mt-3 text-[11px] text-slate-400 font-medium">
                  Skip tour
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
