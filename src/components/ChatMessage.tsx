import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, User, Copy, Check, Sparkles, Shield } from 'lucide-react'

interface ChatMessageProps {
  role: 'user' | 'ai'
  content: string
  timestamp?: string
}

function formatContent(content: string) {
  const lines = content.split('\n')
  return lines.map((line, i) => {
    // Bold text: **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>
      }
      return <span key={j}>{part}</span>
    })

    // Bullet points
    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      return (
        <li key={i} className="ml-4 list-disc text-sm text-slate-600 leading-relaxed">
          {rendered}
        </li>
      )
    }
    // Numbered lists
    if (/^\d+\.\s/.test(line.trim())) {
      return (
        <li key={i} className="ml-4 list-decimal text-sm text-slate-600 leading-relaxed">
          {line.trim().replace(/^\d+\.\s/, '')}
        </li>
      )
    }
    // Empty line
    if (line.trim() === '') {
      return <br key={i} />
    }
    return <p key={i} className="text-sm leading-relaxed">{rendered}</p>
  })
}

export default function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isAI = role === 'ai'
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex gap-3.5 ${isAI ? 'justify-start' : 'justify-end'}`}
    >
      {isAI && (
        <motion.div
          initial={{ scale: 0.3, opacity: 0, rotate: -30 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
          className="relative shrink-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center mt-1 shadow-xl shadow-blue-500/25 ring-2 ring-white/80">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm"
          >
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </motion.div>
        </motion.div>
      )}
      <div className={`max-w-[72%] group ${isAI ? '' : 'order-first'}`}>
        {/* AI label */}
        {isAI && (
          <div className="flex items-center gap-1.5 mb-1.5 ml-1">
            <span className="text-[10px] font-bold text-blue-600">MedAI</span>
            <span className="flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              <Shield className="w-2.5 h-2.5" /> Verified
            </span>
          </div>
        )}
        <div
          className={`px-5 py-4 rounded-2xl text-sm leading-relaxed relative ${
            isAI
              ? 'bg-white/90 backdrop-blur-sm border border-slate-200/60 text-slate-700 rounded-tl-sm shadow-premium hover:shadow-premium-lg transition-all duration-300'
              : 'bg-gradient-to-br from-blue-600 via-blue-650 to-indigo-700 text-white rounded-tr-sm shadow-xl shadow-blue-500/25'
          }`}
        >
          {/* Subtle gradient overlay for AI messages */}
          {isAI && <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-emerald-50/10 rounded-2xl rounded-tl-sm pointer-events-none" />}
          
          <div className="relative z-10">
            {isAI ? <div className="space-y-1.5">{formatContent(content)}</div> : <span className="font-medium">{content}</span>}
          </div>

          {/* Copy button for AI messages */}
          {isAI && (
            <motion.button
              onClick={handleCopy}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute -bottom-3.5 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white border border-slate-200/80 rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-blue-600 hover:border-blue-200 shadow-premium"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="font-medium">Copy</span>
                </>
              )}
            </motion.button>
          )}
        </div>
        {timestamp && (
          <p className={`text-[10px] text-slate-400 mt-2 ${isAI ? 'ml-1' : 'text-right mr-1'}`}>{timestamp}</p>
        )}
      </div>
      {!isAI && (
        <motion.div
          initial={{ scale: 0.3, opacity: 0, rotate: 30 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
          className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 flex items-center justify-center shrink-0 mt-1 shadow-xl shadow-slate-500/15 ring-2 ring-white/60"
        >
          <User className="w-4 h-4 text-white" />
        </motion.div>
      )}
    </motion.div>
  )
}
