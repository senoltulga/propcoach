export default function BelgelerPage() {
  const categories = [
    { icon: '📋', label: 'Sözleşmeler', count: 0, desc: 'Satış ve kiralama sözleşmeleri' },
    { icon: '🏠', label: 'Tapu & Kadastro', count: 0, desc: 'Tapu senedi, kadastro kopyaları' },
    { icon: '💼', label: 'CV & Belgeler', count: 0, desc: 'Danışman CV ve sertifikaları' },
    { icon: '📊', label: 'KRB Raporları', count: 0, desc: 'Karşılaştırmalı piyasa analizleri' },
    { icon: '📑', label: 'Mali Belgeler', count: 0, desc: 'Fatura, makbuz, vergi belgeleri' },
    { icon: '🔑', label: 'Kiralama', count: 0, desc: 'Kira sözleşmeleri ve tutanaklar' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Belgeler</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ofis belge yönetimi</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors">
          + Belge Yükle
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          placeholder="Belge ara..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div
            key={cat.label}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow cursor-pointer group"
          >
            <div className="text-2xl mb-2">{cat.icon}</div>
            <div className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
              {cat.label}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{cat.desc}</div>
            <div className="mt-3 text-xs text-gray-400">{cat.count} belge</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
        <div className="text-4xl mb-3">📁</div>
        <div className="text-gray-500 text-sm mb-4">Henüz belge yüklenmemiş</div>
        <p className="text-xs text-gray-400 max-w-sm mx-auto">
          Google Drive entegrasyonu ile belgelerinizi senkronize edebilir veya doğrudan yükleyebilirsiniz.
        </p>
        <div className="mt-4 flex gap-2 justify-center">
          <button className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors">
            Belge Yükle
          </button>
          <button className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            Google Drive Bağla
          </button>
        </div>
      </div>
    </div>
  )
}
