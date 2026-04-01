'use client'

import { useState, useRef, useEffect } from 'react'

type ToolCall = { id: string; tool: string; input: any; display: string }
type Artifact = { type: 'pdf' | 'presentation'; url?: string; title: string; slides?: Slide[] }
type Slide = { title: string; points: string[]; type: string; highlight?: string }

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  tool_calls?: ToolCall[]
  artifacts?: Artifact[]
  loading?: boolean
}

const TOOL_ICONS: Record<string, string> = {
  search_listings: '🔍',
  get_agent_performance: '📊',
  generate_krb_report: '📄',
  create_presentation: '🎨',
  schedule_calendar_event: '📅',
  send_email: '📧',
  get_training_summary: '🎓',
}

const TOOL_LABELS: Record<string, string> = {
  search_listings: 'İlan Araması',
  get_agent_performance: 'Performans Analizi',
  generate_krb_report: 'KRB Raporu',
  create_presentation: 'Sunum Oluşturma',
  schedule_calendar_event: 'Takvim Etkinliği',
  send_email: 'Mail Gönderme',
  get_training_summary: 'Eğitim Özeti',
}

const QUICK_PROMPTS = [
  { label: 'Performans raporu', prompt: 'Bu ayki danışman performansını özetle' },
  { label: 'KRB oluştur', prompt: 'Portföydeki ilk aktif mülk için KRB raporu oluştur' },
  { label: 'Satış sunumu', prompt: 'Ofis için profesyonel satış sunumu hazırla' },
  { label: 'Eğitim durumu', prompt: 'Zorunlu eğitimlerin tamamlanma durumunu göster' },
  { label: 'Piyasa analizi', prompt: 'Portföye dayalı piyasa analizi sunumu oluştur' },
  { label: 'Ofis performans raporu', prompt: 'Mart 2026 ofis performans raporu sunumu hazırla' },
]

function PresentationViewer({ slides, title }: { slides: Slide[]; title: string }) {
  const [current, setCurrent] = useState(0)
  const slide = slides[current]
  if (!slide) return null

  const bgColors = ['from-emerald-700 to-emerald-900', 'from-slate-700 to-slate-900', 'from-violet-700 to-violet-900', 'from-blue-700 to-blue-900', 'from-amber-600 to-amber-800', 'from-rose-700 to-rose-900']
  const bg = bgColors[current % bgColors.length]

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Slide */}
      <div className={`bg-gradient-to-br ${bg} p-6 min-h-[180px] flex flex-col justify-between`}>
        <div>
          {current === 0 && <p className="text-white/60 text-xs mb-2 uppercase tracking-wider">{title}</p>}
          <h3 className="text-white font-bold text-lg leading-tight mb-3">{slide.title}</h3>
          {slide.highlight && (
            <div className="text-3xl font-black text-white/90 mb-3">{slide.highlight}</div>
          )}
          <ul className="space-y-1.5">
            {(slide.points || []).map((p, i) => (
              <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                <span className="text-white/50 mt-0.5 shrink-0">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end mt-4">
          <span className="text-white/40 text-xs">{current + 1} / {slides.length}</span>
        </div>
      </div>
      {/* Controls */}
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
        <div className="flex gap-1">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-emerald-600' : 'bg-gray-300'}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            className="text-xs px-2 py-1 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-100">
            ← Önceki
          </button>
          <button onClick={() => setCurrent(c => Math.min(slides.length - 1, c + 1))}
            disabled={current === slides.length - 1}
            className="text-xs px-2 py-1 rounded bg-white border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-100">
            Sonraki →
          </button>
        </div>
      </div>
    </div>
  )
}

function ArtifactCard({ artifact }: { artifact: Artifact }) {
  if (artifact.type === 'pdf') {
    return (
      <a href={artifact.url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium">
        <span>📄</span>
        <span>{artifact.title}</span>
        <span className="text-red-400 text-xs">PDF indir →</span>
      </a>
    )
  }
  if (artifact.type === 'presentation' && artifact.slides) {
    return <PresentationViewer slides={artifact.slides} title={artifact.title} />
  }
  return null
}

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Merhaba! Ben PropCoach AI Asistanınım. KRB raporu, sunum, performans analizi, takvim etkinliği, mail ve daha fazlası için bana yazabilirsiniz.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text?: string) => {
    const content = (text || input).trim()
    if (!content || loading) return
    setInput('')

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content }
    const loadingMsg: Message = { id: Date.now() + 1 + '', role: 'assistant', content: '', loading: true }
    setMessages(prev => [...prev, userMsg, loadingMsg])
    setLoading(true)

    // Build message history for API (exclude loading)
    const history = [...messages, userMsg]
      .filter(m => !m.loading)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })
      const data = await res.json()

      setMessages(prev => prev.map(m =>
        m.loading ? {
          ...m,
          content: data.response || '',
          tool_calls: data.tool_calls || [],
          artifacts: data.artifacts || [],
          loading: false,
        } : m
      ))
    } catch {
      setMessages(prev => prev.map(m =>
        m.loading ? { ...m, content: 'Bir hata oluştu. Tekrar deneyin.', loading: false } : m
      ))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm shrink-0 mt-0.5">
                🤖
              </div>
            )}

            <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>

              {/* Tool calls */}
              {(msg.tool_calls || []).length > 0 && (
                <div className="mb-2 space-y-1">
                  {(msg.tool_calls || []).map(tc => (
                    <div key={tc.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
                      <span>{TOOL_ICONS[tc.tool] || '🔧'}</span>
                      <span className="font-medium">{TOOL_LABELS[tc.tool] || tc.tool}</span>
                      <span className="text-gray-400">—</span>
                      <span className="text-gray-500">{tc.display}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Message bubble */}
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-sm'
                  : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm'
              }`}>
                {msg.loading ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>

              {/* Artifacts */}
              {(msg.artifacts || []).map((a, i) => (
                <ArtifactCard key={i} artifact={a} />
              ))}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                SİZ
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-400 mb-2">Hızlı başlangıç:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map(p => (
              <button key={p.label} onClick={() => send(p.prompt)}
                className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full hover:bg-emerald-100 transition-colors">
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
            placeholder="KRB oluştur, sunum hazırla, performans analizi yap..."
            rows={2}
            disabled={loading}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none disabled:opacity-60"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-colors text-sm font-medium shrink-0"
          >
            Gönder
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Enter ile gönder · Shift+Enter yeni satır</p>
      </div>
    </div>
  )
}
