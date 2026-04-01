import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'
import { getClientWithTokens } from '@/lib/google'
import Link from 'next/link'

interface GoogleEvent {
  id?: string | null
  summary?: string | null
  location?: string | null
  start?: { dateTime?: string | null; date?: string | null } | null
  end?: { dateTime?: string | null; date?: string | null } | null
}

export default async function TakvimPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('office_id')
    .eq('id', user!.id)
    .single()

  const officeId = profile?.office_id

  // Google entegrasyonunu kontrol et
  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', user!.id)
    .eq('provider', 'google')
    .single()

  const today = new Date()
  const monthName = today.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })

  // Google bağlıysa Calendar'dan etkinlikleri çek
  if (integration?.access_token) {
    let googleEvents: GoogleEvent[] = []
    let fetchError = false
    const connectedEmail: string | null = integration.google_email || null

    try {
      const auth = getClientWithTokens(
        integration.access_token,
        integration.refresh_token
      )
      const calendar = google.calendar({ version: 'v3', auth })

      const { data } = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 20,
        singleEvents: true,
        orderBy: 'startTime',
      })
      googleEvents = data.items || []
    } catch {
      fetchError = true
    }

    if (fetchError) {
      return (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Takvim</h1>
              <p className="text-sm text-gray-500 mt-0.5">{monthName}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-red-100 p-8 text-center">
            <div className="text-3xl mb-3">⚠️</div>
            <div className="text-gray-700 font-medium mb-1">Takvim yüklenemedi</div>
            <div className="text-gray-400 text-sm mb-4">
              Google Calendar&apos;a bağlanırken bir hata oluştu.
            </div>
            <Link
              href="/dashboard/ayarlar"
              className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium underline underline-offset-2"
            >
              Ayarlara git
            </Link>
          </div>
        </div>
      )
    }

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Takvim</h1>
            <p className="text-sm text-gray-500 mt-0.5">{monthName}</p>
          </div>
          <button
            disabled
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg opacity-50 cursor-not-allowed flex items-center gap-2"
            title="Yakında"
          >
            + Etkinlik Ekle
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">Yakında</span>
          </button>
        </div>

        {/* Bağlı hesap bilgisi */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-lg w-fit">
          <span className="text-sm">📆</span>
          <span className="text-sm text-emerald-700 font-medium">Google Takvim Bağlı</span>
          {connectedEmail && (
            <span className="text-xs text-emerald-600 opacity-75">— {connectedEmail}</span>
          )}
        </div>

        {/* Etkinlik listesi */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Yaklaşan Etkinlikler</h2>
          {googleEvents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <div className="text-3xl mb-2">📅</div>
              <div className="text-gray-400 text-sm">Yaklaşan etkinlik bulunamadı</div>
            </div>
          ) : (
            <div className="space-y-2">
              {googleEvents.map((event) => {
                const startStr = event.start?.dateTime || event.start?.date
                const endStr = event.end?.dateTime || event.end?.date
                const startDate = startStr ? new Date(startStr) : null
                const endDate = endStr ? new Date(endStr) : null
                const isAllDay = !event.start?.dateTime
                const isToday =
                  startDate
                    ? startDate.toDateString() === today.toDateString()
                    : false

                return (
                  <div
                    key={event.id}
                    className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${
                      isToday
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-gray-100'
                    }`}
                  >
                    {/* Tarih bloğu */}
                    <div
                      className={`text-center min-w-[52px] ${
                        isToday ? 'text-emerald-700' : 'text-gray-500'
                      }`}
                    >
                      {startDate ? (
                        <>
                          <div className="text-xs font-medium uppercase">
                            {startDate.toLocaleDateString('tr-TR', { weekday: 'short' })}
                          </div>
                          <div className="text-xl font-bold leading-none mt-0.5">
                            {startDate.getDate()}
                          </div>
                          <div className="text-[10px] opacity-60">
                            {startDate.toLocaleDateString('tr-TR', { month: 'short' })}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400">—</div>
                      )}
                    </div>

                    {/* Etkinlik detayı */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {event.summary || '(Başlıksız etkinlik)'}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        {isAllDay ? (
                          <span>Tüm gün</span>
                        ) : (
                          startDate && (
                            <span>
                              {startDate.toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {endDate && (
                                <>
                                  {' – '}
                                  {endDate.toLocaleTimeString('tr-TR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </>
                              )}
                            </span>
                          )
                        )}
                        {event.location && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="truncate max-w-[200px]">{event.location}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {isToday && (
                      <span className="shrink-0 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        Bugün
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Google bağlı değil — coaching_sessions göster + CTA
  const { data: sessions } = await supabase
    .from('coaching_sessions')
    .select('*, profiles(full_name)')
    .eq('office_id', officeId)
    .eq('status', 'planned')
    .gte('session_date', new Date().toISOString())
    .order('session_date', { ascending: true })
    .limit(10)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Takvim</h1>
          <p className="text-sm text-gray-500 mt-0.5">{monthName}</p>
        </div>
        <button
          disabled
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg opacity-50 cursor-not-allowed flex items-center gap-2"
          title="Yakında"
        >
          + Etkinlik Ekle
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">Yakında</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Koçluk seansları */}
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
                    className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${
                      isToday
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-gray-100'
                    }`}
                  >
                    <div
                      className={`text-center min-w-[52px] ${
                        isToday ? 'text-emerald-700' : 'text-gray-500'
                      }`}
                    >
                      <div className="text-xs font-medium uppercase">
                        {date.toLocaleDateString('tr-TR', { weekday: 'short' })}
                      </div>
                      <div className="text-xl font-bold leading-none mt-0.5">{date.getDate()}</div>
                      <div className="text-[10px] opacity-60">
                        {date.toLocaleDateString('tr-TR', { month: 'short' })}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        Koçluk Seansı — {s.profiles?.full_name || 'Danışman'}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {date.toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {s.duration_minutes && ` · ${s.duration_minutes} dk`}
                        {s.program && ` · ${s.program}`}
                      </div>
                    </div>
                    {isToday && (
                      <span className="shrink-0 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        Bugün
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Google Takvim CTA */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Entegrasyonlar</h2>
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            {/* Google Takvim Bağla */}
            <div className="flex items-start gap-3 p-4 border border-emerald-100 bg-emerald-50 rounded-xl">
              <span className="text-2xl mt-0.5">📆</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">Google Takvim</div>
                <div className="text-xs text-gray-500 mt-0.5 mb-3">
                  Gerçek etkinliklerinizi takvimde görmek için Google hesabınızı bağlayın.
                </div>
                <Link
                  href="/dashboard/ayarlar"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Google Takvim Bağla
                </Link>
              </div>
            </div>

            {/* Outlook — yakında */}
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
