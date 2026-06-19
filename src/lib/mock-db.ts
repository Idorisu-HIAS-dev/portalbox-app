// localStorage-based mock database for demo purposes
// All data persists across page refreshes

function genId() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function now() {
  return new Date().toISOString();
}

// ─── Types ──────────────────────────────────────────────
export interface MockCategory { id: string; name: string; description: string; created_at: string; }
export interface MockItem { id: string; code: string; name: string; category_id: string; stock: number; min_stock: number; unit: string; description: string; photo_url: string | null; created_at: string; }
export interface MockStockIn { id: string; item_id: string; qty: number; source: string; note: string; trx_date: string; created_at: string; }
export interface MockStockOut { id: string; item_id: string; qty: number; destination: string; note: string; trx_date: string; created_at: string; }
export interface MockRequest { id: string; item_id: string | null; qty: number; requester_id: string; note: string; status: "menunggu" | "disetujui" | "ditolak"; kategori: string | null; kategori_lain: string | null; merek: string | null; ekspedisi: string | null; ekspedisi_lain: string | null; approver_id: string | null; approval_note: string | null; approved_at: string | null; created_at: string; }
export interface MockNotification { id: string; user_id: string | null; title: string; message: string; type: string; read: boolean; link: string | null; created_at: string; }
export interface MockChat { id: string; sender_id: string; recipient_id: string; content: string; read: boolean; created_at: string; }

// ─── Default Data ───────────────────────────────────────
const DEFAULT_CATEGORIES: MockCategory[] = [
  { id: "cat-1", name: "Elektronik", description: "Peralatan elektronik kantor", created_at: "2026-01-01T00:00:00Z" },
  { id: "cat-2", name: "Furniture", description: "Meja, kursi, lemari, dll", created_at: "2026-01-01T00:00:00Z" },
  { id: "cat-3", name: "Alat Tulis", description: "Pensil, pulpen, kertas, dll", created_at: "2026-01-01T00:00:00Z" },
  { id: "cat-4", name: "ATK Khusus", description: "Peralatan presentasi & rapat", created_at: "2026-01-01T00:00:00Z" },
  { id: "cat-5", name: "Komputer & Aksesoris", description: "PC, laptop, printer, dll", created_at: "2026-01-01T00:00:00Z" },
  { id: "cat-6", name: "Kebersihan", description: "Peralatan kebersihan kantor", created_at: "2026-01-01T00:00:00Z" },
];

const DEFAULT_ITEMS: MockItem[] = [
  { id: "it-1", code: "BRG-00001", name: "Laptop ASUS Vivobook 14", category_id: "cat-5", stock: 12, min_stock: 3, unit: "unit", description: "Laptop 14 inch RAM 16GB", photo_url: null, created_at: "2026-01-15T00:00:00Z" },
  { id: "it-2", code: "BRG-00002", name: "Monitor LG 24 inch", category_id: "cat-5", stock: 8, min_stock: 2, unit: "unit", description: "Monitor LED IPS FHD", photo_url: null, created_at: "2026-01-15T00:00:00Z" },
  { id: "it-3", code: "BRG-00003", name: "Keyboard Mechanical Logitech", category_id: "cat-5", stock: 15, min_stock: 5, unit: "pcs", description: "Keyboard wireless mekanik", photo_url: null, created_at: "2026-03-10T00:00:00Z" },
  { id: "it-4", code: "BRG-00004", name: "Mouse Logitech G102", category_id: "cat-5", stock: 20, min_stock: 5, unit: "pcs", description: "Mouse gaming optical", photo_url: null, created_at: "2026-03-10T00:00:00Z" },
  { id: "it-5", code: "BRG-00005", name: "Meja Kerja Lipat", category_id: "cat-2", stock: 6, min_stock: 2, unit: "unit", description: "Meja lipat portable 80x60cm", photo_url: null, created_at: "2026-04-05T00:00:00Z" },
  { id: "it-6", code: "BRG-00006", name: "Kursi Ergonomis", category_id: "cat-2", stock: 10, min_stock: 3, unit: "unit", description: "Kursi kantor sandaran tinggi", photo_url: null, created_at: "2026-04-05T00:00:00Z" },
  { id: "it-7", code: "BRG-00007", name: "Pulpen Pilot G2", category_id: "cat-3", stock: 50, min_stock: 10, unit: "pcs", description: "Pulpen gel hitam 0.7mm", photo_url: null, created_at: "2026-02-01T00:00:00Z" },
  { id: "it-8", code: "BRG-00008", name: "Kertas A4 70g (rim)", category_id: "cat-3", stock: 25, min_stock: 5, unit: "rim", description: "Kertas fotokopi A4 500 lembar", photo_url: null, created_at: "2026-02-01T00:00:00Z" },
  { id: "it-9", code: "BRG-00009", name: "Whiteboard 120x90cm", category_id: "cat-4", stock: 4, min_stock: 1, unit: "unit", description: "Papan tulis magnetik", photo_url: null, created_at: "2026-05-20T00:00:00Z" },
  { id: "it-10", code: "BRG-00010", name: "Spidol Whiteboard (set)", category_id: "cat-4", stock: 18, min_stock: 5, unit: "set", description: "Set 6 warna spidol", photo_url: null, created_at: "2026-05-20T00:00:00Z" },
  { id: "it-11", code: "BRG-00011", name: "Headset Jabra Evolve2", category_id: "cat-1", stock: 7, min_stock: 2, unit: "unit", description: "Headset BT noise cancelling", photo_url: null, created_at: "2026-06-01T00:00:00Z" },
  { id: "it-12", code: "BRG-00012", name: "Pembersih Lantai (galon)", category_id: "cat-6", stock: 3, min_stock: 1, unit: "galon", description: "Cairan pembersih 5L", photo_url: null, created_at: "2026-06-01T00:00:00Z" },
];

