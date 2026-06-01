import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import PerfumeCard from '../components/PerfumeCard'

const STARTERS = [
  "I want a fresh, light fragrance for summer mornings",
  "Recommend something warm and sensual for winter evenings",
  "I love oud and rose — what should I try?",
  "I need an office-appropriate perfume that isn't too strong",
  "What's a good unisex fragrance with woody notes?",
  "Best affordable alternatives to Creed Aventus?",
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold
        ${isUser ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
        {isUser ? 'U' : 'S'}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
        ${isUser
          ? 'bg-stone-900 text-white rounded-tr-sm'
          : 'bg-white text-stone-700 border border-stone-200 rounded-tl-sm'
        }`}>
        <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
      </div>
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hello! I'm Scentique, your AI fragrance consultant.\n\nTell me about the scents you love, the occasions you're shopping for, or how you'd like to feel — and I'll find the best matches from our database of 2,500+ fragrances. What are you looking for today?",
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [perfumes, setPerfumes] = useState([])
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const res = await axios.post('/api/chat', { message: msg, history })
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }])
      if (res.data.recommendations?.length) setPerfumes(res.data.recommendations)
    } catch {
      toast.error('Could not reach the AI. Is the backend running?')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <main className="min-h-screen pt-16 flex flex-col bg-stone-50">
      <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-4 p-4 lg:p-6 flex-1"
           style={{ height: 'calc(100vh - 4rem)' }}>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col card overflow-hidden min-h-0">
          <div className="p-4 border-b border-stone-200 flex-shrink-0">
            <h1 className="font-serif text-xl text-stone-900">AI Perfume Consultant</h1>
            <p className="text-xs text-stone-400 mt-0.5">Powered by Claude · RAG + Content-ML · 2,500+ fragrances</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-stone-50">
            {messages.map((m, i) => <Message key={i} msg={m} />)}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-semibold text-stone-600">S</div>
                <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"
                           style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5 flex-shrink-0 border-t border-stone-200 pt-3 bg-white">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-stone-200 text-stone-500
                             hover:border-stone-400 hover:text-stone-800 hover:bg-stone-50 transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="p-4 border-t border-stone-200 flex-shrink-0 bg-white">
            <div className="flex gap-2">
              <input ref={inputRef} className="input-field flex-1" disabled={loading}
                placeholder="Ask about fragrances, notes, occasions..."
                value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()} />
              <button onClick={() => send()} disabled={loading || !input.trim()}
                className="btn-primary px-5 disabled:opacity-40 disabled:cursor-not-allowed">
                →
              </button>
            </div>
          </div>
        </div>

        {/* Recommendations panel */}
        <div className="lg:w-96 flex flex-col min-h-0 overflow-y-auto">
          {perfumes.length === 0 ? (
            <div className="card p-6 text-center text-stone-400 text-sm">
              Perfume recommendations will appear here after you chat with the AI.
            </div>
          ) : (
            <div className="space-y-4">
              {perfumes.map((p) => <PerfumeCard key={p.id} perfume={p} />)}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
