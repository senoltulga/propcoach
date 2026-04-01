import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPTS: Record<string, string> = {
  serbest: `Sen PropCoach, Türk gayrimenkul sektörüne özel deneyimli bir iş koçusun. Danışmana serbest formatta destek veriyorsun. Kısa, pratik, Türkçe cevaplar ver.`,
  satis: `Sen PropCoach, gayrimenkul satış uzmanı ve koçusun. Kapanış teknikleri, itiraz yönetimi, müzakere konularında Türk piyasasına özgü pratik tavsiyeler ver. Kısa ve uygulanabilir cevaplar ver.`,
  musteri: `Sen PropCoach, müşteri ilişkileri koçusun. CRM, müşteri takibi, ilişki yönetimi konularında Türk gayrimenkul danışmanlarına destek veriyorsun. Somut, uygulanabilir adımlar öner.`,
  portfoy: `Sen PropCoach, portföy yönetimi ve fiyatlama uzmanısın. KRB (Karşılaştırmalı Piyasa Analizi) hazırlama, fiyat stratejisi, ilan optimizasyonu konularında danışmana destek ver.`,
  hedef: `Sen PropCoach, performans ve hedef koçusun. Aylık hedef belirleme, önceliklendirme, verimlilik artırma konularında Türk gayrimenkul danışmanlarına rehberlik ediyorsun.`,
  motivasyon: `Sen PropCoach, motivasyon ve kişisel gelişim koçusun. Danışmanın engellerini aşmasına, güçlü yönlerini keşfetmesine ve profesyonel büyümesine yardımcı ol. Empatik ve destekleyici bir ton kullan.`,
}

export async function POST(req: NextRequest) {
  try {
    const { program, messages } = await req.json()
    const systemPrompt = SYSTEM_PROMPTS[program] || SYSTEM_PROMPTS.serbest

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Coach API error:', err)
    return NextResponse.json({ reply: 'Koçluk servisi şu an yanıt veremiyor. Lütfen tekrar deneyin.' }, { status: 500 })
  }
}
