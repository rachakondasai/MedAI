import { useState, useRef } from 'react'
import { Send, Paperclip, Mic, FileText, X, Loader2 } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  onFileUpload?: (file: File) => void
  disabled?: boolean
  uploading?: boolean
}

export default function ChatInput({ onSend, onFileUpload, disabled, uploading }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFile && onFileUpload) {
      onFileUpload(selectedFile)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (!message.trim()) return
    onSend(message)
    setMessage('')
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

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-4">
      {/* File preview */}
      {selectedFile && (
        <div className="mb-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs font-medium text-blue-800 truncate flex-1">{selectedFile.name}</span>
          <span className="text-[10px] text-blue-500">{(selectedFile.size / 1024).toFixed(0)} KB</span>
          <button type="button" onClick={clearFile} className="text-blue-400 hover:text-blue-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
          title="Upload PDF report"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={selectedFile ? 'Click send to upload your report...' : 'Describe your symptoms or ask a health question...'}
          className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
          disabled={!!selectedFile || disabled}
        />
        <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors">
          <Mic className="w-5 h-5" />
        </button>
        <button
          type="submit"
          disabled={(!message.trim() && !selectedFile) || disabled || uploading}
          className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg flex items-center justify-center transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
      <p className="text-[10px] text-slate-400 mt-2 text-center">
        MedAI provides informational guidance only. Always consult a medical professional.
      </p>
    </form>
  )
}
