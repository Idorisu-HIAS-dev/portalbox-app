# Implementation Plan

Scope is large — I'll build it as 6 coordinated changes. Color palette stays the same (primary blue #2563EB, sidebar dark #1E293B).

## 1. Permintaan (Requests) — form fields
Add to request creation form:
- **Kategori barang** (select): Makanan, Minuman, Elektronik, ATK, Furniture, Kebersihan, Peralatan, Kesehatan, Pakaian & Perlengkapan, Bahan Baku, Sparepart, Lain-lain (free text muncul jika dipilih)
- **Nama merek** (text input)
- **Ekspedisi** (select): J&T, JNE, SPX, SiCepat, AnterAja, Pos Indonesia, TIKI, Ninja Xpress, Lion Parcel, Wahana, SAP, Lainnya (free text muncul jika dipilih)

Migration: add `kategori`, `kategori_lain`, `merek`, `ekspedisi`, `ekspedisi_lain` columns to `requests`.

## 2. Layout — sidebar behavior
- **Desktop (≥md)**: sidebar sticky di kiri (fixed full height)
- **Mobile (<md)**: sidebar pindah ke bawah sebagai bottom navigation bar (ikon + label pendek)

## 3. Dashboard — redesign mengikuti referensi No.1
- Top row: 5 stat cards bulat/rounded dengan ikon dalam lingkaran ungu/biru
- Row tengah: donut "Order Summary" (in delivery/delivered/cancelled style → kita pakai: Masuk/Keluar/Pending) + "Overview" line chart + "Top Selling Items" list di kanan
- Row bawah: bar chart "Customer Map" (kita pakai: aktivitas transaksi per hari) + area chart "Total Revenue" (kita pakai: nilai stok per bulan)

## 4. Chat — fitur baru (referensi No.3)
- Tabel baru `chat_messages` (sender_id, recipient_id, content, read, created_at)
- Route `/_authenticated/chat`: split view → list user di kiri (search), conversation di kanan dengan bubble messages dan input bawah
- Realtime via Supabase channel
- Menu sidebar baru "Chat" dengan badge unread

## 5. Tabel — styling seperti No.2
Update `DataTable`:
- Header pill rounded gelap
- Row dengan avatar circle di kolom nama
- Status badge berwarna (hijau/merah/kuning) dengan dot
- Action menu titik tiga di ujung kanan
- Border row tipis, hover state subtle

## 6. Pengaturan — overhaul lengkap dengan tabs
Tabs: **Tampilan | Sistem | Notifikasi | Keamanan | Backup & Pemulihan | Laporan**

- **Tampilan**: Tema (Light/Dark/Sistem), Warna aksen (Biru/Hijau/Ungu/Orange), Sidebar diperkecil default, Tampilkan ikon saja, Buka menu saat hover, Format tanggal (3 pilihan)
- **Sistem**: Timezone (WIB/WITA/WIT), Logout otomatis (30m/1j/2j), Generate QR otomatis, Cetak QR setelah simpan
- **Notifikasi**: toggle Barang Masuk/Keluar/Permintaan/Persetujuan/Stok Menipis/Habis
- **Keamanan**: Wajib ganti password pertama login, Catat aktivitas pengguna
- **Backup & Pemulihan**: Tombol Backup Sekarang & Restore, frekuensi otomatis (Harian/Mingguan/Bulanan/Nonaktif)
- **Laporan**: PDF/Excel toggle, Tampilkan logo, tanda tangan, footer, nomor halaman

Settings disimpan di tabel `app_settings` per-user (user_id, settings JSONB) + diterapkan ke tema & accent color via CSS variable.

---

## Technical Notes
- Migration tunggal: kolom baru requests + tabel chat_messages + tabel app_settings
- Theme/accent diterapkan via `data-accent` attribute di `<html>` + class `dark`
- Chat memakai Supabase Realtime postgres_changes channel
- Bottom-nav mobile: hanya 5 menu utama; sisanya di sheet "More"

Setelah disetujui saya implementasikan semua dalam satu batch (migration dulu, lalu kode).