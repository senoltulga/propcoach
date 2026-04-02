'use client'

import { useState, useEffect, useRef } from 'react'
import PanelNav from '../PanelNav'

type Document = {
  id: string
  title: string
  file_name: string
  file_type: string
  char_count: number
  chunk_count: number
  created_at: string
}

type Memory = {
  id: string
  memory_type: string
  content: string
  importance: number
  created_at: string
}

export default function DokumanPage() {
  const [docs, setDocs] = useState<Document[]>([])
  const [memories, setMemories] = useState<Memory[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [tab, setTab] = useState<'docs' | 'memory'>('docs')
  const fileRef = useRef<HTMLInputElement>(null)

  const loadDocs = async () => {
    const res = await fetch('/api/rag/documents')
    const d = await res.json()
    setDocs(d.documents || [])
  }

  const loadMemories = async () => {
    const res = await fetch('/api/memory')
    const d = await res.json()
    setMemories(d.memories || [])
  }

  useEffect(() => { loadDocs(); loadMemories() }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMsg(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/rag/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Hata')
      setUploadMsg({ text: `✓ "${data.document.title}" yüklendi — ${data.document.chunks} parça, ${(data.document.chars / 1000).toFixed(1)}K karakter`, ok: true })
      loadDocs()
    } catch (err: any) {
      setUploadMsg({ text: err.message, ok: false })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const deleteDoc = async (id: string) => {
    if (!confirm('Bu dokümanı ve tüm parçalarını silmek istiyor musunuz?')) return
    await fetch('/api/rag/documents', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadDocs()
  }

  const deleteMemory = async (id: string) => {
    await fetch('/api/memory', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memory_id: id }) })
    loadMemories()
  }

  const memTypeLabel: Record<string, string> = {
    goal: '🎯 Hedef', preference: '⭐ Tercih', fact: '📌 Bilgi', context: '💬 Bağlam'
  }
  const memTypeColor: Record<string, string> = {
    goal: 'bg-violet-100 text-violet-700',
    preference: 'bg-yellow-100 text-yellow-700',
    fact: 'bg-blue-100 text-blue-700',
    context: 'bg-gray-100 text-gray-600',
  }
  const fileIcon = (type: string) => type?.includes('pdf') ? '📄' : '📝'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="px-6 py-3">
          <span className="text-base font-bold text-emerald-700">PropCoach</span>
        </div>
        <PanelNav />
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Koç Hafızası</h1>
          <p className="text-sm text-gray-500 mt-0.5">Dokümanlar ve koçluk notları — koçunuz bunları bilir</p>
        </div>

        {/* Tab */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {([['docs', '📚 Dokümanlar'], ['memory', '🧠 Koç Notları']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'docs' && (
          <div className="space-y-4">
            {/* Upload */}
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center hover:border-emerald-400 transition-colors">
              <div className="text-4xl mb-3">📂</div>
              <p className="text-sm font-medium text-gray-700 mb-1">PDF veya TXT dosyası yükleyin</p>
              <p className="text-xs text-gray-400 mb-4">Maks 5MB — emlak mevzuatı, fiyat listeleri, eğitim materyalleri</p>
              <label className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${uploading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                {uploading ? (
                  <><span className="animate-spin">⟳</span> Yükleniyor...</>
                ) : (
                  <><span>+</span> Dosya Seç</>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.txt,.md" onChange={handleUpload} disabled={uploading} className="hidden" />
              </label>
              {uploadMsg && (
                <div className={`mt-4 text-sm px-4 py-2 rounded-lg inline-block ${uploadMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {uploadMsg.text}
                </div>
              )}
            </div>

            {/* Doc list */}
            {docs.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-8">Henüz doküman yok</div>
            ) : (
              <div className="space-y-2">
                {docs.map(doc => (
                  <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                    <span className="text-2xl flex-shrink-0">{fileIcon(doc.file_type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{doc.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {doc.file_name} · {doc.chunk_count} parça · {(doc.char_count / 1000).toFixed(1)}K karakter
                      </p>
                      <p className="text-xs text-gray-300">{new Date(doc.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Aktif</span>
                      <button onClick={() => deleteDoc(doc.id)}
                        className="text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 px-2 py-1 rounded-lg transition-colors">
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
              💡 Yüklediğiniz dokümanlar otomatik olarak parçalanır ve vektörleştirilir. Koçluk sohbetinde koçunuz ilgili parçaları bulup yanıtlarına dahil eder.
            </div>
          </div>
        )}

        {tab === 'memory' && (
          <div className="space-y-3">
            {memories.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-8">Koçluk notları henüz yok.<br/>Koçunuzla konuştukça hedef ve bilgiler buraya kaydedilir.</div>
            ) : (
              memories.map(m => (
                <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 mt-0.5 ${memTypeColor[m.memory_type] || 'bg-gray-100 text-gray-500'}`}>
                    {memTypeLabel[m.memory_type] || m.memory_type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{m.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(m.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <button onClick={() => deleteMemory(m.id)}
                    className="text-xs text-red-400 hover:text-red-600 flex-shrink-0 mt-0.5">
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
