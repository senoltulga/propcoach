-- ============================================
-- PropCoach Migration v2 — Tüm tablolar
-- ============================================

-- 1. RLS sonsuz döngüsünü düzelt
DROP POLICY IF EXISTS "Ofis sahibi tüm profilleri görür" ON profiles;
DROP POLICY IF EXISTS "Ofis üyeleri profilleri görür" ON profiles;

CREATE OR REPLACE FUNCTION get_my_office_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT office_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE POLICY "Ofis üyeleri profilleri görür"
ON profiles FOR SELECT
USING (office_id = get_my_office_id() OR auth.uid() = id);

-- 2. Staff tablosu
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid REFERENCES offices(id),
  full_name text NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'assistant',
  custom_role text,
  access_level text DEFAULT 'view_only',
  cv_url text,
  phone text,
  start_date date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ofis üyeleri staff görür" ON staff;
CREATE POLICY "Ofis üyeleri staff görür" ON staff FOR ALL
USING (office_id = get_my_office_id());

-- 3. Training modules tablosu
CREATE TABLE IF NOT EXISTS training_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid REFERENCES offices(id),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'education_coaching',
  description text,
  lesson_count int DEFAULT 1,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ofis üyeleri modülleri görür" ON training_modules;
CREATE POLICY "Ofis üyeleri modülleri görür" ON training_modules FOR ALL
USING (office_id = get_my_office_id());

-- 4. Module assignments
CREATE TABLE IF NOT EXISTS module_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES training_modules(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES profiles(id),
  progress int DEFAULT 0,
  completed_at timestamptz,
  assigned_at timestamptz DEFAULT now()
);
ALTER TABLE module_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ofis üyeleri atamaları görür" ON module_assignments;
CREATE POLICY "Ofis üyeleri atamaları görür" ON module_assignments FOR ALL
USING (
  agent_id = auth.uid()
  OR module_id IN (SELECT id FROM training_modules WHERE office_id = get_my_office_id())
);

-- 5. Coaching sessions
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid REFERENCES offices(id),
  agent_id uuid REFERENCES profiles(id),
  program text NOT NULL DEFAULT 'serbest',
  status text DEFAULT 'planned',
  duration_minutes int,
  notes text,
  session_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ofis üyeleri seansları görür" ON coaching_sessions;
CREATE POLICY "Ofis üyeleri seansları görür" ON coaching_sessions FOR ALL
USING (agent_id = auth.uid() OR office_id = get_my_office_id());

-- 6. Coaching messages
CREATE TABLE IF NOT EXISTS coaching_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES coaching_sessions(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE coaching_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Kendi mesajlarını görür" ON coaching_messages;
CREATE POLICY "Kendi mesajlarını görür" ON coaching_messages FOR ALL
USING (
  session_id IN (
    SELECT id FROM coaching_sessions
    WHERE agent_id = auth.uid() OR office_id = get_my_office_id()
  )
);

-- 7. Test verisi — Staff
INSERT INTO staff (office_id, full_name, email, role, start_date) VALUES
('11111111-1111-1111-1111-111111111111', 'Merve Koç', 'merve@tulga.com', 'team_leader', '2024-01-15'),
('11111111-1111-1111-1111-111111111111', 'Elif Yıldız', 'elif@tulga.com', 'hr', '2024-03-01'),
('11111111-1111-1111-1111-111111111111', 'Burak Aydın', 'burak@tulga.com', 'social_media', '2024-06-01'),
('11111111-1111-1111-1111-111111111111', 'Ramazan Çelik', 'muhasebe@tulga.com', 'accounting', '2023-09-01')
ON CONFLICT DO NOTHING;

-- 8. Test verisi — Training modules
INSERT INTO training_modules (office_id, name, type, description, lesson_count, status) VALUES
('11111111-1111-1111-1111-111111111111', 'Satış Koçluğu', 'sales_coaching', 'Kapanış teknikleri, müzakere, itiraz yönetimi.', 4, 'active'),
('11111111-1111-1111-1111-111111111111', 'Eğitim Koçluğu', 'education_coaching', 'Sektör bilgisi, hukuki süreçler, KRB hazırlama.', 6, 'active'),
('11111111-1111-1111-1111-111111111111', 'Portföy Yönetimi', 'technical', 'İlan yönetimi, fiyat stratejisi, KRB süreçleri.', 3, 'draft')
ON CONFLICT DO NOTHING;

-- Tamamlandı
SELECT 'Migration başarılı ✓' as result;
