import { createClient } from '@/lib/supabase/server'
import AgentTable from './AgentTable'

const fmt = (n: number) => n >= 1000000 ? `₺${(n/1000000).toFixed(1)}M` : `₺${n.toLocaleString('tr-TR')}`

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const officeId = profile?.office_id || '11111111-1111-1111-1111-111111111111'

  const [{ data: agents }, { data: metrics }] = await Promise.all([
    supabase.from('profiles').select('id,full_name,email,role').eq('office_id', officeId).neq('role','office_owner'),
    supabase.from('agent_metrics').select('*').eq('month', 3).eq('year', 2026),
  ])

  const metricsMap = Object.fromEntries((metrics || []).map(m => [m.agent_id, m]))
  const totalSales = (metrics || []).reduce((s, m) => s + (m.sales_count || 0), 0)
  const totalRevenue = (metrics || []).reduce((s, m) => s + (Number(m.revenue) || 0), 0)
  const totalClients = (metrics || []).reduce((s, m) => s + (m.client_count || 0), 0)
  const totalMeetings = (metrics || []).reduce((s, m) => s + (m.meetings_count || 0), 0)
  const avgConv = totalMeetings > 0 ? Math.round((totalSales / totalMeetings) * 100) : 0

  const agentRows = (agents || []).filter(a => metricsMap[a.id]).map(a => {
    const m = metricsMap[a.id]
    const pct = m?.target_sales > 0 ? Math.round((m.sales_count / m.target_sales) * 100) : 0
    const status: 'good'|'watch'|'critical' = pct >= 80 ? 'good' : pct >= 50 ? 'watch' : 'critical'
    return { ...a, m, pct, status }
  }).sort((a, b) => b.pct - a.pct)

  const criticalAgents = agentRows.filter(a => a.status === 'critical')

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Mart 2026 — {profile?.full_name}</p>
      </div>

      {criticalAgents.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span>⚠️</span>
            <span className="font-medium text-amber-800">AI Uyarısı:</span>
            <span className="text-amber-700">{criticalAgents[0].full_name} hedefe %{criticalAgents[0].pct} ulaştı</span>
          </div>
          <a href="/dashboard/egitim" className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700">Görüntüle →</a>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Aylık Satış', value: totalSales, sub: 'adet' },
          { label: 'Ciro', value: fmt(totalRevenue), sub: 'bu ay' },
          { label: 'Aktif Müşteri', value: totalClients, sub: 'kişi' },
          { label: 'Kapanış Oranı', value: `%${avgConv}`, sub: 'ortalama' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border p-5">
            <p className="text-xs text-gray-500">{k.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{k.value}</p>
            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AgentTable agents={agentRows} />
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Hızlı Erişim</h3>
            <div className="space-y-1">
              {[
                { href: '/dashboard/portfoy', icon: '🏠', label: 'Portföy' },
                { href: '/dashboard/musteriler', icon: '🤝', label: 'Müşteriler' },
                { href: '/dashboard/personel', icon: '👔', label: 'Personel' },
                { href: '/dashboard/egitim', icon: '🎓', label: 'Eğitim & Koçluk' },
                { href: '/dashboard/belgeler', icon: '📁', label: 'Belgeler' },
                { href: '/dashboard/mali', icon: '💰', label: 'Mali Durum' },
              ].map(item => (
                <a key={item.href} href={item.href} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
                  <span>{item.icon}</span><span>{item.label}</span><span className="ml-auto text-gray-300 text-xs">→</span>
                </a>
              ))}
            </div>
          </div>
          <div className="bg-emerald-700 rounded-xl p-4">
            <p className="text-white font-semibold text-sm mb-1">AI Koçluk</p>
            <p className="text-emerald-200 text-xs mb-3">Danışmanlarınız için koçluk seansı başlatın</p>
            <a href="/dashboard/egitim" className="block text-center bg-white text-emerald-700 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-50">Koçluk Yönet →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
