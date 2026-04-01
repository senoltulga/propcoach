import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getClientWithTokens } from '@/lib/google'
import { google } from 'googleapis'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Sen PropCoach AI Asistanısın — Türk emlak ofisleri için tasarlanmış çok yetenekli bir asistan.

Görevlerin:
- Ofis ve danışman performansını analiz et
- KRB (Kıymet Takdir Raporu) oluştur
- Sunum ve raporlar hazırla
- Takvim etkinlikleri planla ve Google Calendar'a ekle
- Gmail üzerinden mail gönder
- Danışman eğitim durumunu takip et
- Portföydeki ilanları ara ve filtrele

Kullanıcı senden bir şey istediğinde önce uygun araçları kullanarak gerçek veriyi al, sonra net ve yararlı bir yanıt ver.
Araç kullanırken kullanıcıya ne yaptığını kısaca belirt.
Yanıtların Türkçe olsun. Sonuçları maddeler halinde, sade ve net sun.
Sunum oluştururken içeriği zengin ve profesyonel tut.`

const tools: Anthropic.Tool[] = [
  {
    name: 'search_listings',
    description: 'Portföydeki ilanları ara. Fiyat aralığı, durum veya anahtar kelimeye göre filtrele.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Arama metni (başlık içinde)' },
        status: { type: 'string', enum: ['active', 'sold', 'passive'] },
        max_price: { type: 'number' },
        min_price: { type: 'number' },
        limit: { type: 'number', description: 'Kaç sonuç (varsayılan 5)' },
      },
      required: [],
    },
  },
  {
    name: 'get_agent_performance',
    description: 'Danışman performans metriklerini getir. Satış, ciro, müşteri, hedef bilgileri.',
    input_schema: {
      type: 'object' as const,
      properties: {
        agent_name: { type: 'string', description: 'Danışman adı (boş = tüm danışmanlar)' },
      },
      required: [],
    },
  },
  {
    name: 'generate_krb_report',
    description: 'Seçilen mülk için KRB (Kıymet Takdir Raporu) PDF oluştur.',
    input_schema: {
      type: 'object' as const,
      properties: {
        listing_id: { type: 'string', description: 'Mülk ID\'si' },
        listing_title: { type: 'string', description: 'Mülk başlığı veya anahtar kelime' },
      },
      required: [],
    },
  },
  {
    name: 'create_presentation',
    description: 'Belirtilen konu için profesyonel sunum oluştur: satış sunumu, performans raporu, piyasa analizi vb.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Sunum başlığı' },
        topic: {
          type: 'string',
          enum: ['sales_pitch', 'office_performance', 'market_analysis', 'agent_intro', 'training_report', 'custom'],
        },
        key_points: { type: 'array', items: { type: 'string' }, description: 'Vurgulanacak noktalar' },
        context: { type: 'string', description: 'Ek bağlam' },
      },
      required: ['title', 'topic'],
    },
  },
  {
    name: 'schedule_calendar_event',
    description: 'Google Calendar\'a yeni etkinlik ekle.',
    input_schema: {
      type: 'object' as const,
      properties: {
        summary: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        start_time: { type: 'string', description: 'HH:MM' },
        end_time: { type: 'string', description: 'HH:MM' },
        description: { type: 'string' },
        attendees: { type: 'array', items: { type: 'string' } },
      },
      required: ['summary', 'date', 'start_time', 'end_time'],
    },
  },
  {
    name: 'send_email',
    description: 'Gmail üzerinden email gönder.',
    input_schema: {
      type: 'object' as const,
      properties: {
        to: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'get_training_summary',
    description: 'Ofisteki zorunlu eğitim tamamlanma durumunu ve danışman eğitim geçmişini getir.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
]

// ─── Tool Executor ────────────────────────────────────────────────────────────
async function executeTool(
  toolName: string,
  input: Record<string, any>,
  supabase: any,
  officeId: string,
  integration: any,
): Promise<{ data: any; display: string; artifact?: any }> {
  switch (toolName) {

    case 'search_listings': {
      let q = supabase
        .from('listings')
        .select('id,title,price,status,district,type,cover_image_url,agent_id')
        .eq('office_id', officeId)
      if (input.status) q = q.eq('status', input.status)
      if (input.max_price) q = q.lte('price', input.max_price)
      if (input.min_price) q = q.gte('price', input.min_price)
      if (input.query) q = q.ilike('title', `%${input.query}%`)
      q = q.limit(input.limit || 5)
      const { data } = await q
      return {
        data: data || [],
        display: `${(data || []).length} ilan bulundu`,
      }
    }

    case 'get_agent_performance': {
      let aq = supabase
        .from('profiles')
        .select('id,full_name,email')
        .eq('office_id', officeId)
        .eq('role', 'agent')
      if (input.agent_name) aq = aq.ilike('full_name', `%${input.agent_name}%`)
      const { data: agents } = await aq
      const { data: metrics } = await supabase
        .from('agent_metrics')
        .select('*')
        .eq('month', 3)
        .eq('year', 2026)
      const metricsMap = Object.fromEntries((metrics || []).map((m: any) => [m.agent_id, m]))
      const result = (agents || []).map((a: any) => ({
        name: a.full_name,
        email: a.email,
        sales: metricsMap[a.id]?.sales_count ?? 0,
        revenue: metricsMap[a.id]?.revenue ?? 0,
        clients: metricsMap[a.id]?.client_count ?? 0,
        meetings: metricsMap[a.id]?.meetings_count ?? 0,
        target: metricsMap[a.id]?.target_sales ?? 0,
        target_pct: metricsMap[a.id]?.target_sales > 0
          ? Math.round((metricsMap[a.id]?.sales_count / metricsMap[a.id]?.target_sales) * 100)
          : 0,
      }))
      return { data: result, display: `${result.length} danışman performans verisi alındı` }
    }

    case 'generate_krb_report': {
      let listingId = input.listing_id
      if (!listingId && input.listing_title) {
        const { data } = await supabase
          .from('listings')
          .select('id,title')
          .ilike('title', `%${input.listing_title}%`)
          .eq('office_id', officeId)
          .limit(1)
        listingId = data?.[0]?.id
      }
      if (!listingId) {
        return { data: { error: 'Mülk bulunamadı' }, display: 'Mülk bulunamadı — önce ilan araması yapın' }
      }
      const url = `/api/pdf/krb?listing_id=${listingId}`
      return {
        data: { url, listing_id: listingId },
        display: 'KRB raporu hazır',
        artifact: { type: 'pdf', url, title: 'KRB Kıymet Takdir Raporu' },
      }
    }

    case 'create_presentation': {
      // Konuya göre veri çek
      let contextData: any = {}
      if (input.topic === 'office_performance') {
        const { data: metrics } = await supabase.from('agent_metrics').select('*').eq('month', 3).eq('year', 2026)
        const { data: agents } = await supabase.from('profiles').select('id,full_name').eq('office_id', officeId).neq('role', 'office_owner')
        contextData = { metrics, agents, month: 'Mart 2026' }
      } else if (input.topic === 'training_report') {
        const { data: mandatory } = await supabase.from('mandatory_trainings').select('*').eq('office_id', officeId)
        const { data: completions } = await supabase.from('agent_trainings').select('*').eq('office_id', officeId)
        contextData = { mandatory, completions }
      } else if (input.topic === 'market_analysis') {
        const { data: listings } = await supabase.from('listings').select('price,status,type,district').eq('office_id', officeId)
        contextData = { listings }
      }

      // Specialist agent — sunum içeriği üret
      const presResponse = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `"${input.title}" başlıklı profesyonel bir sunum oluştur.
