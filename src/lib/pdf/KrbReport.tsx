import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: '#1f2937', padding: 40, backgroundColor: '#ffffff' },
  header: { backgroundColor: '#059669', padding: 20, marginBottom: 20, borderRadius: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#ffffff', marginBottom: 4 },
  headerSub: { fontSize: 10, color: '#a7f3d0' },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#059669', marginBottom: 8, marginTop: 16, borderBottomWidth: 1, borderBottomColor: '#d1fae5', paddingBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 140, color: '#6b7280', fontSize: 9 },
  value: { flex: 1, fontFamily: 'Helvetica-Bold', color: '#111827' },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f0fdf4', padding: '6 8', borderRadius: 2 },
  tableRow: { flexDirection: 'row', padding: '5 8', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#374151' },
  td: { fontSize: 9, color: '#374151' },
  col1: { flex: 3 },
  col2: { flex: 2 },
  col3: { flex: 1 },
  col4: { flex: 1 },
  col5: { flex: 1 },
  priceBox: { flexDirection: 'row', gap: 8, marginTop: 8 },
  priceCard: { flex: 1, backgroundColor: '#f9fafb', border: '1 solid #e5e7eb', borderRadius: 4, padding: 10, alignItems: 'center' },
  priceCardLabel: { fontSize: 8, color: '#6b7280', marginBottom: 4 },
  priceCardValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#059669' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#9ca3af', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8 },
})

const fmt = (n: number) =>
  n >= 1000000 ? `₺${(n / 1000000).toFixed(2)}M` : `₺${n.toLocaleString('tr-TR')}`

interface KrbProps {
  listing: {
    title: string
    price: number
    rooms?: string
    district?: string
    days_on_market: number
  }
  agentName: string
  officeName: string
  comparables: Array<{
    title: string
    price: number
    district?: string
    rooms?: string
    days_on_market: number
    status: string
  }>
  reportDate: string
}

export function KrbReport({ listing, agentName, officeName, comparables, reportDate }: KrbProps) {
  const prices = [listing.price, ...comparables.map(c => c.price)].filter(Boolean)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Karşılaştırmalı Piyasa Analizi</Text>
          <Text style={styles.headerSub}>{officeName} · {agentName} · {reportDate}</Text>
        </View>

        {/* Ana mülk */}
        <Text style={styles.sectionTitle}>Ana Mülk</Text>
        <View style={styles.row}><Text style={styles.label}>İlan Başlığı</Text><Text style={styles.value}>{listing.title}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Fiyat</Text><Text style={styles.value}>{fmt(listing.price)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Oda Sayısı</Text><Text style={styles.value}>{listing.rooms || '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>İlçe</Text><Text style={styles.value}>{listing.district || '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>İlandaki Gün</Text><Text style={styles.value}>{listing.days_on_market} gün</Text></View>

        {/* Karşılaştırmalı mülkler */}
        <Text style={styles.sectionTitle}>Karşılaştırmalı Mülkler</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.col1]}>Başlık</Text>
            <Text style={[styles.th, styles.col2]}>Fiyat</Text>
            <Text style={[styles.th, styles.col3]}>İlçe</Text>
            <Text style={[styles.th, styles.col4]}>Oda</Text>
            <Text style={[styles.th, styles.col5]}>Durum</Text>
          </View>
          {comparables.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.td, { color: '#9ca3af' }]}>Aynı ilçede karşılaştırılabilir ilan bulunamadı.</Text>
            </View>
          ) : (
            comparables.map((c, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.td, styles.col1]}>{c.title?.slice(0, 30)}</Text>
                <Text style={[styles.td, styles.col2]}>{fmt(c.price)}</Text>
                <Text style={[styles.td, styles.col3]}>{c.district || '—'}</Text>
                <Text style={[styles.td, styles.col4]}>{c.rooms || '—'}</Text>
                <Text style={[styles.td, styles.col5]}>{c.status === 'sold' ? 'Satıldı' : 'Aktif'}</Text>
              </View>
            ))
          )}
        </View>

        {/* Fiyat analizi */}
        <Text style={styles.sectionTitle}>Fiyat Analizi</Text>
        <View style={styles.priceBox}>
          <View style={styles.priceCard}>
            <Text style={styles.priceCardLabel}>En Düşük</Text>
            <Text style={styles.priceCardValue}>{fmt(minPrice)}</Text>
          </View>
          <View style={styles.priceCard}>
            <Text style={styles.priceCardLabel}>Ortalama</Text>
            <Text style={styles.priceCardValue}>{fmt(avgPrice)}</Text>
          </View>
          <View style={styles.priceCard}>
            <Text style={styles.priceCardLabel}>En Yüksek</Text>
            <Text style={styles.priceCardValue}>{fmt(maxPrice)}</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Bu rapor PropCoach tarafından otomatik oluşturulmuştur. · propcoach-kappa.vercel.app</Text>
      </Page>
    </Document>
  )
}
