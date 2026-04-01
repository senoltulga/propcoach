import { createClient } from '@/lib/supabase/server'

export default async function AyarlarPage({
  searchParams,
}: {
  searchParams: { google?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', user!.id)
    .eq('provider', 'google')
    .maybeSingle()

  const isConnected = !!integration?.access_token
  const googleEmail = integration?.google_email

  const statusMsg =
    searchParams.google === 'success' ? '✓ Google hesabı başarıyla bağlandı.' :
    searchParams.google === 'error' ? '✗ Bağlantı sırasında hata oluştu.' :
    searchParams.google === 'disconnected' ? 'Google bağlantısı kaldırıldı.' : null

  const services = [
    { icon: '📁', name: 'Google Drive', desc: 'Belge yükleme ve senkronizasyon', scope: 'drive' },
    { icon: '📧', name: 'Gmail', desc: 'Müşteri maillerini görüntüleme ve yanıtlama', scope: 'gmail' },
    { icon: '📅', name: 'Google Takvim', desc: 'Koçluk seanslarını takvime otomatik ekleme', scope: 'calendar' },
  ]

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ayarlar & Entegrasyonlar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Google servislerini PropCoach&apos;a bağlayın</p>
      </div>

      {statusMsg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
          searchParams.google === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
          searchParams.google === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-gray-50 text-gray-600 border border-gray-200'
        }`}>
          {statusMsg}
        </div>
      )}

      {/* Google OAuth Bağlantı Kartı */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xl shadow-sm">G</div>
            <div>
              <div className="font-semibold text-gray-900">Google Hesabı</div>
              <div className="text-xs text-gray-500">
                {isConnected ? googleEmail || 'Bağlandı' : 'Bağlı değil'}
              </div>
            </div>
          </div>
          {isConnected ? (
            <form action="/api/auth/google/disconnect" method="POST">
              <button className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg transition-colors">
                Bağlantıyı Kes
              </button>
            </form>
          ) : (
            <a
              href="/api/auth/google"
              className="text-xs bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Google ile Bağlan
            </a>
          )}
        </div>

        {isConnected && (
          <div className={`text-xs px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100`}>
            ✓ Google hesabı bağlı — Drive, Gmail ve Takvim erişimi aktif
          </div>
        )}
      </div>

      {/* Servisler */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Entegre Servisler</h2>
        <div className="space-y-3">
          {services.map(s => (
            <div key={s.name} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
              <span className="text-2xl">{s.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{s.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
              </div>
              <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                isConnected
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {isConnected ? 'Aktif' : 'Pasif'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!isConnected && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <strong>Nasıl çalışır?</strong> Google hesabınızı bir kez bağlayın &mdash; Drive, Gmail ve Takvim otomatik olarak aktifleşir. Bağlantıyı istediğiniz zaman kesebilirsiniz.
        </div>
      )}
    </div>
  )
}
