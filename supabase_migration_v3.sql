-- ============================================
-- PropCoach Migration v3 — Eksik tablolar
-- ============================================

-- 1. agent_metrics
CREATE TABLE IF NOT EXISTS agent_metrics (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id     uuid REFERENCES offices(id),
  agent_id      uuid REFERENCES profiles(id),
  month         int NOT NULL,
  year          int NOT NULL,
  sales_count   int DEFAULT 0,
  revenue       numeric DEFAULT 0,
  client_count  int DEFAULT 0,
  meetings_count int DEFAULT 0,
  target_sales  int DEFAULT 10,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(agent_id, month, year)
);
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ofis üyeleri metrikleri görür" ON agent_metrics;
CREATE POLICY "Ofis üyeleri metrikleri görür" ON agent_metrics FOR ALL
USING (office_id = get_my_office_id() OR agent_id = auth.uid());

-- 2. clients
CREATE TABLE IF NOT EXISTS clients (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id    uuid REFERENCES offices(id),
  agent_id     uuid REFERENCES profiles(id),
  full_name    text NOT NULL,
  email        text,
  phone        text,
  budget       numeric DEFAULT 0,
  interest     text,
  status       text DEFAULT 'active',  -- active, risk, cold, closed
  last_contact timestamptz,
  notes        text,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ofis üyeleri müşterileri görür" ON clients;
CREATE POLICY "Ofis üyeleri müşterileri görür" ON clients FOR ALL
USING (office_id = get_my_office_id() OR agent_id = auth.uid());

-- 3. listings
CREATE TABLE IF NOT EXISTS listings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id       uuid REFERENCES offices(id),
  agent_id        uuid REFERENCES profiles(id),
  title           text NOT NULL,
  description     text,
  price           numeric DEFAULT 0,
  status          text DEFAULT 'active',  -- active, sold, passive
  days_on_market  int DEFAULT 0,
  krb_uploaded    boolean DEFAULT false,
  property_type   text,
  rooms           text,
  area_sqm        numeric,
  district        text,
  city            text,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ofis üyeleri ilanları görür" ON listings;
CREATE POLICY "Ofis üyeleri ilanları görür" ON listings FOR ALL
USING (office_id = get_my_office_id() OR agent_id = auth.uid());

-- ============================================
-- Test verisi — agent_metrics (Mart 2026)
-- (office_id ve agent_id'yi gerçek değerlerle değiştirin)
-- ============================================

-- Bu INSERT'leri çalıştırmak için önce danışman ID'lerini profiles tablosundan alın:
-- SELECT id, full_name FROM profiles WHERE office_id = '11111111-1111-1111-1111-111111111111';

-- Aşağıdaki örnek veriler gerçek agent_id olmadan çalışmayabilir.
-- Danışman hesapları varsa onların UUID'lerini kullanın.

-- Örnek: Kendi hesabınızın UUID'si için
-- INSERT INTO agent_metrics (office_id, agent_id, month, year, sales_count, revenue, client_count, meetings_count, target_sales)
-- SELECT '11111111-1111-1111-1111-111111111111', id, 3, 2026, 7, 875000, 12, 18, 10
-- FROM profiles WHERE email = 'senoltulga@gmail.com'
-- ON CONFLICT (agent_id, month, year) DO NOTHING;

-- ============================================
-- Test verisi — clients
-- ============================================
-- INSERT INTO clients (office_id, agent_id, full_name, budget, interest, status, last_contact)
-- SELECT '11111111-1111-1111-1111-111111111111', id, 'Ahmet Kaya', 2500000, '3+1 Kadıköy', 'active', now() - interval '2 days'
-- FROM profiles WHERE email = 'senoltulga@gmail.com'
-- ON CONFLICT DO NOTHING;

-- ============================================
-- Test verisi — listings
-- ============================================
-- INSERT INTO listings (office_id, agent_id, title, price, status, days_on_market, krb_uploaded)
-- SELECT '11111111-1111-1111-1111-111111111111', id, 'Kadıköy 3+1 Deniz Manzaralı', 3200000, 'active', 45, true
-- FROM profiles WHERE email = 'senoltulga@gmail.com'
-- ON CONFLICT DO NOTHING;

SELECT 'Migration v3 başarılı ✓' as result;
