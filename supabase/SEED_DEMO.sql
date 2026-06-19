-- ============================================================
-- SEED DATA DEMO — VERSI FINAL
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1) Drop SEMUA FK constraints yang bisa ganggu
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_category_id_fkey;
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_created_by_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE stock_in DROP CONSTRAINT IF EXISTS stock_in_item_id_fkey;
ALTER TABLE stock_in DROP CONSTRAINT IF EXISTS stock_in_created_by_fkey;
ALTER TABLE stock_out DROP CONSTRAINT IF EXISTS stock_out_item_id_fkey;
ALTER TABLE stock_out DROP CONSTRAINT IF EXISTS stock_out_created_by_fkey;
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_item_id_fkey;
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_requester_id_fkey;
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_approver_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_recipient_id_fkey;
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_user_id_fkey;
ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS app_settings_user_id_fkey;

-- 2) Disable RLS
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

-- 3) Hapus data lama supaya tidak konflik
TRUNCATE chat_messages, notifications, audit_log, app_settings CASCADE;
TRUNCATE requests, stock_out, stock_in, items, categories, user_roles, profiles CASCADE;

-- 4) Insert semua data

-- CATEGORIES
INSERT INTO categories (id, name, description) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Elektronik', 'Peralatan elektronik kantor'),
  ('10000000-0000-0000-0000-000000000002', 'Furniture', 'Meja, kursi, lemari, dll'),
  ('10000000-0000-0000-0000-000000000003', 'Alat Tulis', 'Pensil, pulpen, kertas, dll'),
  ('10000000-0000-0000-0000-000000000004', 'ATK Khusus', 'Peralatan presentasi & rapat'),
  ('10000000-0000-0000-0000-000000000005', 'Komputer & Aksesoris', 'PC, laptop, printer, dll'),
  ('10000000-0000-0000-0000-000000000006', 'Kebersihan', 'Peralatan kebersihan kantor');

-- ITEMS
INSERT INTO items (id, code, name, category_id, stock, min_stock, unit, description) VALUES
  ('20000000-0000-0000-0000-000000000001', 'BRG-00001', 'Laptop ASUS Vivobook 14',    '10000000-0000-0000-0000-000000000005', 12, 3,  'unit', 'Laptop 14 inch, RAM 16GB'),
  ('20000000-0000-0000-0000-000000000002', 'BRG-00002', 'Monitor LG 24 inch',          '10000000-0000-0000-0000-000000000005', 8,  2,  'unit', 'Monitor LED IPS FHD'),
  ('20000000-0000-0000-0000-000000000003', 'BRG-00003', 'Keyboard Mechanical Logitech', '10000000-0000-0000-0000-000000000005', 15, 5,  'pcs',  'Keyboard wireless mekanik'),
  ('20000000-0000-0000-0000-000000000004', 'BRG-00004', 'Mouse Logitech G102',         '10000000-0000-0000-0000-000000000005', 20, 5,  'pcs',  'Mouse gaming optical'),
  ('20000000-0000-0000-0000-000000000005', 'BRG-00005', 'Meja Kerja Lipat',            '10000000-0000-0000-0000-000000000002', 6,  2,  'unit', 'Meja lipat portable 80x60cm'),
  ('20000000-0000-0000-0000-000000000006', 'BRG-00006', 'Kursi Ergonomis',             '10000000-0000-0000-0000-000000000002', 10, 3,  'unit', 'Kursi kantor dengan sandaran tinggi'),
  ('20000000-0000-0000-0000-000000000007', 'BRG-00007', 'Pulpen Pilot G2',             '10000000-0000-0000-0000-000000000003', 50, 10, 'pcs',  'Pulpen gel hitam 0.7mm'),
  ('20000000-0000-0000-0000-000000000008', 'BRG-00008', 'Kertas A4 70g (rim)',         '10000000-0000-0000-0000-000000000003', 25, 5,  'rim',  'Kertas fotokopi A4 500 lembar'),
  ('20000000-0000-0000-0000-000000000009', 'BRG-00009', 'Whiteboard 120x90cm',         '10000000-0000-0000-0000-000000000004', 4,  1,  'unit', 'Papan tulis magnetik'),
  ('20000000-0000-0000-0000-000000000010', 'BRG-00010', 'Spidol Whiteboard (set)',     '10000000-0000-0000-0000-000000000004', 18, 5,  'set',  'Set 6 warna spidol papan tulis'),
  ('20000000-0000-0000-0000-000000000011', 'BRG-00011', 'Headset Jabra Evolve2',       '10000000-0000-0000-0000-000000000001', 7,  2,  'unit', 'Headset BT noise cancelling'),
  ('20000000-0000-0000-0000-000000000012', 'BRG-00012', 'Pembersih Lantai (galon)',    '10000000-0000-0000-0000-000000000006', 3,  1,  'galon','Cairan pembersih lantai 5L');

