import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('office_id, role').eq('id', user.id).single()

  const officeId = profile?.office_id ?? user.id
  const body = await req.json()
  const { agent_id, title, category, training_date, score, notes, mandatory_training_id } = body

  if (!title || !training_date) {
    return NextResponse.json({ error: 'title ve training_date gerekli' }, { status: 400 })
  }

  // Yönetici başkası adına kaydediyorsa agent_id kullan, danışman kendi adına kaydediyorsa user.id
  const targetAgentId = (
    (profile?.role === 'office_owner' || profile?.role === 'office_manager') && agent_id
  ) ? agent_id : user.id

  const { data, error } = await supabase
    .from('agent_trainings')
    .insert({
      agent_id: targetAgentId,
      office_id: officeId,
      title,
      category: category || 'genel',
      training_date,
      score: score ?? null,
      notes: notes || null,
      mandatory_training_id: mandatory_training_id || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ training: data })
}
