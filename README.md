# PropCoach

> Gayrimenkul ofisleri ve danışmanlar için AI destekli koçluk ve mentorlük platformu.

## Nedir?

PropCoach, Türkiye'deki gayrimenkul ofislerine ve bağımsız danışmanlara yönelik bir mikro SaaS ürünüdür. Platform iki temel sorunu çözer:

- **Ofis sahipleri** danışman performansını ve portföy durumunu gerçek zamanlı izleyemez
- **Danışmanlar** kişiselleştirilmiş koçluk ve gelişim desteği alamaz

PropCoach bu boşluğu AI destekli koçluk motoru ve performans takip araçlarıyla doldurur.

---

## Özellikler (MVP)

### Kurumsal (Ofis) Modülü
- Danışman performans tablosu (satış, müşteri, kapanış oranı, hedefe ulaşma)
- KPI paneli (aylık ciro, aktif müşteri, görüşme→kapanış oranı)
- Portföy yönetimi (aktif ilanlar, 90+ gün takibi, KRB dosyası durumu)
- Danışman detay sayfası (6 sekme: trend, müşteriler, portföy, geçmiş, eğitim, AI öneri)
- AI koçluk motoru (otomatik zayıf alan tespiti + kişiselleştirilmiş öneri)

### Bireysel (Danışman) Modülü
- Kişisel performans dashboard'u
- Müşteri takip listesi
- Kişisel portföy yönetimi
- AI koçluk seansı

---

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 14 (App Router) |
| Backend / Auth | Supabase |
| Veritabanı | PostgreSQL (Supabase) |
| AI / LLM | Claude API (Anthropic) |
| RAG | Supabase pgvector |
| Deployment | Vercel |
| Ödeme | Stripe / Iyzico |

---

## Kurulum

```bash
# Repoyu klonla
git clone https://github.com/kullanici/propcoach.git
cd propcoach

# Bağımlılıkları yükle
npm install

# Ortam değişkenlerini ayarla
cp .env.example .env.local
# .env.local dosyasını düzenle (Supabase + Anthropic anahtarları)

# Geliştirme sunucusunu başlat
npm run dev
```

### Gerekli Ortam Değişkenleri

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
```

---

## Proje Yapısı

```
propcoach/
├── app/
│   ├── (auth)/          # Giriş, kayıt, abonelik
│   ├── dashboard/       # Ofis sahibi ana sayfa
│   ├── danisман/        # Danışman detay sayfaları
│   ├── portfoy/         # Portföy yönetimi
│   └── api/             # API route'ları (AI, webhooks)
├── components/          # Yeniden kullanılabilir UI bileşenleri
├── lib/
│   ├── supabase/        # DB istemcisi ve sorgular
│   ├── ai/              # Claude API entegrasyonu
│   └── rag/             # Doküman işleme ve vektör arama
├── types/               # TypeScript tip tanımları
└── public/
```

---

## Kullanıcı Tipleri

| Tip | Açıklama |
|-----|----------|
| `office_owner` | Ofis sahibi / broker — tam yetki |
| `office_manager` | Ofis yöneticisi — operasyonel yetki |
| `agent_linked` | Ofise bağlı danışman |
| `agent_independent` | Bağımsız danışman |

---

## Katkı

Bu proje aktif geliştirme aşamasındadır. Katkı rehberi yakında eklenecektir.

---

## Lisans

Özel lisans — tüm hakları saklıdır.
