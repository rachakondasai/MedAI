import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Bot, FileText, Search, Loader2, RefreshCw } from 'lucide-react'
import { isAuthenticated, getUserSearchLogs, getUserChatHistory } from '../lib/auth'

interface HistoryItem {
  type: 'search' | 'chat'
  title: string
  detail: string
  date: string
}

const typeColor: Record<string, string> = {
  search: 'bg-purple-50 text-purple-600',
  chat: 'bg-blue-50 text-blue-600',
}

const typeIcon: Record<string, any> = {
  search: Search,
  chat: Bot,
}

export default function History() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

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
        history.push({
          type: 'search',
          title: log.query?.length > 60 ? log.query.slice(0, 60) + '…' : (log.query || 'Search query'),
          detail: log.response_preview || 'No response preview',
          date: new Date(log.created_at).toLocaleString(),
        })
      }

      for (const chat of chats) {
        if (chat.role === 'user') {
          history.push({
            type: 'chat',
            title: `Chat: ${chat.content?.length > 50 ? chat.content.slice(0, 50) + '…' : (chat.content || '')}`,
            detail: `You said this at ${new Date(chat.created_at).toLocaleTimeString()}`,
            date: new Date(chat.created_at).toLocaleString(),
          })
        }
      }

      // Sort by date descending
      history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900">Activity History</h2>
        </div>
        <button
          onClick={loadHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="ml-2 text-sm text-slate-400">Loading history...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No activity yet. Start chatting with MedAI!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => {
            const Icon = typeIcon[item.type] || FileText
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-4 hover:shadow-md hover:shadow-slate-100 transition-all"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${typeColor[item.type] || 'bg-slate-50 text-slate-500'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-900 truncate">{item.title}</h3>
                    <span className="text-xs text-slate-400 shrink-0 ml-4">{item.date}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.detail}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
