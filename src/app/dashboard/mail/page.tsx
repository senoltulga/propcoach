export default function MailPage() {
  const mockMails = [
    {
      id: 1,
      from: 'ahmet.kaya@gmail.com',
      subject: 'Kadıköy 3+1 daire hakkında bilgi almak istiyorum',
      preview: 'Merhaba, web sitenizde gördüğüm Kadıköy ilanıyla ilgili...',
      time: '10:32',
      unread: true,
      tag: 'Müşteri',
    },
    {
      id: 2,
      from: 'mehmet.demir@hotmail.com',
      subject: 'Görüşme randevusu — Beşiktaş ofis',
      preview: 'Geçen hafta konuştuğumuz Beşiktaş ofisi için randevu almak istiyorum...',
      time: 'Dün',
      unread: true,
      tag: 'Randevu',
    },
    {
      id: 3,
      from: 'fatma.yilmaz@gmail.com',
      subject: 'Teklif değerlendirmesi',
      preview: 'Daireniz için yaptığımız teklifi kabul etmeyi düşünüyoruz...',
      time: 'Dün',
      unread: false,
      tag: 'Teklif',
    },
    {
      id: 4,
      from: 'ayse.celik@yahoo.com',
      subject: 'Ev gezme talebi — Üsküdar',
      preview: 'Üsküdar\'daki müstakil ev ilanınız için gezi ayarlayabilir miyiz?',
      time: 'Paz',
      unread: false,
      tag: 'Müşteri',
    },
  ]

  const tagColor: Record<string, string> = {
    Müşteri: 'bg-blue-100 text-blue-700',
    Randevu: 'bg-purple-100 text-purple-700',
    Teklif: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mail</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gelen kutusu</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors">
          + Yeni Mail
        </button>
      </div>

      {/* Gmail CTA */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">📧</span>
          <div>
            <div className="text-sm font-medium text-blue-900">Gmail Entegrasyonu</div>
            <div className="text-xs text-blue-600">Gmail hesabınızı bağlayarak tüm müşteri maillerini burada yönetin</div>
          </div>
        </div>
        <button className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
          Gmail Bağla
        </button>
      </div>

      {/* Mock inbox */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-2 flex gap-4 text-xs font-medium">
          <button className="text-emerald-700 border-b-2 border-emerald-600 pb-1">Gelen Kutusu (2)</button>
          <button className="text-gray-400 hover:text-gray-600">Gönderilen</button>
          <button className="text-gray-400 hover:text-gray-600">Taslaklar</button>
        </div>
        {mockMails.map(mail => (
          <div
            key={mail.id}
            className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${mail.unread ? 'bg-blue-50/30' : ''}`}
          >
            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${mail.unread ? 'bg-emerald-500' : 'bg-transparent'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-sm ${mail.unread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                  {mail.from}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{mail.time}</span>
              </div>
              <div className={`text-sm ${mail.unread ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                {mail.subject}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400 truncate">{mail.preview}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${tagColor[mail.tag] || 'bg-gray-100 text-gray-500'}`}>
                  {mail.tag}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-center text-gray-400">
        Örnek veriler gösterilmektedir. Gmail bağlandığında gerçek mailler burada görünür.
      </p>
    </div>
  )
}
