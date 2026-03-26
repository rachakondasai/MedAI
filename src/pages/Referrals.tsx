import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gift,
  TrendingUp,
  Copy,
  Check,
  Users,
  DollarSign,
  ChevronRight,
  Share2,
  Sparkles,
  ArrowRight,
  Clock,
  Crown,
  Link,
  MessageSquare,
  Mail,
  Twitter,
  Wallet,
  Award,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser } from '../lib/auth'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Mock earnings chart data
const earningsData = [
  { week: 'W1', earned: 0 },
  { week: 'W2', earned: 4.50 },
  { week: 'W3', earned: 12.75 },
  { week: 'W4', earned: 8.25 },
  { week: 'W5', earned: 22.50 },
  { week: 'W6', earned: 18.00 },
  { week: 'W7', earned: 31.50 },
  { week: 'W8', earned: 27.00 },
]

// Mock referral history
const referralHistory = [
  { name: 'Priya S.', test: 'Full Body Wellness Panel', date: '2025-07-01', commission: 7.50, status: 'paid' },
  { name: 'Arjun K.', test: 'CBC + Lipid Profile', date: '2025-07-03', commission: 4.05, status: 'paid' },
  { name: 'Meena R.', test: 'Diabetes Screening', date: '2025-07-05', commission: 2.70, status: 'pending' },
  { name: 'Rahul T.', test: 'Thyroid Function', date: '2025-07-08', commission: 3.75, status: 'paid' },
  { name: 'Sanya D.', test: 'Full Body Wellness Panel', date: '2025-07-10', commission: 7.50, status: 'processing' },
]

