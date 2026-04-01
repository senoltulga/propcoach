import { createClient } from '@/lib/supabase/server'

export default async function EgitimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('office_id').eq('id', user!.id).single()

  const officeId = profile?.office_id

  const [{ data: modules }, { data: sessions }] = await Promise.all([
    supabase
      .from('training_modules')
      .select('*, module_assignments(count)')
      .eq('office_id', officeId)
      .order('created_at', { ascending: false }),
    supabase
      .from('coaching_sessions')
      .select('*, profiles(full_name)')
      .eq('office_id', officeId)
      .order('session_date', { ascending: false })
      .limit(20),
  ])

  const typeLabel: Record<string, string> = {
    sales_coaching: 'Satış Koçluğu',
    education_coaching: 'Eğitim Koçluğu',
    technical: 'Teknik',
    personal_development: 'Kişisel Gelişim',
  }

  const statusColor: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    draft: 'bg-gray-100 text-gray-500',
    archived: 'bg-red-100 text-red-600',
  }

  const sessionStatusColor: Record<string, string> = {
    planned: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-600',
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Eğitim & Koçluk</h1>
          <p className="text-sm text-gray-500 mt-0.5">Modüller ve koçluk seansları</p>
        </div>
        <div className="flex gap-2">
          <button
            disabled
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg opacity-50 cursor-not-allowed"
            title="Yakında"
          >
            + Yeni Modül
          </button>
          <button
            disabled
            className="px-4 py-2 border border-emerald-600 text-emerald-700 text-sm rounded-lg opacity-50 cursor-not-allowed"
            title="Yakında"
          >
            + Koçluk Seansı
          </button>
        </div>
      </div>

      {/* Modules */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Eğitim Modülleri</h2>
        {!modules || modules.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            Henüz modül eklenmemiş.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((m: any) => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400">{typeLabel[m.type] || m.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[m.status] || 'bg-gray-100 text-gray-500'}`}>
                    {m.status === 'active' ? 'Aktif' : m.status === 'draft' ? 'Taslak' : 'Arşiv'}
                  </span>
                </div>
                <div className="font-semibold text-gray-900 mb-1">{m.name}</div>
                {m.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{m.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{m.lesson_count} ders</span>
                  <span>{m.module_assignments?.[0]?.count || 0} danışman atandı</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coaching Sessions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Koçluk Seansları</h2>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {!sessions || sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Henüz koçluk seansı yok.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Danışman</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Program</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tarih</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Süre</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Durum</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s: any) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.profiles?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.program}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(s.session_date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {s.duration_minutes ? `${s.duration_minutes} dk` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sessionStatusColor[s.status] || 'bg-gray-100 text-gray-500'}`}>
                        {s.status === 'planned' ? 'Planlandı' : s.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
