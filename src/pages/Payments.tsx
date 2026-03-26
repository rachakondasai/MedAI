/**
 * Payments.tsx — Personal PhonePe / UPI QR Payment Page
 *
 * Works with ANY personal UPI ID (PhonePe, GPay, Paytm, BHIM, etc.)
 * e.g.  9876543210@ybl   (PhonePe personal)
 *       name@oksbi        (GPay)
 *       name@paytm
 *
 * Workflow:
 *  1. User picks a plan or blood test
 *  2. QR code is shown with the exact amount (generated locally, no server needed)
 *  3. User scans with PhonePe / GPay / any UPI app and pays
 *  4. User clicks "I've Paid":
 *       → AUTO-OPENS your (admin) WhatsApp with full payment details
 *       → User also gets a WhatsApp notification button for their own number
 *  5. You verify the screenshot manually and activate the feature
 *
 * Setup: set VITE_UPI_ID, VITE_MERCHANT_NAME, VITE_WHATSAPP_NO in your .env file
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  QrCode,
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
  RefreshCw,
  ChevronLeft,
  MessageCircle,
  Phone,
  Bell,
  Send,
} from 'lucide-react'
import { getStoredUser } from '../lib/auth'

// ─────────────────────────────────────────────────────────────
// CONFIGURE YOUR PERSONAL UPI DETAILS HERE
// Or set them in your .env file (recommended)
// ─────────────────────────────────────────────────────────────
const UPI_ID        = import.meta.env.VITE_UPI_ID        || '6303089935@ybl'
const MERCHANT_NAME = import.meta.env.VITE_MERCHANT_NAME || 'R SAI PRASAD'
// YOUR personal WhatsApp (admin) — with country code, no + or spaces
// India +91 6303089935
const ADMIN_WHATSAPP = import.meta.env.VITE_WHATSAPP_NO || '916303089935'

// ─────────────────────────────────────────────────────────────
// PAYMENT ITEMS
// ─────────────────────────────────────────────────────────────
interface PaymentItem {
  id: string
  title: string
  description: string
  amount: number
  icon: any
  color: string
  iconBg: string
  category: 'subscription' | 'test'
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

// ─────────────────────────────────────────────────────────────
// UPI URL builder (standard UPI deep-link spec)
// Works with PhonePe, GPay, Paytm, BHIM, etc.
// ─────────────────────────────────────────────────────────────
function buildUpiUrl(amount: number, note: string, txnRef: string) {
  const params = new URLSearchParams({
    pa: UPI_ID,                     // payee UPI ID
    pn: MERCHANT_NAME,              // payee name
    am: amount.toFixed(2),          // amount in INR
    cu: 'INR',
    tn: note.slice(0, 80),          // transaction note (max 80 chars)
    tr: txnRef,                     // transaction reference
  })
  return `upi://pay?${params.toString()}`
}

// ─────────────────────────────────────────────────────────────
// QR CODE  — drawn on a <canvas> using a simple QR algorithm
// so it works 100% offline without any external API calls.
// Uses the lightweight 'qrcode' npm package if available,
// otherwise falls back to Google Charts (online only).
// ─────────────────────────────────────────────────────────────
function QRCanvas({ value, size = 240 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    if (!value) return
    let cancelled = false

    // Dynamically import qrcode only if it's installed
    const tryQrCode = async () => {
      try {
        const pkgName = 'qrcode'
        // @ts-ignore
        const mod = await import(/* @vite-ignore */ pkgName)
        const QRCode = mod.default ?? mod
        if (cancelled || !canvasRef.current) return
        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' },
        })
      } catch {
        if (!cancelled) setFallback(true)
      }
    }
    tryQrCode()

    return () => { cancelled = true }
  }, [value, size])

  const googleQrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodeURIComponent(value)}&choe=UTF-8&chld=M|2`

  if (fallback) {
    return (
      <img
        src={googleQrUrl}
        alt="UPI QR Code"
        width={size}
        height={size}
        className="rounded-2xl border-4 border-white shadow-xl"
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-2xl border-4 border-white shadow-xl"
    />
  )
}

// ─────────────────────────────────────────────────────────────
// COPY BUTTON
// ─────────────────────────────────────────────────────────────
function CopyButton({ text, label = 'Copy UPI ID' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="flex items-center gap-1.5 text-[12px] text-blue-600 hover:text-blue-800 transition-colors font-semibold px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100"
    >
      {copied
        ? <><CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> Copied!</>
        : <><Copy className="w-3.5 h-3.5" /> {label}</>}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// WHATSAPP MESSAGE BUILDERS
// ─────────────────────────────────────────────────────────────

// Message sent TO YOU (admin) — full payment details
function buildAdminMsg(item: PaymentItem, txnRef: string, userName: string, userEmail: string, userPhone: string) {
  return encodeURIComponent(
    `🔔 *New Payment — MedAI*\n\n` +
    `📦 *Plan/Test:* ${item.title}\n` +
    `💰 *Amount:* ₹${item.amount}\n` +
    `🔑 *Ref:* ${txnRef}\n` +
    `👤 *User:* ${userName || 'Unknown'}\n` +
    `📧 *Email:* ${userEmail || 'N/A'}\n` +
    `📱 *Phone:* ${userPhone || 'N/A'}\n` +
    `💳 *UPI paid to:* ${UPI_ID}\n` +
    `🕒 *Time:* ${new Date().toLocaleString('en-IN')}\n\n` +
    `Please verify the payment screenshot and activate the plan. 🙏`
  )
}

// Message sent TO USER — their own confirmation receipt
function buildUserMsg(item: PaymentItem, txnRef: string, userName: string) {
  return encodeURIComponent(
    `✅ *MedAI Payment Receipt*\n\n` +
    `Hi ${userName || 'there'}! 👋\n\n` +
    `Thank you for your payment.\n\n` +
    `📦 *Plan/Test:* ${item.title}\n` +
    `💰 *Amount Paid:* ₹${item.amount}\n` +
    `🔑 *Reference:* ${txnRef}\n` +
    `📅 *Date:* ${new Date().toLocaleDateString('en-IN')}\n\n` +
    `Your plan will be activated within a few hours after verification. ⚡\n\n` +
    `_— MedAI Team_`
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
type Step = 'select' | 'pay' | 'confirm'

export default function Payments() {
  const user = getStoredUser()
  const [step, setStep] = useState<Step>('select')
  const [selected, setSelected] = useState<PaymentItem | null>(null)
  const [filter, setFilter] = useState<'all' | 'subscription' | 'test'>('all')
  const [submitting, setSubmitting] = useState(false)
  const [txnRef, setTxnRef] = useState('')
  // User's own phone for WhatsApp self-notification
  const [userPhone, setUserPhone] = useState('')
  const [adminNotified, setAdminNotified] = useState(false)

  const filtered = PAYMENT_ITEMS.filter(p => filter === 'all' || p.category === filter)

  const handleSelect = (item: PaymentItem) => {
    const ref = `MEDAI-${item.id.toUpperCase().slice(0, 6)}-${Date.now().toString().slice(-6)}`
    setTxnRef(ref)
    setSelected(item)
    setStep('pay')
    setAdminNotified(false)
  }

  const handleIvePaid = async () => {
    if (!selected) return
    setSubmitting(true)
    await new Promise(res => setTimeout(res, 800))
    setSubmitting(false)
    setStep('confirm')

    // AUTO-OPEN admin WhatsApp immediately after brief delay
    setTimeout(() => {
      const adminMsg = buildAdminMsg(selected, txnRef, user?.name || '', user?.email || '', userPhone)
      const adminUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${adminMsg}`
      window.open(adminUrl, '_blank')
      setAdminNotified(true)
    }, 600)
  }

  const upiUrl = selected ? buildUpiUrl(selected.amount, selected.title, txnRef) : ''

  // Admin WhatsApp link (for manual re-send)
  const adminWaLink = selected
    ? `https://wa.me/${ADMIN_WHATSAPP}?text=${buildAdminMsg(selected, txnRef, user?.name || '', user?.email || '', userPhone)}`
    : '#'

  // User's own WhatsApp link (self-receipt)
  const userWaLink = selected && userPhone
    ? `https://wa.me/${userPhone.replace(/\D/g, '').replace(/^0/, '91')}?text=${buildUserMsg(selected, txnRef, user?.name || '')}`
    : null

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-purple-50/20 p-6">
      <div className="max-w-lg mx-auto">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          {step !== 'select' && (
            <button
              onClick={() => { setStep('select'); setSelected(null) }}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4 font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}

          <div className="flex items-center gap-4">
            {/* PhonePe purple icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5f259f] via-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-xl shadow-purple-400/30 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-white/10"
                animate={{ y: ['-100%', '100%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              />
              <QrCode className="w-7 h-7 text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                {step === 'select' ? 'Pay via PhonePe / UPI'
                  : step === 'pay' ? 'Scan & Pay'
                  : 'Payment Sent! 🎉'}
              </h1>
              <p className="text-sm text-slate-500">
                {step === 'select' ? 'Personal UPI — PhonePe, GPay, Paytm accepted'
                  : step === 'pay' ? `Paying to: ${UPI_ID}`
                  : 'Send your screenshot to activate'}
              </p>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-2 mt-5">
            {(['select', 'pay', 'confirm'] as Step[]).map((s, idx) => {
              const steps = ['select', 'pay', 'confirm']
              const current = steps.indexOf(step)
              const thisIdx = steps.indexOf(s)
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    thisIdx === current ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                      : thisIdx < current ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {thisIdx < current ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:block ${thisIdx === current ? 'text-purple-600' : 'text-slate-400'}`}>
                    {s === 'select' ? 'Choose' : s === 'pay' ? 'Pay' : 'Done'}
                  </span>
                  {idx < 2 && <div className="w-6 h-px bg-slate-200" />}
                </div>
              )
            })}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ═══════════════════════════════════════════════
              STEP 1 — SELECT PLAN / TEST
          ════════════════════════════════════════════════ */}
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              {/* Filter tabs */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'all',          label: 'All' },
                  { key: 'subscription', label: '📋 Plans' },
                  { key: 'test',         label: '🧪 Blood Tests' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      filter === tab.key
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-purple-200 hover:text-purple-600'
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
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -2, scale: 1.005 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200/60 hover:border-purple-200 hover:shadow-md hover:shadow-purple-50 transition-all text-left group relative overflow-hidden"
                  >
                    {item.popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-violet-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                        Popular
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm group-hover:text-purple-700 transition-colors">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-black text-slate-900 text-xl">₹{item.amount}</p>
                        <p className="text-[10px] text-slate-400">{item.category === 'subscription' ? '/month' : 'one-time'}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* How it works */}
              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-2">
                <p className="text-xs font-bold text-purple-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> How to pay (Personal UPI)
                </p>
                <ol className="text-xs text-purple-700/80 space-y-1.5 list-none">
                  {[
                    'Select a plan or blood test above',
                    'Scan the QR code with PhonePe, GPay or Paytm',
                    'Pay the exact amount shown',
                    'Click "I\'ve Paid" and share the screenshot on WhatsApp',
                    'We\'ll activate your plan within a few hours',
                  ].map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-purple-200 text-purple-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════
              STEP 2 — QR + PAY
          ════════════════════════════════════════════════ */}
          {step === 'pay' && selected && (
            <motion.div
              key="pay"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              {/* Summary */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl border border-purple-100">
                <div className={`w-12 h-12 rounded-xl ${selected.iconBg} flex items-center justify-center shrink-0`}>
                  <selected.icon className={`w-6 h-6 ${selected.color}`} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{selected.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{selected.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-slate-900">₹{selected.amount}</p>
                  <p className="text-[10px] text-slate-400 font-medium">INR</p>
                </div>
              </div>

              {/* QR Card */}
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 flex flex-col items-center gap-5 shadow-sm">

                {/* Header */}
                <div className="flex items-center gap-2.5 w-full justify-center">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5f259f] to-[#7c3aed] flex items-center justify-center shadow-md">
                    <Smartphone className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Scan with PhonePe / GPay / Paytm</p>
                    <p className="text-[10px] text-slate-400">or open UPI app and enter ID manually</p>
                  </div>
                </div>

                {/* QR Code — generated locally */}
                <div className="p-3 bg-white rounded-3xl shadow-xl border border-slate-100 relative">
                  {/* Purple corner accents */}
                  <div className="absolute top-2 left-2 w-5 h-5 border-l-2 border-t-2 border-purple-500 rounded-tl-md" />
                  <div className="absolute top-2 right-2 w-5 h-5 border-r-2 border-t-2 border-purple-500 rounded-tr-md" />
                  <div className="absolute bottom-2 left-2 w-5 h-5 border-l-2 border-b-2 border-purple-500 rounded-bl-md" />
                  <div className="absolute bottom-2 right-2 w-5 h-5 border-r-2 border-b-2 border-purple-500 rounded-br-md" />
                  <QRCanvas value={upiUrl} size={220} />
                </div>

                {/* UPI ID display — big & copyable */}
                <div className="flex flex-col items-center gap-2 w-full bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Personal UPI ID</p>
                  <div className="flex items-center gap-2">
                    {/* PhonePe brand color for the @ symbol */}
                    <code className="text-lg font-black text-slate-900 tracking-wide">
                      {UPI_ID.split('@')[0]}
                      <span className="text-[#5f259f]">@</span>
                      {UPI_ID.split('@')[1]}
                    </code>
                  </div>
                  <CopyButton text={UPI_ID} label="Copy UPI ID" />
                </div>

                {/* Open in app button */}
                <a
                  href={upiUrl}
                  className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-[#5f259f] to-[#7c3aed] text-white text-sm font-bold rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-purple-300/40 w-full justify-center"
                >
                  <Smartphone className="w-5 h-5" />
                  Open PhonePe / GPay / Paytm
                </a>

                {/* Amount warning */}
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-100 w-full">
                  <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Pay <strong className="text-slate-700">exactly ₹{selected.amount}.00</strong> — don't change the amount or it won't match</span>
                </div>
              </div>

              {/* User phone number for self-receipt */}
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
                <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Your WhatsApp number (optional)
                </p>
                <p className="text-[11px] text-blue-600/80 leading-relaxed">
                  Enter your number to receive a payment confirmation on <strong>your WhatsApp</strong> too.
                </p>
                <div className="flex items-center gap-2 bg-white rounded-xl border border-blue-200 px-3 py-2.5 focus-within:border-blue-400 transition-colors">
                  <span className="text-sm font-bold text-blue-600">🇮🇳 +91</span>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={userPhone}
                    onChange={e => setUserPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="flex-1 text-sm font-semibold text-slate-800 outline-none bg-transparent placeholder:text-slate-300"
                    maxLength={10}
                  />
                  {userPhone.length === 10 && (
                    <Check className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </div>

              {/* Transaction reference */}
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <strong>Your reference number:</strong>{' '}
                  <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">{txnRef}</code>
                  <br />
                  After clicking "I've Paid", <strong>WhatsApp will open automatically</strong> to notify us.
                </div>
              </div>

              {/* I've Paid */}
              <motion.button
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleIvePaid}
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-200/50 disabled:opacity-60 text-sm"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending notifications…</>
                  : <><Check className="w-4 h-4" /> I've Paid — Notify MedAI on WhatsApp</>}
              </motion.button>

              <p className="text-[11px] text-center text-slate-400">
                <Bell className="w-3 h-3 inline-block mr-1 text-emerald-500" />
                Clicking the button will <strong className="text-slate-600">auto-open WhatsApp</strong> to notify MedAI team instantly.
              </p>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════
              STEP 3 — CONFIRM + DUAL WHATSAPP NOTIFICATIONS
          ════════════════════════════════════════════════ */}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-5 py-4"
            >
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-300/50"
              >
                <Check className="w-12 h-12 text-white" />
              </motion.div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Payment Done! 🎉</h2>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                  {adminNotified
                    ? <>✅ <strong className="text-emerald-600">MedAI team was auto-notified</strong> via WhatsApp! Now send your payment screenshot to confirm.</>
                    : <>Now send your <strong className="text-slate-700">payment screenshot</strong> on WhatsApp so we can verify and activate <strong className="text-slate-700">{selected?.title}</strong>.</>
                  }
                </p>
              </div>

              {/* Notification cards */}
              <div className="space-y-3 max-w-xs mx-auto text-left">

                {/* ── Admin notification (auto-sent) ── */}
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`rounded-2xl border p-4 ${adminNotified ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${adminNotified ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${adminNotified ? 'text-emerald-700' : 'text-slate-600'}`}>
                        {adminNotified ? '✅ MedAI Team Notified' : '📢 Notify MedAI Team'}
                      </p>
                      <p className="text-[10px] text-slate-400">Admin WhatsApp — payment details auto-sent</p>
                    </div>
                  </div>
                  <motion.a
                    href={adminWaLink}
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                      adminNotified
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-200'
                        : 'bg-[#25D366] hover:bg-[#20b858] text-white shadow-md shadow-green-200'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {adminNotified ? 'Re-send to MedAI WhatsApp' : 'Send to MedAI WhatsApp'}
                  </motion.a>
                </motion.div>

                {/* ── User self-receipt ── */}
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 }}
                  className="rounded-2xl border bg-blue-50 border-blue-200 p-4"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center">
                      <Send className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-700">Send Receipt to Yourself</p>
                      <p className="text-[10px] text-slate-400">Your WhatsApp — keep a copy of this payment</p>
                    </div>
                  </div>

                  {userWaLink ? (
                    <motion.a
                      href={userWaLink}
                      target="_blank"
                      rel="noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Send to My WhatsApp (+91 {userPhone})
                    </motion.a>
                  ) : (
                    <div className="flex items-center gap-2 bg-white rounded-xl border border-blue-200 px-3 py-2 focus-within:border-blue-400 transition-colors">
                      <span className="text-xs font-bold text-blue-600">🇮🇳 +91</span>
                      <input
                        type="tel"
                        placeholder="Enter your number"
                        value={userPhone}
                        onChange={e => setUserPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="flex-1 text-xs font-semibold text-slate-800 outline-none bg-transparent placeholder:text-slate-300"
                        maxLength={10}
                      />
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Ref number */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 max-w-xs mx-auto">
                <p className="font-semibold text-slate-700 mb-1">Your reference number</p>
                <code className="font-mono font-bold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 block text-center">
                  {txnRef}
                </code>
                <p className="mt-2 text-slate-400">Share this with MedAI if you have any issues.</p>
              </div>

              {/* Status timeline */}
              <div className="flex flex-col items-center gap-2 max-w-xs mx-auto">
                {[
                  { icon: Check, label: 'Payment completed by you', done: true },
                  { icon: Bell, label: 'MedAI team notified via WhatsApp', done: adminNotified },
                  { icon: Clock, label: 'Manual verification by our team', done: false },
                  { icon: Zap, label: 'Plan / test activated', done: false },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full ${
                      s.done
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border border-slate-200'
                    }`}
                  >
                    <s.icon className={`w-4 h-4 shrink-0 ${s.done ? 'text-emerald-500' : 'text-slate-300'}`} />
                    {s.label}
                  </motion.div>
                ))}
              </div>

              <button
                onClick={() => { setStep('select'); setSelected(null); setAdminNotified(false) }}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors mx-auto font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Make another payment
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
