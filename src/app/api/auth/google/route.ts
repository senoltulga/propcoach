import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUrl } from '@/lib/google'

// GET /api/auth/google — OAuth akışını başlatır
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // state = user id (callback'de kim olduğunu bileceğiz)
  const url = getAuthUrl(user.id)
  return NextResponse.redirect(url)
}
