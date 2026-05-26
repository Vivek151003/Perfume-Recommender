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
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold
        ${isUser ? 'bg-gold-500/20 text-gold-400' : 'bg-stone-700 text-stone-200'}`}>
        {isUser ? 'U' : '✦'}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
        ${isUser
          ? 'bg-gold-500/15 text-stone-200 border border-gold-500/20 rounded-tr-sm'
          : 'bg-stone-800/80 text-stone-300 border border-stone-700/40 rounded-tl-sm'
        }`}>
        <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
      </div>
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm Scentique, your AI fragrance consultant.\n\nTell me about the scents you love, the occasions you're shopping for, or how you'd like to feel — and I'll find the best matches from our database of 2,500+ fragrances. What are you looking for today?",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [perfumes, setPerfumes] = useState([])
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

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
      if (res.data.recommendations?.length) {
        setPerfumes(res.data.recommendations)
      }
    } catch (err) {
      toast.error('Could not reach the AI. Is the backend running?')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <main className="min-h-screen pt-20 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-4 p-4 lg:p-6 flex-1"
           style={{ height: 'calc(100vh - 5rem)' }}>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col card-glass overflow-hidden min-h-0">
          <div className="p-4 border-b border-stone-800/60 flex-shrink-0">
            <h1 className="font-serif text-xl text-stone-200">AI Perfume Consultant</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Groq llama-3.3-70b · RAG + Content-ML · 2,500+ fragrances
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((m, i) => <Message key={i} msg={m} />)}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-sm">✦</div>
                <div className="bg-stone-800/80 border border-stone-700/40 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 bg-gold-400/60 rounded-full animate-bounce"
                           style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-stone-700/50 text-stone-400
                             hover:border-gold-500/40 hover:text-gold-400 transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="p-4 border-t border-stone-800/60 flex-shrink-0">
            <div className="flex gap-2">
              <input ref={inputRef} className="input-field flex-1" disabled={loading}
                placeholder="Ask about fragrances, notes, occasions..."
                value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()} />
              <button onClick={() => send()} disabled={loading || !input.trim()}
                className="btn-gold px-5 py-3 disabled:opacity-40 disabled:cursor-not-allowed">→</button>
            </div>
          </div>
        </div>

        {/* Recommendations panel */}
        <div className="lg:w-96 flex flex-col min-h-0 overflow-y-auto">
          <div className="space-y-4">
            {perfumes.length === 0 ? (
              <div className="card-glass p-6 text-center text-stone-500 text-sm">
                Perfume recommendations will appear here after you chat with the AI.
              </div>
            ) : (
              perfumes.map((p) => <PerfumeCard key={p.id} perfume={p} />)
            )}
          </div>
        </div>

      </div>
    </main>
  )
}
