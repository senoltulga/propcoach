import { createClient } from '@/lib/supabase/server'

const avatarColor = (i: number) => ['bg-emerald-100 text-emerald-700','bg-violet-100 text-violet-700','bg-red-100 text-red-700','bg-blue-100 text-blue-700'][i % 4]
const initials = (name: string) => name?.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()
const fmt = (n: number) => n >= 1000000 ? `₺${(n/1000000).toFixed(1)}M` : `₺${n.toLocaleString('tr-TR')}`

export default async function DanismanlarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('office_id').eq('id', user!.id).single()
  const officeId = profile?.office_id || '11111111-1111-1111-1111-111111111111'

  const [{ data: agents }, { data: metrics }] = await Promise.all([
    supabase.from('profiles').select('*').eq('office_id', officeId).neq('role','office_owner'),
    supabase.from('agent_metrics').select('*').eq('month', 3).eq('year', 2026),
  ])

  const metricsMap = Object.fromEntries((metrics || []).map(m => [m.agent_id, m]))
  const rows = (agents || []).map((a, i) => {
    const m = metricsMap[a.id]
    const pct = m?.target_sales > 0 ? Math.round((m.sales_count / m.target_sales) * 100) : 0
    const status = pct >= 80 ? 'good' : pct >= 50 ? 'watch' : 'critical'
    return { ...a, m, pct, status, i }
  }).sort((a, b) => b.pct - a.pct)

  const badge = (s: string) => s === 'good' ? 'bg-green-100 text-green-700' : s === 'watch' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
  const label = (s: string) => s === 'good' ? 'İyi' : s === 'watch' ? 'Takipte' : 'Kritik'
  const bar = (s: string) => s === 'good' ? 'bg-green-500' : s === 'watch' ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold">Danışmanlar</h1><p className="text-sm text-gray-500 mt-1">{rows.length} danışman</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((a) => (
          <div key={a.id} className={`bg-white rounded-xl border p-5 ${a.status === 'critical' ? 'border-red-200' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${avatarColor(a.i)}`}>{initials(a.full_name)}</div>
                <div><div className="font-semibold">{a.full_name}</div><div className="text-xs text-gray-400">{a.email}</div></div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge(a.status)}`}>{label(a.status)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-50 rounded-lg p-2 text-center"><div className="text-lg font-bold">{a.m?.sales_count ?? 0}</div><div className="text-xs text-gray-400">Satış</div></div>
              <div className="bg-gray-50 rounded-lg p-2 text-center"><div className="text-lg font-bold">{a.m?.client_count ?? 0}</div><div className="text-xs text-gray-400">Müşteri</div></div>
              <div className="bg-gray-50 rounded-lg p-2 text-center"><div className="text-sm font-bold">{fmt(Number(a.m?.revenue)||0)}</div><div className="text-xs text-gray-400">Ciro</div></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Hedefe ulaşma</span><span className="font-semibold">%{a.pct}</span></div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-3"><div className={`h-2 rounded-full ${bar(a.status)}`} style={{ width: `${Math.min(a.pct,100)}%` }} /></div>
            <div className="flex justify-end">
              <a
                href={`/api/pdf/cv?agent_id=${a.id}`}
                target="_blank"
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium border border-emerald-200 px-2 py-1 rounded-lg"
              >
                CV İndir ↓
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
