import { createClient } from '@/lib/supabase/server'
import AddMandatoryTrainingButton from './AddMandatoryTrainingButton'
import LogTrainingButton from './LogTrainingButton'

export default async function EgitimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('office_id, id').eq('id', user!.id).single()

  const officeId = profile?.office_id ?? profile?.id

  const [
    { data: modules },
    { data: sessions },
    { data: mandatory },
    { data: agentTrainings },
    { data: agents },
  ] = await Promise.all([
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
    supabase
      .from('mandatory_trainings')
      .select('*')
      .eq('office_id', officeId)
      .eq('is_active', true)
      .order('deadline', { ascending: true }),
    supabase
      .from('agent_trainings')
      .select('*, profiles!agent_id(full_name)')
      .eq('office_id', officeId)
      .order('training_date', { ascending: false })
      .limit(50),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('office_id', officeId)
      .eq('role', 'agent'),
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

  const categoryLabel: Record<string, string> = {
    hukuki: 'Hukuki',
    satis: 'Satış',
    teknik: 'Teknik',
    kisisel_gelisim: 'Kişisel Gelişim',
    genel: 'Genel',
  }

  // Her zorunlu eğitim için kaç danışman tamamladı
  const completionMap: Record<string, Set<string>> = {}
  for (const t of (agentTrainings || [])) {
    if (t.mandatory_training_id) {
      if (!completionMap[t.mandatory_training_id]) completionMap[t.mandatory_training_id] = new Set()
      completionMap[t.mandatory_training_id].add(t.agent_id)
    }
  }
  const totalAgents = agents?.length ?? 0

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Eğitim & Koçluk</h1>
          <p className="text-sm text-gray-500 mt-0.5">Zorunlu eğitimler, modüller ve koçluk seansları</p>
        </div>
        <div className="flex gap-2">
          <AddMandatoryTrainingButton />
          <LogTrainingButton agents={agents || []} />
        </div>
      </div>

      {/* ── Zorunlu Eğitimler ─────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Zorunlu Eğitimler</h2>
        {!mandatory || mandatory.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            Henüz zorunlu eğitim tanımlanmamış.
            <div className="mt-3"><AddMandatoryTrainingButton /></div>
          </div>
        ) : (
          <div className="space-y-3">
            {mandatory.map((m: any) => {
              const completedCount = completionMap[m.id]?.size ?? 0
              const pct = totalAgents > 0 ? Math.round((completedCount / totalAgents) * 100) : 0
              const isOverdue = m.deadline && new Date(m.deadline) < new Date()
              return (
                <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{m.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {categoryLabel[m.category] ?? m.category}
                        </span>
                        {m.target_role !== 'all' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                            {m.target_role}
                          </span>
                        )}
                      </div>
                      {m.description && <p className="text-xs text-gray-500 mb-2">{m.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        {m.deadline && (
                          <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                            {isOverdue ? '⚠️ Gecikmiş — ' : 'Son: '}
                            {new Date(m.deadline).toLocaleDateString('tr-TR')}
                          </span>
                        )}
                        <span>{completedCount}/{totalAgents} danışman tamamladı</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className={`shrink-0 text-sm font-bold ${pct === 100 ? 'text-emerald-600' : 'text-gray-400'}`}>
                      %{pct}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Aldığı Eğitimler ──────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Danışmanların Aldığı Eğitimler</h2>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {!agentTrainings || agentTrainings.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Henüz eğitim kaydı yok.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Danışman</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Eğitim</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Kategori</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tarih</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Puan</th>
                </tr>
              </thead>
              <tbody>
                {agentTrainings.map((t: any) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{t.profiles?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {t.title}
                      {t.mandatory_training_id && (
                        <span className="ml-1.5 text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Zorunlu</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{categoryLabel[t.category] ?? t.category}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(t.training_date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3">
                      {t.score != null ? (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          t.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                          t.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-600'
                        }`}>{t.score}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Eğitim Modülleri ──────────────────────────────── */}
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
                  <span>{m.module_assignments?.[0]?.count || 0} danışman</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Koçluk Seansları ──────────────────────────────── */}
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
