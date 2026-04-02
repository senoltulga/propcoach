import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AddMyTrainingButton from './AddMyTrainingButton'
import SeedButton from './SeedButton'

export default async function PanelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (profile?.role === 'office_owner' || profile?.role === 'office_manager') {
    redirect('/dashboard')
  }

  const officeId = profile?.office_id

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const [
    { data: metrics },
    { data: clients },
    { data: listings },
    { data: myTrainings },
    { data: mandatory },
  ] = await Promise.all([
    supabase
      .from('agent_metrics')
      .select('*')
      .eq('agent_id', user.id)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .maybeSingle(),
    supabase
      .from('clients')
      .select('*')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('listings')
      .select('*')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('agent_trainings')
      .select('*')
      .eq('agent_id', user.id)
      .order('training_date', { ascending: false }),
    supabase
      .from('mandatory_trainings')
      .select('*')
      .eq('office_id', officeId)
      .eq('is_active', true)
      .order('deadline', { ascending: true }),
  ])

  const salesCount = metrics?.sales_count ?? 0
  const revenue = metrics?.revenue ?? 0
  const clientCount = metrics?.client_count ?? 0
  const meetingsCount = metrics?.meetings_count ?? 0
  const targetSales = metrics?.target_sales ?? 10
  const targetRate = Math.round((salesCount / Math.max(targetSales, 1)) * 100)
  const convRate = Math.round((salesCount / Math.max(meetingsCount, 1)) * 100)

  const formatMoney = (n: number) =>
    n >= 1000000 ? `₺${(n / 1000000).toFixed(1)}M` : `₺${n.toLocaleString('tr-TR')}`

  const statusDot = targetRate >= 80 ? 'bg-green-500' : targetRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  const statusLabel = targetRate >= 80 ? 'Hedefe ulaşıyor' : targetRate >= 50 ? 'Takipte' : 'Kritik seviye'
  const statusColor = targetRate >= 80 ? 'text-green-700 bg-green-50' : targetRate >= 50 ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50'

  const completedMandatoryIds = new Set((myTrainings || []).map((t: any) => t.mandatory_training_id).filter(Boolean))

  const categoryLabel: Record<string, string> = {
    hukuki: 'Hukuki', satis: 'Satış', teknik: 'Teknik',
    kisisel_gelisim: 'Kişisel Gelişim', genel: 'Genel',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <span className="text-base font-bold text-emerald-700">PropCoach</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-xs">
              {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'D'}
            </div>
            <span className="text-sm text-gray-700">{profile?.full_name || user.email}</span>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button className="text-sm text-red-500 hover:underline">Çıkış</button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* Başlık + durum */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Merhaba, {profile?.full_name?.split(' ')[0] || 'Danışman'} 👋</h1>
            <p className="text-gray-500 text-sm mt-1">{now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} performans özeti</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
            {statusLabel}
          </span>
        </div>

        {/* KPI kartları */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-xs text-gray-500 mb-1">Satış</p>
            <p className="text-3xl font-bold text-gray-900">{salesCount}</p>
            <p className="text-xs text-gray-400 mt-1">/ {targetSales} hedef</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-xs text-gray-500 mb-1">Ciro</p>
            <p className="text-3xl font-bold text-gray-900">{formatMoney(revenue)}</p>
            <p className="text-xs text-gray-400 mt-1">bu ay</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-xs text-gray-500 mb-1">Aktif Müşteri</p>
            <p className="text-3xl font-bold text-gray-900">{clientCount}</p>
            <p className="text-xs text-gray-400 mt-1">kişi</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-xs text-gray-500 mb-1">Kapanış Oranı</p>
            <p className="text-3xl font-bold text-gray-900">%{convRate}</p>
            <p className="text-xs text-gray-400 mt-1">{meetingsCount} görüşmeden</p>
          </div>
        </div>

        {/* Demo veri yoksa yükleme butonu */}
        {!metrics && !clients?.length && !listings?.length && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-blue-800">Henüz veri yok</p>
              <p className="text-xs text-blue-600 mt-0.5">Demo veriler yükleyerek tüm modüllerin çalışmasını görebilirsiniz.</p>
            </div>
            <SeedButton />
          </div>
        )}

        {/* Hedefe ulaşma */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Aylık Hedef İlerlemesi</h2>
            <span className="text-sm font-semibold text-gray-700">%{targetRate}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${targetRate >= 80 ? 'bg-green-500' : targetRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(targetRate, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-400">{salesCount} satış tamamlandı</span>
            <span className="text-xs text-gray-400">{targetSales} satış hedefi</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* Müşteriler */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Müşterilerim ({clients?.length ?? 0})</h2>
            </div>
            {!clients || clients.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Henüz müşteri yok</p>
            ) : (
              <div className="space-y-3">
                {clients.slice(0, 5).map((c: { id: string; full_name: string; status: string; budget: number }) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-semibold">
                        {c.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.full_name}</p>
                        <p className="text-xs text-gray-400">{formatMoney(c.budget)} bütçe</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.status === 'active' ? 'bg-green-100 text-green-700' :
                      c.status === 'closed' ? 'bg-gray-100 text-gray-500' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {c.status === 'active' ? 'Aktif' : c.status === 'closed' ? 'Kapandı' : 'Takipte'}
                    </span>
                  </div>
                ))}
                {(clients?.length ?? 0) > 5 && (
                  <p className="text-xs text-gray-400 text-center pt-1">+{clients!.length - 5} daha</p>
                )}
              </div>
            )}
          </div>

          {/* İlanlar */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-gray-900">İlanlarım ({listings?.length ?? 0})</h2>
            </div>
            {!listings || listings.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Henüz ilan yok</p>
            ) : (
              <div className="space-y-3">
                {listings.slice(0, 5).map((l: { id: string; title: string; price: number; status: string; days_on_market: number }) => (
                  <div key={l.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-48">{l.title}</p>
                      <p className="text-xs text-gray-400">{formatMoney(l.price)} · {l.days_on_market} gün</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      l.status === 'active' ? 'bg-green-100 text-green-700' :
                      l.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {l.status === 'active' ? 'Aktif' : l.status === 'sold' ? 'Satıldı' : 'Pasif'}
                    </span>
                  </div>
                ))}
                {(listings?.length ?? 0) > 5 && (
                  <p className="text-xs text-gray-400 text-center pt-1">+{listings!.length - 5} daha</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Eğitimler ───────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* Zorunlu Eğitimler */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Zorunlu Eğitimler</h2>
            {!mandatory || mandatory.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Zorunlu eğitim tanımlanmamış</p>
            ) : (
              <div className="space-y-3">
                {mandatory.map((m: any) => {
                  const done = completedMandatoryIds.has(m.id)
                  const isOverdue = m.deadline && new Date(m.deadline) < new Date() && !done
                  return (
                    <div key={m.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                      done ? 'border-emerald-100 bg-emerald-50' :
                      isOverdue ? 'border-red-100 bg-red-50' :
                      'border-gray-100'
                    }`}>
                      <span className={`mt-0.5 text-base ${done ? 'text-emerald-500' : 'text-gray-300'}`}>
                        {done ? '✓' : '○'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${done ? 'text-emerald-800 line-through' : 'text-gray-900'}`}>
                          {m.title}
                        </p>
                        <p className={`text-xs mt-0.5 ${
                          isOverdue ? 'text-red-500 font-medium' :
                          done ? 'text-emerald-600' : 'text-gray-400'
                        }`}>
                          {done ? 'Tamamlandı' :
                           isOverdue ? `⚠️ Gecikmiş — ${new Date(m.deadline).toLocaleDateString('tr-TR')}` :
                           m.deadline ? `Son: ${new Date(m.deadline).toLocaleDateString('tr-TR')}` : ''}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Aldığım Eğitimler */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Aldığım Eğitimler</h2>
              <AddMyTrainingButton />
            </div>
            {!myTrainings || myTrainings.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Henüz eğitim kaydı yok</p>
            ) : (
              <div className="space-y-3">
                {myTrainings.slice(0, 6).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {categoryLabel[t.category] ?? t.category} · {new Date(t.training_date).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    {t.score != null && (
                      <span className={`ml-3 shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        t.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                        t.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-600'
                      }`}>{t.score}</span>
                    )}
                  </div>
                ))}
                {myTrainings.length > 6 && (
                  <p className="text-xs text-gray-400 text-center pt-1">+{myTrainings.length - 6} daha</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Koçluk Kartı */}
        <div className="bg-emerald-700 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-white font-semibold text-base mb-1">AI Koçunuzla görüşün</h3>
            <p className="text-emerald-200 text-sm">Performansınıza göre kişiselleştirilmiş öneriler alın.</p>
          </div>
          <a href="/panel/kocluk" className="bg-white text-emerald-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition">
            Koçluk seansı başlat
          </a>
        </div>

      </main>
    </div>
  )
}
