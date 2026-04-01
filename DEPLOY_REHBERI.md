# PropCoach — Deploy Rehberi

## Adım 1: Vercel'e Yükleme (Hemen Yapın)

### Gereksinimler
- Bilgisayarınızda şu dosyalar olmalı (hepsi aynı klasörde):
  - `01_landing.html`
  - `02_giris.html`
  - `04_dashboard.html`
  - `05_kocluk.html`
  - `06_kocluk_ai.html`

### Yükleme Adımları
1. **vercel.com** adresine gidin
2. "Sign Up" → Google ile kayıt olun (ücretsiz)
3. Dashboard'da "Add New Project" tıklayın
4. Dosya klasörünüzü sürükleyip bırakın
5. "Deploy" butonuna tıklayın
6. ~30 saniye bekleyin → `propcoach-xxx.vercel.app` linki hazır!

### Alan Adı Bağlama (Opsiyonel)
1. Vercel dashboard → projeniz → "Settings" → "Domains"
2. `propcoach.com` yazın → "Add"
3. Namecheap/GoDaddy'de DNS ayarını Vercel'in gösterdiği şekilde yapın

---

## Adım 2: GitHub Kurulumu (Bir Sonraki Oturumda)

GitHub, kodunuzun yedeklendiği ve Vercel'e otomatik aktarıldığı yerdir.

1. **github.com** → "Sign up" → ücretsiz hesap
2. "New repository" → İsim: `propcoach` → "Public" → "Create"
3. Dosyalarınızı sürükle-bırak ile yükleyin
4. Vercel'de "Import Git Repository" → GitHub bağlayın
5. Artık dosya değiştirip GitHub'a gönderdikçe site otomatik güncellenir

---

## Adım 3: Gerçek AI (Claude API Anahtarı)

`06_kocluk_ai.html` dosyası için API anahtarı gerekir.

1. **console.anthropic.com** → hesap açın
2. "API Keys" → "Create Key" → kopyalayın
3. `06_kocluk_ai.html` içinde şu satırı bulun:
   ```
   headers: { 'Content-Type': 'application/json' }
   ```
   Şu şekilde güncelleyin:
   ```
   headers: {
     'Content-Type': 'application/json',
     'x-api-key': 'sk-ant-...(anahtarınız)'
   }
   ```
4. Dosyayı kaydedin ve Vercel'e tekrar yükleyin

> **Güvenlik notu:** API anahtarını HTML dosyasına gömmek prototip için kabul edilebilir.
> Gerçek üretim uygulamasında anahtar Vercel ortam değişkenlerine taşınmalıdır.

---

## Adım 4: Supabase Bağlantısı (İleride)

Şu an veriler HTML içinde sabit yazılı. Supabase bağlandığında:
- Gerçek kullanıcı girişi çalışır
- Danışman verileri veritabanından gelir
- Her ofis kendi verilerini görür

Bu adım bir sonraki oturumda ele alınacak.

---

## Özet

| Adım | Durum | Süre |
|------|-------|------|
| Vercel deploy | Hemen yapılabilir | ~10 dakika |
| GitHub kurulum | Bir sonraki oturumda | ~20 dakika |
| Claude API anahtarı | Bir sonraki oturumda | ~5 dakika |
| Supabase bağlantısı | İleride | ~2-3 oturum |
