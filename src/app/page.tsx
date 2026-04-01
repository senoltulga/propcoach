import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* NAV */}
      <nav className="flex justify-between items-center px-6 py-4 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-50">
        <span className="text-base font-bold text-emerald-700">PropCoach</span>
        <div className="flex items-center gap-3">
          <a href="#ozellikler" className="hidden md:block text-sm text-gray-500 hover:text-gray-800 transition">Özellikler</a>
          <a href="#fiyatlar" className="hidden md:block text-sm text-gray-500 hover:text-gray-800 transition">Fiyatlar</a>
          <Link href="/giris" className="text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            Giriş yap
          </Link>
          <Link href="/kayit" className="text-sm px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition font-medium">
            Ücretsiz başla
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 mb-6 tracking-wide">
          Gayrimenkul ofisleri için AI koçluk
        </span>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-5 tracking-tight">
          Danışmanlarınız gelişsin,<br />
          <span className="text-emerald-700">ofisiniz büyüsün</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
          PropCoach, gayrimenkul ofisleri ve danışmanlar için AI destekli performans takibi ve kişiselleştirilmiş koçluk platformudur.
        </p>
        <div className="flex gap-3 justify-center flex-wrap mb-12">
          <Link href="/kayit" className="px-6 py-3 bg-emerald-700 text-white rounded-xl font-medium hover:bg-emerald-800 transition text-sm">
            14 gün ücretsiz dene
          </Link>
          <a href="#ozellikler" className="px-6 py-3 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition">
            Özellikleri gör
          </a>
        </div>
        <div className="flex justify-center gap-10 flex-wrap">
          {[
            { val: '2.400+', label: 'danışman kullanıyor' },
            { val: '%34', label: 'ortalama kapanış artışı' },
            { val: '180+', label: 'aktif ofis' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-gray-900">{s.val}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-gray-100" id="ozellikler" />

      {/* ÖZELLİKLER */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">Özellikler</span>
          <h2 className="text-2xl font-bold mt-2 mb-2">Her şey tek platformda</h2>
          <p className="text-gray-500 text-sm">Danışman takibinden AI koçluğa, portföy yönetiminden eğitime kadar.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: '📊', title: 'Performans takibi', desc: 'Danışmanlarınızın satış, müşteri ve kapanış oranlarını gerçek zamanlı izleyin. Renk kodlu durum rozetleriyle anlık görünüm.' },
            { icon: '🤖', title: 'AI koçluk motoru', desc: 'Zayıf alanları otomatik tespit eder, her danışmana özel gelişim önerisi üretir. Ofisinizin dokümanlarını okuyarak kişiselleştirir.' },
            { icon: '🏠', title: 'Portföy yönetimi', desc: 'Tüm ilanlarınızı tek ekranda görün. 90+ gün takibi, fiyat güncelleme önerisi ve KRB dosyası durumu dahil.' },
            { icon: '🎓', title: 'Eğitim ve gelişim', desc: 'Modül bazlı eğitim içerikleri, ilerleme takibi ve AI önerili kişisel öğrenme yolları.' },
          ].map(f => (
            <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-sm transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-lg mb-4">{f.icon}</div>
              <h3 className="font-semibold text-sm mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-gray-100" />

      {/* KİME GÖRE */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">Kime göre?</span>
          <h2 className="text-2xl font-bold mt-2 mb-2">Ofisiniz için mi, siz için mi?</h2>
          <p className="text-gray-500 text-sm">İki farklı kullanıcı tipi, iki farklı deneyim.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/kayit" className="block bg-emerald-50 border border-emerald-200 rounded-2xl p-6 hover:bg-emerald-100 transition">
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-800 mb-4">Kurumsal</span>
            <h3 className="font-semibold text-emerald-800 mb-3">Gayrimenkul ofisleri</h3>
            <ul className="text-sm text-emerald-700 space-y-1.5">
              {['Tüm danışmanları izle', 'KPI ve portföy takibi', 'AI koçluk otomasyonu', 'Rol bazlı erişim'].map(i => (
                <li key={i} className="flex items-center gap-2"><span className="text-emerald-500">✓</span>{i}</li>
              ))}
            </ul>
          </Link>
          <Link href="/kayit" className="block bg-violet-50 border border-violet-200 rounded-2xl p-6 hover:bg-violet-100 transition">
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-200 text-violet-800 mb-4">Bireysel</span>
            <h3 className="font-semibold text-violet-800 mb-3">Gayrimenkul danışmanları</h3>
            <ul className="text-sm text-violet-700 space-y-1.5">
              {['Kişisel performans takibi', 'Müşteri yönetimi', 'AI koçluk seansları', 'Bağımsız kullanım'].map(i => (
                <li key={i} className="flex items-center gap-2"><span className="text-violet-500">✓</span>{i}</li>
              ))}
            </ul>
          </Link>
        </div>
      </section>

      <hr className="border-gray-100" id="fiyatlar" />

      {/* FİYATLAR */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">Fiyatlar</span>
          <h2 className="text-2xl font-bold mt-2 mb-2">Şeffaf fiyatlandırma</h2>
          <p className="text-gray-500 text-sm">14 gün ücretsiz, kredi kartı gerekmez.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Danışman', price: '₺499', period: '/ ay · kişi başı', featured: false, features: ['Kişisel dashboard', 'Müşteri takibi', 'AI koçluk (5 seans/ay)', 'Kişisel portföy'], cta: 'Başla' },
            { name: 'Ofis', price: '₺2.499', period: '/ ay · 10 danışmana kadar', featured: true, badge: 'En popüler', features: ['Tüm danışman özellikleri', 'Ofis dashboard\'u', 'Sınırsız AI koçluk', 'Portföy yönetimi', 'KRB takibi'], cta: '14 gün ücretsiz dene' },
            { name: 'Kurumsal', price: '₺5.999', period: '/ ay · sınırsız danışman', featured: false, features: ['Tüm Ofis özellikleri', 'Sınırsız danışman', 'Özel doküman yükleme', 'Öncelikli destek', 'API erişimi'], cta: 'Teklif al' },
          ].map(p => (
            <div key={p.name} className={`rounded-2xl p-6 flex flex-col ${p.featured ? 'border-2 border-emerald-600 shadow-md' : 'border border-gray-100'}`}>
              {'badge' in p && p.badge && (
                <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-700 text-white mb-3 self-start">{p.badge}</span>
              )}
              <div className="text-sm font-semibold mb-1">{p.name}</div>
              <div className="text-3xl font-bold mb-0.5">{p.price}</div>
              <div className="text-xs text-gray-400 mb-4">{p.period}</div>
              <ul className="text-sm text-gray-600 space-y-2 border-t border-gray-100 pt-4 mb-6 flex-1">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/kayit" className={`w-full text-center py-2.5 rounded-xl text-sm font-medium transition ${p.featured ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'border border-gray-200 hover:bg-gray-50'}`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 border-t border-gray-100 py-16 text-center px-6">
        <h2 className="text-2xl font-bold mb-2">Bugün başlayın</h2>
        <p className="text-gray-500 text-sm mb-6">14 gün ücretsiz, kurulum yok, kredi kartı gerekmez.</p>
        <Link href="/kayit" className="inline-block px-6 py-3 bg-emerald-700 text-white rounded-xl font-medium hover:bg-emerald-800 transition text-sm">
          Ücretsiz hesap oluştur
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-5 flex justify-between items-center flex-wrap gap-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">© 2026 PropCoach · Tüm hakları saklıdır</span>
        <div className="flex gap-4">
          {['Gizlilik', 'KVKK', 'İletişim'].map(l => (
            <a key={l} href="#" className="text-xs text-gray-400 hover:text-gray-600 transition">{l}</a>
          ))}
        </div>
      </footer>

    </div>
  )
}
