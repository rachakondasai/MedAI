/**
 * Payments.tsx — PhonePe QR Payment Page
 *
 * Workflow:
 *  1. User picks a plan / service (blood test, subscription, etc.)
 *  2. A PhonePe QR code is displayed with the amount
 *  3. User scans & pays via PhonePe / any UPI app
 *  4. User clicks "I've Paid" → shows a pending/confirm screen
 *  5. Admin verifies payment and unlocks the feature (manual for now)
 *
 * When real PhonePe Business API keys are available, replace the static
 * QR with a server-generated deep-link QR via /api/payment/create-order.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  QrCode,
  CreditCard,
  Check,
  Clock,
  ArrowRight,
  Shield,
  Smartphone,
  Copy,
  CheckCheck,
  Info,
  Zap,
  FlaskConical,
  Crown,
  Star,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
} from 'lucide-react'
import { getStoredUser } from '../lib/auth'

// ── Configurable payment settings ──────────────────────────────────────────
// Set your UPI ID in .env as VITE_UPI_ID or hardcode for testing.
const UPI_ID = import.meta.env.VITE_UPI_ID || 'yourname@ybl'
const MERCHANT_NAME = import.meta.env.VITE_MERCHANT_NAME || 'MedAI Healthcare'

// ── Payment plans ───────────────────────────────────────────────────────────
interface PaymentItem {
  id: string
  title: string
  description: string
  amount: number
  icon: any
  color: string
  iconBg: string
  category: 'subscription' | 'test' | 'addon'
  popular?: boolean
}

const PAYMENT_ITEMS: PaymentItem[] = [
  {
    id: 'pro_monthly',
    title: 'Pro Plan — Monthly',
    description: 'Unlimited AI chats, blood test booking, report uploads',
    amount: 399,
    icon: Crown,
    color: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    category: 'subscription',
    popular: true,
  },
  {
    id: 'elite_monthly',
    title: 'Elite Plan — Monthly',
    description: 'Everything in Pro + referral earnings + API access',
    amount: 1199,
    icon: Star,
    color: 'text-violet-600',
    iconBg: 'bg-violet-100',
    category: 'subscription',
  },
  {
    id: 'cbc_test',
    title: 'CBC Blood Test',
    description: 'Complete Blood Count — home collection or walk-in',
    amount: 250,
    icon: FlaskConical,
    color: 'text-red-500',
    iconBg: 'bg-red-50',
    category: 'test',
    popular: true,
  },
  {
    id: 'lipid_test',
    title: 'Lipid Profile Test',
    description: 'Cholesterol, HDL, LDL, Triglycerides',
    amount: 450,
    icon: FlaskConical,
    color: 'text-orange-500',
    iconBg: 'bg-orange-50',
    category: 'test',
  },
  {
    id: 'diabetes_test',
    title: 'Diabetes Screening',
    description: 'HbA1c + Fasting Blood Sugar',
    amount: 350,
    icon: FlaskConical,
    color: 'text-blue-500',
    iconBg: 'bg-blue-50',
    category: 'test',
  },
  {
    id: 'full_body',
    title: 'Full Body Checkup',
    description: '80+ parameters — comprehensive health panel',
    amount: 999,
    icon: Zap,
    color: 'text-purple-600',
    iconBg: 'bg-purple-50',
    category: 'test',
  },
]

// ── UPI deep-link / QR generator ────────────────────────────────────────────
function buildUpiUrl(amount: number, txnNote: string, userName: string) {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: MERCHANT_NAME,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: txnNote,
    // Optional: tr = transaction ref (replace with real order ID from server)
    tr: `MEDAI-${Date.now()}`,
  })
  return `upi://pay?${params.toString()}`
}

function buildQrImageUrl(upiUrl: string) {
  // Use Google Charts QR API (free, no auth needed)
  const encoded = encodeURIComponent(upiUrl)
  return `https://chart.googleapis.com/chart?cht=qr&chs=280x280&chl=${encoded}&choe=UTF-8`
}

// ── Copy helper ──────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 transition-colors font-semibold"
    >
      {copied ? <><CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy UPI ID</>}
    </button>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
type Step = 'select' | 'pay' | 'confirm'

export default function Payments() {
  const user = getStoredUser()
  const [step, setStep] = useState<Step>('select')
  const [selected, setSelected] = useState<PaymentItem | null>(null)
  const [filter, setFilter] = useState<'all' | 'subscription' | 'test'>('all')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [txnRef, setTxnRef] = useState('')

  const filtered = PAYMENT_ITEMS.filter(p => filter === 'all' || p.category === filter)

  const handleSelect = (item: PaymentItem) => {
    setSelected(item)
    setStep('pay')
    setSubmitted(false)
    // Generate a reference for this session
    setTxnRef(`MEDAI-${item.id.toUpperCase()}-${Date.now()}`)
  }

  const handleIvePaid = async () => {
    setSubmitting(true)
    // Simulate a "notify admin" API call
    await new Promise(res => setTimeout(res, 1500))
    setSubmitting(false)
    setSubmitted(true)
    setStep('confirm')
  }

  const upiUrl = selected ? buildUpiUrl(selected.amount, selected.title, user?.name || 'User') : ''
  const qrUrl = selected ? buildQrImageUrl(upiUrl) : ''

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/20 p-6">
      <div className="max-w-2xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {step !== 'select' && (
            <button
              onClick={() => { setStep('select'); setSelected(null) }}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4 font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Back to plans
            </button>
          )}

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                {step === 'select' ? 'Pay via PhonePe / UPI' : step === 'pay' ? 'Scan & Pay' : 'Payment Submitted'}
              </h1>
              <p className="text-sm text-slate-500">
                {step === 'select'
                  ? 'Choose a plan or test to pay for'
                  : step === 'pay'
                  ? 'Scan the QR with any UPI app'
                  : 'We\'ll verify and activate within a few hours'}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-5">
            {(['select', 'pay', 'confirm'] as Step[]).map((s, idx) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s === step ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' :
                  (['select', 'pay', 'confirm'].indexOf(s) < ['select', 'pay', 'confirm'].indexOf(step))
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {(['select', 'pay', 'confirm'].indexOf(s) < ['select', 'pay', 'confirm'].indexOf(step))
                    ? <Check className="w-3.5 h-3.5" />
                    : idx + 1}
                </div>
                <span className={`text-xs font-semibold hidden sm:block ${s === step ? 'text-blue-600' : 'text-slate-400'}`}>
                  {s === 'select' ? 'Choose Plan' : s === 'pay' ? 'Pay' : 'Confirm'}
                </span>
                {idx < 2 && <div className="w-6 h-px bg-slate-200" />}
              </div>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Select ── */}
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Filter tabs */}
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'subscription', label: 'Subscriptions' },
                  { key: 'test', label: 'Blood Tests' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      filter === tab.key
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3">
                {filtered.map((item, i) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -2, scale: 1.005 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200/60 hover:border-blue-200 hover:shadow-md hover:shadow-blue-50 transition-all text-left group relative overflow-hidden"
                  >
                    {item.popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                        Popular
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-black text-slate-900 text-lg">₹{item.amount}</p>
                        <p className="text-[10px] text-slate-400">{item.category === 'subscription' ? '/month' : 'one-time'}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* UPI notice */}
              <div className="flex items-start gap-3 p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-700 leading-relaxed">
                  <strong>Payment is manual for now.</strong> After you pay via PhonePe / GPay / Paytm, send a screenshot to our WhatsApp support. We'll activate your plan within a few hours. Automated payment verification coming soon.
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Pay ── */}
          {step === 'pay' && selected && (
            <motion.div
              key="pay"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Summary card */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <div className={`w-12 h-12 rounded-xl ${selected.iconBg} flex items-center justify-center`}>
                  <selected.icon className={`w-6 h-6 ${selected.color}`} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{selected.title}</p>
                  <p className="text-xs text-slate-500">{selected.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900">₹{selected.amount}</p>
                  <p className="text-[10px] text-slate-400">INR</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 flex flex-col items-center gap-5 shadow-sm">
                {/* PhonePe header */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5f259f] to-[#7c3aed] flex items-center justify-center shadow-md">
                    <Smartphone className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-slate-800">Scan with PhonePe / GPay / Paytm</span>
                </div>

                {/* QR Image */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-2xl" />
                  <img
                    src={qrUrl}
                    alt="UPI QR Code"
                    width={240}
                    height={240}
                    className="rounded-2xl border-4 border-white shadow-xl relative z-10"
                    onError={(e) => {
                      // Fallback if Google Charts is blocked
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  {/* Fallback: show UPI ID prominently */}
                  <div className="mt-3 flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-500">or pay directly to</span>
                    <code className="text-sm font-bold text-slate-800 bg-slate-100 px-4 py-1.5 rounded-xl">{UPI_ID}</code>
                    <CopyButton text={UPI_ID} />
                  </div>
                </div>

                {/* Open in app button */}
                <a
                  href={upiUrl}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#5f259f] to-[#7c3aed] text-white text-sm font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-purple-300/40 w-full justify-center"
                >
                  <Smartphone className="w-4 h-4" />
                  Open in PhonePe / UPI App
                </a>

                {/* Amount reminder */}
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 w-full justify-center">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  Pay exactly <strong className="text-slate-700 mx-1">₹{selected.amount}.00</strong> — do not change the amount
                </div>
              </div>

              {/* Transaction ref */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800">
                  <strong>Save this ref:</strong> <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">{txnRef}</code>
                  <br />Share it with support if you face any issue.
                </div>
              </div>

              {/* After paying */}
              <motion.button
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleIvePaid}
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-200/50 disabled:opacity-60 text-sm"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><Check className="w-4 h-4" /> I've Paid — Notify Team</>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* ── STEP 3: Confirm ── */}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-10 space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-300/50"
              >
                <Check className="w-12 h-12 text-white" />
              </motion.div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Payment Notified! 🎉</h2>
                <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
                  Our team has been notified. We'll verify your payment and activate{' '}
                  <strong className="text-slate-700">{selected?.title}</strong> within a few hours.
                </p>
              </div>

              {/* Status chips */}
              <div className="flex flex-col items-center gap-2">
                {[
                  { icon: Check, label: 'Payment screenshot shared', done: true },
                  { icon: Clock, label: 'Team review pending', done: false },
                  { icon: Zap, label: 'Plan activation', done: false },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium ${
                      s.done ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
                    }`}
                  >
                    <s.icon className={`w-4 h-4 ${s.done ? 'text-emerald-500' : 'text-slate-300'}`} />
                    {s.label}
                  </motion.div>
                ))}
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-xs text-blue-700 text-left max-w-sm mx-auto">
                <strong>Need faster activation?</strong> Send your payment screenshot + reference <code className="bg-blue-100 px-1 rounded font-mono">{txnRef}</code> to our WhatsApp support.
              </div>

              <button
                onClick={() => { setStep('select'); setSelected(null) }}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mx-auto font-medium"
              >
                <RefreshCw className="w-4 h-4" /> Make another payment
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