const HOW_IT_WORKS = [
  { step: 1, icon: Share2, title: 'Share Your Link', desc: 'Copy your unique referral link and share it with friends, family, or patients.', color: 'text-blue-500', bg: 'bg-blue-50' },
  { step: 2, icon: FlaskConical, title: 'They Book a Test', desc: "When someone books a blood test through your link, it's tracked automatically.", color: 'text-teal-500', bg: 'bg-teal-50' },
  { step: 3, icon: DollarSign, title: 'You Earn 15%', desc: 'You get 15% of the test price credited to your MedAI wallet within 48 hours.', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { step: 4, icon: Wallet, title: 'Withdraw Anytime', desc: 'Transfer your balance to UPI / bank when you reach the ₹500 / $10 threshold.', color: 'text-violet-500', bg: 'bg-violet-50' },
]

// Import workaround — FlaskConical used below
import { FlaskConical } from 'lucide-react'

export default function Referrals() {
  const user = getStoredUser()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const isPro = false // TODO: load from subscription
  const referralCode = user?.id ? `MEDAI-${user.id.substring(0, 6).toUpperCase()}` : 'MEDAI-ABC123'
  const referralLink = `https://medai.app/signup?ref=${referralCode}`

  const totalEarned = 124.50
  const totalReferrals = 18
  const pendingPayout = 18.75
  const thisMonthEarned = earningsData.reduce((s, d) => s + d.earned, 0)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareVia = (platform: string) => {
    const text = `Join me on MedAI — AI-powered healthcare. Get your blood tests booked online and chat with an AI doctor! Use my link: ${referralLink}`
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      email: `mailto:?subject=Try MedAI – AI Healthcare&body=${encodeURIComponent(text)}`,
    }
    window.open(urls[platform], '_blank')
  }

  if (!isPro) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-2xl p-10 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-violet-500/25">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Elite Feature</h2>
          <p className="text-sm text-slate-500 mb-2 leading-relaxed">
            The referral commission program is exclusive to <strong>MedAI Elite</strong> subscribers.
          </p>
          <p className="text-sm text-slate-400 mb-6">
            Upgrade to Elite to start earning <strong>15% commission</strong> on every blood test you refer.
          </p>
          <div className="bg-violet-50 rounded-xl p-4 text-xs text-violet-700 mb-6">
            💡 <strong>Top referrers</strong> earn over $500/month sharing their links with friends and patients.
          </div>
          <div className="flex flex-col gap-2">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/subscriptions')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Elite
              <ArrowRight className="w-4 h-4" />
            </motion.button>
            <button onClick={() => navigate('/')} className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
              Maybe later
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Referral Program</h1>
            <p className="text-sm text-slate-500">Earn 15% on every blood test you refer</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Earned', value: `$${totalEarned.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Total Referrals', value: totalReferrals, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'This Month', value: `$${thisMonthEarned.toFixed(2)}`, icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-50' },
          { label: 'Pending Payout', value: `$${pendingPayout.toFixed(2)}`, icon: Wallet, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
          >
            <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Referral Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3 bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-700 rounded-3xl p-6 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Link className="w-4 h-4 text-violet-300" />
              <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">Your Referral Link</span>
            </div>
            <p className="text-sm font-bold mb-4">{referralLink}</p>
            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCopy}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-300" /> Copied!
                    </motion.span>
                  ) : (
                    <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1.5">
                      <Copy className="w-4 h-4" /> Copy Link
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
              <button onClick={() => shareVia('whatsapp')} className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                <MessageSquare className="w-4 h-4" /> WhatsApp
              </button>
              <button onClick={() => shareVia('twitter')} className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                <Twitter className="w-4 h-4" /> Twitter
              </button>
              <button onClick={() => shareVia('email')} className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                <Mail className="w-4 h-4" /> Email
              </button>
            </div>
          </div>
        </motion.div>

        {/* Payout card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Wallet Balance</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mb-0.5">${pendingPayout.toFixed(2)}</p>
            <p className="text-xs text-slate-400">Minimum payout: $10.00</p>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(pendingPayout / 10) * 100}%` }}
                transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                className="bg-amber-400 h-2 rounded-full"
              />
            </div>
            <p className="text-xs text-slate-500 mb-3">${pendingPayout.toFixed(2)} / $10 threshold</p>
            <button
              disabled={pendingPayout < 10}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow"
            >
              Withdraw to Bank
            </button>
          </div>
        </motion.div>
      </div>

      {/* Earnings Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-8"
      >
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-500" />
          Weekly Earnings
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={earningsData}>
            <defs>
              <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(val: any) => [`$${val.toFixed(2)}`, 'Earned']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
            <Area type="monotone" dataKey="earned" stroke="#8B5CF6" strokeWidth={2.5} fill="url(#earningsGrad)" dot={false} activeDot={{ r: 5, fill: '#8B5CF6' }} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* How It Works */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mb-8">
        <h3 className="text-base font-bold text-slate-900 mb-4">How It Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_IT_WORKS.map((h, i) => (
            <motion.div
              key={h.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
            >
              <div className={`w-9 h-9 ${h.bg} rounded-xl flex items-center justify-center mb-3`}>
                <h.icon className={`w-4.5 h-4.5 ${h.color}`} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Step {h.step}</p>
              <p className="text-sm font-bold text-slate-900 mb-1">{h.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{h.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Referral History */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Referral History
          </h3>
          <span className="text-xs text-slate-400">{referralHistory.length} referrals</span>
        </div>
        <div className="divide-y divide-slate-50">
          {referralHistory.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.07 }}
              className="px-6 py-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-xs font-bold text-violet-600 shrink-0">
                  {r.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{r.name}</p>
                  <p className="text-xs text-slate-400 truncate">{r.test}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-emerald-600">+${r.commission.toFixed(2)}</p>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                  r.status === 'paid' ? 'bg-emerald-100 text-emerald-600' :
                  r.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {r.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Leaderboard teaser */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-3xl p-6 flex items-center gap-4"
      >
        <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shrink-0">
          <Award className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">Top Referrer Leaderboard 🏆</p>
          <p className="text-xs text-slate-500 mt-0.5">Top 10 referrers this month get a <strong>2× bonus</strong> on all commissions. Check back every Monday for rankings.</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
      </motion.div>
    </div>
  )
}
