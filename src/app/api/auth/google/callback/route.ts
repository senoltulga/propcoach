import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOAuthClient } from '@/lib/google'

// GET /api/auth/google/callback?code=...&state=userId
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const userId = req.nextUrl.searchParams.get('state')

  if (!code || !userId) {
    return NextResponse.redirect(new URL('/dashboard/ayarlar?google=error', req.url))
  }

  const client = getOAuthClient()
  const { tokens } = await client.getToken(code)

  const supabase = await createClient()

  // Token'ları integrations tablosuna kaydet
  const { error } = await supabase
    .from('integrations')
    .upsert({
      user_id: userId,
      provider: 'google',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      google_email: null, // aşağıda doldurulacak
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' })

  if (error) {
    console.error('Integration save error:', error)
    return NextResponse.redirect(new URL('/dashboard/ayarlar?google=error', req.url))
  }

  // Google email'i çek ve kaydet
  try {
    client.setCredentials(tokens)
    const oauth2 = (await import('googleapis')).google.oauth2({ version: 'v2', auth: client })
    const { data: info } = await oauth2.userinfo.get()
    await supabase
      .from('integrations')
      .update({ google_email: info.email })
      .eq('user_id', userId)
      .eq('provider', 'google')
  } catch {}

  return NextResponse.redirect(new URL('/dashboard/ayarlar?google=success', req.url))
}
