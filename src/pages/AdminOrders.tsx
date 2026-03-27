/**
 * AdminOrders.tsx — Admin panel for managing lab test orders
 * Admin can:
 *  - See ALL orders from all users
 *  - Mark status: confirmed → sample_collected → processing → delivered
 *  - Mark payment as paid/pending
 *  - Assign lab name + address + phone
 *  - Add notes visible to user
 *  - Filter by status / payment
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical, CheckCircle2, Clock, Loader2, Building2,
  MapPin, Phone, Edit3, Save, X, RefreshCw,
  Calendar, ChevronDown, ChevronUp, Truck, PackageSearch, Check,
  Link, Upload, IndianRupee, TrendingUp, BadgeCheck, Bell,
} from 'lucide-react'
import { getOrders, saveOrders, type LabOrder, type OrderStatus, STATUS_CONFIG } from './Orders'

// ─────────────────────────────────────────────────────────────────────────────
// DEMO ORDERS — pre-loaded if nothing in localStorage yet
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_ORDERS: LabOrder[] = [
  {
    id: 'ORD-001',
    testName: 'Complete Blood Count (CBC)',
    labName: 'Apollo Diagnostics',
    labAddress: 'Himayatnagar, Hyderabad',
    labPhone: '040-23456789',
    amount: 250,
    status: 'confirmed',
    paymentStatus: 'paid',
    orderedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    collectionMode: 'home',
    estimatedDelivery: 'Tomorrow 6pm',
    txnRef: 'MEDAI-CBC001-123456',
    notes: 'Sample collected successfully. Report tomorrow.',
  },
  {
    id: 'ORD-002',
    testName: 'Lipid Profile Test',
    labName: 'SRL Diagnostics',
    labAddress: 'Banjara Hills, Hyderabad',
    labPhone: '040-33334444',
    amount: 450,
    status: 'pending_payment',
    paymentStatus: 'pending',
    orderedAt: new Date(Date.now() - 3600000).toISOString(),
    collectionMode: 'walk-in',
    txnRef: 'MEDAI-LIPID-654321',
  },
  {
    id: 'ORD-003',
    testName: 'Diabetes Screening (HbA1c)',
    labName: '',
    labAddress: '',
    labPhone: '',
    amount: 350,
    status: 'pending_payment',
    paymentStatus: 'pending',
    orderedAt: new Date().toISOString(),
    collectionMode: 'home',
    txnRef: 'MEDAI-DIAB-789012',
  },
]

const STATUS_FLOW: OrderStatus[] = ['pending_payment', 'confirmed', 'sample_collected', 'processing', 'delivered']

// ─────────────────────────────────────────────────────────────────────────────
// EDIT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function EditOrderModal({
  order,
  onSave,
  onClose,
}: {
  order: LabOrder
  onSave: (updated: LabOrder) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({ ...order })

  const set = (k: keyof LabOrder, v: string) => setForm(f => ({ ...f, [k]: v }))

  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(form.status) + 1]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Title */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <p className="font-black text-slate-800 text-sm">{order.testName}</p>
            <p className="text-xs text-slate-400 mt-0.5">Order ID: {order.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Order Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_FLOW.map(s => {
                const cfg = STATUS_CONFIG[s]
                const Icon = cfg.icon
                return (
                  <button
                    key={s}
                    onClick={() => set('status', s)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      form.status === s ? `${cfg.bg} ${cfg.color} ring-2 ring-offset-1 ring-current` : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${form.status === s && s === 'processing' ? 'animate-spin' : ''}`} />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick advance button */}
          {nextStatus && (
            <button
              onClick={() => set('status', nextStatus)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
            >
              <Truck className="w-3.5 h-3.5" />
              Advance → {STATUS_CONFIG[nextStatus].label}
            </button>
          )}

          {/* Payment */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Payment Status</label>
            <div className="flex gap-2">
              {(['pending', 'paid'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => set('paymentStatus', p)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all capitalize ${
                    form.paymentStatus === p
                      ? p === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  {p === 'paid' ? '✅ Paid' : '⏳ Pending'}
                </button>
              ))}
            </div>
          </div>

          {/* Lab details */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-600">Lab Assignment</label>
            {[
              { key: 'labName', icon: Building2, placeholder: 'Lab name (e.g. Apollo Diagnostics)' },
              { key: 'labAddress', icon: MapPin, placeholder: 'Lab address / area' },
              { key: 'labPhone', icon: Phone, placeholder: 'Lab phone number' },
              { key: 'estimatedDelivery', icon: Calendar, placeholder: 'Estimated delivery (e.g. Tomorrow 6pm)' },
            ].map(f => {
              const Icon = f.icon
              return (
                <div key={f.key} className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={(form as any)[f.key] || ''}
                    onChange={e => set(f.key as keyof LabOrder, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
                  />
                </div>
              )
            })}
          </div>

          {/* Report URL */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Upload className="w-3 h-3 text-emerald-500" />
              Report URL / Google Drive Link
            </label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="url"
                value={form.reportUrl || ''}
                onChange={e => set('reportUrl', e.target.value)}
                placeholder="https://drive.google.com/file/..."
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all"
              />
            </div>
            {form.reportUrl && (
              <a
                href={form.reportUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-emerald-600 hover:underline"
              >
                <BadgeCheck className="w-3 h-3" /> Verify link opens correctly
              </a>
            )}
            <p className="text-[10px] text-slate-400 mt-1">
              💡 Tip: Upload to Google Drive, set sharing to "Anyone with link", then paste here. Setting status to "Report Ready" will notify the user.
            </p>
          </div>

          {/* Notes for user */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Note to User (visible on their order)</label>
            <textarea
              value={form.notes || ''}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="e.g. Sample will be collected between 8-10am. Please be available."
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
            />
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER ROW
// ─────────────────────────────────────────────────────────────────────────────
function AdminOrderRow({ order, onEdit }: { order: LabOrder; onEdit: (o: LabOrder) => void }) {
  const cfg = STATUS_CONFIG[order.status]
  const Icon = cfg.icon
  const needsReport = order.paymentStatus === 'paid' && order.status !== 'delivered' && order.status !== 'pending_payment'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Highlight band for orders needing report */}
      {needsReport && (
        <div className="flex items-center gap-2 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <p className="text-[11px] font-bold text-amber-700 flex-1">Paid — upload report URL &amp; mark as delivered</p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <FlaskConical className="w-5 h-5 text-blue-600" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm truncate">{order.testName}</p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-[11px] text-slate-400">{new Date(order.orderedAt).toLocaleDateString('en-IN')}</span>
            {order.labName && <span className="text-[11px] text-blue-600 font-semibold">{order.labName}</span>}
            {order.txnRef && <code className="text-[10px] font-mono text-slate-400">{order.txnRef}</code>}
            {(order as any).patientName && <span className="text-[11px] text-slate-500">👤 {(order as any).patientName}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {/* Payment badge */}
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Unpaid'}
          </span>

          {/* Status badge */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
            <Icon className={`w-3 h-3 ${order.status === 'processing' ? 'animate-spin' : ''}`} />
            {cfg.label}
          </div>

          {/* Amount */}
          <span className="text-sm font-black text-slate-700">₹{order.amount}</span>

          {/* Edit */}
          <button
            onClick={() => onEdit(order)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Report URL preview */}
      {order.reportUrl && (
        <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
          <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <a
            href={order.reportUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-emerald-700 font-semibold hover:underline truncate flex-1"
          >
            {order.reportUrl}
          </a>
        </div>
      )}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminOrders() {
  const [orders, setOrders] = useState<LabOrder[]>([])
  const [filter, setFilter] = useState<'all' | OrderStatus | 'unpaid'>('all')
  const [editing, setEditing] = useState<LabOrder | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let stored = getOrders()
    if (stored.length === 0) {
      stored = DEMO_ORDERS
      saveOrders(stored)
    }
    setOrders(stored)
  }, [refreshKey])

  const handleSave = (updated: LabOrder) => {
    const newOrders = orders.map(o => o.id === updated.id ? updated : o)
    setOrders(newOrders)
    saveOrders(newOrders)
    setEditing(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const filtered = orders.filter(o => {
    if (filter === 'all') return true
    if (filter === 'unpaid') return o.paymentStatus === 'pending'
    return o.status === filter
  })

  const counts = {
    all: orders.length,
    unpaid: orders.filter(o => o.paymentStatus === 'pending').length,
    pending_payment: orders.filter(o => o.status === 'pending_payment').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    sample_collected: orders.filter(o => o.status === 'sample_collected').length,
    processing: orders.filter(o => o.status === 'processing').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }

  return (
    <>
      <AnimatePresence>
        {editing && (
          <EditOrderModal
            order={editing}
            onSave={handleSave}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>

      <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/20 p-6">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                    <FlaskConical className="w-4 h-4 text-white" />
                  </span>
                  Lab Orders
                  <span className="text-sm font-semibold text-slate-400">(Admin)</span>
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">Manage all test orders, assign labs, update status</p>
              </div>
              <div className="flex items-center gap-2">
                {saved && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl"
                  >
                    <Check className="w-3.5 h-3.5" /> Saved!
                  </motion.div>
                )}
                <button
                  onClick={() => setRefreshKey(k => k + 1)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              {[
                { label: 'Total Orders', value: counts.all, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200', icon: PackageSearch },
                { label: 'Unpaid', value: counts.unpaid, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
                { label: 'Processing', value: counts.processing + counts.sample_collected, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: Loader2 },
                { label: 'Delivered', value: counts.delivered, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
              ].map(s => {
                const Icon = s.icon
                return (
                  <div key={s.label} className={`${s.bg} border rounded-2xl p-3 flex items-center gap-3`}>
                    <Icon className={`w-5 h-5 ${s.color} shrink-0`} />
                    <div>
                      <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{s.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Revenue summary */}
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                {
                  label: 'Total Revenue',
                  value: `₹${orders.reduce((s, o) => s + (o.paymentStatus === 'paid' ? o.amount : 0), 0).toLocaleString('en-IN')}`,
                  sub: `${orders.filter(o => o.paymentStatus === 'paid').length} paid orders`,
                  color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: IndianRupee,
                },
                {
                  label: 'Pending Revenue',
                  value: `₹${orders.reduce((s, o) => s + (o.paymentStatus === 'pending' ? o.amount : 0), 0).toLocaleString('en-IN')}`,
                  sub: `${orders.filter(o => o.paymentStatus === 'pending').length} unpaid`,
                  color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: TrendingUp,
                },
                {
                  label: 'Reports Pending',
                  value: String(orders.filter(o => o.status !== 'delivered' && o.status !== 'pending_payment').length),
                  sub: 'Need report upload',
                  color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Bell,
                },
              ].map(s => {
                const Icon = s.icon
                return (
                  <div key={s.label} className={`${s.bg} border rounded-2xl p-3`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{s.label}</p>
                    </div>
                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
                  </div>
                )
              })}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap mt-4">
              {[
                { key: 'all', label: 'All Orders' },
                { key: 'unpaid', label: '⏳ Unpaid' },
                { key: 'pending_payment', label: 'Pending' },
                { key: 'confirmed', label: 'Confirmed' },
                { key: 'sample_collected', label: 'Collected' },
                { key: 'processing', label: 'Processing' },
                { key: 'delivered', label: 'Delivered' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    filter === f.key
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-blue-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Order list */}
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white rounded-3xl border border-slate-200/60"
            >
              <PackageSearch className="w-14 h-14 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-semibold text-sm">No orders in this filter</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filtered.map(order => (
                  <AdminOrderRow key={order.id} order={order} onEdit={setEditing} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
