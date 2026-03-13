import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, Bot, FileText, Search, Loader2, RefreshCw,
  Filter, Calendar, TrendingUp, Sparkles, MessageSquare,
  ArrowUpRight, Zap,
} from 'lucide-react'
import { isAuthenticated, getUserSearchLogs, getUserChatHistory } from '../lib/auth'

interface HistoryItem {
  type: 'search' | 'chat'
  title: string
  detail: string
  date: string
  rawDate: Date
}

type FilterType = 'all' | 'search' | 'chat'

const typeConfig = {
  search: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-100',
    icon: Search,
    label: 'Search',
    gradient: 'from-purple-500 to-violet-600',
    badge: 'bg-purple-100 text-purple-700',
  },
  chat: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-100',
    icon: Bot,
    label: 'Chat',
    gradient: 'from-blue-500 to-indigo-600',
    badge: 'bg-blue-100 text-blue-700',
  },
}

export default function History() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchText, setSearchText] = useState('')

  const loadHistory = async () => {
    setLoading(true)
    try {
      if (!isAuthenticated()) {
        setItems([])
        return
      }
      const [logs, chats] = await Promise.all([
        getUserSearchLogs(30),
        getUserChatHistory(30),
      ])

      const history: HistoryItem[] = []

      for (const log of logs) {
        const raw = new Date(log.created_at)
        history.push({
          type: 'search',
          title: log.query?.length > 60 ? log.query.slice(0, 60) + '…' : (log.query || 'Search query'),
          detail: log.response_preview || 'No response preview',
          date: raw.toLocaleString(),
          rawDate: raw,
        })
      }

      for (const chat of chats) {
        if (chat.role === 'user') {
          const raw = new Date(chat.created_at)
          history.push({
            type: 'chat',
            title: chat.content?.length > 60 ? chat.content.slice(0, 60) + '…' : (chat.content || ''),
            detail: `You said this at ${raw.toLocaleTimeString()}`,
            date: raw.toLocaleString(),
            rawDate: raw,
          })
        }
      }

      history.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
      setItems(history.slice(0, 50))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const filteredItems = items
    .filter(item => filter === 'all' || item.type === filter)
    .filter(item => !searchText || item.title.toLowerCase().includes(searchText.toLowerCase()))

  const stats = {
    total: items.length,
    searches: items.filter(i => i.type === 'search').length,
    chats: items.filter(i => i.type === 'chat').length,
  }

  // Group items by date
  const groupedItems: Record<string, HistoryItem[]> = {}
  filteredItems.forEach(item => {
    const dateKey = item.rawDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
    if (!groupedItems[dateKey]) groupedItems[dateKey] = []
    groupedItems[dateKey].push(item)
  })

  return (
    <div className="h-full overflow-y-auto relative">
      {/* Ambient mesh background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-100/30 via-blue-50/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-violet-100/25 via-purple-50/10 to-transparent rounded-full blur-3xl" />
      </div>
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header — Premium */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: [0, -8, 8, 0] }}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-500/20"
          >
            <Clock className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Activity History</h2>
            <p className="text-xs text-slate-400 mt-0.5">Your interactions with MedAI</p>
          </div>
        </div>
        <motion.button
          onClick={loadHistory}
          disabled={loading}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-xl hover:bg-white hover:shadow-md transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </motion.div>

      {/* Stats Cards — Glass */}
      {!loading && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: 'Total Activities', value: stats.total, icon: TrendingUp, color: 'emerald', gradient: 'from-emerald-500 to-teal-600' },
            { label: 'AI Searches', value: stats.searches, icon: Search, color: 'purple', gradient: 'from-purple-500 to-violet-600' },
            { label: 'Chat Messages', value: stats.chats, icon: MessageSquare, color: 'blue', gradient: 'from-blue-500 to-indigo-600' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.06 }}
              whileHover={{ y: -3, scale: 1.02 }}
              className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 p-4 hover:shadow-xl shadow-lg shadow-slate-500/5 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Filters & Search */}
      {!loading && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3"
        >
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {([
              { key: 'all' as FilterType, label: 'All', count: stats.total },
              { key: 'search' as FilterType, label: 'Searches', count: stats.searches },
              { key: 'chat' as FilterType, label: 'Chats', count: stats.chats },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                  filter === f.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === f.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-400'
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search history..."
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
        </motion.div>
      )}

      {/* Timeline Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
            <Clock className="absolute inset-0 w-5 h-5 m-auto text-blue-500" />
          </div>
          <p className="text-sm text-slate-500 mt-4">Loading history...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-slate-100"
          >
            <Clock className="w-10 h-10 text-slate-300" />
          </motion.div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {searchText ? 'No matching results' : 'No activity yet'}
          </h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            {searchText
              ? 'Try a different search term.'
              : 'Start chatting with MedAI or search for health information to see your timeline here.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([dateLabel, dateItems], gi) => (
            <motion.div
              key={dateLabel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.05 }}
            >
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span className="text-[11px] font-semibold text-slate-600">{dateLabel}</span>
                </div>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400">{dateItems.length} items</span>
              </div>

              {/* Items */}
              <div className="space-y-2 ml-2 border-l-2 border-slate-100 pl-5 relative">
                {dateItems.map((item, i) => {
                  const cfg = typeConfig[item.type]
                  const Icon = cfg.icon
                  return (
                    <motion.div
                      key={`${gi}-${i}`}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-white/70 backdrop-blur-xl rounded-xl border border-slate-200/50 p-4 hover:shadow-xl shadow-lg shadow-slate-500/5 hover:-translate-y-0.5 transition-all duration-300 relative group"
                    >
                      {/* Timeline dot */}
                      <div className={`absolute -left-[29px] top-5 w-3.5 h-3.5 rounded-full bg-gradient-to-br ${cfg.gradient} ring-4 ring-white`} />

                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border} group-hover:scale-105 transition-transform`}>
                          <Icon className={`w-5 h-5 ${cfg.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${cfg.badge}`}>{cfg.label}</span>
                            <span className="text-[10px] text-slate-400 ml-auto shrink-0">
                              {item.rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h3 className="text-sm font-medium text-slate-900 truncate">{item.title}</h3>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.detail}</p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
    </div>
  )
}
