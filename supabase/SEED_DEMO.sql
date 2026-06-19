-- ============================================================
-- SEED DATA DEMO untuk Inventoport
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Drop FK constraints sementara supaya bisa insert tanpa auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_created_by_fkey;
ALTER TABLE stock_in DROP CONSTRAINT IF EXISTS stock_in_created_by_fkey;
ALTER TABLE stock_out DROP CONSTRAINT IF EXISTS stock_out_created_by_fkey;
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_requester_id_fkey;
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_approver_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_recipient_id_fkey;
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_user_id_fkey;
ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS app_settings_user_id_fkey;

-- Disable RLS sementara
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out DISABLE ROW LEVEL SECURITY;
ALTER TABLE requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- UUID tetap
-- ============================================================
DO $$
DECLARE
  uid UUID := '00000000-0000-0000-0000-000000000000';
  cat1 UUID := '10000000-0000-0000-0000-000000000001';
  cat2 UUID := '10000000-0000-0000-0000-000000000002';
  cat3 UUID := '10000000-0000-0000-0000-000000000003';
  cat4 UUID := '10000000-0000-0000-0000-000000000004';
  cat5 UUID := '10000000-0000-0000-0000-000000000005';
  cat6 UUID := '10000000-0000-0000-0000-000000000006';
  it1 UUID := '20000000-0000-0000-0000-000000000001';
  it2 UUID := '20000000-0000-0000-0000-000000000002';
  it3 UUID := '20000000-0000-0000-0000-000000000003';
  it4 UUID := '20000000-0000-0000-0000-000000000004';
  it5 UUID := '20000000-0000-0000-0000-000000000005';
  it6 UUID := '20000000-0000-0000-0000-000000000006';
  it7 UUID := '20000000-0000-0000-0000-000000000007';
  it8 UUID := '20000000-0000-0000-0000-000000000008';
  it9 UUID := '20000000-0000-0000-0000-000000000009';
  it10 UUID := '20000000-0000-0000-0000-000000000010';
  it11 UUID := '20000000-0000-0000-0000-000000000011';
  it12 UUID := '20000000-0000-0000-0000-000000000012';
BEGIN

-- ============================================================
-- 1. CATEGORIES
-- ============================================================
INSERT INTO categories (id, name, description) VALUES
  (cat1, 'Elektronik', 'Peralatan elektronik kantor'),
  (cat2, 'Furniture', 'Meja, kursi, lemari, dll'),
  (cat3, 'Alat Tulis', 'Pensil, pulpen, kertas, dll'),
  (cat4, 'ATK Khusus', 'Peralatan presentasi & rapat'),
  (cat5, 'Komputer & Aksesoris', 'PC, laptop, printer, dll'),
  (cat6, 'Kebersihan', 'Peralatan kebersihan kantor')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- ============================================================
-- 2. ITEMS
-- ============================================================
INSERT INTO items (id, code, name, category_id, stock, min_stock, unit, description) VALUES
  (it1,  'BRG-00001', 'Laptop ASUS Vivobook 14',    cat5, 12, 3,  'unit', 'Laptop 14 inch, RAM 16GB'),
  (it2,  'BRG-00002', 'Monitor LG 24 inch',          cat5, 8,  2,  'unit', 'Monitor LED IPS FHD'),
  (it3,  'BRG-00003', 'Keyboard Mechanical Logitech', cat5, 15, 5,  'pcs',  'Keyboard wireless mekanik'),
  (it4,  'BRG-00004', 'Mouse Logitech G102',         cat5, 20, 5,  'pcs',  'Mouse gaming optical'),
  (it5,  'BRG-00005', 'Meja Kerja Lipat',            cat2, 6,  2,  'unit', 'Meja lipat portable 80x60cm'),
  (it6,  'BRG-00006', 'Kursi Ergonomis',             cat2, 10, 3,  'unit', 'Kursi kantor dengan sandaran tinggi'),
  (it7,  'BRG-00007', 'Pulpen Pilot G2',             cat3, 50, 10, 'pcs',  'Pulpen gel hitam 0.7mm'),
  (it8,  'BRG-00008', 'Kertas A4 70g (rim)',         cat3, 25, 5,  'rim',  'Kertas fotokopi A4 500 lembar'),
  (it9,  'BRG-00009', 'Whiteboard 120x90cm',         cat4, 4,  1,  'unit', 'Papan tulis magnetik'),
  (it10, 'BRG-00010', 'Spidol Whiteboard (set)',     cat4, 18, 5,  'set',  'Set 6 warna spidol papan tulis'),
  (it11, 'BRG-00011', 'Headset Jabra Evolve2',       cat1, 7,  2,  'unit', 'Headset BT noise cancelling'),
  (it12, 'BRG-00012', 'Pembersih Lantai (galon)',    cat6, 3,  1,  'galon','Cairan pembersih lantai 5L')
