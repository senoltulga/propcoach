'use client'

import { useState } from 'react'

const PROGRAMS = [
  { id: 'serbest',   label: 'Serbest Görüşme',    icon: '💬', desc: 'Aklındaki her konuyu konuş' },
  { id: 'satis',     label: 'Satış Koçluğu',       icon: '🎯', desc: 'Kapanış ve itiraz yönetimi' },
  { id: 'musteri',   label: 'Müşteri Yönetimi',    icon: '🤝', desc: 'İlişki kurma ve takip' },
  { id: 'portfoy',   label: 'Portföy Stratejisi',  icon: '🏠', desc: 'Fiyatlama ve KRB hazırlama' },
  { id: 'hedef',     label: 'Hedef Belirleme',      icon: '📊', desc: 'Aylık plan ve öncelikler' },
  { id: 'motivasyon',label: 'Motivasyon & Gelişim', icon: '🚀', desc: 'Engeller ve güçlü yönler' },
]

export default function KoclukPage() {
  const [program, setProgram] = useState<string | null>(null)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const startProgram = (id: string) => {
    setProgram(id)
    const prog = PROGRAMS.find(p => p.id === id)!
    setMessages([{
      role: 'assistant',
      content: `Merhaba! Ben PropCoach AI koçunuzum. **${prog.label}** programına hoş geldiniz.\n\n${getWelcome(id)}`
    }])
  }

  const getWelcome = (id: string) => {
    const map: Record<string, string> = {
      serbest: 'Bugün ne hakkında konuşmak istersiniz? Her konuda yardımcı olmaya hazırım.',
      satis: 'Satış sürecinizde en çok hangi adımda zorlanıyorsunuz? Kapanış mı, itiraz yönetimi mi, yoksa ilk temas mı?',
      musteri: 'Şu anda takipte olduğunuz müşteri sayısı kaç? Hangi müşterinizle ilgili stratejik destek almak istersiniz?',
      portfoy: 'Portföyünüzdeki ilanları gözden geçirelim. 90 günü aşan ilan var mı? KRB hazırladınız mı?',
      hedef: 'Bu ay hedefiniz kaç satış? Mart ayının kalanında ulaşılabilir bir plan yapalım.',
      motivasyon: 'Bugün nasıl hissediyorsunuz? Engel oluşturan bir durum var mı, konuşalım.',
    }
    return map[id] || 'Size nasıl yardımcı olabilirim?'
  }

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program, messages: [...messages, { role: 'user', content: userMsg }] }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Bir hata oluştu.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Bağlantı hatası. Lütfen tekrar deneyin.' }])
    } finally {
      setLoading(false)
    }
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <a href="/panel" className="text-gray-400 hover:text-gray-600 text-sm">← Panele Dön</a>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Koçluk Seansı</h1>
          <p className="text-gray-500 text-sm mb-8">Bir program seçin ve koçluk seansınızı başlatın.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PROGRAMS.map(p => (
              <button
                key={p.id}
                onClick={() => startProgram(p.id)}
                className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-emerald-400 hover:shadow-sm transition-all group"
              >
                <div className="text-2xl mb-2">{p.icon}</div>
                <div className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">{p.label}</div>
                <div className="text-xs text-gray-500 mt-1">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const prog = PROGRAMS.find(p => p.id === program)!

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => { setProgram(null); setMessages([]) }} className="text-gray-400 hover:text-gray-600">←</button>
        <span className="text-lg">{prog.icon}</span>
        <div>
          <div className="text-sm font-semibold text-gray-900">{prog.label}</div>
          <div className="text-xs text-emerald-600">PropCoach AI</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0 mt-0.5">AI</div>
            )}
            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-emerald-600 text-white rounded-br-sm'
                : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">AI</div>
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4 flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Mesajınızı yazın..."
            disabled={loading}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
