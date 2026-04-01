import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('office_id, role').eq('id', user.id).single()

  if (profile?.role !== 'office_owner' && profile?.role !== 'office_manager') {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 403 })
  }

  const officeId = profile.office_id ?? user.id
  const body = await req.json()
  const { title, description, category, deadline, target_role } = body

  if (!title) return NextResponse.json({ error: 'title gerekli' }, { status: 400 })

  const { data, error } = await supabase
    .from('mandatory_trainings')
    .insert({
      office_id: officeId,
      title,
      description: description || null,
      category: category || 'genel',
      deadline: deadline || null,
      target_role: target_role || 'all',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ training: data })
}
