import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// GET — kullanıcının hafızasını ve son konuşmaları getir
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sessionId = req.nextUrl.searchParams.get('session_id') || 'default'
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')

  const [{ data: memories }, { data: history }] = await Promise.all([
    supabase
      .from('agent_memory')
      .select('*')
      .eq('user_id', user.id)
      .order('importance', { ascending: false })
      .limit(10),
    supabase
      .from('conversation_history')
      .select('role,content,tool_calls,artifacts,created_at')
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit),
  ])

  return NextResponse.json({ memories: memories || [], history: history || [] })
}

// POST — mesaj kaydet + otomatik hafıza çıkarımı
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { session_id, role, content, tool_calls, artifacts, extract_memory } = await req.json()

  // Konuşmayı kaydet
  await supabase.from('conversation_history').insert({
    user_id: user.id,
    session_id: session_id || 'default',
    role,
    content,
    tool_calls: tool_calls || null,
    artifacts: artifacts || null,
  })

  // Kullanıcı mesajından hafıza çıkar (arka planda)
  if (extract_memory && role === 'user' && content.length > 30) {
    try {
      const extractRes = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: `Bu mesajdan önemli bir tercih, hedef veya bilgi var mı? Varsa JSON olarak döndür, yoksa null döndür.
Mesaj: "${content}"
Format: {"memory_type":"fact|preference|goal","content":"...","importance":1-10} veya null`,
        }],
      })
      const txt = extractRes.content[0].type === 'text' ? extractRes.content[0].text.trim() : ''
      if (txt && txt !== 'null') {
        const jsonMatch = txt.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const mem = JSON.parse(jsonMatch[0])
          await supabase.from('agent_memory').insert({
            user_id: user.id,
            memory_type: mem.memory_type || 'fact',
            content: mem.content,
            importance: mem.importance || 5,
          })
        }
      }
    } catch { /* hafıza çıkarımı opsiyonel */ }
  }

  return NextResponse.json({ ok: true })
}

// DELETE — oturum veya hafıza temizle
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, session_id } = await req.json()

  if (type === 'history' && session_id) {
    await supabase.from('conversation_history').delete().eq('user_id', user.id).eq('session_id', session_id)
  } else if (type === 'memory') {
    await supabase.from('agent_memory').delete().eq('user_id', user.id)
  }

  return NextResponse.json({ ok: true })
}
