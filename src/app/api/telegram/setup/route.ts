import { NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://propcoach-kappa.vercel.app'

export async function POST() {
  if (!BOT_TOKEN) return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN eksik' }, { status: 400 })

  const webhookUrl = `${APP_URL}/api/telegram`
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message'] }),
  })
  const data = await res.json()
  return NextResponse.json({ webhook_url: webhookUrl, result: data })
}
