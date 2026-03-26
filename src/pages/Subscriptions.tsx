import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown,
  Zap,
  Check,
  Sparkles,
  Bot,
  FileText,
  Building2,
  Pill,
  FlaskConical,
  Brain,
  Shield,
  Star,
  ArrowRight,
  Infinity,
  Gift,
  TrendingUp,
  Lock,
  X,
  ChevronRight,
} from 'lucide-react'
import { getStoredUser } from '../lib/auth'
import { useNavigate } from 'react-router-dom'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    tagline: 'Get started with core AI health features',
    color: 'from-slate-500 to-slate-600',
    border: 'border-slate-200',
    badge: null,
    features: [
      { label: '10 AI Doctor chats/month', ok: true },
      { label: '2 report uploads/month', ok: true },
      { label: 'Hospital & medicine search', ok: true },
      { label: 'Basic health dashboard', ok: true },
      { label: 'Blood test booking', ok: false },
      { label: 'Unlimited AI chats', ok: false },
      { label: 'Priority AI processing', ok: false },
      { label: 'Family health profiles', ok: false },
      { label: 'Export health records (PDF)', ok: false },
      { label: 'Referral commission earnings', ok: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 4.99,
    period: 'month',
    tagline: 'Unlimited AI + blood test booking',
    color: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-300',
    badge: 'Most Popular',
    features: [
      { label: 'Unlimited AI Doctor chats', ok: true },
      { label: 'Unlimited report uploads', ok: true },
      { label: 'Hospital & medicine search', ok: true },
      { label: 'Advanced health dashboard', ok: true },
      { label: 'Blood test booking', ok: true },
      { label: 'Priority AI processing', ok: true },
      { label: 'Family health profiles (up to 3)', ok: true },
      { label: 'Export health records (PDF)', ok: true },
      { label: 'Referral commission earnings', ok: false },
      { label: 'White-label portal', ok: false },
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 14.99,
    period: 'month',
    tagline: 'Everything + earn commissions + API access',
    color: 'from-violet-500 to-purple-700',
    border: 'border-violet-300',
    badge: 'Best Value',
    features: [
      { label: 'Unlimited AI Doctor chats', ok: true },
      { label: 'Unlimited report uploads', ok: true },
      { label: 'Hospital & medicine search', ok: true },
      { label: 'Advanced health dashboard', ok: true },
      { label: 'Blood test booking (priority)', ok: true },
      { label: 'Priority AI processing', ok: true },
      { label: 'Family health profiles (up to 10)', ok: true },
      { label: 'Export health records (PDF)', ok: true },
      { label: 'Referral commission earnings', ok: true },
      { label: 'White-label portal', ok: true },
    ],
  },
]

const HIGHLIGHTS = [
  { icon: Bot, title: 'Unlimited AI Doctor', desc: 'Chat with GPT-4o as much as you need — no daily limits, no throttling.', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: FlaskConical, title: 'Blood Test Booking', desc: 'Book diagnostic tests online. We assign a certified lab partner near you.', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { icon: TrendingUp, title: 'Referral Commissions', desc: 'Earn 15% on every blood test you refer. Real money, real impact.', color: 'text-violet-500', bg: 'bg-violet-50' },
  { icon: Brain, title: 'RAG-Powered Reports', desc: 'Upload any medical report and get an AI-generated plain-language summary instantly.', color: 'text-orange-500', bg: 'bg-orange-50' },
]

const FAQ = [
  { q: 'Can I cancel anytime?', a: 'Yes. You can cancel your subscription at any time from Settings → Subscription. You retain Pro access until the end of your billing period.' },
  { q: 'Is my health data secure?', a: 'Absolutely. All data is encrypted at rest and in transit. We never sell or share your personal health data with third parties.' },
  { q: 'How does blood test booking work?', a: 'Select a test, pick a date and time slot, and we match you with a certified diagnostic center near you. Results are delivered in-app.' },
  { q: 'How does the referral commission work?', a: 'Elite users get a unique referral link. When someone books a blood test through your link, you earn 15% commission credited to your MedAI wallet.' },
  { q: 'Is there a family plan?', a: 'Pro allows up to 3 family profiles. Elite allows up to 10. Each profile has its own health history, vitals, and AI chat.' },
]

export default function Subscriptions() {
  const user = getStoredUser()
  const navigate = useNavigate()
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const getDisplayPrice = (base: number) => {
    if (base === 0) return '0'
    return billing === 'yearly' ? (base * 0.75).toFixed(2) : base.toFixed(2)
  }

  const currentPlan = 'free' // TODO: load from backend subscription status

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 max-w-6xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-100 to-emerald-100 border border-violet-200 text-violet-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4"
        >
          <Crown className="w-3.5 h-3.5" />
          MedAI Premium Plans
        </motion.div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 leading-tight">
          Upgrade Your Health Intelligence
        </h1>
        <p className="text-base text-slate-500 max-w-xl mx-auto">
          Unlock unlimited AI consultations, blood test booking, and earn commissions helping others stay healthy.
        </p>

        {/* Billing Toggle */}
        <div className="mt-6 inline-flex items-center gap-3 bg-slate-100 rounded-full p-1">
          {(['monthly', 'yearly'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                billing === b
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {b === 'monthly' ? 'Monthly' : 'Yearly'}
              {b === 'yearly' && (
                <span className="ml-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                  −25%
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
            className={`relative rounded-3xl border-2 ${plan.border} bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden`}
          >
            {plan.badge && (
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${plan.color}`} />
            )}
            {plan.badge && (
              <div className="absolute top-3 right-3">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${plan.color} text-white shadow`}>
                  {plan.badge}
                </span>
              </div>
            )}

            <div className="p-6 flex-1 flex flex-col">
              {/* Plan name */}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-3`}>
                {plan.id === 'free' && <Zap className="w-5 h-5 text-white" />}
                {plan.id === 'pro' && <Sparkles className="w-5 h-5 text-white" />}
                {plan.id === 'elite' && <Crown className="w-5 h-5 text-white" />}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5 mb-4">{plan.tagline}</p>

              {/* Price */}
              <div className="flex items-end gap-1 mb-5">
                <span className="text-4xl font-extrabold text-slate-900">
                  ${getDisplayPrice(plan.price)}
                </span>
                <span className="text-sm text-slate-500 pb-1">
                  {plan.price === 0 ? '' : `/${billing === 'yearly' ? 'mo (billed yearly)' : 'mo'}`}
                </span>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-2.5">
                    {f.ok ? (
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                    )}
                    <span className={`text-sm ${f.ok ? 'text-slate-700' : 'text-slate-400'}`}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {currentPlan === plan.id ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : plan.id === 'free' ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl text-sm font-semibold border border-slate-200 text-slate-500 cursor-not-allowed"
                >
                  Always Free
                </button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r ${plan.color} text-white shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-shadow`}
                >
                  Upgrade to {plan.name}
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Feature Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-14"
      >
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Why Upgrade?</h2>
        <p className="text-sm text-slate-500 text-center mb-8">Features designed to put your health first</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {HIGHLIGHTS.map((h, i) => (
            <motion.div
              key={h.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + i * 0.08 }}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl ${h.bg} flex items-center justify-center mb-3`}>
                <h.icon className={`w-5 h-5 ${h.color}`} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">{h.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{h.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Referral Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="mb-14 rounded-3xl overflow-hidden relative bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-700 p-8 text-white"
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-violet-200" />
              <span className="text-sm font-semibold text-violet-200 uppercase tracking-wider">Referral Program</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Earn 15% on every referral</h2>
            <p className="text-sm text-violet-200 max-w-md">
              Share your unique referral link. When a friend books a blood test through MedAI, you earn a 15% commission — paid directly to your wallet. Available on Elite plan.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/referrals')}
            className="shrink-0 flex items-center gap-2 bg-white text-violet-700 font-bold text-sm px-6 py-3 rounded-xl shadow-xl hover:shadow-2xl transition-shadow"
          >
            <TrendingUp className="w-4 h-4" />
            View Referral Dashboard
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="mb-10"
      >
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Frequently Asked Questions</h2>
        <div className="max-w-2xl mx-auto space-y-3">
          {FAQ.map((item, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <button
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {item.q}
                <motion.div
                  animate={{ rotate: openFaq === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronRight className={`w-4 h-4 text-slate-400 rotate-90`} />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {openFaq === i && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-sm text-slate-500 leading-relaxed">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Trust Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75 }}
        className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 pb-4"
      >
        {[
          { icon: Shield, label: 'HIPAA-aligned security' },
          { icon: Lock, label: 'End-to-end encryption' },
          { icon: Star, label: '4.9/5 user rating' },
          { icon: Infinity, label: 'Cancel anytime' },
        ].map((b) => (
          <div key={b.label} className="flex items-center gap-1.5">
            <b.icon className="w-3.5 h-3.5 text-slate-400" />
            {b.label}
          </div>
        ))}
      </motion.div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPlan(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {selectedPlan === 'pro' ? 'Upgrade to Pro' : 'Upgrade to Elite'}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Payments are currently in <strong>sandbox mode</strong>. Integration with Stripe / Razorpay coming soon. You'll receive access once billing is live.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-lg"
                >
                  Got it — Notify Me!
                </button>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="w-full py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
