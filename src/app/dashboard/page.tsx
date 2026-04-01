import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const fmt = (n: number) => n >= 1000000 ? `₺${(n / 1000000).toFixed(1)}M` : `₺${n.toLocaleString('tr-TR')}`
const initials = (name: string) => name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
const avatarColors = ['bg-emerald-100 text-emerald-700', 'bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700', 'bg-amber-100 text-amber-700', 'bg-pink-100 text-pink-700']

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const officeId = profile?.office_id || profile?.id

  const [
    { data: agents },
    { data: metrics },
    { data: listings },
    { data: sessions },
    { data: mandatory },
    { data: agentTrainings },
    { data: clients },
  ] = await Promise.all([
    supabase.from('profiles').select('id,full_name,email,role,avatar_url').eq('office_id', officeId).neq('role', 'office_owner'),
    supabase.from('agent_metrics').select('*').eq('month', 3).eq('year', 2026),
    supabase.from('listings').select('id,status,price,title,cover_image_url,agent_id').eq('office_id', officeId).limit(5),
    supabase.from('coaching_sessions').select('*,profiles(full_name)').eq('office_id', officeId).eq('status', 'planned').gte('session_date', new Date().toISOString()).order('session_date').limit(3),
    supabase.from('mandatory_trainings').select('*').eq('office_id', officeId).eq('is_active', true),
    supabase.from('agent_trainings').select('agent_id,mandatory_training_id').eq('office_id', officeId),
    supabase.from('clients').select('id,status,agent_id').eq('office_id', officeId),
  ])

  // KPI hesapla
  const metricsMap = Object.fromEntries((metrics || []).map(m => [m.agent_id, m]))
  const totalSales = (metrics || []).reduce((s, m) => s + (m.sales_count || 0), 0)
  const totalRevenue = (metrics || []).reduce((s, m) => s + (Number(m.revenue) || 0), 0)
  const totalClients = (clients || []).filter(c => c.status === 'active').length
  const totalMeetings = (metrics || []).reduce((s, m) => s + (m.meetings_count || 0), 0)
  const avgConv = totalMeetings > 0 ? Math.round((totalSales / totalMeetings) * 100) : 0
  const activeListings = (listings || []).filter(l => l.status === 'active').length

  // Danışman sıralama
  const agentRows = (agents || []).map((a, i) => {
    const m = metricsMap[a.id]
    const pct = m?.target_sales > 0 ? Math.round((m.sales_count / m.target_sales) * 100) : 0
    const status: 'good' | 'watch' | 'critical' = pct >= 80 ? 'good' : pct >= 50 ? 'watch' : 'critical'
    return { ...a, m, pct, status, colorIdx: i }
  }).sort((a, b) => b.pct - a.pct)

  const topAgents = agentRows.slice(0, 3)
  const criticalAgents = agentRows.filter(a => a.status === 'critical')

  // Eğitim tamamlama
  const completedMap: Record<string, Set<string>> = {}
  for (const t of (agentTrainings || [])) {
    if (t.mandatory_training_id) {
      if (!completedMap[t.mandatory_training_id]) completedMap[t.mandatory_training_id] = new Set()
      completedMap[t.mandatory_training_id].add(t.agent_id)
    }
  }
  const totalAgents = agentRows.length
  const trainingPct = mandatory && mandatory.length > 0
    ? Math.round(
        (mandatory || []).reduce((sum, m) => sum + (completedMap[m.id]?.size ?? 0), 0) /
        Math.max(mandatory.length * totalAgents, 1) * 100
      )
    : null

  const now = new Date()

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Başlık ────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} — {profile?.full_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
            {initials(profile?.full_name || '')}
          </div>
        </div>
      </div>

      {/* ── Uyarılar ─────────────────────────── */}
      {criticalAgents.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-red-500 text-base">⚠</span>
            <span className="font-semibold text-red-800">{criticalAgents.length} danışman kritik seviyede:</span>
            <span className="text-red-700">{criticalAgents.map(a => a.full_name).join(', ')}</span>
          </div>
          <Link href="/dashboard/egitim" className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
            Koçluk Planla →
          </Link>
        </div>
      )}

      {/* ── Ana KPI Kartları ─────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Aylık Satış</p>
            <span className="text-2xl">🏠</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalSales}</p>
          <p className="text-xs text-gray-400 mt-1">işlem tamamlandı</p>
          <div className="mt-3 h-1 bg-gray-100 rounded-full">
            <div className="h-1 bg-emerald-500 rounded-full" style={{ width: `${Math.min(totalSales * 10, 100)}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ciro</p>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{fmt(totalRevenue)}</p>
          <p className="text-xs text-gray-400 mt-1">bu ay toplam</p>
          <div className="mt-3 h-1 bg-gray-100 rounded-full">
            <div className="h-1 bg-violet-500 rounded-full" style={{ width: totalRevenue > 0 ? '70%' : '0%' }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Aktif Müşteri</p>
            <span className="text-2xl">🤝</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalClients}</p>
          <p className="text-xs text-gray-400 mt-1">portföyde takip</p>
          <div className="mt-3 h-1 bg-gray-100 rounded-full">
            <div className="h-1 bg-blue-500 rounded-full" style={{ width: `${Math.min(totalClients * 5, 100)}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Kapanış Oranı</p>
            <span className="text-2xl">🎯</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">%{avgConv}</p>
          <p className="text-xs text-gray-400 mt-1">{totalMeetings} görüşmeden</p>
          <div className="mt-3 h-1 bg-gray-100 rounded-full">
            <div className={`h-1 rounded-full ${avgConv >= 30 ? 'bg-emerald-500' : avgConv >= 15 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(avgConv * 2, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* ── Ana İçerik Grid ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* SOL: Danışman Performansı */}
        <div className="lg:col-span-2 space-y-6">

          {/* Danışman Performans Kartları */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">Danışman Performansı</h2>
              <Link href="/dashboard/danismanlar" className="text-xs text-emerald-600 hover:underline">Tümünü gör →</Link>
            </div>

            {agentRows.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Danışman verisi bulunamadı</p>
            ) : (
              <div className="space-y-4">
                {agentRows.map((a, i) => {
                  const barCol = a.status === 'good' ? 'bg-emerald-500' : a.status === 'watch' ? 'bg-yellow-500' : 'bg-red-500'
                  const badgeBg = a.status === 'good' ? 'bg-emerald-100 text-emerald-700' : a.status === 'watch' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
                  const badgeLabel = a.status === 'good' ? 'İyi' : a.status === 'watch' ? 'Takipte' : 'Kritik'
                  return (
                    <div key={a.id} className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                        {initials(a.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-800 truncate">{a.full_name}</span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs text-gray-500">{a.m?.sales_count ?? 0} satış · {fmt(Number(a.m?.revenue) || 0)}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badgeBg}`}>{badgeLabel}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className={`h-2 rounded-full transition-all ${barCol}`} style={{ width: `${Math.min(a.pct, 100)}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-8 text-right">%{a.pct}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Alt satır: Son İlanlar + Yaklaşan Seanslar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Son İlanlar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Son İlanlar</h2>
                <Link href="/dashboard/portfoy" className="text-xs text-emerald-600 hover:underline">Tümü →</Link>
              </div>
              <div className="space-y-3">
                {!listings || listings.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">İlan bulunamadı</p>
                ) : listings.slice(0, 4).map((l: any) => (
                  <div key={l.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {l.cover_image_url
                        ? <img src={l.cover_image_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-lg">🏠</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{l.title}</p>
                      <p className="text-xs text-gray-400">{fmt(Number(l.price) || 0)}</p>
                    </div>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                      l.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      l.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {l.status === 'active' ? 'Aktif' : l.status === 'sold' ? 'Satıldı' : 'Pasif'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Yaklaşan Seanslar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Yaklaşan Seanslar</h2>
                <Link href="/dashboard/takvim" className="text-xs text-emerald-600 hover:underline">Takvim →</Link>
              </div>
              <div className="space-y-3">
                {!sessions || sessions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Planlanmış seans yok</p>
                ) : sessions.map((s: any) => {
                  const d = new Date(s.session_date)
                  const isToday = d.toDateString() === now.toDateString()
                  return (
                    <div key={s.id} className={`flex items-center gap-3 p-2 rounded-lg ${isToday ? 'bg-emerald-50' : ''}`}>
                      <div className={`text-center w-10 shrink-0 ${isToday ? 'text-emerald-700' : 'text-gray-500'}`}>
                        <div className="text-xs font-medium uppercase">{d.toLocaleDateString('tr-TR', { weekday: 'short' })}</div>
                        <div className="text-lg font-bold leading-none">{d.getDate()}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{s.profiles?.full_name}</p>
                        <p className="text-xs text-gray-400">{d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} · {s.program}</p>
                      </div>
                      {isToday && <span className="text-xs bg-emerald-600 text-white px-1.5 py-0.5 rounded-full shrink-0">Bugün</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

        </div>

        {/* SAĞ: Sidebar */}
        <div className="space-y-5">

          {/* Ofis Özeti */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Ofis Özeti</h2>
            <div className="space-y-3">
              {[
                { label: 'Danışman', value: totalAgents, icon: '👤', color: 'text-violet-600' },
                { label: 'Aktif İlan', value: activeListings, icon: '🏠', color: 'text-emerald-600' },
                { label: 'Aktif Müşteri', value: totalClients, icon: '🤝', color: 'text-blue-600' },
                { label: 'Bu Ay Satış', value: totalSales, icon: '✅', color: 'text-emerald-600' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <span className={`font-bold text-sm ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Eğitim Tamamlama */}
          {mandatory && mandatory.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Zorunlu Eğitimler</h2>
                <Link href="/dashboard/egitim" className="text-xs text-emerald-600 hover:underline">Yönet →</Link>
              </div>
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke={trainingPct === 100 ? '#10b981' : trainingPct! >= 60 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="3"
                      strokeDasharray={`${trainingPct ?? 0} ${100 - (trainingPct ?? 0)}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">%{trainingPct ?? 0}</span>
                    <span className="text-[10px] text-gray-400">tamamlandı</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {mandatory.slice(0, 3).map((m: any) => {
                  const done = completedMap[m.id]?.size ?? 0
                  const pct = totalAgents > 0 ? Math.round((done / totalAgents) * 100) : 0
                  const isOverdue = m.deadline && new Date(m.deadline) < now
                  return (
                    <div key={m.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs truncate ${isOverdue && pct < 100 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {isOverdue && pct < 100 ? '⚠ ' : ''}{m.title}
                        </span>
                        <span className="text-xs text-gray-400 ml-1 shrink-0">{done}/{totalAgents}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className={`h-1.5 rounded-full ${pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* En İyi Danışmanlar */}
          {topAgents.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">En İyi Danışmanlar</h2>
              <div className="space-y-3">
                {topAgents.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <span className="text-base shrink-0">{['🥇', '🥈', '🥉'][i]}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${avatarColors[a.colorIdx % avatarColors.length]}`}>
                      {initials(a.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{a.full_name}</p>
                      <p className="text-xs text-gray-400">{a.m?.sales_count ?? 0} satış · %{a.pct}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hızlı Erişim */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Hızlı Erişim</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/dashboard/portfoy', icon: '🏠', label: 'Portföy' },
                { href: '/dashboard/musteriler', icon: '🤝', label: 'Müşteriler' },
                { href: '/dashboard/egitim', icon: '🎓', label: 'Eğitim' },
                { href: '/dashboard/belgeler', icon: '📁', label: 'Belgeler' },
                { href: '/dashboard/mail', icon: '📧', label: 'Mail' },
                { href: '/dashboard/mali', icon: '💰', label: 'Mali' },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 text-sm text-gray-600 transition-colors">
                  <span>{item.icon}</span>
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* AI Koçluk CTA */}
          <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-2xl p-5">
            <p className="text-white font-semibold text-sm mb-1">🤖 AI Koçluk Asistanı</p>
            <p className="text-emerald-200 text-xs mb-4">Danışmanlarınız için özelleştirilmiş koçluk programları</p>
            <Link href="/dashboard/egitim"
              className="block text-center bg-white text-emerald-700 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors">
              Koçluk Yönet →
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
