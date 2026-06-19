-- Hapus semua FK constraints
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

-- Disable RLS
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

-- Hapus data lama
TRUNCATE chat_messages, notifications, audit_log, app_settings CASCADE;
TRUNCATE requests, stock_out, stock_in, items, categories, user_roles, profiles CASCADE;

-- CATEGORIES
INSERT INTO categories (id, name, description) VALUES
('a1000000-0000-0000-0000-000000000001', 'Elektronik', 'Peralatan elektronik kantor'),
('a1000000-0000-0000-0000-000000000002', 'Furniture', 'Meja, kursi, lemari, dll'),
('a1000000-0000-0000-0000-000000000003', 'Alat Tulis', 'Pensil, pulpen, kertas, dll'),
('a1000000-0000-0000-0000-000000000004', 'ATK Khusus', 'Peralatan presentasi & rapat'),
('a1000000-0000-0000-0000-000000000005', 'Komputer & Aksesoris', 'PC, laptop, printer, dll'),
('a1000000-0000-0000-0000-000000000006', 'Kebersihan', 'Peralatan kebersihan kantor');

-- ITEMS
INSERT INTO items (id, code, name, category_id, stock, min_stock, unit, description) VALUES
('b2000000-0000-0000-0000-000000000001', 'BRG-00001', 'Laptop ASUS Vivobook 14',    'a1000000-0000-0000-0000-000000000005', 12, 3,  'unit', 'Laptop 14 inch RAM 16GB'),
('b2000000-0000-0000-0000-000000000002', 'BRG-00002', 'Monitor LG 24 inch',          'a1000000-0000-0000-0000-000000000005', 8,  2,  'unit', 'Monitor LED IPS FHD'),
('b2000000-0000-0000-0000-000000000003', 'BRG-00003', 'Keyboard Mechanical',          'a1000000-0000-0000-0000-000000000005', 15, 5,  'pcs',  'Keyboard wireless'),
('b2000000-0000-0000-0000-000000000004', 'BRG-00004', 'Mouse Logitech G102',         'a1000000-0000-0000-0000-000000000005', 20, 5,  'pcs',  'Mouse gaming'),
('b2000000-0000-0000-0000-000000000005', 'BRG-00005', 'Meja Kerja Lipat',            'a1000000-0000-0000-0000-000000000002', 6,  2,  'unit', 'Meja lipat 80x60cm'),
('b2000000-0000-0000-0000-000000000006', 'BRG-00006', 'Kursi Ergonomis',             'a1000000-0000-0000-0000-000000000002', 10, 3,  'unit', 'Kursi kantor'),
('b2000000-0000-0000-0000-000000000007', 'BRG-00007', 'Pulpen Pilot G2',             'a1000000-0000-0000-0000-000000000003', 50, 10, 'pcs',  'Pulpen gel 0.7mm'),
('b2000000-0000-0000-0000-000000000008', 'BRG-00008', 'Kertas A4 70g (rim)',         'a1000000-0000-0000-0000-000000000003', 25, 5,  'rim',  'Kertas A4 500 lembar'),
('b2000000-0000-0000-0000-000000000009', 'BRG-00009', 'Whiteboard 120x90cm',         'a1000000-0000-0000-0000-000000000004', 4,  1,  'unit', 'Papan tulis magnetik'),
('b2000000-0000-0000-0000-000000000010', 'BRG-00010', 'Spidol Whiteboard (set)',     'a1000000-0000-0000-0000-000000000004', 18, 5,  'set',  'Set 6 warna'),
('b2000000-0000-0000-0000-000000000011', 'BRG-00011', 'Headset Jabra Evolve2',       'a1000000-0000-0000-0000-000000000001', 7,  2,  'unit', 'Headset BT'),
('b2000000-0000-0000-0000-000000000012', 'BRG-00012', 'Pembersih Lantai',            'a1000000-0000-0000-0000-000000000006', 3,  1,  'galon','Cairan 5L');

