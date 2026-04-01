import { createClient } from '@/lib/supabase/server'

const roleLabel: Record<string,string> = {
  team_leader: 'Takım Lideri', hr: 'İK Sorumlusu', social_media: 'Sosyal Medya',
  accounting: 'Muhasebe', manager: 'Ofis Yöneticisi', assistant: 'Asistan'
}
const roleColor: Record<string,string> = {
  team_leader:'bg-blue-100 text-blue-700', hr:'bg-purple-100 text-purple-700',
  social_media:'bg-pink-100 text-pink-700', accounting:'bg-yellow-100 text-yellow-700',
  manager:'bg-emerald-100 text-emerald-700', assistant:'bg-gray-100 text-gray-700'
}

export default async function PersonelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('office_id').eq('id', user!.id).single()
  const officeId = profile?.office_id || '11111111-1111-1111-1111-111111111111'

  const { data: staff } = await supabase.from('staff').select('*').eq('office_id', officeId).order('created_at')

  const initials = (name: string) => name?.split(' ').map((n:string) => n[0]).join('').slice(0,2).toUpperCase()

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold">Personel</h1><p className="text-sm text-gray-500 mt-1">{staff?.length || 0} personel</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(staff || []).map(s => (
          <div key={s.id} className="bg-white rounded-xl border p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700 flex-shrink-0">
              {initials(s.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{s.full_name}</div>
              <div className="text-xs text-gray-400 mb-2 truncate">{s.email}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor[s.role] || 'bg-gray-100 text-gray-600'}`}>
                {s.custom_role || roleLabel[s.role] || s.role}
              </span>
            </div>
          </div>
        ))}
        {(staff || []).length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">👔</p>
            <p className="text-sm">Henüz personel eklenmedi</p>
          </div>
        )}
      </div>
    </div>
  )
}
