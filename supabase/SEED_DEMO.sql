-- ============================================================
-- SEED DATA DEMO untuk Inventoport
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- UUID tetap agar bisa di-cross-reference
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
  n1 UUID := '30000000-0000-0000-0000-000000000001';
  n2 UUID := '30000000-0000-0000-0000-000000000002';
  n3 UUID := '30000000-0000-0000-0000-000000000003';
  n4 UUID := '30000000-0000-0000-0000-000000000004';
  n5 UUID := '30000000-0000-0000-0000-000000000005';
  n6 UUID := '30000000-0000-0000-0000-000000000006';
BEGIN

-- Sementara disable RLS supaya insert bisa jalan
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
-- 1. PROFILES
-- ============================================================
INSERT INTO profiles (id, full_name, avatar_url) VALUES
  (uid, 'Admin Utama', NULL)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- ============================================================
-- 2. USER ROLES
-- ============================================================
INSERT INTO user_roles (user_id, role) VALUES
  (uid, 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================
-- 3. CATEGORIES
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
-- 4. ITEMS
-- ============================================================
INSERT INTO items (id, code, name, category_id, stock, min_stock, unit, description) VALUES
  (it1,  'BRG-00001', 'Laptop ASUS Vivobook 14',   cat5, 12, 3,  'unit', 'Laptop 14 inch, RAM 16GB'),
  (it2,  'BRG-00002', 'Monitor LG 24 inch',         cat5, 8,  2,  'unit', 'Monitor LED IPS FHD'),
  (it3,  'BRG-00003', 'Keyboard Mechanical Logitech',cat5, 15, 5,  'pcs',  'Keyboard wireless mekanik'),
  (it4,  'BRG-00004', 'Mouse Logitech G102',        cat5, 20, 5,  'pcs',  'Mouse gaming optical'),
  (it5,  'BRG-00005', 'Meja Kerja Lipat',           cat2, 6,  2,  'unit', 'Meja lipat portable 80x60cm'),
  (it6,  'BRG-00006', 'Kursi Ergonomis',            cat2, 10, 3,  'unit', 'Kursi kantor dengan sandaran tinggi'),
  (it7,  'BRG-00007', 'Pulpen Pilot G2',            cat3, 50, 10, 'pcs',  'Pulpen gel hitam 0.7mm'),
  (it8,  'BRG-00008', 'Kertas A4 70g (rim)',        cat3, 25, 5,  'rim',  'Kertas fotokopi A4 500 lembar'),
  (it9,  'BRG-00009', 'Whiteboard 120x90cm',        cat4, 4,  1,  'unit', 'Papan tulis magnetik'),
  (it10, 'BRG-00010', 'Spidol Whiteboard (set)',    cat4, 18, 5,  'set',  'Set 6 warna spidol papan tulis'),
  (it11, 'BRG-00011', 'Headset Jabra Evolve2',      cat1, 7,  2,  'unit', 'Headset BT noise cancelling'),
  (it12, 'BRG-00011', 'Pembersih Lantai (galon)',   cat6, 3,  1,  'galon','Cairan pembersih lantai 5L')
ON CONFLICT (id) DO UPDATE SET stock = EXCLUDED.stock, name = EXCLUDED.name;

-- ============================================================
-- 5. STOCK IN (transaksi masuk)
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
-- 6. STOCK OUT (transaksi keluar)
-- ============================================================
INSERT INTO stock_out (id, item_id, qty, destination, note, trx_date, created_by) VALUES
  ('50000000-0000-0000-0000-000000000001', it1,  2, 'Lantai 2 - Ruang Dev',     'Untuk tim pengembang',       '2026-01-20', uid),
  ('50000000-0000-0000-0000-000000000002', it2,  2, 'Lantai 2 - Ruang Dev',     'Monitor ganda',              '2026-01-20', uid),
  ('50000000-0000-0000-0000-000000000003', it7,  15, 'Lantai 1 - Front Desk',    'Untuk CS & admin',           '2026-02-10', uid),
  ('50000000-0000-0000-0000-000000000004', it8,  5,  'Lantai 1 - Ruang Rapat',   'Meeting bulanan',            '2026-03-01', uid),
  ('50000000-0000-0000-0000-000000000005', it3,  3,  'Lantai 3 - Ruang Kerja',   'Untuk tim QA',              '2026-03-15', uid),
  ('50000000-0000-0000-0000-000000000006', it6,  3,  'Lantai 1 - Ruang Tamu',    'Kursi untuk ruang tamu',    '2026-04-10', uid),
  ('50000000-0000-0000-0000-000000000007', it10, 8,  'Lantai 2 - Ruang Meeting', 'Spidol untuk rapat',         '2026-05-15', uid),
  ('50000000-0000-0000-0000-000000000008', it11, 2,  'Lantai 3 - Ruang Support', 'Headset tim helpdesk',       '2026-06-05', uid)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. REQUESTS (permintaan)
-- ============================================================
INSERT INTO requests (id, item_id, qty, requester_id, note, status, kategori, merek, ekspedisi, created_at) VALUES
  ('60000000-0000-0000-0000-000000000001', it1,  2, uid, 'Butuh laptop untuk tim baru',   'menunggu',  'Elektronik', 'ASUS',     'JNE',       '2026-06-10 09:00:00+07'),
  ('60000000-0000-0000-0000-000000000002', it5,  3, uid, 'Meja untuk ruang baru',         'disetujui', 'Furniture',  'Olympic',  'J&T',       '2026-06-11 10:30:00+07'),
  ('60000000-0000-0000-0000-000000000003', it8,  5, uid, 'Kertas untuk cetak laporan',    'disetujui', 'Alat Tulis', 'Sinar Dunia','SiCepat', '2026-06-12 14:00:00+07'),
  ('60000000-0000-0000-0000-000000000004', it11, 1, uid, 'Headset untuk wfh',             'ditolak',   'Elektronik', 'Jabra',    'Grab',      '2026-06-13 08:15:00+07'),
  ('60000000-0000-0000-0000-000000000005', NULL, 10, uid, 'Permintaan ATK umum bulan ini', 'menunggu',  'Alat Tulis', NULL,       'GoSend',    '2026-06-15 11:00:00+07')
ON CONFLICT (id) DO NOTHING;

-- Set approver pada yang sudah disetujui/ditolak
UPDATE requests SET approver_id = uid, approval_note = 'Disetujui, silakan ambil', approved_at = '2026-06-11 15:00:00+07' WHERE id = '60000000-0000-0000-0000-000000000002';
UPDATE requests SET approver_id = uid, approval_note = 'Disetujui, stok tersedia',  approved_at = '2026-06-12 16:00:00+07' WHERE id = '60000000-0000-0000-0000-000000000003';
UPDATE requests SET approver_id = uid, approval_note = 'Ditolak, budget tidak cukup',approved_at = '2026-06-13 12:00:00+07' WHERE id = '60000000-0000-0000-0000-000000000004';

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================
INSERT INTO notifications (id, user_id, title, message, type, read, link, created_at) VALUES
  (n1, uid, 'Stok Menipis',          'Laptop ASUS Vivobook 14 tersisa 3 unit',  'stok_menipis',      false, '/data-barang', '2026-06-15 08:00:00+07'),
  (n2, uid, 'Permintaan Baru',       'Ada permintaan baru dari Admin Utama',    'permintaan_baru',   false, '/persetujuan', '2026-06-15 09:00:00+07'),
  (n3, uid, 'Permintaan Disetujui',  'Permintaan meja kerja telah disetujui',  'permintaan_disetujui', true, '/permintaan', '2026-06-11 15:05:00+07'),
  (n4, uid, 'Permintaan Ditolak',    'Permintaan headset ditolak - budget',     'permintaan_ditolak', true, '/permintaan', '2026-06-13 12:05:00+07'),
  (n5, uid, 'Info Sistem',           'Database berhasil diupdate',              'info',              true, NULL,          '2026-06-10 07:00:00+07'),
  (n6, uid, 'Stok Habis',            'Stok kertas A4 hampir habis',             'stok_habis',        false, '/data-barang','2026-06-16 08:30:00+07')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. CHAT MESSAGES
-- ============================================================
INSERT INTO chat_messages (sender_id, recipient_id, content, read, created_at) VALUES
  (uid, uid, 'Selamat datang di sistem Inventaris! Ini adalah pesan demo.', false, '2026-06-10 08:00:00+07'),
  (uid, uid, 'Anda bisa menggunakan fitur chat untuk berkomunikasi dengan admin.', true,  '2026-06-10 08:01:00+07'),
  (uid, uid, 'Untuk permintaan barang, silakan buka menu Permintaan Barang.',    true,  '2026-06-10 08:02:00+07'),
  (uid, uid, 'Status persetujuan bisa dilihat di menu Persetujuan.',             false, '2026-06-12 10:00:00+07'),
  (uid, uid, 'Laporan bulanan tersedia di menu Laporan.',                        false, '2026-06-14 14:00:00+07'),
  (uid, uid, 'Terima kasih telah menggunakan sistem ini!',                       false, '2026-06-15 09:00:00+07')
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

RAISE NOTICE '✅ Seed data demo berhasil diinsert!';

END $$;
