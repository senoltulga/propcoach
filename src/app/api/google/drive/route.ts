import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { Readable } from 'stream'
import { createClient } from '@/lib/supabase/server'
import { getClientWithTokens } from '@/lib/google'

async function getIntegration(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single()
  return data
}

// GET /api/google/drive?action=list&folder_id=...
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const integration = await getIntegration(user.id)
  if (!integration) return NextResponse.json({ error: 'Google bağlı değil' }, { status: 400 })

  const auth = getClientWithTokens(integration.access_token, integration.refresh_token)
  const drive = google.drive({ version: 'v3', auth })

  const folderId = req.nextUrl.searchParams.get('folder_id') || 'root'

  const { data } = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink)',
    orderBy: 'modifiedTime desc',
    pageSize: 50,
  })

  return NextResponse.json({ files: data.files || [] })
}

// POST /api/google/drive — dosya yükleme
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const integration = await getIntegration(user.id)
  if (!integration) return NextResponse.json({ error: 'Google bağlı değil' }, { status: 400 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const folderName = (formData.get('folder') as string) || 'PropCoach'

  if (!file) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 })

  const auth = getClientWithTokens(integration.access_token, integration.refresh_token)
  const drive = google.drive({ version: 'v3', auth })

  // PropCoach klasörünü bul veya oluştur
  let folderId: string
  const { data: folderSearch } = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
  })

  if (folderSearch.files && folderSearch.files.length > 0) {
    folderId = folderSearch.files[0].id!
  } else {
    const { data: newFolder } = await drive.files.create({
      requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id',
    })
    folderId = newFolder.id!
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const stream = Readable.from(buffer)

  const { data: uploaded } = await drive.files.create({
    requestBody: { name: file.name, parents: [folderId] },
    media: { mimeType: file.type || 'application/octet-stream', body: stream },
    fields: 'id,name,webViewLink',
  })

  return NextResponse.json({ file: uploaded })
}
