import { createClient } from '@/lib/supabase/server'

function fmt(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)
}

export default async function MaliPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('office_id').eq('id', user!.id).single()

  const officeId = profile?.office_id

  const { data: metrics } = await supabase
    .from('agent_metrics')
    .select('*, profiles(full_name)')
    .eq('office_id', officeId)
    .order('total_revenue', { ascending: false })

  const totalRevenue = metrics?.reduce((s: number, m: any) => s + (m.total_revenue || 0), 0) || 0
  const totalSales = metrics?.reduce((s: number, m: any) => s + (m.total_sales || 0), 0) || 0
  const totalListings = metrics?.reduce((s: number, m: any) => s + (m.active_listings || 0), 0) || 0
  const avgRevenue = metrics && metrics.length > 0 ? totalRevenue / metrics.length : 0

  const kpis = [
    { label: 'Toplam Ciro', value: fmt(totalRevenue), color: 'text-emerald-700' },
    { label: 'Toplam Satış', value: `${totalSales} adet`, color: 'text-blue-700' },
    { label: 'Aktif İlan', value: `${totalListings} adet`, color: 'text-purple-700' },
    { label: 'Danışman Başı Ort.', value: fmt(avgRevenue), color: 'text-orange-700' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mali Durum</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ofis gelir ve performans özeti</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-xs text-gray-400 mb-1">{k.label}</div>
            <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Agent Revenue Table */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Danışman Bazlı Gelir</h2>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {!metrics || metrics.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Veri bulunamadı.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Danışman</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Satış</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Ciro</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Aktif İlan</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Pay %</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m: any) => {
                  const share = totalRevenue > 0 ? ((m.total_revenue || 0) / totalRevenue * 100).toFixed(1) : '0'
                  return (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{m.profiles?.full_name || '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{m.total_sales || 0}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">{fmt(m.total_revenue || 0)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{m.active_listings || 0}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8">%{share}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td className="px-4 py-3 font-bold text-gray-900">Toplam</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{totalSales}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700">{fmt(totalRevenue)}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{totalListings}</td>
                  <td className="px-4 py-3 text-right text-xs text-gray-400">%100</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
        Detaylı muhasebe entegrasyonu (fatura, gider, vergi) bir sonraki fazda eklenecek.
      </div>
    </div>
  )
}
