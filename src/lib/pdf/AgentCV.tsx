import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: '#1f2937', flexDirection: 'row', backgroundColor: '#ffffff' },
  left: { width: 180, backgroundColor: '#059669', padding: 24, minHeight: '100%' },
  right: { flex: 1, padding: 32 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#059669' },
  agentName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#ffffff', marginBottom: 4 },
  agentRole: { fontSize: 9, color: '#a7f3d0', marginBottom: 20 },
  contactLabel: { fontSize: 8, color: '#6ee7b7', marginBottom: 2 },
  contactValue: { fontSize: 9, color: '#ffffff', marginBottom: 10 },
  dividerLeft: { borderBottomWidth: 1, borderBottomColor: '#047857', marginBottom: 14, marginTop: 4 },
  officeName: { fontSize: 8, color: '#a7f3d0' },
  headerRight: { marginBottom: 24 },
  brand: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#059669', marginBottom: 2 },
  brandSub: { fontSize: 9, color: '#9ca3af' },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#059669', marginBottom: 10, marginTop: 18, borderBottomWidth: 1, borderBottomColor: '#d1fae5', paddingBottom: 4 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  kpiCard: { flex: 1, backgroundColor: '#f0fdf4', borderRadius: 4, padding: 10 },
  kpiValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#059669', marginBottom: 2 },
  kpiLabel: { fontSize: 8, color: '#6b7280' },
  aboutText: { fontSize: 9, color: '#4b5563', lineHeight: 1.6 },
  footer: { position: 'absolute', bottom: 24, left: 32, right: 32, textAlign: 'center', fontSize: 8, color: '#9ca3af', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 6 },
})

const fmt = (n: number) =>
  n >= 1000000 ? `₺${(n / 1000000).toFixed(1)}M` : `₺${n.toLocaleString('tr-TR')}`

const roleLabel = (r: string) => {
  const map: Record<string, string> = {
    office_owner: 'Ofis Sahibi',
    office_manager: 'Ofis Müdürü',
    agent_linked: 'Gayrimenkul Danışmanı',
    agent_independent: 'Bağımsız Danışman',
  }
  return map[r] || 'Danışman'
}

interface CVProps {
  agent: {
    full_name: string
    email?: string
    phone?: string
    role: string
  }
  metrics: {
    sales_count: number
    revenue: number
    client_count: number
    meetings_count: number
  } | null
  officeName: string
  reportDate: string
}

export function AgentCV({ agent, metrics, officeName, reportDate }: CVProps) {
  const initials = agent.full_name
    ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'D'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Sol panel */}
        <View style={styles.left}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.agentName}>{agent.full_name}</Text>
          <Text style={styles.agentRole}>{roleLabel(agent.role)}</Text>
          <View style={styles.dividerLeft} />
          <Text style={styles.contactLabel}>E-posta</Text>
          <Text style={styles.contactValue}>{agent.email || '—'}</Text>
          <Text style={styles.contactLabel}>Telefon</Text>
          <Text style={styles.contactValue}>{agent.phone || '—'}</Text>
          <Text style={styles.contactLabel}>Ofis</Text>
          <Text style={styles.officeName}>{officeName}</Text>
        </View>

        {/* Sağ panel */}
        <View style={styles.right}>
          <View style={styles.headerRight}>
            <Text style={styles.brand}>PropCoach</Text>
            <Text style={styles.brandSub}>Danışman Profili · {reportDate}</Text>
          </View>

          <Text style={styles.sectionTitle}>Performans Özeti</Text>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{metrics?.sales_count ?? 0}</Text>
              <Text style={styles.kpiLabel}>Toplam Satış</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{fmt(metrics?.revenue ?? 0)}</Text>
              <Text style={styles.kpiLabel}>Toplam Ciro</Text>
            </View>
          </View>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{metrics?.client_count ?? 0}</Text>
              <Text style={styles.kpiLabel}>Aktif Müşteri</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{metrics?.meetings_count ?? 0}</Text>
              <Text style={styles.kpiLabel}>Görüşme Sayısı</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Hakkında</Text>
          <Text style={styles.aboutText}>
            {agent.full_name}, {officeName} bünyesinde görev yapan deneyimli bir gayrimenkul danışmanıdır.
            PropCoach platformu aracılığıyla müşteri yönetimi, portföy takibi ve koçluk programlarına aktif olarak katılmaktadır.
          </Text>

          <Text style={styles.footer}>
            Bu CV PropCoach tarafından otomatik oluşturulmuştur. · propcoach-kappa.vercel.app
          </Text>
        </View>
      </Page>
    </Document>
  )
}
