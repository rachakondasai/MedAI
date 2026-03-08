import { motion } from 'framer-motion'
import { Bot, User } from 'lucide-react'

interface ChatMessageProps {
  role: 'user' | 'ai'
  content: string
  timestamp?: string
}

function formatContent(content: string) {
  // Simple markdown-like rendering for AI responses
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
    // Empty line = paragraph break
    if (line.trim() === '') {
      return <br key={i} />
    }
    return <p key={i} className="text-sm leading-relaxed">{rendered}</p>
  })
}

export default function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isAI = role === 'ai'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
    >
      {isAI && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 mt-1">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[70%] ${isAI ? '' : 'order-first'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isAI
              ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-md'
              : 'bg-blue-600 text-white rounded-tr-md'
          }`}
        >
          {isAI ? <div className="space-y-1">{formatContent(content)}</div> : content}
        </div>
        {timestamp && (
          <p className={`text-[10px] text-slate-400 mt-1 ${isAI ? '' : 'text-right'}`}>{timestamp}</p>
        )}
      </div>
      {!isAI && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shrink-0 mt-1">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  )
}
