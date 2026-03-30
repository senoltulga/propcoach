import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/giris')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">PropCoach</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{profile?.full_name || user.email}</span>
          <form action="/api/auth/signout" method="POST">
            <button className="text-sm text-red-500 hover:underline">Çıkış</button>
          </form>
        </div>
      </header>

      {/* Ana içerik */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Hoş geldiniz 👋</h2>
          <p className="text-gray-500 mt-1">Ofis performansınızı buradan takip edin.</p>
        </div>

        {/* KPI Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Aylık Satış', value: '0', unit: 'adet', color: 'blue' },
            { label: 'Ciro', value: '₺0', unit: 'bu ay', color: 'green' },
            { label: 'Aktif Müşteri', value: '0', unit: 'kişi', color: 'purple' },
            { label: 'Kapanış Oranı', value: '%0', unit: 'ortalama', color: 'orange' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-xl p-5 shadow-sm border">
              <p className="text-sm text-gray-500">{kpi.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{kpi.value}</p>
              <p className="text-xs text-gray-400 mt-1">{kpi.unit}</p>
            </div>
          ))}
        </div>

        {/* Danışman Tablosu Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Danışmanlar</h3>
            <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              + Danışman Ekle
            </button>
          </div>
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">Henüz danışman eklenmedi</p>
            <p className="text-sm mt-1">Danışman ekleyerek performans takibine başlayın</p>
          </div>
        </div>
      </main>
    </div>
  )
}
