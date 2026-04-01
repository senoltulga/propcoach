'use client'

import { useRef, useState } from 'react'

export default function DriveUploadButton() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleFile(file: File) {
    setUploading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/google/drive', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Yükleme başarısız (${res.status})`)
      }

      setSuccess(true)
      // Sayfayı yenileyerek güncel listeyi göster
      setTimeout(() => window.location.reload(), 1000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          // input'u sıfırla ki aynı dosya tekrar seçilebilsin
          e.target.value = ''
        }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {uploading ? 'Yükleniyor…' : '+ Belge Yükle'}
      </button>

      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
      {success && (
        <span className="text-xs text-emerald-600">Yüklendi!</span>
      )}
    </div>
  )
}
