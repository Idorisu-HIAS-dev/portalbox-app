import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, ScanLine } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAppSettings, formatDate, writeAuditLog } from "@/hooks/use-app-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/data-table";
import { QRScanner } from "@/components/qr-scanner";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const KATEGORI_OPSI = [
  "Makanan", "Minuman", "Elektronik", "ATK", "Furniture", "Kebersihan",
  "Peralatan", "Kesehatan", "Pakaian & Perlengkapan", "Bahan Baku", "Sparepart", "Lain-lain",
];

const EKSPEDISI_OPSI = [
  "J&T Express", "JNE Express", "Shopee Express (SPX)", "SiCepat Ekspres", "AnterAja",
  "Pos Indonesia", "TIKI", "Ninja Xpress", "Lion Parcel", "Wahana Express", "SAP Express", "Lainnya",
];

const MOCK_ITEMS_LIST = [
  { id: "1", name: "Laptop ASUS Vivobook 14", stock: 12, unit: "unit" },
  { id: "2", name: "Monitor LG 24 inch", stock: 8, unit: "unit" },
  { id: "3", name: "Keyboard Mechanical Logitech", stock: 15, unit: "pcs" },
  { id: "4", name: "Mouse Logitech G102", stock: 20, unit: "pcs" },
  { id: "5", name: "Meja Kerja Lipat", stock: 6, unit: "unit" },
  { id: "6", name: "Kursi Ergonomis", stock: 10, unit: "unit" },
  { id: "7", name: "Pulpen Pilot G2", stock: 50, unit: "pcs" },
  { id: "8", name: "Kertas A4 70g (rim)", stock: 25, unit: "rim" },
  { id: "9", name: "Whiteboard 120x90cm", stock: 4, unit: "unit" },
  { id: "10", name: "Spidol Whiteboard (set)", stock: 18, unit: "set" },
  { id: "11", name: "Headset Jabra Evolve2", stock: 7, unit: "unit" },
  { id: "12", name: "Pembersih Lantai (galon)", stock: 3, unit: "galon" },
];

const MOCK_STOCK_IN = [
  { id: "1", item_id: "1", qty: 5, source: "PT Maju Jaya", note: "Pengadaan Q1 2026", trx_date: "2026-01-15", created_by: "admin", created_at: "2026-01-15", items: { name: "Laptop ASUS Vivobook 14", unit: "unit" } },
  { id: "2", item_id: "2", qty: 4, source: "PT Maju Jaya", note: "Pengadaan Q1 2026", trx_date: "2026-01-15", created_by: "admin", created_at: "2026-01-15", items: { name: "Monitor LG 24 inch", unit: "unit" } },
  { id: "3", item_id: "7", qty: 30, source: "Toko ATK Pusat", note: "Restock bulanan", trx_date: "2026-02-01", created_by: "admin", created_at: "2026-02-01", items: { name: "Pulpen Pilot G2", unit: "pcs" } },
  { id: "4", item_id: "8", qty: 10, source: "Toko ATK Pusat", note: "Restock bulanan", trx_date: "2026-02-01", created_by: "admin", created_at: "2026-02-01", items: { name: "Kertas A4 70g (rim)", unit: "rim" } },
  { id: "5", item_id: "3", qty: 8, source: "Distributor IT", note: "Keyboard wireless baru", trx_date: "2026-03-10", created_by: "admin", created_at: "2026-03-10", items: { name: "Keyboard Mechanical Logitech", unit: "pcs" } },
  { id: "6", item_id: "4", qty: 12, source: "Distributor IT", note: "Mouse gaming stok", trx_date: "2026-03-10", created_by: "admin", created_at: "2026-03-10", items: { name: "Mouse Logitech G102", unit: "pcs" } },
  { id: "7", item_id: "5", qty: 3, source: "Furniture Indo", note: "Meja kerja lipat", trx_date: "2026-04-05", created_by: "admin", created_at: "2026-04-05", items: { name: "Meja Kerja Lipat", unit: "unit" } },
  { id: "8", item_id: "6", qty: 5, source: "Furniture Indo", note: "Kursi ergonomis", trx_date: "2026-04-05", created_by: "admin", created_at: "2026-04-05", items: { name: "Kursi Ergonomis", unit: "unit" } },
  { id: "9", item_id: "9", qty: 2, source: "Toko Office", note: "Whiteboard rapat", trx_date: "2026-05-20", created_by: "admin", created_at: "2026-05-20", items: { name: "Whiteboard 120x90cm", unit: "unit" } },
  { id: "10", item_id: "11", qty: 3, source: "PT Maju Jaya", note: "Headset tim support", trx_date: "2026-06-01", created_by: "admin", created_at: "2026-06-01", items: { name: "Headset Jabra Evolve2", unit: "unit" } },
];