-- STOCK IN
INSERT INTO stock_in (id, item_id, qty, source, note, trx_date, created_by) VALUES
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 5,  'PT Maju Jaya',    'Pengadaan Q1 2026',           '2026-01-15', NULL),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 4,  'PT Maju Jaya',    'Pengadaan Q1 2026',           '2026-01-15', NULL),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000007', 30, 'Toko ATK Pusat',  'Restock bulanan',             '2026-02-01', NULL),
  ('40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000008', 10, 'Toko ATK Pusat',  'Restock bulanan',             '2026-02-01', NULL),
  ('40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 8,  'Distributor IT',  'Keyboard wireless baru',      '2026-03-10', NULL),
  ('40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000004', 12, 'Distributor IT',  'Mouse gaming stok',           '2026-03-10', NULL),
  ('40000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000005', 3,  'Furniture Indo',  'Meja kerja lipat batch baru', '2026-04-05', NULL),
  ('40000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000006', 5,  'Furniture Indo',  'Kursi ergonomis batch baru',  '2026-04-05', NULL),
  ('40000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000009', 2,  'Toko Office',    'Whiteboard untuk rapat',      '2026-05-20', NULL),
  ('40000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000011', 3,  'PT Maju Jaya',   'Headset untuk tim support',   '2026-06-01', NULL);

-- STOCK OUT
INSERT INTO stock_out (id, item_id, qty, destination, note, trx_date, created_by) VALUES
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 2,  'Lantai 2 - Ruang Dev',     'Untuk tim pengembang',    '2026-01-20', NULL),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 2,  'Lantai 2 - Ruang Dev',     'Monitor ganda',           '2026-01-20', NULL),
  ('50000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000007', 15, 'Lantai 1 - Front Desk',    'Untuk CS & admin',        '2026-02-10', NULL),
  ('50000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000008', 5,  'Lantai 1 - Ruang Rapat',   'Meeting bulanan',         '2026-03-01', NULL),
  ('50000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 3,  'Lantai 3 - Ruang Kerja',   'Untuk tim QA',           '2026-03-15', NULL),
  ('50000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000006', 3,  'Lantai 1 - Ruang Tamu',    'Kursi untuk ruang tamu', '2026-04-10', NULL),
  ('50000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000010', 8,  'Lantai 2 - Ruang Meeting', 'Spidol untuk rapat',      '2026-05-15', NULL),
  ('50000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000011', 2,  'Lantai 3 - Ruang Support', 'Headset tim helpdesk',    '2026-06-05', NULL);

-- PROFILES (NULL untuk auth.users FK)
INSERT INTO profiles (id, full_name, avatar_url) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Admin Utama', NULL);

-- USER ROLES
INSERT INTO user_roles (user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000000', 'admin');

-- REQUESTS
INSERT INTO requests (id, item_id, qty, requester_id, note, status, kategori, merek, ekspedisi, created_at) VALUES
  ('60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 2, '00000000-0000-0000-0000-000000000000', 'Butuh laptop untuk tim baru',   'menunggu',  'Elektronik', 'ASUS',     'JNE',       '2026-06-10 09:00:00+07'),
  ('60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', 3, '00000000-0000-0000-0000-000000000000', 'Meja untuk ruang baru',         'disetujui', 'Furniture',  'Olympic',  'J&T',       '2026-06-11 10:30:00+07'),
  ('60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000008', 5, '00000000-0000-0000-0000-000000000000', 'Kertas untuk cetak laporan',    'disetujui', 'Alat Tulis', 'Sinar Dunia','SiCepat', '2026-06-12 14:00:00+07'),
  ('60000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000011', 1, '00000000-0000-0000-0000-000000000000', 'Headset untuk wfh',             'ditolak',   'Elektronik', 'Jabra',    'Grab',      '2026-06-13 08:15:00+07'),
  ('60000000-0000-0000-0000-000000000005', NULL,                                    10, '00000000-0000-0000-0000-000000000000', 'Permintaan ATK umum bulan ini', 'menunggu',  'Alat Tulis', NULL,       'GoSend',    '2026-06-15 11:00:00+07');

UPDATE requests SET approver_id = '00000000-0000-0000-0000-000000000000', approval_note = 'Disetujui, silakan ambil', approved_at = '2026-06-11 15:00:00+07' WHERE id = '60000000-0000-0000-0000-000000000002';
UPDATE requests SET approver_id = '00000000-0000-0000-0000-000000000000', approval_note = 'Disetujui, stok tersedia',  approved_at = '2026-06-12 16:00:00+07' WHERE id = '60000000-0000-0000-0000-000000000003';
UPDATE requests SET approver_id = '00000000-0000-0000-0000-000000000000', approval_note = 'Ditolak, budget tidak cukup',approved_at = '2026-06-13 12:00:00+07' WHERE id = '60000000-0000-0000-0000-000000000004';

-- NOTIFICATIONS
INSERT INTO notifications (id, user_id, title, message, type, read, link, created_at) VALUES
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Stok Menipis',          'Laptop ASUS Vivobook 14 tersisa 3 unit',  'stok_menipis',         false, '/data-barang', '2026-06-15 08:00:00+07'),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Permintaan Baru',       'Ada permintaan baru dari Admin Utama',    'permintaan_baru',      false, '/persetujuan', '2026-06-15 09:00:00+07'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'Permintaan Disetujui',  'Permintaan meja kerja telah disetujui',  'permintaan_disetujui', true,  '/permintaan', '2026-06-11 15:05:00+07'),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'Permintaan Ditolak',    'Permintaan headset ditolak - budget',     'permintaan_ditolak',   true,  '/permintaan', '2026-06-13 12:05:00+07'),
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'Info Sistem',           'Database berhasil diupdate',              'info',                 true,  NULL,          '2026-06-10 07:00:00+07'),
  ('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'Stok Habis',            'Stok kertas A4 hampir habis',             'stok_habis',           false, '/data-barang','2026-06-16 08:30:00+07');

-- CHAT MESSAGES
INSERT INTO chat_messages (sender_id, recipient_id, content, read, created_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Selamat datang di sistem Inventaris! Ini adalah pesan demo.', false, '2026-06-10 08:00:00+07'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Anda bisa menggunakan fitur chat untuk berkomunikasi.', true,  '2026-06-10 08:01:00+07'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Untuk permintaan barang, buka menu Permintaan Barang.', true,  '2026-06-10 08:02:00+07'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Status persetujuan bisa dilihat di menu Persetujuan.', false, '2026-06-12 10:00:00+07'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Laporan bulanan tersedia di menu Laporan.', false, '2026-06-14 14:00:00+07'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Terima kasih telah menggunakan sistem ini!', false, '2026-06-15 09:00:00+07');

-- APP SETTINGS
INSERT INTO app_settings (user_id, settings) VALUES
  ('00000000-0000-0000-0000-000000000000', '{"theme":"system","accentColor":"blue","dateFmt":"dd/MM/yyyy","timeFmt":"HH:mm","sidebarCollapsed":false,"autoLogoutMinutes":60,"notifEnabled":true}'::jsonb);

-- 5) Re-enable RLS
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

-- 6) Re-add FK (NOT VALID supaya data dummy tidak error)
ALTER TABLE items ADD CONSTRAINT items_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL NOT VALID;
ALTER TABLE items ADD CONSTRAINT items_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE stock_in ADD CONSTRAINT stock_in_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE stock_in ADD CONSTRAINT stock_in_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE stock_out ADD CONSTRAINT stock_out_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE stock_out ADD CONSTRAINT stock_out_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE requests ADD CONSTRAINT requests_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT NOT VALID;
ALTER TABLE requests ADD CONSTRAINT requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE requests ADD CONSTRAINT requests_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE audit_log ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE app_settings ADD CONSTRAINT app_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;

RAISE NOTICE '✅ Seed data demo berhasil diinsert!';
