import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

async function sendTelegram(chatId: number, text: string, parseMode?: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode || 'HTML',
    }),
  })
}

async function handleTelegramMessage(supabase: any, telegramId: number, text: string, firstName: string) {
  // Kullanıcıyı bul
  const { data: tgUser } = await supabase
    .from('telegram_users')
    .select('*, profiles(*)')
    .eq('telegram_id', telegramId)
    .maybeSingle()

  // Kayıtlı değilse bağlantı kodu üret
  if (!tgUser) {
    const linkCode = Math.random().toString(36).slice(2, 8).toUpperCase()
    await supabase.from('agent_memory').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      memory_type: 'context',
      content: JSON.stringify({ telegram_id: telegramId, link_code: linkCode, first_name: firstName }),
      importance: 10,
    }).catch(() => {})

    await sendTelegram(telegramId,
      `👋 Merhaba ${firstName}!\n\nPropCoach'a hoş geldiniz.\n\nHesabınızı bağlamak için PropCoach'ta <b>Ayarlar</b> sayfasına gidin ve şu kodu girin:\n\n<code>${linkCode}</code>\n\nYa da <b>/baglantı</b> yazarak devam edin.`
    )
    return
  }

  const profile = tgUser.profiles
  const officeId = profile?.office_id || profile?.id

  // Komut kontrolü
  if (text.startsWith('/')) {
    await handleCommand(supabase, telegramId, text, profile, officeId)
    return
  }

  // AI Agent ile yanıtla
  const { data: memories } = await supabase
    .from('agent_memory')
    .select('content,memory_type')
    .eq('user_id', profile.id)
    .order('importance', { ascending: false })
    .limit(5)

  const { data: recentHistory } = await supabase
    .from('conversation_history')
    .select('role,content')
    .eq('user_id', profile.id)
    .eq('session_id', `telegram_${telegramId}`)
    .order('created_at', { ascending: false })
    .limit(6)

  const memoryContext = (memories || []).map((m: any) => m.content).join('\n')
  const history = (recentHistory || []).reverse().map((h: any) => ({ role: h.role, content: h.content }))

  const systemPrompt = `Sen PropCoach AI Asistanısın. Telegram üzerinden yanıt veriyorsun.
Kullanıcı: ${profile.full_name} (${profile.role})
${memoryContext ? `Bilinen bilgiler:\n${memoryContext}` : ''}
Kısa ve net yanıtlar ver. Emoji kullanabilirsin. Türkçe konuş.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [...history, { role: 'user', content: text }],
    })

    const answer = response.content[0].type === 'text' ? response.content[0].text : 'Yanıt alınamadı.'

    // Geçmişe kaydet
    await supabase.from('conversation_history').insert([
      { user_id: profile.id, session_id: `telegram_${telegramId}`, role: 'user', content: text },
      { user_id: profile.id, session_id: `telegram_${telegramId}`, role: 'assistant', content: answer },
    ])

    await sendTelegram(telegramId, answer)
  } catch {
    await sendTelegram(telegramId, '⚠️ Bir hata oluştu. Lütfen tekrar deneyin.')
  }
}

async function handleCommand(supabase: any, telegramId: number, text: string, profile: any, officeId: string) {
  const cmd = text.split(' ')[0].toLowerCase()

  switch (cmd) {
    case '/start':
    case '/yardim': {
      await sendTelegram(telegramId, `🤖 <b>PropCoach Komutları</b>

/performans — Bu ayki performans özeti
/ilanlar — Aktif ilanları listele
/randevular — Yaklaşan randevular
/lead — Yeni lead ekle
/ozet — Ofis genel durumu
/yardim — Bu menü

Ya da doğrudan soru sorabilirsiniz! 💬`)
      break
    }

    case '/performans': {
      const { data: metrics } = await supabase
        .from('agent_metrics')
        .select('*')
        .eq('agent_id', profile.id)
        .eq('month', 3).eq('year', 2026)
        .single()

      if (!metrics) {
        await sendTelegram(telegramId, '📊 Performans verisi bulunamadı.')
        break
      }
      const pct = metrics.target_sales > 0 ? Math.round((metrics.sales_count / metrics.target_sales) * 100) : 0
      const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10))
      await sendTelegram(telegramId, `📊 <b>Mart 2026 Performansı</b>

💰 Ciro: <b>₺${Number(metrics.revenue || 0).toLocaleString('tr-TR')}</b>
🏠 Satış: <b>${metrics.sales_count}</b> / ${metrics.target_sales} hedef
🤝 Müşteri: <b>${metrics.client_count}</b>
📞 Görüşme: <b>${metrics.meetings_count}</b>

