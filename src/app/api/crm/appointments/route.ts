import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getClientWithTokens } from '@/lib/google'
import { google } from 'googleapis'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('office_id,id').eq('id', user.id).single()
  const officeId = profile?.office_id || profile?.id

  const { data, error } = await supabase
    .from('appointments')
    .select('*, profiles!agent_id(full_name), leads(full_name,phone)')
    .eq('office_id', officeId)
    .order('appointment_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ appointments: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('office_id,id').eq('id', user.id).single()
  const officeId = profile?.office_id || profile?.id

  const body = await req.json()
  const { title, description, appointment_date, duration_minutes, location, type, agent_id, lead_id, client_id, add_to_calendar } = body

  if (!title || !appointment_date) return NextResponse.json({ error: 'title ve appointment_date gerekli' }, { status: 400 })

  let calendarEventId: string | null = null

  // Google Calendar'a da ekle
  if (add_to_calendar) {
    try {
      const { data: integration } = await supabase
        .from('integrations').select('*').eq('user_id', user.id).eq('provider', 'google').maybeSingle()
      if (integration?.access_token) {
        const auth = getClientWithTokens(integration.access_token, integration.refresh_token)
        const calendar = google.calendar({ version: 'v3', auth })
        const start = new Date(appointment_date)
        const end = new Date(start.getTime() + (duration_minutes || 60) * 60000)
        const event = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: title,
            description: description || '',
            location: location || '',
            start: { dateTime: start.toISOString(), timeZone: 'Europe/Istanbul' },
            end: { dateTime: end.toISOString(), timeZone: 'Europe/Istanbul' },
          },
        })
        calendarEventId = event.data.id || null
      }
    } catch { /* calendar opsiyonel */ }
  }

  const { data, error } = await supabase.from('appointments').insert({
    office_id: officeId,
    agent_id: agent_id || user.id,
    lead_id: lead_id || null,
    client_id: client_id || null,
    title, description: description || null,
    appointment_date,
    duration_minutes: duration_minutes || 60,
    location: location || null,
    type: type || 'meeting',
    status: 'planned',
    calendar_event_id: calendarEventId,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ appointment: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

  const { data, error } = await supabase.from('appointments').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ appointment: data })
}
