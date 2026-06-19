import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Upload, ImageOff, QrCode, ArrowDownToLine, ArrowUpFromLine, Tags } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAppSettings, formatDate, writeAuditLog } from "@/hooks/use-app-settings";
import type { AppSettings } from "@/hooks/use-app-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
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

export const Route = createFileRoute("/_authenticated/data-barang")({
  ssr: false,
  head: () => ({ meta: [{ title: "Data Barang — Inventaris" }] }),
  component: ItemsPage,
});

type Item = {
  id: string; code: string; name: string; stock: number; min_stock: number;
  unit: string; photo_url: string | null; category_id: string | null;
  categories?: { name: string } | null;
  created_at?: string;
};
type Cat = { id: string; name: string; description: string | null };
type Trx = { id: string; qty: number; trx_date: string; note: string | null; source?: string | null; destination?: string | null; created_at: string };

const schema = z.object({
  code: z.string().trim().min(1, "Kode wajib").max(50),
  name: z.string().trim().min(1, "Nama wajib").max(150),
  category_id: z.string().nullable(),
  stock: z.coerce.number().int().min(0),
  min_stock: z.coerce.number().int().min(0),
  unit: z.string().trim().min(1).max(20),
  description: z.string().max(500).optional(),
});

const MOCK_CATEGORIES: Cat[] = [
  { id: "1", name: "Elektronik", description: "Peralatan elektronik kantor" },
  { id: "2", name: "Furniture", description: "Meja, kursi, lemari, dll" },
  { id: "3", name: "Alat Tulis", description: "Pensil, pulpen, kertas, dll" },
  { id: "4", name: "ATK Khusus", description: "Peralatan presentasi & rapat" },
  { id: "5", name: "Komputer & Aksesoris", description: "PC, laptop, printer, dll" },
  { id: "6", name: "Kebersihan", description: "Peralatan kebersihan kantor" },
];

const MOCK_ITEMS = [
  { id: "1", code: "BRG-00001", name: "Laptop ASUS Vivobook 14", category_id: "5", stock: 12, min_stock: 3, unit: "unit", description: "Laptop 14 inch RAM 16GB", categories: { name: "Komputer & Aksesoris" }, photo_url: null, created_at: "2026-01-10" },
  { id: "2", code: "BRG-00002", name: "Monitor LG 24 inch", category_id: "5", stock: 8, min_stock: 2, unit: "unit", description: "Monitor LED IPS FHD", categories: { name: "Komputer & Aksesoris" }, photo_url: null, created_at: "2026-01-10" },
  { id: "3", code: "BRG-00003", name: "Keyboard Mechanical Logitech", category_id: "5", stock: 15, min_stock: 5, unit: "pcs", description: "Keyboard wireless", categories: { name: "Komputer & Aksesoris" }, photo_url: null, created_at: "2026-01-15" },
  { id: "4", code: "BRG-00004", name: "Mouse Logitech G102", category_id: "5", stock: 20, min_stock: 5, unit: "pcs", description: "Mouse gaming", categories: { name: "Komputer & Aksesoris" }, photo_url: null, created_at: "2026-01-15" },
  { id: "5", code: "BRG-00005", name: "Meja Kerja Lipat", category_id: "2", stock: 6, min_stock: 2, unit: "unit", description: "Meja lipat portable", categories: { name: "Furniture" }, photo_url: null, created_at: "2026-02-01" },
  { id: "6", code: "BRG-00006", name: "Kursi Ergonomis", category_id: "2", stock: 10, min_stock: 3, unit: "unit", description: "Kursi kantor", categories: { name: "Furniture" }, photo_url: null, created_at: "2026-02-01" },
  { id: "7", code: "BRG-00007", name: "Pulpen Pilot G2", category_id: "3", stock: 50, min_stock: 10, unit: "pcs", description: "Pulpen gel 0.7mm", categories: { name: "Alat Tulis" }, photo_url: null, created_at: "2026-03-01" },
  { id: "8", code: "BRG-00008", name: "Kertas A4 70g (rim)", category_id: "3", stock: 25, min_stock: 5, unit: "rim", description: "Kertas A4 500 lembar", categories: { name: "Alat Tulis" }, photo_url: null, created_at: "2026-03-01" },
  { id: "9", code: "BRG-00009", name: "Whiteboard 120x90cm", category_id: "4", stock: 4, min_stock: 1, unit: "unit", description: "Papan tulis magnetik", categories: { name: "ATK Khusus" }, photo_url: null, created_at: "2026-04-01" },
  { id: "10", code: "BRG-00010", name: "Spidol Whiteboard (set)", category_id: "4", stock: 18, min_stock: 5, unit: "set", description: "Set 6 warna", categories: { name: "ATK Khusus" }, photo_url: null, created_at: "2026-04-01" },
  { id: "11", code: "BRG-00011", name: "Headset Jabra Evolve2", category_id: "1", stock: 7, min_stock: 2, unit: "unit", description: "Headset BT", categories: { name: "Elektronik" }, photo_url: null, created_at: "2026-05-01" },
  { id: "12", code: "BRG-00012", name: "Pembersih Lantai (galon)", category_id: "6", stock: 3, min_stock: 1, unit: "galon", description: "Cairan 5L", categories: { name: "Kebersihan" }, photo_url: null, created_at: "2026-05-01" },
];