🎯 Hedef: ${bar} %${pct}`)
      break
    }

    case '/ilanlar': {
      const { data: listings } = await supabase
        .from('listings')
        .select('title,price,status')
        .eq('agent_id', profile.id)
        .eq('status', 'active')
        .limit(5)

      if (!listings || listings.length === 0) {
        await sendTelegram(telegramId, '🏠 Aktif ilan bulunamadı.')
        break
      }
      const lines = listings.map((l: any, i: number) =>
        `${i + 1}. <b>${l.title}</b>\n   ₺${Number(l.price || 0).toLocaleString('tr-TR')}`
      ).join('\n\n')
      await sendTelegram(telegramId, `🏠 <b>Aktif İlanlar (${listings.length})</b>\n\n${lines}`)
      break
    }

    case '/randevular': {
      const { data: apts } = await supabase
        .from('appointments')
        .select('title,appointment_date,location,type')
        .eq('agent_id', profile.id)
        .eq('status', 'planned')
        .gte('appointment_date', new Date().toISOString())
        .order('appointment_date')
        .limit(5)

      if (!apts || apts.length === 0) {
        await sendTelegram(telegramId, '📅 Yaklaşan randevu bulunamadı.')
        break
      }
      const lines = apts.map((a: any) => {
        const d = new Date(a.appointment_date)
        return `📌 <b>${a.title}</b>\n   ${d.toLocaleDateString('tr-TR')} ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}${a.location ? '\n   📍 ' + a.location : ''}`
      }).join('\n\n')
      await sendTelegram(telegramId, `📅 <b>Yaklaşan Randevular</b>\n\n${lines}`)
      break
    }

    case '/ozet': {
      const [{ data: listings }, { data: leads }, { data: apts }] = await Promise.all([
        supabase.from('listings').select('id,status').eq('agent_id', profile.id),
        supabase.from('leads').select('id,status').eq('office_id', officeId),
        supabase.from('appointments').select('id').eq('agent_id', profile.id).eq('status', 'planned').gte('appointment_date', new Date().toISOString()),
      ])
      const activeListings = (listings || []).filter((l: any) => l.status === 'active').length
      const newLeads = (leads || []).filter((l: any) => l.status === 'new').length
      await sendTelegram(telegramId, `📋 <b>Ofis Özeti</b>

🏠 Aktif İlan: <b>${activeListings}</b>
👤 Yeni Lead: <b>${newLeads}</b>
📅 Bekleyen Randevu: <b>${(apts || []).length}</b>

Detaylar için /yardim`)
      break
    }

    case '/lead': {
      const parts = text.split(' ').slice(1)
      if (parts.length < 1) {
        await sendTelegram(telegramId, '💡 Kullanım: /lead Ad Soyad | Telefon | Not\nÖrnek: /lead Ahmet Kaya | +90 532 111 2233 | Kadıköy 3+1 arıyor')
        break
      }
      const [namePart, phonePart, notesPart] = text.replace('/lead ', '').split('|').map((s: string) => s.trim())
      const { error } = await supabase.from('leads').insert({
        office_id: officeId,
        assigned_to: profile.id,
        full_name: namePart,
        phone: phonePart || null,
        notes: notesPart || `Telegram üzerinden eklendi (${new Date().toLocaleDateString('tr-TR')})`,
        source: 'telegram',
        type: 'client',
        status: 'new',
      })
      if (error) {
        await sendTelegram(telegramId, '❌ Lead eklenemedi: ' + error.message)
      } else {
        await sendTelegram(telegramId, `✅ Lead eklendi!\n👤 ${namePart}${phonePart ? '\n📞 ' + phonePart : ''}${notesPart ? '\n📝 ' + notesPart : ''}`)
      }
      break
    }

    default:
      await sendTelegram(telegramId, '❓ Bilinmeyen komut. /yardim yazın.')
  }
}

// Webhook handler
export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) return NextResponse.json({ ok: false, error: 'Bot token eksik' })

  const body = await req.json()
  const message = body.message || body.edited_message
  if (!message) return NextResponse.json({ ok: true })

  const chatId = message.chat?.id
  const text = message.text || ''
  const firstName = message.from?.first_name || 'Kullanıcı'

  if (!chatId || !text) return NextResponse.json({ ok: true })

  const supabase = createServiceClient()
  await handleTelegramMessage(supabase, chatId, text, firstName)

  return NextResponse.json({ ok: true })
}

// GET — webhook kayıt durumunu kontrol et
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  if (!BOT_TOKEN) return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN eksik' })
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`)
  const data = await res.json()
  return NextResponse.json(data)
}
