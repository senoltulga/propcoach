import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const getOpenAI = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'missing' })

// ─── Program sistem promptları ────────────────────────────────────────────────
const BASE_PROMPT = `Sen PropCoach — Türk gayrimenkul sektörüne özel, veriye dayalı bir AI koçusun.
Danışmanın gerçek performans verisine, müşteri bilgilerine ve portföyüne erişebildiğinden, soyut tavsiyeler yerine somut, kişiselleştirilmiş öneriler veriyorsun.
Türkçe konuş. Kısa, net ve uygulanabilir cevaplar ver. Gerektiğinde araçları kullanarak güncel veriyi getir.`

const PROGRAM_PROMPTS: Record<string, string> = {
  serbest: 'Serbest format. Her konuda yardımcı ol.',
  satis: 'Satış koçluğu: kapanış teknikleri, itiraz yönetimi, müzakere. Danışmanın satış metriklerine göre kişisel öneriler ver.',
  musteri: 'Müşteri ilişkileri: CRM, takip, ilişki yönetimi. Danışmanın aktif müşterilerini bilerek strateji öner.',
  portfoy: 'Portföy yönetimi: KRB hazırlama, fiyatlama, ilan optimizasyonu. Danışmanın gerçek ilanlarını analiz et.',
  hedef: 'Hedef & performans koçluğu: aylık plan, önceliklendirme. Danışmanın mevcut metriklerine göre gerçekçi hedefler koy.',
  motivasyon: 'Motivasyon & kişisel gelişim. Empatik ve destekleyici ol. Danışmanın durumunu bilerek konuş.',
}

// ─── Koçluk araçları ──────────────────────────────────────────────────────────
const coachTools: Anthropic.Tool[] = [
  {
    name: 'get_my_performance',
    description: 'Danışmanın bu ayki performans metriklerini getir: satış, ciro, müşteri, görüşme, hedef.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_my_listings',
    description: 'Danışmanın aktif ilanlarını getir: fiyat, tür, piyasada kalma süresi.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['active', 'sold', 'passive'] },
      },
      required: [],
    },
  },
  {
    name: 'get_my_clients',
    description: 'Danışmanın müşteri listesini getir: durum, bütçe, not.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['active', 'passive', 'closed'] },
      },
      required: [],
    },
  },
  {
    name: 'get_my_leads',
    description: 'Danışmana atanmış CRM leadleri getir.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'new, contacted, qualified vb.' },
      },
      required: [],
    },
  },
  {
    name: 'get_my_trainings',
    description: 'Danışmanın tamamladığı eğitimleri ve tamamlanmamış zorunlu eğitimleri getir.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_market_context',
    description: 'Ofisteki diğer danışmanların ortalama metriklerini getir — kıyaslama için.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'save_coaching_note',
    description: 'Koçluk seansından önemli bir hedef, karar veya not kaydet (hafıza).',
    input_schema: {
      type: 'object' as const,
      properties: {
        content: { type: 'string', description: 'Kaydedilecek not/hedef' },
        type: { type: 'string', enum: ['goal', 'preference', 'fact', 'context'] },
      },
      required: ['content', 'type'],
    },
  },
]

