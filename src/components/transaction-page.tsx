import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, ScanLine } from "lucide-react";
import { toast } from "sonner";

import { db, genId, now } from "@/lib/mock-db";
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
      const allRows = isIn ? db.stock_in.getAll() : db.stock_out.getAll();
      const itemsList = db.items.getAll();
      return allRows.map((t) => ({ ...t, items: itemsList.find((i) => i.id === t.item_id) ?? null })) as Row[];
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: async () => db.items.getAll() as any[],
  });

  function resetForm() {
    setForm({ item_name: "", item_id: null, qty: 1, [sourceField]: "", note: "", trx_date: new Date().toISOString().slice(0, 10), kategori: "", kategori_lain: "", merek: "", ekspedisi: "", ekspedisi_lain: "" });
  }

  async function handleQRScan(code: string) {
    const allItems = db.items.getAll();
    const item = allItems.find((i) => i.code === code);
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

    if (isIn && !form.item_name.trim()) return toast.error("Nama barang wajib diisi");
    if (!isIn && !form.item_id) return toast.error("Pilih barang");

    let finalItemId = form.item_id;

    if (isIn && form.item_name.trim()) {
      const itemName = form.item_name.trim();
      const allItems = db.items.getAll();
      const existing = allItems.find((i) => i.name.toLowerCase() === itemName.toLowerCase());

      if (existing) {
        finalItemId = existing.id;
      } else {
        const code = `BRG-${Date.now().toString(36).toUpperCase()}`;
        const newItem: any = { id: genId(), code, name: itemName, stock: 0, min_stock: 5, unit: "pcs", category_id: null, description: "", photo_url: null, created_at: now() };
        db.items.insert(newItem);
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

    const rowId = genId();
    const payload: any = {
      id: rowId,
      item_id: finalItemId, qty: form.qty, trx_date: form.trx_date,
      note: noteParts.join(" | ") || null,
      created_at: now(),
    };
    payload[sourceField] = form[sourceField] || null;

    if (isIn) {
      db.stock_in.insert(payload);
      const item = db.items.getAll().find((i) => i.id === finalItemId);
      if (item) db.items.update(finalItemId, { stock: item.stock + form.qty });
    } else {
      db.stock_out.insert(payload);
      const item = db.items.getAll().find((i) => i.id === finalItemId);
      if (item) db.items.update(finalItemId, { stock: Math.max(0, item.stock - form.qty) });
    }

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
      if (isIn) db.stock_in.remove(id);
      else db.stock_out.remove(id);
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
