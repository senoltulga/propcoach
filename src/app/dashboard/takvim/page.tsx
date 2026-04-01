import { createClient } from '@/lib/supabase/server'

export default async function TakvimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('office_id').eq('id', user!.id).single()

  const officeId = profile?.office_id

  // Fetch upcoming coaching sessions as calendar items
  const { data: sessions } = await supabase
    .from('coaching_sessions')
    .select('*, profiles(full_name)')
    .eq('office_id', officeId)
    .eq('status', 'planned')
    .gte('session_date', new Date().toISOString())
    .order('session_date', { ascending: true })
    .limit(10)

  const today = new Date()
  const monthName = today.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Takvim</h1>
          <p className="text-sm text-gray-500 mt-0.5">{monthName}</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors">
          + Etkinlik Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Yaklaşan Etkinlikler</h2>
          {!sessions || sessions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <div className="text-3xl mb-2">📅</div>
              <div className="text-gray-400 text-sm">Planlanmış etkinlik yok</div>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((s: any) => {
                const date = new Date(s.session_date)
                const isToday = date.toDateString() === today.toDateString()
                return (
                  <div
                    key={s.id}
                    className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${isToday ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100'}`}
                  >
                    <div className={`text-center min-w-[48px] ${isToday ? 'text-emerald-700' : 'text-gray-500'}`}>
                      <div className="text-xs font-medium">{date.toLocaleDateString('tr-TR', { weekday: 'short' })}</div>
                      <div className="text-xl font-bold">{date.getDate()}</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        Koçluk Seansı — {s.profiles?.full_name || 'Danışman'}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        {s.duration_minutes && ` · ${s.duration_minutes} dk`}
                        {' · '}{s.program}
                      </div>
                    </div>
                    {isToday && (
                      <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">Bugün</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Integration CTA */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Entegrasyonlar</h2>
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
              <span className="text-xl">📆</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Google Takvim</div>
                <div className="text-xs text-gray-400">Senkronize değil</div>
              </div>
              <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Bağla</button>
            </div>
            <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg opacity-50">
              <span className="text-xl">📧</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Outlook</div>
                <div className="text-xs text-gray-400">Yakında</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