// ─── Tool Executor ────────────────────────────────────────────────────────────
async function executeCoachTool(
  toolName: string,
  input: Record<string, any>,
  supabase: any,
  userId: string,
  officeId: string,
): Promise<string> {
  switch (toolName) {

    case 'get_my_performance': {
      const { data } = await supabase
        .from('agent_metrics')
        .select('*')
        .eq('agent_id', userId)
        .eq('month', new Date().getMonth() + 1)
        .eq('year', new Date().getFullYear())
        .maybeSingle()
      if (!data) return 'Performans verisi bulunamadı.'
      const pct = data.target_sales > 0 ? Math.round((data.sales_count / data.target_sales) * 100) : 0
      return JSON.stringify({
        satış: data.sales_count, hedef: data.target_sales, hedefe_ulaşma: `%${pct}`,
        ciro: `₺${Number(data.revenue).toLocaleString('tr-TR')}`,
        müşteri: data.client_count, görüşme: data.meetings_count,
        kapanış_oranı: data.meetings_count > 0 ? `%${Math.round(data.sales_count / data.meetings_count * 100)}` : '%0',
      })
    }

    case 'get_my_listings': {
      let q = supabase.from('listings').select('title,price,status,type,district,days_on_market').eq('agent_id', userId)
      if (input.status) q = q.eq('status', input.status)
      const { data } = await q.limit(10)
      if (!data || data.length === 0) return 'İlan bulunamadı.'
      return JSON.stringify(data.map((l: any) => ({
        başlık: l.title, fiyat: `₺${Number(l.price).toLocaleString('tr-TR')}`,
        durum: l.status, tür: l.type, bölge: l.district,
        piyasada: `${l.days_on_market} gün`,
      })))
    }

    case 'get_my_clients': {
      let q = supabase.from('clients').select('full_name,status,budget,notes').eq('agent_id', userId)
      if (input.status) q = q.eq('status', input.status)
      const { data } = await q.limit(10)
      if (!data || data.length === 0) return 'Müşteri bulunamadı.'
      return JSON.stringify(data.map((c: any) => ({
        isim: c.full_name, durum: c.status,
        bütçe: c.budget ? `₺${Number(c.budget).toLocaleString('tr-TR')}` : 'belirtilmemiş',
        not: c.notes,
      })))
    }

    case 'get_my_leads': {
      let q = supabase.from('leads').select('full_name,status,phone,budget,notes').eq('assigned_to', userId)
      if (input.status) q = q.eq('status', input.status)
      const { data } = await q.limit(10)
      if (!data || data.length === 0) return 'Lead bulunamadı.'
      return JSON.stringify(data.map((l: any) => ({
        isim: l.full_name, durum: l.status, telefon: l.phone,
        bütçe: l.budget ? `₺${Number(l.budget).toLocaleString('tr-TR')}` : '-', not: l.notes,
      })))
    }

    case 'get_my_trainings': {
      const [{ data: completed }, { data: mandatory }] = await Promise.all([
        supabase.from('agent_trainings').select('title,category,training_date,score,mandatory_training_id').eq('agent_id', userId).order('training_date', { ascending: false }).limit(10),
        supabase.from('mandatory_trainings').select('id,title,deadline').eq('office_id', officeId).eq('is_active', true),
      ])
      const completedIds = new Set((completed || []).map((t: any) => t.mandatory_training_id).filter(Boolean))
      const missing = (mandatory || []).filter((m: any) => !completedIds.has(m.id))
      return JSON.stringify({
        tamamlanan: (completed || []).map((t: any) => ({ eğitim: t.title, tarih: t.training_date, puan: t.score })),
        eksik_zorunlu: missing.map((m: any) => ({ eğitim: m.title, son_tarih: m.deadline })),
      })
    }

    case 'get_market_context': {
      const { data: allMetrics } = await supabase
        .from('agent_metrics')
        .select('sales_count,revenue,client_count,meetings_count,target_sales')
        .eq('month', new Date().getMonth() + 1)
        .eq('year', new Date().getFullYear())
      if (!allMetrics || allMetrics.length === 0) return 'Ofis verisi bulunamadı.'
      const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0
      return JSON.stringify({
        ofis_ortalamaları: {
          satış: avg(allMetrics.map((m: any) => m.sales_count)),
          ciro: `₺${avg(allMetrics.map((m: any) => Number(m.revenue))).toLocaleString('tr-TR')}`,
          müşteri: avg(allMetrics.map((m: any) => m.client_count)),
          görüşme: avg(allMetrics.map((m: any) => m.meetings_count)),
          hedef_tamamlama: `%${avg(allMetrics.map((m: any) => m.target_sales > 0 ? Math.round(m.sales_count / m.target_sales * 100) : 0))}`,
        },
        danışman_sayısı: allMetrics.length,
      })
    }

    case 'save_coaching_note': {
      await supabase.from('agent_memory').insert({
        user_id: userId,
        memory_type: input.type || 'fact',
        content: input.content,
        importance: input.type === 'goal' ? 8 : 5,
      })
      return `Not kaydedildi: "${input.content}"`
    }

    default:
      return 'Araç bulunamadı.'
  }
}

