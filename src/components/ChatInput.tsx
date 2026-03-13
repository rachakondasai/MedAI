import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, Mic, FileText, X, Loader2, Sparkles, Stethoscope, Brain, Heart, Zap, Shield, Activity, ChevronDown, Cpu } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  onFileUpload?: (file: File) => void
  disabled?: boolean
  uploading?: boolean
  selectedModel?: string
  onModelChange?: (model: string) => void
}

const AI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Most capable model', badge: 'Recommended', badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', description: 'Fast & powerful', badge: '', badgeColor: '' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast & affordable', badge: 'Fast', badgeColor: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'amazon-nova-lite', name: 'Nova Lite', provider: 'Amazon', description: 'Lightweight & efficient', badge: '', badgeColor: '' },
  { id: 'amazon-nova-pro', name: 'Nova Pro', provider: 'Amazon', description: 'Balanced performance', badge: '', badgeColor: '' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Strong reasoning', badge: '', badgeColor: '' },
]

const suggestions = [
  { icon: Stethoscope, text: 'I have a headache and fever', color: 'from-blue-500 to-indigo-500', bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200/60' },
  { icon: Heart, text: 'Check my heart health', color: 'from-rose-500 to-pink-500', bg: 'from-rose-50 to-pink-50', border: 'border-rose-200/60' },
  { icon: Brain, text: 'Feeling anxious lately', color: 'from-purple-500 to-violet-500', bg: 'from-purple-50 to-violet-50', border: 'border-purple-200/60' },
  { icon: Activity, text: 'Analyze my blood report', color: 'from-emerald-500 to-teal-500', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-200/60' },
]

export default function ChatInput({ onSend, onFileUpload, disabled, uploading, selectedModel = 'gpt-4o', onModelChange }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [showModelPicker, setShowModelPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modelPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCharCount(message.length)
  }, [message])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [message])

  // Close model picker on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false)
      }
    }
    if (showModelPicker) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showModelPicker])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // If a file is selected, upload it first
    if (selectedFile && onFileUpload) {
      onFileUpload(selectedFile)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      // If there's also a message, send it after the upload
      if (message.trim()) {
        const msg = message.trim()
        setMessage('')
        setShowSuggestions(false)
        setTimeout(() => onSend(msg), 300)
      }
      return
    }
    if (!message.trim()) return
    onSend(message)
    setMessage('')
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        alert('Only PDF files are supported.')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large. Max 10MB.')
        return
      }
      setSelectedFile(file)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSuggestionClick = (text: string) => {
    onSend(text)
    setShowSuggestions(false)
  }

  return (
    <div className="relative border-t border-white/40 bg-gradient-to-t from-white/95 via-white/90 to-white/70 backdrop-blur-2xl">
      {/* Ambient top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent blur-sm" />

      <div className="p-4 pb-3">
        {/* Quick Suggestions — Premium Animated Pills */}
        <AnimatePresence>
          {showSuggestions && !message && !selectedFile && !disabled && (
            <motion.div
              initial={{ opacity: 0, y: 12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 12, height: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="mb-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </motion.div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quick Start</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -15, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
                    onClick={() => handleSuggestionClick(s.text)}
                    className={`flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r ${s.bg} border ${s.border} rounded-xl text-xs text-slate-600 hover:text-slate-800 whitespace-nowrap transition-all duration-300 group shrink-0 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5`}
                  >
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                      <s.icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-medium">{s.text}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          {/* File preview — Premium Glass Card */}
          <AnimatePresence>
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                className="mb-3"
              >
                <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50/90 to-indigo-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl px-4 py-3 shadow-sm">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"
                  >
                    <FileText className="w-5 h-5 text-white" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-blue-800 truncate block">{selectedFile.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-blue-500 font-medium">{(selectedFile.size / 1024).toFixed(0)} KB</span>
                      <span className="w-1 h-1 rounded-full bg-blue-300" />
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">PDF</span>
                      <span className="w-1 h-1 rounded-full bg-blue-300" />
                      <span className="text-[10px] text-blue-500 flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" /> Ready for AI analysis
                      </span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={clearFile}
                    className="text-blue-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Input Area — Extreme Premium */}
          <div className={`relative rounded-2xl transition-all duration-500 ${
            isFocused
              ? 'shadow-2xl shadow-blue-200/40'
              : 'shadow-lg shadow-slate-200/30'
          }`}>
            {/* Animated border glow */}
            <div className={`absolute -inset-[1px] rounded-2xl transition-opacity duration-500 ${
              isFocused
                ? 'opacity-100 bg-gradient-to-r from-blue-400/30 via-emerald-400/20 to-purple-400/30'
                : 'opacity-0'
            }`} />

            <div className={`relative flex items-end gap-2 bg-white/95 backdrop-blur-xl rounded-2xl px-4 py-3 border transition-all duration-500 ${
              isFocused
                ? 'border-blue-200/80'
                : 'border-slate-200/60'
            }`}>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Left actions */}
              <div className="flex items-center gap-1 pb-0.5">
                <motion.button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || uploading}
                  whileHover={{ scale: 1.1, rotate: -10 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-slate-400 hover:text-blue-600 transition-all disabled:opacity-40 p-2 rounded-xl hover:bg-blue-50 relative group"
                  title="Upload PDF report"
                >
                  <Paperclip className="w-5 h-5" />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-slate-800 text-white px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Upload PDF
                  </span>
                </motion.button>
              </div>

              {/* Textarea */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={selectedFile ? 'Add a message about the report (optional), then press Send...' : 'Describe symptoms, ask a health question, or upload a report...'}
                  className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 resize-none min-h-[24px] max-h-[120px] leading-relaxed"
                  disabled={disabled}
                  rows={1}
                />
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-1 pb-0.5">
                {/* Character count (subtle) */}
                {charCount > 0 && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[9px] text-slate-300 font-mono tabular-nums mr-1"
                  >
                    {charCount}
                  </motion.span>
                )}

                {/* Voice button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsListening(!isListening)}
                  className={`relative p-2 rounded-xl transition-all ${
                    isListening
                      ? 'text-red-500 bg-red-50'
                      : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                  title="Voice input (coming soon)"
                >
                  <Mic className="w-5 h-5" />
                  {isListening && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-xl border-2 border-red-300"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    </>
                  )}
                </motion.button>

                {/* Send button — Premium */}
                <motion.button
                  type="submit"
                  disabled={(!message.trim() && !selectedFile) || disabled || uploading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all overflow-hidden group disabled:opacity-40"
                >
                  {/* Button gradient background */}
                  <div className={`absolute inset-0 transition-all duration-300 ${
                    (!message.trim() && !selectedFile) || disabled || uploading
                      ? 'bg-slate-200'
                      : 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30'
                  }`} />

                  {/* Shimmer overlay */}
                  {message.trim() && !disabled && !uploading && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-200%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                  )}

                  <div className="relative z-10">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    )}
                  </div>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Bottom bar — Model selector & AI badge */}
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="flex items-center gap-2">
              {/* Model Selector Dropdown */}
              <div className="relative" ref={modelPickerRef}>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200/60 hover:border-blue-200 px-2.5 py-1 rounded-lg transition-all"
                >
                  <Cpu className="w-3 h-3" />
                  {AI_MODELS.find(m => m.id === selectedModel)?.name || 'GPT-4o'}
                  <ChevronDown className={`w-3 h-3 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showModelPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="absolute bottom-full left-0 mb-2 w-72 bg-white/98 backdrop-blur-xl rounded-xl border border-slate-200/80 shadow-2xl shadow-slate-200/50 z-50 overflow-hidden"
                    >
                      <div className="p-3 border-b border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select AI Model</p>
                      </div>
                      <div className="p-1.5 max-h-64 overflow-y-auto">
                        {AI_MODELS.map((model) => (
                          <motion.button
                            key={model.id}
                            type="button"
                            whileHover={{ x: 2, backgroundColor: 'rgba(239,246,255,0.8)' }}
                            onClick={() => {
                              onModelChange?.(model.id)
                              setShowModelPicker(false)
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all ${
                              selectedModel === model.id ? 'bg-blue-50 border border-blue-200/60' : 'hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              selectedModel === model.id ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20' : 'bg-slate-100'
                            }`}>
                              <Cpu className={`w-4 h-4 ${selectedModel === model.id ? 'text-white' : 'text-slate-400'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${selectedModel === model.id ? 'text-blue-700' : 'text-slate-700'}`}>{model.name}</span>
                                {model.badge && (
                                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${model.badgeColor}`}>{model.badge}</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">{model.provider} · {model.description}</p>
                            </div>
                            {selectedModel === model.id && (
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-px h-3 bg-slate-200" />
              <div className="flex items-center gap-1 text-[9px] text-slate-400">
                <Shield className="w-2.5 h-2.5 text-emerald-400" />
                Encrypted
              </div>
            </div>
            <p className="text-[9px] text-slate-400">
              MedAI provides guidance only — consult a healthcare professional
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
