import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { getClientWithTokens } from '@/lib/google'

async function getIntegration(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single()
  return data
}

// GET /api/google/mail?action=list|get&message_id=...
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const integration = await getIntegration(user.id)
  if (!integration) return NextResponse.json({ error: 'Google bağlı değil' }, { status: 400 })

  const auth = getClientWithTokens(integration.access_token, integration.refresh_token)
  const gmail = google.gmail({ version: 'v1', auth })

  const action = req.nextUrl.searchParams.get('action') || 'list'

  if (action === 'list') {
    const { data } = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
      labelIds: ['INBOX'],
    })

    const messages = await Promise.all(
      (data.messages || []).slice(0, 10).map(async (m) => {
        const { data: msg } = await gmail.users.messages.get({
          userId: 'me',
          id: m.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        })
        const headers = msg.payload?.headers || []
        const get = (name: string) => headers.find(h => h.name === name)?.value || ''
        return {
          id: m.id,
          from: get('From'),
          subject: get('Subject'),
          date: get('Date'),
          snippet: msg.snippet,
          unread: msg.labelIds?.includes('UNREAD'),
        }
      })
    )

    return NextResponse.json({ messages })
  }

  if (action === 'get') {
    const messageId = req.nextUrl.searchParams.get('message_id')
    if (!messageId) return NextResponse.json({ error: 'message_id required' }, { status: 400 })

    const { data: msg } = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    })

    return NextResponse.json({ message: msg })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// POST /api/google/mail — mail gönder
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const integration = await getIntegration(user.id)
  if (!integration) return NextResponse.json({ error: 'Google bağlı değil' }, { status: 400 })

  const { to, subject, body } = await req.json()
  if (!to || !subject || !body) return NextResponse.json({ error: 'to, subject, body required' }, { status: 400 })

  const auth = getClientWithTokens(integration.access_token, integration.refresh_token)
  const gmail = google.gmail({ version: 'v1', auth })

  const raw = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`
  ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const { data } = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  })

  return NextResponse.json({ message: data })
}