Konu tipi: ${input.topic}
Ana noktalar: ${(input.key_points || []).join(', ') || 'otomatik belirle'}
Bağlam: ${input.context || ''}
Veri: ${JSON.stringify(contextData).slice(0, 2000)}

JSON formatında yanıt ver (başka bir şey yazma):
{
  "slides": [
    {
      "title": "slayt başlığı",
      "points": ["madde 1", "madde 2", "madde 3"],
      "type": "title|content|data|closing",
      "highlight": "opsiyonel vurgulanan sayı veya ifade"
    }
  ]
}
Maksimum 6 slayt. Türkçe. Her slayta 3-5 madde.`,
        }],
      })

      let slides: any[] = []
      try {
        const text = presResponse.content[0].type === 'text' ? presResponse.content[0].text : ''
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) slides = JSON.parse(jsonMatch[0]).slides || []
      } catch {
        slides = [{ title: input.title, points: ['Sunum oluşturuldu.'], type: 'title' }]
      }

      return {
        data: { slides, title: input.title },
        display: `${slides.length} slaytlık "${input.title}" sunumu oluşturuldu`,
        artifact: { type: 'presentation', title: input.title, slides },
      }
    }

    case 'schedule_calendar_event': {
      if (!integration?.access_token) {
        return { data: { error: 'Google bağlı değil' }, display: '⚠ Google Calendar bağlı değil. Ayarlar > Google ile Bağlan.' }
      }
      try {
        const auth = getClientWithTokens(integration.access_token, integration.refresh_token)
        const calendar = google.calendar({ version: 'v3', auth })
        const event = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: input.summary,
            description: input.description || '',
            start: { dateTime: `${input.date}T${input.start_time}:00`, timeZone: 'Europe/Istanbul' },
            end: { dateTime: `${input.date}T${input.end_time}:00`, timeZone: 'Europe/Istanbul' },
            attendees: (input.attendees || []).map((e: string) => ({ email: e })),
          },
        })
        return {
          data: { event_id: event.data.id, link: event.data.htmlLink },
          display: `✓ "${input.summary}" takvime eklendi — ${input.date} ${input.start_time}`,
        }
      } catch (e: any) {
        return { data: { error: e.message }, display: `Takvim hatası: ${e.message}` }
      }
    }

    case 'send_email': {
      if (!integration?.access_token) {
        return { data: { error: 'Gmail bağlı değil' }, display: '⚠ Gmail bağlı değil. Ayarlar > Google ile Bağlan.' }
      }
      try {
        const auth = getClientWithTokens(integration.access_token, integration.refresh_token)
        const gmail = google.gmail({ version: 'v1', auth })
        const raw = Buffer.from(
          `To: ${input.to}\r\nSubject: ${input.subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${input.body}`
        ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
        await gmail.users.messages.send({ userId: 'me', requestBody: { raw } })
        return { data: { sent: true }, display: `✓ Mail gönderildi → ${input.to}` }
      } catch (e: any) {
        return { data: { error: e.message }, display: `Mail hatası: ${e.message}` }
      }
    }

    case 'get_training_summary': {
      const [{ data: mandatory }, { data: completions }, { data: agents }] = await Promise.all([
        supabase.from('mandatory_trainings').select('*').eq('office_id', officeId).eq('is_active', true),
        supabase.from('agent_trainings').select('agent_id,mandatory_training_id,title,training_date,score').eq('office_id', officeId),
        supabase.from('profiles').select('id,full_name').eq('office_id', officeId).eq('role', 'agent'),
      ])
      return {
        data: { mandatory: mandatory || [], completions: completions || [], totalAgents: agents?.length || 0 },
        display: `${mandatory?.length || 0} zorunlu eğitim, ${completions?.length || 0} tamamlama kaydı`,
      }
    }

    default:
      return { data: { error: 'Bilinmeyen araç' }, display: 'Bilinmeyen araç' }
  }
}

// ─── POST /api/agent ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const officeId = profile?.office_id || profile?.id

  const { data: integration } = await supabase
    .from('integrations').select('*').eq('user_id', user.id).eq('provider', 'google').maybeSingle()

  const { messages } = await req.json()

  let currentMessages = messages
  const toolCallLog: any[] = []
  const artifacts: any[] = []
  let finalResponse = ''

  // Agentic loop — max 6 iteration
  for (let i = 0; i < 6; i++) {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools,
      messages: currentMessages,
    })

    if (response.stop_reason === 'end_turn') {
      finalResponse = (response.content.find(c => c.type === 'text') as any)?.text || ''
      break
    }

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(c => c.type === 'tool_use') as any[]
      const toolResults: any[] = []

      for (const toolUse of toolUseBlocks) {
        const result = await executeTool(toolUse.name, toolUse.input, supabase, officeId, integration)
        toolCallLog.push({ id: toolUse.id, tool: toolUse.name, input: toolUse.input, display: result.display })
        if (result.artifact) artifacts.push(result.artifact)
        toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result.data) })
      }

      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ]
    }
  }

  return NextResponse.json({ response: finalResponse, tool_calls: toolCallLog, artifacts })
}
