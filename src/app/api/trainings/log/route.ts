import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('id, office_id, role').eq('id', user.id).single()

  const body = await req.json()
  const { agent_id, title, category, training_date, score, notes, mandatory_training_id } = body

  if (!title || !training_date) {
    return NextResponse.json({ error: 'title ve training_date gerekli' }, { status: 400 })
  }

  // Yönetici başkası adına kaydediyorsa agent_id kullan
  const isManager = profile?.role === 'office_owner' || profile?.role === 'office_manager'
  const targetAgentId = (isManager && agent_id) ? agent_id : user.id

  // office_id: önce kendi profilden al, yoksa hedef danışmanın profilinden, yoksa user.id (FK profiles(id)'e)
  let officeId: string | null = profile?.office_id || null

  if (!officeId && profile?.role === 'office_owner') {
    // office_owner kendi id'si hem profiles.id hem de officeId olarak geçerli
    officeId = user.id
  }

  if (!officeId && isManager && agent_id) {
    const { data: agentProfile } = await supabase
      .from('profiles').select('office_id').eq('id', agent_id).single()
    officeId = agentProfile?.office_id || null
  }

  const insertData: Record<string, any> = {
    agent_id: targetAgentId,
    title,
    category: category || 'genel',
    training_date,
    score: score != null && score !== '' ? Number(score) : null,
    notes: notes || null,
    mandatory_training_id: mandatory_training_id || null,
  }
  if (officeId) insertData.office_id = officeId

  const { data, error } = await supabase
    .from('agent_trainings')
    .insert(insertData)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ training: data })
}
