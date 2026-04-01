import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('office_id,id').eq('id', user.id).single()
  const officeId = profile?.office_id || profile?.id

  const type = req.nextUrl.searchParams.get('type')
  const status = req.nextUrl.searchParams.get('status')

  let q = supabase
    .from('leads')
    .select('*, profiles!assigned_to(full_name)')
    .eq('office_id', officeId)
    .order('created_at', { ascending: false })

  if (type) q = q.eq('type', type)
  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leads: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('office_id,id').eq('id', user.id).single()
  const officeId = profile?.office_id || profile?.id

  const body = await req.json()
  const { full_name, phone, email, type, source, status, budget, notes, assigned_to, tags } = body

  if (!full_name) return NextResponse.json({ error: 'full_name gerekli' }, { status: 400 })

  const { data, error } = await supabase.from('leads').insert({
    office_id: officeId,
    full_name, phone: phone || null, email: email || null,
    type: type || 'client',
    source: source || 'manual',
    status: status || 'new',
    budget: budget || null,
    notes: notes || null,
    assigned_to: assigned_to || null,
    tags: tags || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lead: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

  const { data, error } = await supabase.from('leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lead: data })
}