ON CONFLICT (id) DO UPDATE SET stock = EXCLUDED.stock, name = EXCLUDED.name;

-- ============================================================
-- 3. STOCK IN
-- ============================================================
INSERT INTO stock_in (id, item_id, qty, source, note, trx_date, created_by) VALUES
  ('40000000-0000-0000-0000-000000000001', it1,  5,  'PT Maju Jaya',    'Pengadaan Q1 2026',           '2026-01-15', uid),
  ('40000000-0000-0000-0000-000000000002', it2,  4,  'PT Maju Jaya',    'Pengadaan Q1 2026',           '2026-01-15', uid),
  ('40000000-0000-0000-0000-000000000003', it7,  30, 'Toko ATK Pusat',  'Restock bulanan',             '2026-02-01', uid),
  ('40000000-0000-0000-0000-000000000004', it8,  10, 'Toko ATK Pusat',  'Restock bulanan',             '2026-02-01', uid),
  ('40000000-0000-0000-0000-000000000005', it3,  8,  'Distributor IT',  'Keyboard wireless baru',      '2026-03-10', uid),
  ('40000000-0000-0000-0000-000000000006', it4,  12, 'Distributor IT',  'Mouse gaming stok',           '2026-03-10', uid),
  ('40000000-0000-0000-0000-000000000007', it5,  3,  'Furniture Indo',  'Meja kerja lipat batch baru', '2026-04-05', uid),
  ('40000000-0000-0000-0000-000000000008', it6,  5,  'Furniture Indo',  'Kursi ergonomis batch baru',  '2026-04-05', uid),
  ('40000000-0000-0000-0000-000000000009', it9,  2,  'Toko Office',    'Whiteboard untuk rapat',      '2026-05-20', uid),
  ('40000000-0000-0000-0000-000000000010', it11, 3,  'PT Maju Jaya',   'Headset untuk tim support',   '2026-06-01', uid)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. STOCK OUT
-- ============================================================
INSERT INTO stock_out (id, item_id, qty, destination, note, trx_date, created_by) VALUES
  ('50000000-0000-0000-0000-000000000001', it1,  2, 'Lantai 2 - Ruang Dev',     'Untuk tim pengembang',    '2026-01-20', uid),
  ('50000000-0000-0000-0000-000000000002', it2,  2, 'Lantai 2 - Ruang Dev',     'Monitor ganda',           '2026-01-20', uid),
  ('50000000-0000-0000-0000-000000000003', it7,  15, 'Lantai 1 - Front Desk',    'Untuk CS & admin',        '2026-02-10', uid),
  ('50000000-0000-0000-0000-000000000004', it8,  5,  'Lantai 1 - Ruang Rapat',   'Meeting bulanan',         '2026-03-01', uid),
  ('50000000-0000-0000-0000-000000000005', it3,  3,  'Lantai 3 - Ruang Kerja',   'Untuk tim QA',           '2026-03-15', uid),
  ('50000000-0000-0000-0000-000000000006', it6,  3,  'Lantai 1 - Ruang Tamu',    'Kursi untuk ruang tamu', '2026-04-10', uid),
  ('50000000-0000-0000-0000-000000000007', it10, 8,  'Lantai 2 - Ruang Meeting', 'Spidol untuk rapat',      '2026-05-15', uid),
  ('50000000-0000-0000-0000-000000000008', it11, 2,  'Lantai 3 - Ruang Support', 'Headset tim helpdesk',    '2026-06-05', uid)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. PROFILES (FK dim-drop, jadi aman)
-- ============================================================
INSERT INTO profiles (id, full_name, avatar_url) VALUES
  (uid, 'Admin Utama', NULL)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- ============================================================
