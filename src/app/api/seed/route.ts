import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const uid = user.id

  const { data: profile } = await supabase.from('profiles').select('office_id').eq('id', uid).single()
  const officeId = profile?.office_id || uid

  // Metrics
  await supabase.from('agent_metrics').upsert({
    agent_id: uid,
    month,
    year,
    sales_count: 3,
    target_sales: 8,
    revenue: 4250000,
    client_count: 12,
    meetings_count: 18,
  }, { onConflict: 'agent_id,month,year' })

  // Clients
  const clientsCheck = await supabase.from('clients').select('id').eq('agent_id', uid).limit(1)
  if (!clientsCheck.data || clientsCheck.data.length === 0) {
    await supabase.from('clients').insert([
      { agent_id: uid, office_id: officeId, full_name: 'Ahmet Yılmaz', status: 'active', budget: 3500000, notes: 'Kadıköy civarında 3+1 arıyor' },
      { agent_id: uid, office_id: officeId, full_name: 'Fatma Kaya', status: 'active', budget: 5200000, notes: 'Beşiktaş'ta dubleks tercih ediyor' },
      { agent_id: uid, office_id: officeId, full_name: 'Mehmet Demir', status: 'passive', budget: 2800000, notes: 'Bütçesi sınırlı, esnek değil' },
      { agent_id: uid, office_id: officeId, full_name: 'Ayşe Çelik', status: 'active', budget: 7000000, notes: 'Boğaz manzaralı villa istiyor' },
      { agent_id: uid, office_id: officeId, full_name: 'Hasan Öztürk', status: 'closed', budget: 4100000, notes: 'Ataşehir'de 2+1 aldı, kapandı' },
    ])
  }

  // Listings
  const listingsCheck = await supabase.from('listings').select('id').eq('agent_id', uid).limit(1)
  if (!listingsCheck.data || listingsCheck.data.length === 0) {
    await supabase.from('listings').insert([
      { agent_id: uid, office_id: officeId, title: 'Kadıköy Moda 3+1 Lüks Daire', price: 4200000, type: 'apartment', status: 'active', district: 'Kadıköy', days_on_market: 14, description: 'Deniz manzaralı, ebeveyn banyolu' },
      { agent_id: uid, office_id: officeId, title: 'Beşiktaş Nişantaşı 2+1', price: 6800000, type: 'apartment', status: 'active', district: 'Beşiktaş', days_on_market: 32, description: 'Metro yürüme mesafesinde' },
      { agent_id: uid, office_id: officeId, title: 'Maltepe Deniz Manzaralı 4+1', price: 5500000, type: 'apartment', status: 'active', district: 'Maltepe', days_on_market: 67, description: 'Geniş teras, otopark dahil' },
      { agent_id: uid, office_id: officeId, title: 'Ataşehir Plaza 1+1 Yatırım', price: 2100000, type: 'apartment', status: 'sold', district: 'Ataşehir', days_on_market: 8, description: 'Kiracılı yatırımlık' },
      { agent_id: uid, office_id: officeId, title: 'Çekmeköy Villa 5+2', price: 12500000, type: 'villa', status: 'active', district: 'Çekmeköy', days_on_market: 95, description: 'Havuzlu, kapalı site' },
    ])
  }

  // Mandatory trainings
  const mandatoryCheck = await supabase.from('mandatory_trainings').select('id').eq('office_id', officeId).limit(1)
  if (!mandatoryCheck.data || mandatoryCheck.data.length === 0) {
    await supabase.from('mandatory_trainings').insert([
      { office_id: officeId, title: 'KVKK & Kişisel Veri Koruma', category: 'hukuki', target_role: 'all', deadline: `${year}-${String(month + 1).padStart(2, '0')}-15`, is_active: true },
      { office_id: officeId, title: 'Tapu ve Kadastro İşlemleri', category: 'teknik', target_role: 'agent', deadline: `${year}-${String(month + 2).padStart(2, '0')}-01`, is_active: true },
      { office_id: officeId, title: 'Müzakere ve Kapanış Teknikleri', category: 'satis', target_role: 'agent', deadline: null, is_active: true },
    ])
  }

  // Agent trainings
  const trainingsCheck = await supabase.from('agent_trainings').select('id').eq('agent_id', uid).limit(1)
  if (!trainingsCheck.data || trainingsCheck.data.length === 0) {
    await supabase.from('agent_trainings').insert([
      { agent_id: uid, office_id: officeId, title: 'Satış Psikolojisi ve İkna Teknikleri', category: 'satis', training_date: `${year}-${String(month).padStart(2,'0')}-10`, score: 88, notes: 'Çok faydalı buldum' },
      { agent_id: uid, office_id: officeId, title: 'Emlak Değerleme Yöntemleri', category: 'teknik', training_date: `${year}-${String(month).padStart(2,'0')}-03`, score: 74, notes: null },
      { agent_id: uid, office_id: officeId, title: 'Dijital Pazarlama & Sosyal Medya', category: 'kisisel_gelisim', training_date: `${year}-${String(month - 1 || 1).padStart(2,'0')}-22`, score: 91, notes: 'Instagram stratejisi çok işe yaradı' },
    ])
  }

  return NextResponse.json({ success: true, message: 'Demo veriler yüklendi.' })
}
