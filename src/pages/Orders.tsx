/**
 * Orders.tsx — User's order tracking page
 * Shows all blood test orders: pending, processing, delivered
 * Users can see: test name, lab, location, status, payment status
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical, Clock, CheckCircle2, Truck, MapPin, Building2,
  Phone, Calendar, ChevronDown, ChevronUp, RefreshCw, AlertCircle,
  Loader2, FileText, ArrowRight, PackageSearch,
} from 'lucide-react'
import { getStoredUser } from '../lib/auth'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type OrderStatus = 'pending_payment' | 'confirmed' | 'sample_collected' | 'processing' | 'delivered'

export interface LabOrder {
  id: string
  testName: string
  labName: string
  labAddress: string
  labPhone: string
  amount: number
  status: OrderStatus
  paymentStatus: 'pending' | 'paid'
  orderedAt: string
  collectionMode: 'home' | 'walk-in'
  reportUrl?: string
  estimatedDelivery?: string
  txnRef?: string
  notes?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
export const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: any; color: string; bg: string; step: number }> = {
  pending_payment: { label: 'Pending Payment', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', step: 0 },
  confirmed:       { label: 'Confirmed',       icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', step: 1 },
  sample_collected:{ label: 'Sample Collected',icon: FlaskConical, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', step: 2 },
  processing:      { label: 'Lab Processing',  icon: Loader2,    color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', step: 3 },
  delivered:       { label: 'Report Ready',    icon: CheckCircle2,color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', step: 4 },
}

const STEPS: OrderStatus[] = ['pending_payment', 'confirmed', 'sample_collected', 'processing', 'delivered']

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE HELPERS — shared with AdminOrders
// ─────────────────────────────────────────────────────────────────────────────
export function getOrders(): LabOrder[] {
  try {
    return JSON.parse(localStorage.getItem('medai_orders') || '[]')
  } catch { return [] }
}

export function saveOrders(orders: LabOrder[]) {
  localStorage.setItem('medai_orders', JSON.stringify(orders))
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER CARD
// ─────────────────────────────────────────────────────────────────────────────
function OrderCard({ order }: { order: LabOrder }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STATUS_CONFIG[order.status]
  const Icon = cfg.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded(x => !x)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <FlaskConical className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm truncate">{order.testName}</p>
          <p className="text-xs text-slate-500 mt-0.5">{order.labName} · {new Date(order.orderedAt).toLocaleDateString('en-IN')}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
            <Icon className={`w-3 h-3 ${order.status === 'processing' ? 'animate-spin' : ''}`} />
            {cfg.label}
          </div>
          <p className="text-xs font-bold text-slate-700">₹{order.amount}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-100 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-2">
                  {STEPS.map((s, i) => (
                    <span key={s} className={STATUS_CONFIG[order.status].step >= i ? 'text-blue-600 font-bold' : ''}>
                      {STATUS_CONFIG[s].label.split(' ')[0]}
                    </span>
                  ))}
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(STATUS_CONFIG[order.status].step / (STEPS.length - 1)) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                  />
                </div>
              </div>

              {/* Lab details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Lab</p>
                    <p className="text-xs font-semibold text-slate-700">{order.labName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Location</p>
                    <p className="text-xs font-semibold text-slate-700 leading-tight">{order.labAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Lab Phone</p>
                    <a href={`tel:${order.labPhone}`} className="text-xs font-semibold text-blue-600">{order.labPhone}</a>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Collection</p>
                    <p className="text-xs font-semibold text-slate-700 capitalize">{order.collectionMode}</p>
                  </div>
                </div>
              </div>

              {/* Payment & Ref */}
              <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Payment</p>
                  <p className={`text-xs font-bold ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
                  </p>
                </div>
                {order.txnRef && (
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Ref</p>
                    <code className="text-[11px] font-mono font-bold text-slate-600">{order.txnRef}</code>
                  </div>
                )}
              </div>

              {/* Estimated delivery */}
              {order.estimatedDelivery && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Estimated report: <strong>{order.estimatedDelivery}</strong>
                </div>
              )}

              {/* Report download */}
              {order.reportUrl && order.status === 'delivered' && (
                <a
                  href={order.reportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Download Report
                </a>
              )}

              {/* Notes from admin */}
              {order.notes && (
                <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{order.notes}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Orders() {
  const user = getStoredUser()
  const [orders, setOrders] = useState<LabOrder[]>([])
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    // Load only this user's orders
    const all = getOrders()
    setOrders(all.filter(o => !user || (o as any).userId === user.id || !(o as any).userId))
  }, [refreshKey])

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const counts = {
    all: orders.length,
    pending_payment: orders.filter(o => o.status === 'pending_payment').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    processing: orders.filter(o => o.status === 'processing' || o.status === 'sample_collected').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/20 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900">My Orders</h1>
              <p className="text-sm text-slate-500 mt-0.5">Track your blood tests & lab reports</p>
            </div>
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {/* Stat chips */}
          <div className="flex gap-2 flex-wrap mt-4">
            {[
              { key: 'all', label: 'All', count: counts.all, color: 'bg-slate-100 text-slate-700' },
              { key: 'pending_payment', label: 'Unpaid', count: counts.pending_payment, color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { key: 'confirmed', label: 'Confirmed', count: counts.confirmed, color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { key: 'processing', label: 'Processing', count: counts.processing, color: 'bg-purple-50 text-purple-700 border-purple-200' },
              { key: 'delivered', label: 'Ready', count: counts.delivered, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  filter === f.key ? 'ring-2 ring-blue-400 ring-offset-1 ' + f.color : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200'
                }`}
              >
                {f.label}
                <span className="w-4 h-4 rounded-full bg-white/60 flex items-center justify-center text-[10px] font-black">{f.count}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Order list */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white rounded-3xl border border-slate-200/60"
          >
            <PackageSearch className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-semibold text-sm">No orders yet</p>
            <p className="text-slate-400 text-xs mt-1">Book a blood test to see your orders here</p>
            <a href="/appointments" className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors">
              <FlaskConical className="w-3.5 h-3.5" /> Book a Test <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map(order => <OrderCard key={order.id} order={order} />)}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
