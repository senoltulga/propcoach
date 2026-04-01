import { NextRequest, NextResponse } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// GET /api/google/calendar — yaklaşan etkinlikleri çek
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const integration = await getIntegration(user.id)
  if (!integration) return NextResponse.json({ error: 'Google bağlı değil' }, { status: 400 })

  const auth = getClientWithTokens(integration.access_token, integration.refresh_token)
  const calendar = google.calendar({ version: 'v3', auth })

  const { data } = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 20,
    singleEvents: true,
    orderBy: 'startTime',
  })

  const events = (data.items || []).map(e => ({
    id: e.id,
    summary: e.summary,
    start: e.start?.dateTime || e.start?.date,
    end: e.end?.dateTime || e.end?.date,
    location: e.location,
    description: e.description,
    htmlLink: e.htmlLink,
  }))

  return NextResponse.json({ events })
}

// POST /api/google/calendar — etkinlik oluştur
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const integration = await getIntegration(user.id)
  if (!integration) return NextResponse.json({ error: 'Google bağlı değil' }, { status: 400 })

  const { summary, description, startDateTime, endDateTime, attendees } = await req.json()

  const auth = getClientWithTokens(integration.access_token, integration.refresh_token)
  const calendar = google.calendar({ version: 'v3', auth })

  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary,
      description,
      start: { dateTime: startDateTime, timeZone: 'Europe/Istanbul' },
      end: { dateTime: endDateTime, timeZone: 'Europe/Istanbul' },
      attendees: attendees?.map((email: string) => ({ email })) || [],
    },
  })

  return NextResponse.json({ event: data })
}