// ─── RAG: Doküman vektör arama ───────────────────────────────────────────────
async function searchDocuments(supabase: any, userId: string, query: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) return ''
  try {
    const embRes = await getOpenAI().embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    })
    const embedding = embRes.data[0].embedding

    const { data: chunks } = await supabase.rpc('match_chunks', {
      query_embedding: JSON.stringify(embedding),
      match_user_id: userId,
      match_count: 4,
      similarity_threshold: 0.3,
    })

    if (!chunks || chunks.length === 0) return ''

    return '\n\nİlgili doküman bilgisi:\n' +
      chunks.map((c: any) => `[${c.doc_title}]: ${c.content}`).join('\n\n')
  } catch { return '' }
}

// ─── RAG: Kişisel hafızayı yükle ─────────────────────────────────────────────
async function loadMemoryContext(supabase: any, userId: string): Promise<string> {
  const [{ data: memories }, { data: history }] = await Promise.all([
    supabase.from('agent_memory').select('content,memory_type,importance').eq('user_id', userId)
      .order('importance', { ascending: false }).limit(6),
    supabase.from('conversation_history').select('role,content').eq('user_id', userId)
      .eq('session_id', `coach_${userId}`).order('created_at', { ascending: false }).limit(8),
  ])

  const memPart = (memories || []).length > 0
    ? '\n\nDanışman hakkında bilinen bilgiler:\n' + (memories || []).map((m: any) => `• ${m.content}`).join('\n')
    : ''

  const histPart = (history || []).length > 0
    ? '\n\nÖnceki koçluk konuşmaları (özet):\n' + (history || []).reverse()
        .slice(-4).map((h: any) => `${h.role === 'user' ? 'Danışman' : 'Koç'}: ${h.content.slice(0, 150)}`).join('\n')
    : ''

  return memPart + histPart
}

// ─── POST /api/coach ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { program, messages } = await req.json()
    const programPrompt = PROGRAM_PROMPTS[program] || PROGRAM_PROMPTS.serbest

    let memoryContext = ''
    let userId = ''
    let officeId = ''

    // Son kullanıcı mesajını al (doküman araması için)
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')?.content || ''

    if (user) {
      userId = user.id
      const { data: profile } = await supabase.from('profiles').select('office_id').eq('id', user.id).single()
      officeId = profile?.office_id || user.id
      memoryContext = await loadMemoryContext(supabase, userId)
    }

    // Doküman RAG araması (kullanıcı girişi varsa)
    const docContext = user && lastUserMessage
      ? await searchDocuments(supabase, userId, lastUserMessage)
      : ''

    const systemPrompt = `${BASE_PROMPT}

Program: ${programPrompt}${memoryContext}${docContext}`

    let currentMessages = messages.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    let finalReply = ''
    const toolCallLog: { tool: string; display: string }[] = []

    // Agentic loop — max 4 iterasyon
    for (let i = 0; i < 4; i++) {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        tools: user ? coachTools : [],
        messages: currentMessages,
      })

      if (response.stop_reason === 'end_turn') {
        finalReply = (response.content.find(c => c.type === 'text') as any)?.text || ''
        break
      }

      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter(c => c.type === 'tool_use') as any[]
        const toolResults: any[] = []

        for (const tu of toolUseBlocks) {
          const result = user
            ? await executeCoachTool(tu.name, tu.input, supabase, userId, officeId)
            : 'Veri erişimi için giriş yapılmalı.'
          toolCallLog.push({ tool: tu.name, display: tu.name.replace('get_my_', '').replace('_', ' ') })
          toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: result })
        }

        currentMessages = [
          ...currentMessages,
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResults },
        ]
      }
    }

    // Konuşmayı hafızaya kaydet
    if (user && finalReply) {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
      if (lastUserMsg) {
        await supabase.from('conversation_history').insert([
          { user_id: userId, session_id: `coach_${userId}`, role: 'user', content: lastUserMsg.content },
          { user_id: userId, session_id: `coach_${userId}`, role: 'assistant', content: finalReply },
        ])
      }
    }

    return NextResponse.json({ reply: finalReply, tool_calls: toolCallLog })
  } catch (err) {
    console.error('Coach API error:', err)
    return NextResponse.json({ reply: 'Koçluk servisi şu an yanıt veremiyor. Lütfen tekrar deneyin.' }, { status: 500 })
  }
}
