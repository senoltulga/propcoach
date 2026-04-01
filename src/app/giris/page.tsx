'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Tab = 'login' | 'register'
type UserType = 'office' | 'agent'

export default function GirisPage() {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('login')
  const [userType, setUserType] = useState<UserType>('office')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('E-posta veya şifre hatalı.'); setLoading(false); return }

    // Role göre yönlendir
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).single()

    const role = profile?.role
    if (role === 'office_owner' || role === 'office_manager') {
      router.push('/dashboard')
    } else {
      router.push('/panel')
    }
    router.refresh()
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })

    if (error) { setError(error.message); setLoading(false); return }

    if (data.user) {
      const role = userType === 'office' ? 'office_owner' : 'agent_independent'
      await supabase.from('profiles').insert({
        id: data.user.id, email, full_name: fullName, role
      })
      setSuccess('Hesabınız oluşturuldu! Yönlendiriliyorsunuz...')
      setTimeout(() => {
        router.push(userType === 'office' ? '/dashboard' : '/panel')
        router.refresh()
      }, 1200)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

      {/* SOL — Yeşil Panel */}
      <div className="hidden md:flex flex-col justify-between bg-emerald-700 px-10 py-10">
        <Link href="/" className="text-white font-bold text-lg">← PropCoach</Link>
        <div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-3">
            Ofisinizi bir üst<br />seviyeye taşıyın
          </h2>
          <p className="text-emerald-200 text-sm leading-relaxed mb-8">
            Danışman performansı, portföy takibi ve AI koçluk — tek platformda.
          </p>
          <div className="space-y-4">
            {[
              { label: 'Aktif ofis', val: '180+' },
              { label: 'Danışman', val: '2.400+' },
              { label: 'Ortalama kapanış artışı', val: '%34' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="text-emerald-200 text-sm">{s.label}: <span className="text-white font-semibold">{s.val}</span></span>
              </div>
            ))}
          </div>
        </div>
        <span className="text-emerald-400 text-xs">© 2026 PropCoach</span>
      </div>

      {/* SAĞ — Form */}
      <div className="flex flex-col justify-center px-8 py-10 max-w-md mx-auto w-full">

        {/* Mobil logo */}
        <Link href="/" className="md:hidden text-emerald-700 font-bold text-lg mb-8">← PropCoach</Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {tab === 'login' ? 'Hesabınıza giriş yapın' : 'Hesap oluşturun'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {tab === 'login' ? (
              <>Hesabınız yok mu? <button onClick={() => { setTab('register'); setError(''); setSuccess('') }} className="text-emerald-700 hover:underline">Ücretsiz oluşturun</button></>
            ) : (
              <>Zaten hesabınız var mı? <button onClick={() => { setTab('login'); setError(''); setSuccess('') }} className="text-emerald-700 hover:underline">Giriş yapın</button></>
            )}
          </p>
        </div>

        {/* Sekmeler */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-6">
          <button onClick={() => { setTab('login'); setError(''); setSuccess('') }}
            className={`flex-1 py-2.5 text-sm transition ${tab === 'login' ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
            Giriş yap
          </button>
          <button onClick={() => { setTab('register'); setError(''); setSuccess('') }}
            className={`flex-1 py-2.5 text-sm transition ${tab === 'register' ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
            Kayıt ol
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-lg mb-4">{success}</div>}

        {/* GİRİŞ FORMU */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">E-posta</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="ornek@sirket.com" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-gray-600">Şifre</label>
                <button type="button" className="text-xs text-emerald-700 hover:underline">Şifremi unuttum</button>
              </div>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition">
              {loading ? 'Giriş yapılıyor...' : 'Giriş yap'}
            </button>
          </form>
        )}

        {/* KAYIT FORMU */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Hesap tipi */}
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setUserType('office')}
                className={`border rounded-xl p-4 text-left transition ${userType === 'office' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="text-xl mb-1">🏢</div>
                <div className={`text-xs font-semibold ${userType === 'office' ? 'text-emerald-700' : 'text-gray-700'}`}>Ofis / Kurumsal</div>
                <div className="text-xs text-gray-400 mt-0.5">Ekip yönetimi</div>
              </button>
              <button type="button" onClick={() => setUserType('agent')}
                className={`border rounded-xl p-4 text-left transition ${userType === 'agent' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="text-xl mb-1">👤</div>
                <div className={`text-xs font-semibold ${userType === 'agent' ? 'text-emerald-700' : 'text-gray-700'}`}>Danışman / Bireysel</div>
                <div className="text-xs text-gray-400 mt-0.5">Kişisel kullanım</div>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ad Soyad</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="Adınız Soyadınız" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">E-posta</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="ornek@sirket.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Şifre</label>
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="En az 6 karakter" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition">
              {loading ? 'Hesap oluşturuluyor...' : 'Hesap oluştur'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
