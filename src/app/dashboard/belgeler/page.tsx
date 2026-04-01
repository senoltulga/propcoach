import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'
import { getClientWithTokens } from '@/lib/google'
import DriveUploadButton from './DriveUploadButton'

function fileIcon(mimeType: string): string {
  if (mimeType === 'application/vnd.google-apps.folder') return '📁'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.startsWith('image/')) return '🖼️'
  return '📎'
}

function formatBytes(bytes?: string | null): string {
  if (!bytes) return '—'
  const n = parseInt(bytes, 10)
  if (isNaN(n)) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function mimeLabel(mimeType: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/vnd.google-apps.folder': 'Klasör',
    'application/vnd.google-apps.document': 'Google Doc',
    'application/vnd.google-apps.spreadsheet': 'Google Sheet',
    'application/vnd.google-apps.presentation': 'Google Slayt',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  }
  return map[mimeType] ?? 'Dosya'
}

type DriveFile = {
  id?: string | null
  name?: string | null
  mimeType?: string | null
  size?: string | null
  modifiedTime?: string | null
  webViewLink?: string | null
}

export default async function BelgelerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', user!.id)
    .eq('provider', 'google')
    .maybeSingle()

  const isConnected = !!integration?.access_token

  // ── Google bağlı değil ──────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Belgeler</h1>
          <p className="text-sm text-gray-500 mt-0.5">Google Drive üzerinden belge yönetimi</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center max-w-md mx-auto">
          <div className="text-5xl mb-4">📁</div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Google Drive Bağlı Değil
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Belgelerinizi yönetmek için Google hesabınızı bağlamanız gerekiyor.
            Bağlandıktan sonra Drive&apos;daki PropCoach klasörünüzdeki dosyalar burada görünür.
          </p>
          <Link
            href="/dashboard/ayarlar"
            className="inline-block px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Google Drive Bağla
          </Link>
        </div>
      </div>
    )
  }

  // ── Google bağlı — Drive'dan dosyaları çek ──────────────────────────────────
  let files: DriveFile[] = []
  let fetchError: string | null = null
  let folderFound = false

  try {
    const auth = getClientWithTokens(
      integration.access_token,
      integration.refresh_token
    )
    const drive = google.drive({ version: 'v3', auth })

    // PropCoach klasörünü bul
    const { data: folderSearch } = await drive.files.list({
      q: "name='PropCoach' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id,name)',
    })

    if (folderSearch.files && folderSearch.files.length > 0) {
      folderFound = true
      const folderId = folderSearch.files[0].id!

      const { data: fileList } = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink)',
        orderBy: 'modifiedTime desc',
        pageSize: 50,
      })

      files = fileList.files || []
    }
  } catch (err: unknown) {
    fetchError = err instanceof Error ? err.message : 'Drive verisi alınamadı'
  }

  const googleEmail: string | null = integration?.google_email ?? null

  return (
    <div className="p-6 space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Belgeler</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Google Drive — PropCoach klasörü
          </p>
        </div>
        <DriveUploadButton />
      </div>

      {/* Bağlı hesap bilgisi */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 w-fit">
        <span className="text-base">✓</span>
        <span>
          Bağlı hesap:{' '}
          <span className="font-medium">{googleEmail ?? 'Google Drive'}</span>
        </span>
        <Link
          href="/dashboard/ayarlar"
          className="ml-2 text-xs text-emerald-600 underline underline-offset-2 hover:text-emerald-800"
        >
          Yönet
        </Link>
      </div>

      {/* Hata */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <strong>Hata:</strong> {fetchError}.{' '}
          <Link
            href="/dashboard/ayarlar"
            className="underline underline-offset-2 hover:text-red-900"
          >
            Ayarlar sayfasında
          </Link>{' '}
          Google bağlantısını kontrol edin.
        </div>
      )}

      {/* PropCoach klasörü yok */}
      {!fetchError && !folderFound && (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-sm text-gray-500 mb-1 font-medium">
            Drive&apos;da &quot;PropCoach&quot; klasörü bulunamadı
          </p>
          <p className="text-xs text-gray-400 mb-5">
            İlk belgeyi yükleyerek klasörü otomatik oluşturabilirsiniz.
          </p>
          <DriveUploadButton />
        </div>
      )}

      {/* Dosya listesi */}
      {!fetchError && folderFound && files.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <div className="text-4xl mb-3">📁</div>
          <p className="text-sm text-gray-500 mb-5">Henüz belge yüklenmedi</p>
          <DriveUploadButton />
        </div>
      )}

      {!fetchError && files.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Tablo başlığı */}
          <div className="grid grid-cols-[auto_1fr_8rem_8rem_8rem_6rem] gap-4 px-5 py-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <span />
            <span>İsim</span>
            <span>Tür</span>
            <span className="text-right">Boyut</span>
            <span className="text-right">Değiştirilme</span>
            <span />
          </div>

          {/* Satırlar */}
          <div className="divide-y divide-gray-50">
            {files.map((file) => (
              <div
                key={file.id}
                className="grid grid-cols-[auto_1fr_8rem_8rem_8rem_6rem] gap-4 items-center px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                {/* İkon */}
                <span className="text-xl leading-none">
                  {fileIcon(file.mimeType ?? '')}
                </span>

                {/* İsim */}
                <span
                  className="text-sm font-medium text-gray-800 truncate"
                  title={file.name ?? undefined}
                >
                  {file.name ?? '—'}
                </span>

                {/* Tür */}
                <span className="text-xs text-gray-500">
                  {mimeLabel(file.mimeType ?? '')}
                </span>

                {/* Boyut */}
                <span className="text-xs text-gray-500 text-right">
                  {formatBytes(file.size)}
                </span>

                {/* Tarih */}
                <span className="text-xs text-gray-500 text-right">
                  {formatDate(file.modifiedTime)}
                </span>

                {/* Link */}
                <span className="text-right">
                  {file.webViewLink ? (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:text-emerald-800 underline underline-offset-2"
                    >
                      Aç
                    </a>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400">
            {files.length} dosya
          </div>
        </div>
      )}
    </div>
  )
}
