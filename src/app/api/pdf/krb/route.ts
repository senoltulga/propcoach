import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import { KrbReport } from '@/lib/pdf/KrbReport'

export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get('listing_id')
  if (!listingId) return NextResponse.json({ error: 'listing_id required' }, { status: 400 })

  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('*, profiles(full_name)')
    .eq('id', listingId)
    .single()

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  const { data: comparables } = await supabase
    .from('listings')
    .select('title, price, district, rooms, days_on_market, status')
    .eq('district', listing.district || '')
    .neq('id', listingId)
    .limit(5)

  let officeName = 'PropCoach Ofisi'
  try {
    const { data: office } = await supabase
      .from('offices')
      .select('name')
      .eq('id', listing.office_id)
      .single()
    if (office?.name) officeName = office.name
  } catch {}

  const reportDate = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  const element = createElement(KrbReport, {
    listing,
    agentName: (listing as any).profiles?.full_name || 'Danışman',
    officeName,
    comparables: comparables || [],
    reportDate,
  })
  const buffer = await renderToBuffer(element as any)

  const filename = `KRB-${listing.title?.slice(0, 30).replace(/\s+/g, '-') || 'rapor'}.pdf`

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