-- 6. USER ROLES
-- ============================================================
INSERT INTO user_roles (user_id, role) VALUES
  (uid, 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================
-- 7. REQUESTS
-- ============================================================
INSERT INTO requests (id, item_id, qty, requester_id, note, status, kategori, merek, ekspedisi, created_at) VALUES
  ('60000000-0000-0000-0000-000000000001', it1,  2, uid, 'Butuh laptop untuk tim baru',   'menunggu',  'Elektronik', 'ASUS',     'JNE',       '2026-06-10 09:00:00+07'),
  ('60000000-0000-0000-0000-000000000002', it5,  3, uid, 'Meja untuk ruang baru',         'disetujui', 'Furniture',  'Olympic',  'J&T',       '2026-06-11 10:30:00+07'),
  ('60000000-0000-0000-0000-000000000003', it8,  5, uid, 'Kertas untuk cetak laporan',    'disetujui', 'Alat Tulis', 'Sinar Dunia','SiCepat', '2026-06-12 14:00:00+07'),
  ('60000000-0000-0000-0000-000000000004', it11, 1, uid, 'Headset untuk wfh',             'ditolak',   'Elektronik', 'Jabra',    'Grab',      '2026-06-13 08:15:00+07'),
  ('60000000-0000-0000-0000-000000000005', NULL, 10, uid, 'Permintaan ATK umum bulan ini', 'menunggu',  'Alat Tulis', NULL,       'GoSend',    '2026-06-15 11:00:00+07')
ON CONFLICT (id) DO NOTHING;

UPDATE requests SET approver_id = uid, approval_note = 'Disetujui, silakan ambil', approved_at = '2026-06-11 15:00:00+07' WHERE id = '60000000-0000-0000-0000-000000000002';
UPDATE requests SET approver_id = uid, approval_note = 'Disetujui, stok tersedia',  approved_at = '2026-06-12 16:00:00+07' WHERE id = '60000000-0000-0000-0000-000000000003';
UPDATE requests SET approver_id = uid, approval_note = 'Ditolak, budget tidak cukup',approved_at = '2026-06-13 12:00:00+07' WHERE id = '60000000-0000-0000-0000-000000000004';

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================
INSERT INTO notifications (id, user_id, title, message, type, read, link, created_at) VALUES
  ('30000000-0000-0000-0000-000000000001', uid, 'Stok Menipis',          'Laptop ASUS Vivobook 14 tersisa 3 unit',  'stok_menipis',      false, '/data-barang', '2026-06-15 08:00:00+07'),
  ('30000000-0000-0000-0000-000000000002', uid, 'Permintaan Baru',       'Ada permintaan baru dari Admin Utama',    'permintaan_baru',   false, '/persetujuan', '2026-06-15 09:00:00+07'),
  ('30000000-0000-0000-0000-000000000003', uid, 'Permintaan Disetujui',  'Permintaan meja kerja telah disetujui',  'permintaan_disetujui', true, '/permintaan', '2026-06-11 15:05:00+07'),
  ('30000000-0000-0000-0000-000000000004', uid, 'Permintaan Ditolak',    'Permintaan headset ditolak - budget',     'permintaan_ditolak', true, '/permintaan', '2026-06-13 12:05:00+07'),
  ('30000000-0000-0000-0000-000000000005', uid, 'Info Sistem',           'Database berhasil diupdate',              'info',              true, NULL,          '2026-06-10 07:00:00+07'),
  ('30000000-0000-0000-0000-000000000006', uid, 'Stok Habis',            'Stok kertas A4 hampir habis',             'stok_habis',        false, '/data-barang','2026-06-16 08:30:00+07')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. CHAT MESSAGES
-- ============================================================
INSERT INTO chat_messages (sender_id, recipient_id, content, read, created_at) VALUES
  (uid, uid, 'Selamat datang di sistem Inventaris! Ini adalah pesan demo.', false, '2026-06-10 08:00:00+07'),
  (uid, uid, 'Anda bisa menggunakan fitur chat untuk berkomunikasi.', true,  '2026-06-10 08:01:00+07'),
  (uid, uid, 'Untuk permintaan barang, silakan buka menu Permintaan Barang.', true,  '2026-06-10 08:02:00+07'),
  (uid, uid, 'Status persetujuan bisa dilihat di menu Persetujuan.', false, '2026-06-12 10:00:00+07'),
  (uid, uid, 'Laporan bulanan tersedia di menu Laporan.', false, '2026-06-14 14:00:00+07'),
  (uid, uid, 'Terima kasih telah menggunakan sistem ini!', false, '2026-06-15 09:00:00+07')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. APP SETTINGS
-- ============================================================
INSERT INTO app_settings (user_id, settings) VALUES
  (uid, '{"theme":"system","accentColor":"blue","dateFmt":"dd/MM/yyyy","timeFmt":"HH:mm","sidebarCollapsed":false,"autoLogoutMinutes":60,"notifEnabled":true}'::jsonb)
ON CONFLICT (user_id) DO UPDATE SET settings = EXCLUDED.settings;

-- ============================================================
-- Re-enable RLS
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Re-add FK constraints (NOT VALID supaya tidak cek data dummy yang sudah ada)
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE items ADD CONSTRAINT items_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE stock_in ADD CONSTRAINT stock_in_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE stock_out ADD CONSTRAINT stock_out_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE requests ADD CONSTRAINT requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE requests ADD CONSTRAINT requests_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE audit_log ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE app_settings ADD CONSTRAINT app_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;

RAISE NOTICE '✅ Seed data demo berhasil diinsert!';

END $$;