const DEFAULT_STOCK_IN: MockStockIn[] = [
  { id: "si-1", item_id: "it-1", qty: 5, source: "PT Maju Jaya", note: "Pengadaan Q1 2026", trx_date: "2026-01-15", created_at: "2026-01-15T00:00:00Z" },
  { id: "si-2", item_id: "it-2", qty: 4, source: "PT Maju Jaya", note: "Pengadaan Q1 2026", trx_date: "2026-01-15", created_at: "2026-01-15T00:00:00Z" },
  { id: "si-3", item_id: "it-7", qty: 30, source: "Toko ATK Pusat", note: "Restock bulanan", trx_date: "2026-02-01", created_at: "2026-02-01T00:00:00Z" },
  { id: "si-4", item_id: "it-8", qty: 10, source: "Toko ATK Pusat", note: "Restock bulanan", trx_date: "2026-02-01", created_at: "2026-02-01T00:00:00Z" },
  { id: "si-5", item_id: "it-3", qty: 8, source: "Distributor IT", note: "Keyboard wireless baru", trx_date: "2026-03-10", created_at: "2026-03-10T00:00:00Z" },
  { id: "si-6", item_id: "it-4", qty: 12, source: "Distributor IT", note: "Mouse gaming stok", trx_date: "2026-03-10", created_at: "2026-03-10T00:00:00Z" },
  { id: "si-7", item_id: "it-5", qty: 3, source: "Furniture Indo", note: "Meja kerja lipat batch baru", trx_date: "2026-04-05", created_at: "2026-04-05T00:00:00Z" },
  { id: "si-8", item_id: "it-6", qty: 5, source: "Furniture Indo", note: "Kursi ergonomis batch baru", trx_date: "2026-04-05", created_at: "2026-04-05T00:00:00Z" },
  { id: "si-9", item_id: "it-9", qty: 2, source: "Toko Office", note: "Whiteboard untuk rapat", trx_date: "2026-05-20", created_at: "2026-05-20T00:00:00Z" },
  { id: "si-10", item_id: "it-11", qty: 3, source: "PT Maju Jaya", note: "Headset untuk tim support", trx_date: "2026-06-01", created_at: "2026-06-01T00:00:00Z" },
];