-- STOCK IN
INSERT INTO stock_in (id, item_id, qty, source, note, trx_date, created_by) VALUES
('c3000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 5,  'PT Maju Jaya',    'Pengadaan Q1',   '2026-01-15', NULL),
('c3000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 4,  'PT Maju Jaya',    'Pengadaan Q1',   '2026-01-15', NULL),
('c3000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000007', 30, 'Toko ATK Pusat',  'Restock',        '2026-02-01', NULL),
('c3000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000008', 10, 'Toko ATK Pusat',  'Restock',        '2026-02-01', NULL),
('c3000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000003', 8,  'Distributor IT',  'Keyboard baru',  '2026-03-10', NULL),
('c3000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000004', 12, 'Distributor IT',  'Mouse stok',     '2026-03-10', NULL),
('c3000000-0000-0000-0000-000000000007', 'b2000000-0000-0000-0000-000000000005', 3,  'Furniture Indo',  'Meja baru',      '2026-04-05', NULL),
('c3000000-0000-0000-0000-000000000008', 'b2000000-0000-0000-0000-000000000006', 5,  'Furniture Indo',  'Kursi baru',     '2026-04-05', NULL),
('c3000000-0000-0000-0000-000000000009', 'b2000000-0000-0000-0000-000000000009', 2,  'Toko Office',    'Whiteboard',     '2026-05-20', NULL),
('c3000000-0000-0000-0000-000000000010', 'b2000000-0000-0000-0000-000000000011', 3,  'PT Maju Jaya',   'Headset',        '2026-06-01', NULL);

-- STOCK OUT
INSERT INTO stock_out (id, item_id, qty, destination, note, trx_date, created_by) VALUES
('d4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 2,  'Ruang Dev',      'Tim dev',        '2026-01-20', NULL),
('d4000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 2,  'Ruang Dev',      'Monitor ganda',  '2026-01-20', NULL),
('d4000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000007', 15, 'Front Desk',     'CS & admin',     '2026-02-10', NULL),
('d4000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000008', 5,  'Ruang Rapat',    'Meeting',        '2026-03-01', NULL),
('d4000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000003', 3,  'Ruang Kerja',    'Tim QA',         '2026-03-15', NULL),
('d4000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000006', 3,  'Ruang Tamu',     'Kursi tamu',     '2026-04-10', NULL),
('d4000000-0000-0000-0000-000000000007', 'b2000000-0000-0000-0000-000000000010', 8,  'Ruang Meeting',  'Spidol rapat',   '2026-05-15', NULL),
('d4000000-0000-0000-0000-000000000008', 'b2000000-0000-0000-0000-000000000011', 2,  'Ruang Support',  'Helpdesk',       '2026-06-05', NULL);

-- NOTIFICATIONS
INSERT INTO notifications (id, user_id, title, message, type, read, link, created_at) VALUES
('e5000000-0000-0000-0000-000000000001', NULL, 'Stok Menipis',         'Laptop tersisa 3 unit',          'stok_menipis',         false, '/data-barang', '2026-06-15 08:00:00+07'),
('e5000000-0000-0000-0000-000000000002', NULL, 'Permintaan Baru',      'Ada permintaan baru',            'permintaan_baru',      false, '/persetujuan', '2026-06-15 09:00:00+07'),
('e5000000-0000-0000-0000-000000000003', NULL, 'Permintaan Disetujui', 'Meja kerja disetujui',           'permintaan_disetujui', true,  '/permintaan', '2026-06-11 15:05:00+07'),
('e5000000-0000-0000-0000-000000000004', NULL, 'Permintaan Ditolak',   'Headset ditolak',                'permintaan_ditolak',   true,  '/permintaan', '2026-06-13 12:05:00+07'),
('e5000000-0000-0000-0000-000000000005', NULL, 'Info Sistem',          'Database diupdate',              'info',                 true,  NULL,          '2026-06-10 07:00:00+07'),
('e5000000-0000-0000-0000-000000000006', NULL, 'Stok Habis',           'Kertas A4 hampir habis',         'stok_habis',           false, '/data-barang','2026-06-16 08:30:00+07');

-- APP SETTINGS
INSERT INTO app_settings (user_id, settings) VALUES
('00000000-0000-0000-0000-000000000000', '{"theme":"system","accentColor":"blue","dateFmt":"dd/MM/yyyy","timeFmt":"HH:mm","sidebarCollapsed":false,"autoLogoutMinutes":60,"notifEnabled":true}'::jsonb);

-- Re-enable RLS
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

-- Re-add FK constraints (NOT VALID)
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
