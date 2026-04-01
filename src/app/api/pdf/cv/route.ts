import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import { AgentCV } from '@/lib/pdf/AgentCV'

export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get('agent_id')
  if (!agentId) return NextResponse.json({ error: 'agent_id required' }, { status: 400 })

  const supabase = await createClient()

  const { data: agent } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', agentId)
    .single()

  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const { data: metrics } = await supabase
    .from('agent_metrics')
    .select('*')
    .eq('agent_id', agentId)
    .eq('month', new Date().getMonth() + 1)
    .eq('year', new Date().getFullYear())
    .maybeSingle()

  let officeName = 'PropCoach Ofisi'
  try {
    const { data: office } = await supabase
      .from('offices')
      .select('name')
      .eq('id', agent.office_id)
      .single()
    if (office?.name) officeName = office.name
  } catch {}

  const reportDate = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  const element = createElement(AgentCV, { agent, metrics, officeName, reportDate })
  const buffer = await renderToBuffer(element as any)

  const filename = `CV-${agent.full_name?.replace(/\s+/g, '-') || 'danishman'}.pdf`

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