const DEFAULT_STOCK_OUT: MockStockOut[] = [
  { id: "so-1", item_id: "it-1", qty: 2, destination: "Ruang Dev", note: "Tim pengembang", trx_date: "2026-01-20", created_at: "2026-01-20T00:00:00Z" },
  { id: "so-2", item_id: "it-2", qty: 2, destination: "Ruang Dev", note: "Monitor ganda", trx_date: "2026-01-20", created_at: "2026-01-20T00:00:00Z" },
  { id: "so-3", item_id: "it-7", qty: 15, destination: "Front Desk", note: "CS & admin", trx_date: "2026-02-10", created_at: "2026-02-10T00:00:00Z" },
  { id: "so-4", item_id: "it-8", qty: 5, destination: "Ruang Rapat", note: "Meeting bulanan", trx_date: "2026-03-01", created_at: "2026-03-01T00:00:00Z" },
  { id: "so-5", item_id: "it-3", qty: 3, destination: "Ruang Kerja", note: "Tim QA", trx_date: "2026-03-15", created_at: "2026-03-15T00:00:00Z" },
  { id: "so-6", item_id: "it-6", qty: 3, destination: "Ruang Tamu", note: "Kursi tamu", trx_date: "2026-04-10", created_at: "2026-04-10T00:00:00Z" },
  { id: "so-7", item_id: "it-10", qty: 8, destination: "Ruang Meeting", note: "Spidol rapat", trx_date: "2026-05-15", created_at: "2026-05-15T00:00:00Z" },
  { id: "so-8", item_id: "it-11", qty: 2, destination: "Ruang Support", note: "Helpdesk", trx_date: "2026-06-05", created_at: "2026-06-05T00:00:00Z" },
];

const DEFAULT_REQUESTS: MockRequest[] = [
  { id: "req-1", item_id: "it-1", qty: 2, requester_id: "admin", note: "Butuh laptop untuk tim baru", status: "menunggu", kategori: "Elektronik", kategori_lain: null, merek: "ASUS", ekspedisi: "JNE", ekspedisi_lain: null, approver_id: null, approval_note: null, approved_at: null, created_at: "2026-06-10T09:00:00Z" },
  { id: "req-2", item_id: "it-5", qty: 3, requester_id: "admin", note: "Meja untuk ruang baru", status: "disetujui", kategori: "Furniture", kategori_lain: null, merek: "Olympic", ekspedisi: "J&T", ekspedisi_lain: null, approver_id: "admin", approval_note: "Disetujui", approved_at: "2026-06-11T15:00:00Z", created_at: "2026-06-11T10:30:00Z" },
  { id: "req-3", item_id: "it-8", qty: 5, requester_id: "admin", note: "Kertas untuk cetak laporan", status: "disetujui", kategori: "Alat Tulis", kategori_lain: null, merek: "Sinar Dunia", ekspedisi: "SiCepat", ekspedisi_lain: null, approver_id: "admin", approval_note: "Stok tersedia", approved_at: "2026-06-12T16:00:00Z", created_at: "2026-06-12T14:00:00Z" },
  { id: "req-4", item_id: "it-11", qty: 1, requester_id: "admin", note: "Headset untuk wfh", status: "ditolak", kategori: "Elektronik", kategori_lain: null, merek: "Jabra", ekspedisi: "Grab", ekspedisi_lain: null, approver_id: "admin", approval_note: "Budget tidak cukup", approved_at: "2026-06-13T12:00:00Z", created_at: "2026-06-13T08:15:00Z" },
  { id: "req-5", item_id: null, qty: 10, requester_id: "admin", note: "Permintaan ATK umum bulan ini", status: "menunggu", kategori: "Alat Tulis", kategori_lain: null, merek: null, ekspedisi: "GoSend", ekspedisi_lain: null, approver_id: null, approval_note: null, approved_at: null, created_at: "2026-06-15T11:00:00Z" },
];

const DEFAULT_NOTIFICATIONS: MockNotification[] = [
  { id: "n-1", user_id: null, title: "Stok Menipis", message: "Laptop ASUS Vivobook 14 tersisa 3 unit", type: "stok_menipis", read: false, link: "/data-barang", created_at: "2026-06-15T08:00:00Z" },
  { id: "n-2", user_id: null, title: "Permintaan Baru", message: "Ada permintaan baru dari Admin Utama", type: "permintaan_baru", read: false, link: "/persetujuan", created_at: "2026-06-15T09:00:00Z" },
  { id: "n-3", user_id: null, title: "Permintaan Disetujui", message: "Meja kerja telah disetujui", type: "permintaan_disetujui", read: true, link: "/permintaan", created_at: "2026-06-11T15:05:00Z" },
  { id: "n-4", user_id: null, title: "Permintaan Ditolak", message: "Headset ditolak - budget", type: "permintaan_ditolak", read: true, link: "/permintaan", created_at: "2026-06-13T12:05:00Z" },
  { id: "n-5", user_id: null, title: "Info Sistem", message: "Database berhasil diupdate", type: "info", read: true, link: null, created_at: "2026-06-10T07:00:00Z" },
  { id: "n-6", user_id: null, title: "Stok Habis", message: "Stok kertas A4 hampir habis", type: "stok_habis", read: false, link: "/data-barang", created_at: "2026-06-16T08:30:00Z" },
];