const MOCK_TRX_IN = [
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

const MOCK_TRX_OUT = [
  { id: "1", item_id: "1", qty: 2, destination: "Ruang Dev", note: "Tim dev", trx_date: "2026-01-20", created_by: "admin", created_at: "2026-01-20", items: { name: "Laptop ASUS Vivobook 14", unit: "unit" } },
  { id: "2", item_id: "2", qty: 2, destination: "Ruang Dev", note: "Monitor ganda", trx_date: "2026-01-20", created_by: "admin", created_at: "2026-01-20", items: { name: "Monitor LG 24 inch", unit: "unit" } },
  { id: "3", item_id: "7", qty: 15, destination: "Front Desk", note: "CS & admin", trx_date: "2026-02-10", created_by: "admin", created_at: "2026-02-10", items: { name: "Pulpen Pilot G2", unit: "pcs" } },
  { id: "4", item_id: "8", qty: 5, destination: "Ruang Rapat", note: "Meeting", trx_date: "2026-03-01", created_by: "admin", created_at: "2026-03-01", items: { name: "Kertas A4 70g (rim)", unit: "rim" } },
  { id: "5", item_id: "3", qty: 3, destination: "Ruang Kerja", note: "Tim QA", trx_date: "2026-03-15", created_by: "admin", created_at: "2026-03-15", items: { name: "Keyboard Mechanical Logitech", unit: "pcs" } },
  { id: "6", item_id: "6", qty: 3, destination: "Ruang Tamu", note: "Kursi tamu", trx_date: "2026-04-10", created_by: "admin", created_at: "2026-04-10", items: { name: "Kursi Ergonomis", unit: "unit" } },
  { id: "7", item_id: "10", qty: 8, destination: "Ruang Meeting", note: "Spidol rapat", trx_date: "2026-05-15", created_by: "admin", created_at: "2026-05-15", items: { name: "Spidol Whiteboard (set)", unit: "set" } },
  { id: "8", item_id: "11", qty: 2, destination: "Ruang Support", note: "Helpdesk", trx_date: "2026-06-05", created_by: "admin", created_at: "2026-06-05", items: { name: "Headset Jabra Evolve2", unit: "unit" } },
];

function ItemsPage() {
  const { role, user } = useAuth();
  const { settings } = useAppSettings();
  const qc = useQueryClient();
  const isAdmin = role === "admin";
  const [tab, setTab] = useState("barang");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<Item | null>(null);

  // Kategori state
  const [openCat, setOpenCat] = useState(false);
  const [editingCat, setEditingCat] = useState<Cat | null>(null);
  const [delCatId, setDelCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({ name: "", description: "" });

  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      return MOCK_ITEMS as Item[];
    },
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => MOCK_CATEGORIES as Cat[],
  });

  const { data: trxIn = [] } = useQuery({
    queryKey: ["stock-in"],
    queryFn: async () => MOCK_TRX_IN as any[],
  });
  const { data: trxOut = [] } = useQuery({
    queryKey: ["stock-out"],
    queryFn: async () => MOCK_TRX_OUT as any[],
  });

  // Item delete
  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const item = items.find((i) => i.id === id);
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
      if (user) await writeAuditLog(user.id, "barang_dihapus", `Barang ${item?.name ?? id} dihapus`, settings.auditLog);
    },
    onSuccess: () => { toast.success("Barang dihapus"); qc.invalidateQueries({ queryKey: ["items"] }); setDeleteId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  // Kategori CRUD
  async function saveCat(e: React.FormEvent) {
    e.preventDefault();
    if (!catForm.name.trim()) return toast.error("Nama wajib");
    const payload = { name: catForm.name.trim(), description: catForm.description.trim() || null };
    const op = editingCat
      ? supabase.from("categories").update(payload).eq("id", editingCat.id)
      : supabase.from("categories").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success(editingCat ? "Kategori diperbarui" : "Kategori ditambahkan");
    setOpenCat(false); setEditingCat(null); setCatForm({ name: "", description: "" });
    qc.invalidateQueries({ queryKey: ["categories"] });
  }
  const delCatMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Kategori dihapus"); qc.invalidateQueries({ queryKey: ["categories"] }); setDelCatId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const detailTrxIn = detailItem ? (trxIn as any[]).filter((t) => t.item_id === detailItem.id) : [];
  const detailTrxOut = detailItem ? (trxOut as any[]).filter((t) => t.item_id === detailItem.id) : [];
  const allDetailTrx = [
    ...detailTrxIn.map((t: any) => ({ ...t, type: "in" as const })),
    ...detailTrxOut.map((t: any) => ({ ...t, type: "out" as const })),
  ].sort((a, b) => new Date(b.trx_date).getTime() - new Date(a.trx_date).getTime());

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="barang">Daftar Barang</TabsTrigger>
          <TabsTrigger value="kategori"><Tags className="h-3.5 w-3.5 mr-1" />Kategori</TabsTrigger>
        </TabsList>

        <TabsContent value="barang" className="mt-4">
          <DataTable<Item>
            data={items}
            searchKeys={["code", "name"]}
            toolbar={
              <Button onClick={() => { setEditing(null); setOpenForm(true); }}>
                <Plus className="h-4 w-4 mr-1" />Tambah Barang
              </Button>
            }
            columns={[
              {
                key: "photo_url", header: "Foto", className: "w-16",
                cell: (r) => r.photo_url ? (
                  <img src={r.photo_url} alt={r.name} className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-muted-foreground"><ImageOff className="h-4 w-4" /></div>
                ),
              },
              { key: "code", header: "Kode", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.code}</span> },
              { key: "name", header: "Nama", sortable: true, cell: (r) => <span className="font-medium">{r.name}</span> },
              { key: "categories", header: "Kategori", cell: (r) => r.categories?.name ?? "—" },
              {
                key: "stock", header: "Stok", sortable: true,
                cell: (r) => {
                  const cls = r.stock === 0 ? "bg-destructive/10 text-destructive" : r.stock <= r.min_stock ? "bg-warning/10 text-warning" : "bg-success/10 text-success";
                  return <Badge className={`${cls} hover:${cls}`} variant="outline">{r.stock} {r.unit}</Badge>;
                },
              },
              { key: "min_stock", header: "Min. Stok" },
              {
                key: "actions", header: "", className: "text-right w-32",
                cell: (r) => (
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setDetailItem(r)} title="Riwayat">
                      <ArrowDownToLine className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(r.code)}`, "_blank")}>
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpenForm(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ),
              },
            ]}
          />

          <ItemFormDialog
            open={openForm}
            onOpenChange={setOpenForm}
            editing={editing}
            categories={categories as { id: string; name: string }[]}
            userId={user?.id}
            settings={settings}
            onSaved={() => qc.invalidateQueries({ queryKey: ["items"] })}
          />

          <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus barang?</AlertDialogTitle>
                <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteId && delMut.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Detail Riwayat Transaksi */}
          <Dialog open={!!detailItem} onOpenChange={(o) => !o && setDetailItem(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Riwayat — {detailItem?.name}</DialogTitle>
              </DialogHeader>
              {allDetailTrx.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Belum ada transaksi.</p>
              ) : (
                <div className="space-y-2">
                  {allDetailTrx.map((t: any) => (
                    <Card key={t.id} className="p-3 flex items-center gap-3">
                      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${t.type === "in" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                        {t.type === "in" ? <ArrowDownToLine className="h-4 w-4" /> : <ArrowUpFromLine className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{t.type === "in" ? "Masuk" : "Keluar"} — {t.qty} {detailItem?.unit}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(t.trx_date, settings.dateFormat)}{t.source ? ` • ${t.source}` : ""}{t.destination ? ` → ${t.destination}` : ""}</p>
                        {t.note && <p className="text-xs text-muted-foreground mt-0.5">{t.note}</p>}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="kategori" className="mt-4">
          <DataTable<Cat>
            data={categories as Cat[]}
            searchKeys={["name"]}
            toolbar={
              <Button onClick={() => { setEditingCat(null); setCatForm({ name: "", description: "" }); setOpenCat(true); }}>
                <Plus className="h-4 w-4 mr-1" />Tambah Kategori
              </Button>
            }
            columns={[
              { key: "name", header: "Nama", sortable: true, cell: (r) => <span className="font-medium">{r.name}</span> },
              { key: "description", header: "Deskripsi", cell: (r) => r.description ?? "—" },
              {
                key: "actions", header: "", className: "text-right w-28",
                cell: (r) => (
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditingCat(r); setCatForm({ name: r.name, description: r.description ?? "" }); setOpenCat(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDelCatId(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ),
              },
            ]}
          />

          <Dialog open={openCat} onOpenChange={setOpenCat}>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingCat ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle></DialogHeader>
              <form onSubmit={saveCat} className="space-y-4">
                <div className="space-y-1.5"><Label>Nama</Label><Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} required /></div>
                <div className="space-y-1.5"><Label>Deskripsi</Label><Textarea value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} /></div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenCat(false)}>Batal</Button>
                  <Button type="submit">Simpan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <AlertDialog open={!!delCatId} onOpenChange={(o) => !o && setDelCatId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus kategori?</AlertDialogTitle>
                <AlertDialogDescription>Barang yang menggunakan kategori ini akan menjadi tanpa kategori.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={() => delCatId && delCatMut.mutate(delCatId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ItemFormDialog({ open, onOpenChange, editing, categories, userId, settings, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void; editing: Item | null;
  categories: { id: string; name: string }[]; userId?: string; settings: AppSettings; onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [form, setForm] = useState(() => init(editing));

  function init(it: Item | null) {
    return {
      code: it?.code ?? "", name: it?.name ?? "", category_id: it?.category_id ?? null,
      stock: it?.stock ?? 0, min_stock: it?.min_stock ?? 5, unit: it?.unit ?? "pcs", description: "",
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      let photo_url: string | null | undefined = undefined;
      if (photoFile) {
        const path = `${userId}/${Date.now()}-${photoFile.name}`;
        const { error: uErr } = await supabase.storage.from("item-photos").upload(path, photoFile, { upsert: false });
        if (uErr) throw uErr;
        const { data: signed } = await supabase.storage.from("item-photos").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
        photo_url = signed?.signedUrl ?? null;
      }
      if (editing) {
        const payload: any = { ...parsed.data };
        if (photo_url !== undefined) payload.photo_url = photo_url;
        const { error } = await supabase.from("items").update(payload).eq("id", editing.id);
        if (error) throw error;
        if (userId) await writeAuditLog(userId, "barang_diperbarui", `Barang ${parsed.data.name} diperbarui`, settings.auditLog);
        toast.success("Barang diperbarui");
      } else {
        const { error } = await supabase.from("items").insert({ ...parsed.data, photo_url: photo_url ?? null, created_by: userId });
        if (error) throw error;
        if (userId) await writeAuditLog(userId, "barang_ditambahkan", `Barang ${parsed.data.name} ditambahkan`, settings.auditLog);
        toast.success("Barang ditambahkan");
      }
      onSaved(); onOpenChange(false); setPhotoFile(null); setForm(init(null));
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (o) setForm(init(editing)); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editing ? "Edit Barang" : "Tambah Barang"}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Kode Barang</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label>Satuan</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required /></div>
          </div>
          <div className="space-y-1.5"><Label>Nama Barang</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="space-y-1.5">
            <Label>Kategori</Label>
            <Select value={form.category_id ?? "__none"} onValueChange={(v) => setForm({ ...form, category_id: v === "__none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— Tanpa kategori —</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Stok Awal</Label><Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
            <div className="space-y-1.5"><Label>Min. Stok</Label><Input type="number" min={0} value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Foto</Label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground hover:bg-muted">
              <Upload className="h-4 w-4" />{photoFile ? photoFile.name : "Pilih foto barang…"}
              <input type="file" accept="image/*" hidden onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