const MOCK_STOCK_OUT = [
  { id: "1", item_id: "1", qty: 2, destination: "Ruang Dev", note: "Tim dev", trx_date: "2026-01-20", created_by: "admin", created_at: "2026-01-20", items: { name: "Laptop ASUS Vivobook 14", unit: "unit" } },
  { id: "2", item_id: "2", qty: 2, destination: "Ruang Dev", note: "Monitor ganda", trx_date: "2026-01-20", created_by: "admin", created_at: "2026-01-20", items: { name: "Monitor LG 24 inch", unit: "unit" } },
  { id: "3", item_id: "7", qty: 15, destination: "Front Desk", note: "CS & admin", trx_date: "2026-02-10", created_by: "admin", created_at: "2026-02-10", items: { name: "Pulpen Pilot G2", unit: "pcs" } },
  { id: "4", item_id: "8", qty: 5, destination: "Ruang Rapat", note: "Meeting", trx_date: "2026-03-01", created_by: "admin", created_at: "2026-03-01", items: { name: "Kertas A4 70g (rim)", unit: "rim" } },
  { id: "5", item_id: "3", qty: 3, destination: "Ruang Kerja", note: "Tim QA", trx_date: "2026-03-15", created_by: "admin", created_at: "2026-03-15", items: { name: "Keyboard Mechanical Logitech", unit: "pcs" } },
  { id: "6", item_id: "6", qty: 3, destination: "Ruang Tamu", note: "Kursi tamu", trx_date: "2026-04-10", created_by: "admin", created_at: "2026-04-10", items: { name: "Kursi Ergonomis", unit: "unit" } },
  { id: "7", item_id: "10", qty: 8, destination: "Ruang Meeting", note: "Spidol rapat", trx_date: "2026-05-15", created_by: "admin", created_at: "2026-05-15", items: { name: "Spidol Whiteboard (set)", unit: "set" } },
  { id: "8", item_id: "11", qty: 2, destination: "Ruang Support", note: "Helpdesk", trx_date: "2026-06-05", created_by: "admin", created_at: "2026-06-05", items: { name: "Headset Jabra Evolve2", unit: "unit" } },
];

type Row = {
  id: string; qty: number; trx_date: string; note: string | null; created_at: string;
  source?: string | null; destination?: string | null; item_id?: string | null;
  items?: { name: string; unit: string } | null;
};