const DEFAULT_CHATS: MockChat[] = [
  { id: "ch-1", sender_id: "admin", recipient_id: "admin", content: "Selamat datang di sistem Inventaris!", read: true, created_at: "2026-06-10T08:00:00Z" },
  { id: "ch-2", sender_id: "admin", recipient_id: "admin", content: "Fitur chat sudah aktif. Kirim pesan ke sesama pengguna.", read: true, created_at: "2026-06-10T08:01:00Z" },
];

// ─── CRUD Layer ─────────────────────────────────────────
type TableMap = {
  categories: MockCategory;
  items: MockItem;
  stock_in: MockStockIn;
  stock_out: MockStockOut;
  requests: MockRequest;
  notifications: MockNotification;
  chat_messages: MockChat;
};

function init() {
  const key = "__mock_db_init__";
  if (!localStorage.getItem(key)) {
    localStorage.setItem("categories", JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem("items", JSON.stringify(DEFAULT_ITEMS));
    localStorage.setItem("stock_in", JSON.stringify(DEFAULT_STOCK_IN));
    localStorage.setItem("stock_out", JSON.stringify(DEFAULT_STOCK_OUT));
    localStorage.setItem("requests", JSON.stringify(DEFAULT_REQUESTS));
    localStorage.setItem("notifications", JSON.stringify(DEFAULT_NOTIFICATIONS));
    localStorage.setItem("chat_messages", JSON.stringify(DEFAULT_CHATS));
    localStorage.setItem(key, "1");
  }
}

function getAll<T>(table: string): T[] {
  init();
  try { return JSON.parse(localStorage.getItem(table) ?? "[]"); } catch { return []; }
}

function insert<T extends { id: string }>(table: string, row: T): T {
  const rows = getAll<T>(table);
  if (!row.id) row.id = genId();
  rows.push(row);
  localStorage.setItem(table, JSON.stringify(rows));
  return row;
}

function update<T extends { id: string }>(table: string, id: string, patch: Partial<T>): T | null {
  const rows = getAll<T>(table);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...patch };
  localStorage.setItem(table, JSON.stringify(rows));
  return rows[idx];
}

function remove(table: string, id: string): boolean {
  const rows = getAll(table);
  const filtered = rows.filter((r: any) => r.id !== id);
  localStorage.setItem(table, JSON.stringify(filtered));
  return filtered.length < rows.length;
}

function reset() {
  localStorage.removeItem("__mock_db_init__");
  init();
}

// ─── Convenience exports ────────────────────────────────
export const db = {
  categories: {
    getAll: () => getAll<MockCategory>("categories"),
    insert: (row: MockCategory) => insert("categories", row),
    update: (id: string, patch: Partial<MockCategory>) => update("categories", id, patch),
    remove: (id: string) => remove("categories", id),
  },
  items: {
    getAll: () => getAll<MockItem>("items"),
    insert: (row: MockItem) => insert("items", row),
    update: (id: string, patch: Partial<MockItem>) => update("items", id, patch),
    remove: (id: string) => remove("items", id),
  },
  stock_in: {
    getAll: () => getAll<MockStockIn>("stock_in"),
    insert: (row: MockStockIn) => insert("stock_in", row),
    remove: (id: string) => remove("stock_in", id),
  },
  stock_out: {
    getAll: () => getAll<MockStockOut>("stock_out"),
    insert: (row: MockStockOut) => insert("stock_out", row),
    remove: (id: string) => remove("stock_out", id),
  },
  requests: {
    getAll: () => getAll<MockRequest>("requests"),
    insert: (row: MockRequest) => insert("requests", row),
    update: (id: string, patch: Partial<MockRequest>) => update("requests", id, patch),
    remove: (id: string) => remove("requests", id),
  },
  notifications: {
    getAll: () => getAll<MockNotification>("notifications"),
    insert: (row: MockNotification) => insert("notifications", row),
    update: (id: string, patch: Partial<MockNotification>) => update("notifications", id, patch),
    remove: (id: string) => remove("notifications", id),
  },
  chat_messages: {
    getAll: () => getAll<MockChat>("chat_messages"),
    insert: (row: MockChat) => insert("chat_messages", row),
    remove: (id: string) => remove("chat_messages", id),
  },
  reset,
};

export { genId, now };
