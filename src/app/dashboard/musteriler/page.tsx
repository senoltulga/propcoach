import { createClient } from '@/lib/supabase/server'

const fmt = (n: number) => `₺${Number(n).toLocaleString('tr-TR')}`

export default async function MusterilerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('office_id').eq('id', user!.id).single()
  const officeId = profile?.office_id || '11111111-1111-1111-1111-111111111111'

  const { data: agentIds } = await supabase.from('profiles').select('id').eq('office_id', officeId)
  const ids = (agentIds || []).map(a => a.id)
  const { data: clients } = await supabase.from('clients').select('*,profiles(full_name)').in('agent_id', ids).order('created_at', { ascending: false })

  const active = (clients || []).filter(c => c.status === 'active').length
  const risk = (clients || []).filter(c => c.status === 'risk').length

  const statusBadge = (s: string) =>
    s === 'active' ? 'bg-green-100 text-green-700' :
    s === 'risk' ? 'bg-red-100 text-red-700' :
    s === 'cold' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
  const statusLabel = (s: string) =>
    s === 'active' ? 'Görüşmede' : s === 'risk' ? 'Kayıp Risk' : s === 'cold' ? 'Soğudu' : s === 'closed' ? 'Kapandı' : s

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold">Müşteriler</h1><p className="text-sm text-gray-500 mt-1">{clients?.length || 0} müşteri · {risk} kayıp riski</p></div>
      </div>

      {risk > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">
          ⚠️ <strong>{risk} müşteri kayıp riski</strong> — 10+ gün temas yok
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-gray-500">Toplam</p><p className="text-2xl font-bold mt-1">{clients?.length || 0}</p></div>
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-gray-500">Aktif</p><p className="text-2xl font-bold mt-1 text-green-700">{active}</p></div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4"><p className="text-xs text-red-700">Kayıp Risk</p><p className="text-2xl font-bold mt-1 text-red-700">{risk}</p></div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-xs text-gray-500 border-b">
            <th className="px-4 py-3 text-left">Müşteri</th>
            <th className="px-4 py-3 text-left">Danışman</th>
            <th className="px-4 py-3 text-left">Bütçe</th>
            <th className="px-4 py-3 text-left">İlgi</th>
            <th className="px-4 py-3 text-left">Durum</th>
          </tr></thead>
          <tbody>
            {(clients || []).map(c => (
              <tr key={c.id} className={`border-b hover:bg-gray-50 ${c.status === 'risk' ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-3 font-medium">{c.full_name}{c.status === 'risk' ? ' ⚠️' : ''}</td>
                <td className="px-4 py-3 text-gray-500">{c.profiles?.full_name || '—'}</td>
                <td className="px-4 py-3">{fmt(c.budget || 0)}</td>
                <td className="px-4 py-3 text-gray-500">{c.interest || '—'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(c.status)}`}>{statusLabel(c.status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
