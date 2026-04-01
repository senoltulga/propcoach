import { createClient } from '@/lib/supabase/server'

const fmt = (n: number) => n >= 1000000 ? `₺${(n/1000000).toFixed(1)}M` : `₺${n.toLocaleString('tr-TR')}`

export default async function PortfoyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('office_id').eq('id', user!.id).single()
  const officeId = profile?.office_id || '11111111-1111-1111-1111-111111111111'

  const { data: listings } = await supabase.from('listings').select('*,profiles(full_name)').eq('office_id', officeId).order('days_on_market', { ascending: false })

  const active = (listings || []).filter(l => l.status === 'active')
  const over90 = active.filter(l => l.days_on_market >= 90)
  const noKrb = active.filter(l => !l.krb_uploaded)

  const statusBorder = (l: any) => {
    if (l.days_on_market >= 90) return 'border-l-4 border-l-red-500'
    if (l.days_on_market >= 60) return 'border-l-4 border-l-yellow-400'
    return ''
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold">Portföy</h1><p className="text-sm text-gray-500 mt-1">{active.length} aktif ilan</p></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-gray-500">Toplam Aktif</p><p className="text-2xl font-bold mt-1">{active.length}</p></div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"><p className="text-xs text-yellow-700">90+ Gün</p><p className="text-2xl font-bold mt-1 text-yellow-700">{over90.length}</p></div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4"><p className="text-xs text-red-700">KRB Eksik</p><p className="text-2xl font-bold mt-1 text-red-700">{noKrb.length}</p></div>
        <div className="bg-white rounded-xl border p-4"><p className="text-xs text-gray-500">Toplam Değer</p><p className="text-2xl font-bold mt-1">{fmt(active.reduce((s,l) => s + Number(l.price||0), 0))}</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(listings || []).map(l => (
          <div key={l.id} className={`bg-white rounded-xl border overflow-hidden ${statusBorder(l)}`}>
            <div className="bg-gray-100 h-28 flex items-center justify-center text-3xl text-gray-300">🏠</div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-semibold text-sm flex-1 mr-2 truncate">{l.title}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  l.status === 'active' ? 'bg-green-100 text-green-700' :
                  l.status === 'sold' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>{l.status === 'active' ? 'Aktif' : l.status === 'sold' ? 'Satıldı' : 'Pasif'}</span>
              </div>
              <p className="font-bold text-gray-900 mb-1">{fmt(Number(l.price)||0)}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <span className={l.days_on_market >= 90 ? 'text-red-500 font-medium' : ''}>{l.days_on_market} gün</span>
                <span>·</span>
                <span className={!l.krb_uploaded ? 'text-red-500' : 'text-green-600'}>{l.krb_uploaded ? 'KRB ✓' : 'KRB Eksik !'}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-gray-100 inline-flex items-center justify-center text-gray-600 font-bold text-xs">
                    {(l.profiles?.full_name || '?').charAt(0)}
                  </span>
                  {l.profiles?.full_name || '—'}
                </div>
                <a
                  href={`/api/pdf/krb?listing_id=${l.id}`}
                  target="_blank"
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  KRB ↓
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
