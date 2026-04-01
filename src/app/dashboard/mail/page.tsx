import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getClientWithTokens } from '@/lib/google'
import { google } from 'googleapis'

interface GmailMessage {
  id: string
  from: string
  subject: string
  date: string
  snippet: string | null | undefined
  unread: boolean
}

type FetchResult =
  | { ok: true; messages: GmailMessage[] }
  | { ok: false; reason: 'not_connected' }
  | { ok: false; reason: 'token_expired' }
  | { ok: false; reason: 'error'; message: string }

async function fetchGmailInbox(
  accessToken: string,
  refreshToken: string,
): Promise<FetchResult> {
  try {
    const auth = getClientWithTokens(accessToken, refreshToken)
    const gmail = google.gmail({ version: 'v1', auth })

    const listRes = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
      labelIds: ['INBOX'],
    })

    const rawMessages = (listRes.data.messages || []).slice(0, 20)

    const messages: GmailMessage[] = await Promise.all(
      rawMessages.map(async (m) => {
        const { data: msg } = await gmail.users.messages.get({
          userId: 'me',
          id: m.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        })
        const headers = msg.payload?.headers || []
        const get = (name: string) =>
          headers.find((h) => h.name === name)?.value || ''
        return {
          id: m.id!,
          from: get('From'),
          subject: get('Subject'),
          date: get('Date'),
          snippet: msg.snippet,
          unread: msg.labelIds?.includes('UNREAD') ?? false,
        }
      }),
    )

    return { ok: true, messages }
  } catch (err: unknown) {
    const errMsg =
      err instanceof Error ? err.message : String(err)

    // Token süresi dolmuş ya da iptal edilmiş
    if (
      errMsg.includes('invalid_grant') ||
      errMsg.includes('Token has been expired') ||
      errMsg.includes('Invalid Credentials')
    ) {
      return { ok: false, reason: 'token_expired' }
    }

    return { ok: false, reason: 'error', message: errMsg }
  }
}

function formatDate(raw: string): string {
  try {
    const d = new Date(raw)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const dayMs = 86_400_000

    if (diff < dayMs && now.getDate() === d.getDate()) {
      return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    }
    if (diff < 2 * dayMs) return 'Dün'
    if (diff < 7 * dayMs) {
      return d.toLocaleDateString('tr-TR', { weekday: 'short' })
    }
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
  } catch {
    return raw
  }
}

function parseSender(raw: string): { name: string; email: string } {
  const match = raw.match(/^(.+?)\s*<(.+?)>$/)
  if (match) return { name: match[1].replace(/"/g, '').trim(), email: match[2] }
  return { name: raw, email: raw }
}

// ——— UI bileşenleri ———————————————————————————————————————————

function NotConnectedBanner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-3xl">
        📧
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Gmail henüz bağlı değil</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
          Müşteri maillerini PropCoach üzerinden yönetmek için Gmail hesabınızı bağlayın.
        </p>
      </div>
      <Link
        href="/dashboard/ayarlar"
        className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
      >
        Gmail Bağla
      </Link>
    </div>
  )
}

function TokenExpiredBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">⚠️</span>
        <div>
          <div className="text-sm font-semibold text-amber-900">
            Bağlantı yenilenmesi gerekiyor
          </div>
          <div className="text-xs text-amber-700 mt-0.5">
            Gmail erişim tokenı süresi dolmuş. Lütfen hesabı tekrar bağlayın.
          </div>
        </div>
      </div>
      <Link
        href="/dashboard/ayarlar"
        className="px-4 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
      >
        Ayarlara Git
      </Link>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">❌</span>
        <div>
          <div className="text-sm font-semibold text-red-900">Gmail yüklenemedi</div>
          <div className="text-xs text-red-700 mt-0.5 font-mono">{message}</div>
        </div>
      </div>
      <Link
        href="/dashboard/ayarlar"
        className="px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
      >
        Ayarlara Git
      </Link>
    </div>
  )
}

function MailRow({ mail }: { mail: GmailMessage }) {
  const sender = parseSender(mail.from)
  const dateLabel = formatDate(mail.date)

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
        mail.unread ? 'bg-blue-50/40' : ''
      }`}
    >
      {/* Okunmadı noktası */}
      <div
        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
          mail.unread ? 'bg-emerald-500' : 'bg-transparent'
        }`}
      />

      <div className="flex-1 min-w-0">
        {/* Gönderen + Tarih */}
        <div className="flex items-center justify-between mb-0.5">
          <span
            className={`text-sm truncate ${
              mail.unread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
            }`}
          >
            {sender.name || sender.email}
          </span>
          <span className="text-xs text-gray-400 flex-shrink-0 ml-3">{dateLabel}</span>
        </div>

        {/* Konu */}
        <div
          className={`text-sm truncate ${
            mail.unread ? 'font-semibold text-gray-800' : 'text-gray-600'
          }`}
        >
          {mail.subject || '(Konusuz)'}
        </div>

        {/* Snippet */}
        {mail.snippet && (
          <div className="text-xs text-gray-400 truncate mt-0.5">{mail.snippet}</div>
        )}
      </div>
    </div>
  )
}

// ——— Ana sayfa ————————————————————————————————————————————————

export default async function MailPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Kullanıcı giriş yapmamışsa
  if (!user) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Lütfen önce{' '}
        <Link href="/giris" className="text-emerald-600 underline">
          giriş yapın
        </Link>
        .
      </div>
    )
  }

  // integrations tablosundan Google token'ı çek
  const { data: integration } = await supabase
    .from('integrations')
    .select('access_token, refresh_token, google_email')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .maybeSingle()

  const isConnected = !!integration?.access_token

  // Gmail verisini çek
  let result: FetchResult = { ok: false, reason: 'not_connected' }
  if (isConnected) {
    result = await fetchGmailInbox(
      integration!.access_token,
      integration!.refresh_token,
    )
  }

  const unreadCount =
    result.ok ? result.messages.filter((m) => m.unread).length : 0

  return (
    <div className="p-6 space-y-4">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mail</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isConnected && integration?.google_email
              ? integration.google_email
              : 'Gelen kutusu'}
          </p>
        </div>

        {/* Yeni Mail — devre dışı */}
        <button
          disabled
          title="Yakında"
          className="px-4 py-2 bg-gray-200 text-gray-400 text-sm rounded-lg cursor-not-allowed select-none"
        >
          + Yeni Mail
          <span className="ml-1.5 text-xs font-normal opacity-70">(Yakında)</span>
        </button>
      </div>

      {/* Bağlı değilse büyük CTA */}
      {!isConnected && <NotConnectedBanner />}

      {/* Token expire hatası */}
      {!result.ok && result.reason === 'token_expired' && <TokenExpiredBanner />}

      {/* Genel hata */}
      {!result.ok && result.reason === 'error' && (
        <ErrorBanner message={result.message} />
      )}

      {/* Mail listesi */}
      {result.ok && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Tab bar */}
          <div className="border-b border-gray-100 px-4 py-2 flex gap-4 text-xs font-medium">
            <span className="text-emerald-700 border-b-2 border-emerald-600 pb-1">
              Gelen Kutusu
              {unreadCount > 0 && (
                <span className="ml-1 bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </span>
          </div>

          {result.messages.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              Gelen kutunuz boş.
            </div>
          ) : (
            result.messages.map((mail) => <MailRow key={mail.id} mail={mail} />)
          )}
        </div>
      )}
    </div>
  )
}