export function TransactionPage({ kind }: { kind: "in" | "out" }) {
  const isIn = kind === "in";
  const table = isIn ? "stock_in" : "stock_out";
  const sourceField = isIn ? "source" : "destination";
  const sourceLabel = isIn ? "Asal Barang" : "Tujuan Barang";
  const title = isIn ? "Barang Masuk" : "Barang Keluar";

  const { user } = useAuth();
  const { settings } = useAppSettings();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [form, setForm] = useState({
    item_name: "", item_id: null as string | null, qty: 1, [sourceField]: "", note: "", trx_date: new Date().toISOString().slice(0, 10),
    kategori: "", kategori_lain: "", merek: "", ekspedisi: "", ekspedisi_lain: "",
  } as any);

  const { data: rows = [] } = useQuery({
    queryKey: [table],
    queryFn: async () => {
      if (isIn) return MOCK_STOCK_IN as Row[];
      return MOCK_STOCK_OUT as Row[];
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: async () => MOCK_ITEMS_LIST as any[],
  });

  function resetForm() {
    setForm({ item_name: "", item_id: null, qty: 1, [sourceField]: "", note: "", trx_date: new Date().toISOString().slice(0, 10), kategori: "", kategori_lain: "", merek: "", ekspedisi: "", ekspedisi_lain: "" });
  }

  async function handleQRScan(code: string) {
    const { data: item } = await supabase.from("items").select("id, name, code").eq("code", code).single();
    if (item) {
      if (isIn) {
        setForm((prev) => ({ ...prev, item_name: item.name, item_id: item.id }));
        toast.success(`Ditemukan: ${item.name}`);
      } else {
        setForm((prev) => ({ ...prev, item_id: item.id }));
        toast.success(`Ditemukan: ${item.name}`);
      }
      setOpen(true);
    } else {
      toast.error(`QR tidak dikenali: ${code}`);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.qty || form.qty <= 0) return toast.error("Jumlah harus > 0");

    // Barang Masuk: need item name to create/find item
    if (isIn && !form.item_name.trim()) return toast.error("Nama barang wajib diisi");

    // Barang Keluar: need to select existing item
    if (!isIn && !form.item_id) return toast.error("Pilih barang");

    let finalItemId = form.item_id;

    // For Barang Masuk: find or create item by name
    if (isIn && form.item_name.trim()) {
      const itemName = form.item_name.trim();
      // Try to find existing item by name (case-insensitive)
      const { data: existing } = await supabase.from("items").select("id").ilike("name", itemName).limit(1);

      if (existing && existing.length > 0) {
        finalItemId = existing[0].id;
      } else {
        // Create new item
        const code = `BRG-${Date.now().toString(36).toUpperCase()}`;
        const { data: newItem, error: createErr } = await supabase.from("items").insert({
          code,
          name: itemName,
          stock: 0,
          min_stock: 5,
          unit: "pcs",
          created_by: user?.id,
        }).select("id").single();

        if (createErr) return toast.error("Gagal membuat barang: " + createErr.message);
        finalItemId = newItem.id;
      }
    }

    const kategoriFinal = form.kategori === "Lain-lain" ? form.kategori_lain.trim() : form.kategori;
    const ekspedisiFinal = form.ekspedisi === "Lainnya" ? form.ekspedisi_lain.trim() : form.ekspedisi;

    let noteParts: string[] = [];
    if (form.note) noteParts.push(form.note);
    if (kategoriFinal) noteParts.push(`Kategori: ${kategoriFinal}`);
    if (form.merek) noteParts.push(`Merek: ${form.merek}`);
    if (ekspedisiFinal) noteParts.push(`Ekspedisi: ${ekspedisiFinal}`);

    const payload: any = {
      item_id: finalItemId, qty: form.qty, trx_date: form.trx_date,
      note: noteParts.join(" | ") || null, created_by: user?.id,
    };
    payload[sourceField] = form[sourceField] || null;

    const { error } = await supabase.from(table).insert(payload);
    if (error) return toast.error(error.message);
    if (user) {
      const itemName = isIn ? form.item_name.trim() : (items as any[]).find((i) => i.id === form.item_id)?.name ?? "";
      await writeAuditLog(user.id, isIn ? "barang_masuk" : "barang_keluar", `${title}: ${itemName} x${form.qty}`, settings.auditLog);
    }
    toast.success(`${title} dicatat`);
    setOpen(false);
    resetForm();
    qc.invalidateQueries({ queryKey: [table] });
    qc.invalidateQueries({ queryKey: ["items"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Dihapus"); qc.invalidateQueries({ queryKey: [table] }); qc.invalidateQueries({ queryKey: ["items"] }); setDelId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <DataTable<Row>
        data={rows}
        searchKeys={["note", sourceField as any]}
        toolbar={
          <div className="flex gap-2">
            {isIn && (
              <Button variant="outline" onClick={() => setShowQR(true)}>
                <ScanLine className="h-4 w-4 mr-1" />Scan QR
              </Button>
            )}
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Tambah {title}</Button>
          </div>
        }
        columns={[
          { key: "trx_date", header: "Tanggal", sortable: true, cell: (r) => formatDate(r.trx_date, settings.dateFormat) },
          { key: "items", header: "Barang", cell: (r) => <span className="font-medium">{r.items?.name ?? "—"}</span> },
          { key: "qty", header: "Jumlah", sortable: true, cell: (r) => `${r.qty} ${r.items?.unit ?? ""}` },
          { key: sourceField, header: sourceLabel, cell: (r) => (r as any)[sourceField] ?? "—" },
          { key: "note", header: "Keterangan", cell: (r) => r.note ?? "—" },
          {
            key: "actions", header: "", className: "text-right w-16",
            cell: (r) => (
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDelId(r.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            ),
          },
        ]}
      />

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Tambah {title}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            {/* Barang Masuk: text input for item name */}
            {isIn && (
              <div className="space-y-1.5">
                <Label>Nama Barang</Label>
                <Input value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} placeholder="Tulis nama barang…" required />
                <p className="text-[11px] text-muted-foreground">Barang baru akan otomatis ditambahkan ke Daftar Barang.</p>
              </div>
            )}

            {/* Barang Keluar: dropdown to select existing item */}
            {!isIn && (
              <div className="space-y-1.5">
                <Label>Barang</Label>
                <Select value={form.item_id ?? ""} onValueChange={(v) => setForm({ ...form, item_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih barang" /></SelectTrigger>
                  <SelectContent>
                    {(items as any[]).map((it) => (
                      <SelectItem key={it.id} value={it.id}>{it.name} (stok: {it.stock} {it.unit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Kategori Barang</Label>
              <Select value={form.kategori} onValueChange={(v) => setForm({ ...form, kategori: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {KATEGORI_OPSI.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
              {form.kategori === "Lain-lain" && (
                <Input className="mt-2" placeholder="Tulis kategori…" value={form.kategori_lain} onChange={(e) => setForm({ ...form, kategori_lain: e.target.value })} />
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Nama Merek</Label>
              <Input value={form.merek} onChange={(e) => setForm({ ...form, merek: e.target.value })} placeholder="Cth: Bagus, Cap Jago…" />
            </div>

            <div className="space-y-1.5">
              <Label>Ekspedisi / Pengiriman</Label>
              <Select value={form.ekspedisi} onValueChange={(v) => setForm({ ...form, ekspedisi: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih ekspedisi" /></SelectTrigger>
                <SelectContent>
                  {EKSPEDISI_OPSI.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
              {form.ekspedisi === "Lainnya" && (
                <Input className="mt-2" placeholder="Sebutkan nama ekspedisi…" value={form.ekspedisi_lain} onChange={(e) => setForm({ ...form, ekspedisi_lain: e.target.value })} />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Jumlah</Label>
                <Input type="number" min={1} value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Tanggal</Label>
                <Input type="date" value={form.trx_date} onChange={(e) => setForm({ ...form, trx_date: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{sourceLabel}</Label>
              <Input value={form[sourceField]} onChange={(e) => setForm({ ...form, [sourceField]: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Keterangan</Label>
              <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus transaksi?</AlertDialogTitle>
            <AlertDialogDescription>Stok barang akan dikembalikan sesuai jumlah transaksi.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => delId && delMut.mutate(delId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isIn && <QRScanner open={showQR} onOpenChange={setShowQR} onScan={handleQRScan} />}
    </div>
  );
}
