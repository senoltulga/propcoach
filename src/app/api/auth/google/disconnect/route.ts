import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase
    .from('integrations')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', 'google')

  return NextResponse.redirect(new URL('/dashboard/ayarlar?google=disconnected', (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/dashboard/ayarlar'))
}
