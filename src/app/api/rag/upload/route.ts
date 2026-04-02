import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Metni ~1000 karakterlik chunk'lara böl, 200 karakter overlap
function chunkText(text: string, size = 1000, overlap = 200): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + size, text.length)
    chunks.push(text.slice(start, end).trim())
    if (end === text.length) break
    start += size - overlap
  }
  return chunks.filter(c => c.length > 50)
}

// PDF'den metin çıkar
async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse')
      const data = await pdfParse(buffer)
      return data.text || ''
    } catch {
      return ''
    }
  }
  // TXT, MD gibi düz metin
  return buffer.toString('utf-8')
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY tanımlı değil' }, { status: 500 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 })

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Dosya 5MB limitini aşıyor' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await extractText(buffer, file.type)

    if (!text || text.trim().length < 20) {
      return NextResponse.json({ error: 'Dosyadan metin çıkarılamadı' }, { status: 400 })
    }

    const chunks = chunkText(text)

    // Dokümanı kaydet
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        title: file.name.replace(/\.[^.]+$/, ''),
        file_name: file.name,
        file_type: file.type,
        char_count: text.length,
        chunk_count: chunks.length,
      })
      .select()
      .single()

    if (docErr) return NextResponse.json({ error: docErr.message }, { status: 500 })

    // Her chunk'ı embed et ve kaydet
    const embeddings = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunks,
    })

    const chunkRows = chunks.map((content, i) => ({
      document_id: doc.id,
      user_id: user.id,
      content,
      chunk_index: i,
      embedding: JSON.stringify(embeddings.data[i].embedding),
    }))

    const { error: chunkErr } = await supabase
      .from('document_chunks')
      .insert(chunkRows)

    if (chunkErr) {
      await supabase.from('documents').delete().eq('id', doc.id)
      return NextResponse.json({ error: chunkErr.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      document: { id: doc.id, title: doc.title, chunks: chunks.length, chars: text.length },
    })
  } catch (err: any) {
    console.error('RAG upload error:', err)
    return NextResponse.json({ error: err.message || 'Yükleme hatası' }, { status: 500 })
  }
}
