'use client'

const statusBadge = (s: string) => s === 'good' ? 'bg-green-100 text-green-700' : s === 'watch' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
const statusLabel = (s: string) => s === 'good' ? 'İyi' : s === 'watch' ? 'Takipte' : 'Kritik'
const barColor = (s: string) => s === 'good' ? 'bg-green-500' : s === 'watch' ? 'bg-yellow-500' : 'bg-red-500'
const avatarColor = (i: number) => ['bg-emerald-100 text-emerald-700','bg-violet-100 text-violet-700','bg-red-100 text-red-700','bg-blue-100 text-blue-700'][i % 4]
const initials = (name: string) => name?.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()
const fmt = (n: number) => n >= 1000000 ? `₺${(n/1000000).toFixed(1)}M` : `₺${n.toLocaleString('tr-TR')}`

export default function AgentTable({ agents }: { agents: any[] }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">Danışmanlar ({agents.length})</h3>
        <a href="/dashboard/danismanlar" className="text-xs text-emerald-600 hover:underline">Tümünü gör →</a>
      </div>
      {agents.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Danışman verisi bulunamadı</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b">
              <th className="pb-2 font-medium">Danışman</th>
              <th className="pb-2 font-medium">Satış</th>
              <th className="pb-2 font-medium">Ciro</th>
              <th className="pb-2 font-medium">Hedefe</th>
              <th className="pb-2 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a, i) => (
              <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${avatarColor(i)}`}>
                      {initials(a.full_name)}
                    </div>
                    <span className="font-medium text-gray-800">{a.full_name}</span>
                  </div>
                </td>
                <td className="py-2.5 text-gray-700">{a.m?.sales_count ?? 0}</td>
                <td className="py-2.5 text-gray-700">{fmt(Number(a.m?.revenue) || 0)}</td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${barColor(a.status)}`} style={{ width: `${Math.min(a.pct, 100)}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">%{a.pct}</span>
                  </div>
                </td>
                <td className="py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(a.status)}`}>
                    {statusLabel(a.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
