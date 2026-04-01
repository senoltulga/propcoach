import { createClient } from '@/lib/supabase/server'
import AddLeadButton from './AddLeadButton'
import AddAppointmentButton from './AddAppointmentButton'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-violet-100 text-violet-700',
  proposal: 'bg-orange-100 text-orange-700',
  won: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-600',
}
const statusLabels: Record<string, string> = {
  new: 'Yeni', contacted: 'İletişimde', qualified: 'Nitelikli',
  proposal: 'Teklif', won: 'Kazanıldı', lost: 'Kaybedildi',
}
const PIPELINE = ['new', 'contacted', 'qualified', 'proposal', 'won']

export default async function CrmPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('office_id,id').eq('id', user!.id).single()
  const officeId = profile?.office_id || profile?.id

  const [
    { data: leads },
    { data: appointments },
    { data: agents },
  ] = await Promise.all([
    supabase.from('leads').select('*, profiles!assigned_to(full_name)').eq('office_id', officeId).order('created_at', { ascending: false }),
    supabase.from('appointments').select('*, profiles!agent_id(full_name), leads(full_name,phone)')
      .eq('office_id', officeId).order('appointment_date', { ascending: true }),
    supabase.from('profiles').select('id,full_name').eq('office_id', officeId).eq('role', 'agent'),
  ])

  const clientLeads = (leads || []).filter((l: any) => l.type === 'client')
  const agentLeads = (leads || []).filter((l: any) => l.type === 'agent')
  const upcomingApts = (appointments || []).filter((a: any) => a.status === 'planned' && new Date(a.appointment_date) >= new Date())
  const now = new Date()

  // Pipeline sayıları
  const pipelineCounts = PIPELINE.reduce((acc, s) => {
    acc[s] = clientLeads.filter((l: any) => l.status === s).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">CRM</h1>
          <p className="text-sm text-gray-500 mt-0.5">Lead yönetimi ve randevular</p>
        </div>
        <div className="flex gap-2">
          <AddLeadButton agents={agents || []} />
          <AddAppointmentButton leads={leads || []} agents={agents || []} />
        </div>
      </div>

      {/* Pipeline */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Müşteri Pipeline</h2>
        <div className="grid grid-cols-5 gap-3">
          {PIPELINE.map((stage, i) => {
            const count = pipelineCounts[stage]
            const isLast = i === PIPELINE.length - 1
            return (
              <div key={stage} className="relative">
                <div className={`rounded-xl p-4 ${count > 0 ? 'bg-white border border-gray-100 shadow-sm' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className={`text-xs font-semibold mb-1 ${statusColors[stage]?.split(' ')[1] || 'text-gray-500'}`}>
                    {statusLabels[stage]}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-400">lead</div>
                </div>
                {!isLast && (
                  <div className="absolute top-1/2 -right-2 -translate-y-1/2 text-gray-300 text-sm z-10">→</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Lead Listesi */}
        <div className="lg:col-span-2 space-y-4">

          {/* Müşteri Leadler */}
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900 text-sm">Müşteri Leadler ({clientLeads.length})</h2>
              <span className="text-xs text-gray-400">kaynak · durum</span>
            </div>
            {clientLeads.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Henüz müşteri lead yok</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {clientLeads.map((lead: any) => (
                  <div key={lead.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {lead.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">{lead.full_name}</div>
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                        {lead.phone && <span>{lead.phone}</span>}
                        {lead.budget && <span>₺{Number(lead.budget).toLocaleString('tr-TR')}</span>}
                        {lead.profiles?.full_name && <span>→ {lead.profiles.full_name}</span>}
                      </div>
                      {lead.notes && <div className="text-xs text-gray-400 truncate mt-0.5">{lead.notes}</div>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400 capitalize">{lead.source}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[lead.status]}`}>
                        {statusLabels[lead.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Danışman Leadler */}
          {agentLeads.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="px-5 py-3 border-b border-gray-50">
                <h2 className="font-semibold text-gray-900 text-sm">Danışman Adayları ({agentLeads.length})</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {agentLeads.map((lead: any) => (
                  <div key={lead.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {lead.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">{lead.full_name}</div>
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                        {lead.phone && <span>{lead.phone}</span>}
                        {lead.email && <span>{lead.email}</span>}
                      </div>
                      {lead.notes && <div className="text-xs text-gray-400 truncate mt-0.5">{lead.notes}</div>}
                    </div>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[lead.status]}`}>
                      {statusLabels[lead.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Randevular */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900 text-sm">Randevular</h2>
              <Link href="/dashboard/takvim" className="text-xs text-emerald-600 hover:underline">Takvim →</Link>
            </div>
            {upcomingApts.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">Yaklaşan randevu yok</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {upcomingApts.map((apt: any) => {
                  const d = new Date(apt.appointment_date)
                  const isToday = d.toDateString() === now.toDateString()
                  const typeIcon: Record<string, string> = { meeting: '🤝', showing: '🏠', call: '📞', other: '📌' }
                  return (
                    <div key={apt.id} className={`px-5 py-3 ${isToday ? 'bg-emerald-50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-base mt-0.5">{typeIcon[apt.type] || '📌'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{apt.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {d.toLocaleDateString('tr-TR')} {d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            {apt.location && ` · ${apt.location}`}
                          </div>
                          {apt.leads?.full_name && (
                            <div className="text-xs text-violet-600 mt-0.5">👤 {apt.leads.full_name}</div>
                          )}
                          {apt.profiles?.full_name && (
                            <div className="text-xs text-gray-400">Danışman: {apt.profiles.full_name}</div>
                          )}
                        </div>
                        {isToday && <span className="text-xs bg-emerald-600 text-white px-1.5 py-0.5 rounded-full shrink-0">Bugün</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* İstatistikler */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Özet</h2>
            <div className="space-y-2.5">
              {[
                { label: 'Toplam Lead', value: (leads || []).length, color: 'text-gray-900' },
                { label: 'Aktif (Yeni+İletişimde)', value: (leads || []).filter((l: any) => ['new', 'contacted'].includes(l.status)).length, color: 'text-blue-600' },
                { label: 'Nitelikli', value: (leads || []).filter((l: any) => l.status === 'qualified').length, color: 'text-violet-600' },
                { label: 'Kazanılan', value: (leads || []).filter((l: any) => l.status === 'won').length, color: 'text-emerald-600' },
                { label: 'Bekleyen Randevu', value: upcomingApts.length, color: 'text-orange-600' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{s.label}</span>
                  <span className={`font-bold ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
