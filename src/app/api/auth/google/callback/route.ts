import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOAuthClient } from '@/lib/google'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://propcoach-kappa.vercel.app'

// GET /api/auth/google/callback?code=...&state=userId
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    const userId = req.nextUrl.searchParams.get('state')

    if (!code || !userId) {
      return NextResponse.redirect(`${BASE_URL}/dashboard/ayarlar?google=error`)
    }

    const client = getOAuthClient()
    const { tokens } = await client.getToken(code)

    if (!tokens.access_token) {
      return NextResponse.redirect(`${BASE_URL}/dashboard/ayarlar?google=error`)
    }

    const supabase = await createClient()

    // RLS bypass için service role gerekmez — state'deki userId ile upsert yapıyoruz
    // integrations tablosunun RLS politikası auth.uid() kontrolü yapar
    // Callback sırasında oturum cookie'si mevcut olduğu için çalışır
    await supabase
      .from('integrations')
      .upsert({
        user_id: userId,
        provider: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,provider' })

    // Google email'i çek
    try {
      client.setCredentials(tokens)
      const { google } = await import('googleapis')
      const oauth2 = google.oauth2({ version: 'v2', auth: client })
      const { data: info } = await oauth2.userinfo.get()
      if (info.email) {
        await supabase
          .from('integrations')
          .update({ google_email: info.email })
          .eq('user_id', userId)
          .eq('provider', 'google')
      }
    } catch (e) {
      console.error('Email fetch error:', e)
    }

    return NextResponse.redirect(`${BASE_URL}/dashboard/ayarlar?google=success`)
  } catch (err) {
    console.error('Google callback error:', err)
    return NextResponse.redirect(`${BASE_URL}/dashboard/ayarlar?google=error`)
  }
}
