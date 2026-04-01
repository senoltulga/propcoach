import AgentChat from './AgentChat'

export default function AsistanPage() {
  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-0px)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-xl">
          🤖
        </div>
        <div>
          <h1 className="font-bold text-gray-900">AI Asistan</h1>
          <p className="text-xs text-gray-500">KRB · Sunum · Performans · Takvim · Mail</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Claude ile çalışıyor
        </div>
      </div>

      {/* Araçlar */}
      <div className="px-6 py-3 border-b border-gray-50 bg-gray-50 flex items-center gap-2 flex-wrap shrink-0">
        <span className="text-xs text-gray-400 font-medium">Araçlar:</span>
        {[
          { icon: '🔍', label: 'İlan Arama' },
          { icon: '📊', label: 'Performans' },
          { icon: '📄', label: 'KRB Raporu' },
          { icon: '🎨', label: 'Sunum' },
          { icon: '🎯', label: 'Lead & CRM' },
          { icon: '📅', label: 'Randevu' },
          { icon: '📧', label: 'Mail' },
          { icon: '🎓', label: 'Eğitim' },
        ].map(t => (
          <span key={t.label} className="inline-flex items-center gap-1 text-xs text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-full">
            {t.icon} {t.label}
          </span>
        ))}
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <AgentChat />
      </div>
    </div>
  )
}
