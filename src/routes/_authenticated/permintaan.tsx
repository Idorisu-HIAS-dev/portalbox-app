import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Eye, Send } from "lucide-react";
import { toast } from "sonner";

import { db, genId, now } from "@/lib/mock-db";
import { useAuth } from "@/hooks/use-auth";
import { useAppSettings, formatDate, writeAuditLog } from "@/hooks/use-app-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/permintaan")({
  ssr: false,
  head: () => ({ meta: [{ title: "Permintaan Barang — Inventaris" }] }),
  component: RequestsPage,
});

const KATEGORI_OPSI = [
  "Makanan", "Minuman", "Elektronik", "ATK", "Furniture", "Kebersihan",
  "Peralatan", "Kesehatan", "Pakaian & Perlengkapan", "Bahan Baku", "Sparepart", "Lain-lain",
];

const EKSPEDISI_OPSI = [
  "J&T Express", "JNE Express", "Shopee Express (SPX)", "SiCepat Ekspres", "AnterAja",
  "Pos Indonesia", "TIKI", "Ninja Xpress", "Lion Parcel", "Wahana Express", "SAP Express", "Lainnya",
];

type Req = {
  id: string; qty: number; status: "menunggu" | "disetujui" | "ditolak";
  note: string | null; created_at: string; requester_id: string; approval_note: string | null;
  kategori: string | null; kategori_lain: string | null; merek: string | null;
  ekspedisi: string | null; ekspedisi_lain: string | null;
  item_id: string | null;
  items?: { name: string; unit: string } | null;
  requester?: { full_name: string | null } | null;
};

function buildMessage(form: any) {
  const kategori = form.kategori === "Lain-lain" ? form.kategori_lain : form.kategori;
  const ekspedisi = form.ekspedisi === "Lainnya" ? form.ekspedisi_lain : form.ekspedisi;
  return `Pak/Bu, izin ajukan permintaan barang ya:
✅ Kategori: ${kategori || "-"}
✅ Merek: ${form.merek || "-"}
✅ Jumlah: ${form.qty}
✅ Pengiriman: ${ekspedisi || "-"}
${form.note ? `📝 Catatan: ${form.note}\n` : ""}Mohon persetujuannya. Terima kasih 🙏`;
}

function RequestsPage() {
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [form, setForm] = useState({
    item_id: "", qty: 1, note: "",
    kategori: "", kategori_lain: "",
    merek: "",
    ekspedisi: "", ekspedisi_lain: "",
  });

  const { data: reqs = [] } = useQuery({
    queryKey: ["requests"],
    queryFn: async () => {
      const allReqs = db.requests.getAll();
      const itemsList = db.items.getAll();
      return allReqs.map((r) => ({
        ...r,
        items: r.item_id ? itemsList.find((i) => i.id === r.item_id) ?? null : null,
        requester: { full_name: "Admin Utama" },
      })) as Req[];
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["items-min"],
    queryFn: async () => db.items.getAll() as any[],
  });

  function validateForm() {
    if (!form.kategori) return "Pilih kategori";
    if (!form.merek.trim()) return "Isi nama merek";
    if (!form.ekspedisi) return "Pilih ekspedisi";
    if (form.kategori === "Lain-lain" && !form.kategori_lain.trim()) return "Tulis kategori lainnya";
    if (form.ekspedisi === "Lainnya" && !form.ekspedisi_lain.trim()) return "Tulis nama ekspedisi";
    return null;
  }

  function handlePreview() {
    const err = validateForm();
    if (err) return toast.error(err);
    setShowDraft(true);
  }

  async function saveDraft() {
    const err = validateForm();
    if (err) return toast.error(err);

    const message = buildMessage(form);
    const newReq: any = {
      id: genId(),
      item_id: form.item_id || null,
      qty: form.qty,
      note: message,
      requester_id: user!.id,
      status: "menunggu",
      kategori: form.kategori,
      kategori_lain: form.kategori === "Lain-lain" ? form.kategori_lain.trim() : null,
      merek: form.merek.trim() || null,
      ekspedisi: form.ekspedisi,
      ekspedisi_lain: form.ekspedisi === "Lainnya" ? form.ekspedisi_lain.trim() : null,
      approver_id: null,
      approval_note: null,
      approved_at: null,
      created_at: now(),
    };
    db.requests.insert(newReq);

    db.chat_messages.insert({
      id: genId(),
      sender_id: user!.id,
      recipient_id: "admin",
      content: message,
      read: false,
      created_at: now(),
    });

    await writeAuditLog(user!.id, "permintaan_dibuat", `Permintaan: ${form.merek} kategori ${form.kategori} x${form.qty} diajukan`, settings.auditLog);
    toast.success("Permintaan dikirim ke Admin via Chat.");
    setShowDraft(false);
    setOpen(false);
    setForm({ item_id: "", qty: 1, note: "", kategori: "", kategori_lain: "", merek: "", ekspedisi: "", ekspedisi_lain: "" });
    qc.invalidateQueries({ queryKey: ["requests"] });
  }

  return (
    <div className="space-y-4">
      <DataTable<Req>
        data={reqs}
        searchKeys={["note", "merek", "kategori"]}
        toolbar={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Ajukan Permintaan</Button>}
        columns={[
          { key: "created_at", header: "Tanggal", sortable: true, cell: (r) => formatDate(r.created_at, settings.dateFormat) },
          { key: "kategori", header: "Kategori", cell: (r) => r.kategori === "Lain-lain" ? r.kategori_lain : (r.kategori ?? "—") },
          { key: "merek", header: "Merek", cell: (r) => r.merek ?? "—" },
          { key: "items", header: "Barang", cell: (r) => <span className="font-medium">{r.items?.name ?? "—"}</span> },
          { key: "qty", header: "Jumlah", cell: (r) => `${r.qty} unit` },
          { key: "ekspedisi", header: "Ekspedisi", cell: (r) => r.ekspedisi === "Lainnya" ? r.ekspedisi_lain : (r.ekspedisi ?? "—") },
          { key: "requester", header: "Pemohon", cell: (r) => r.requester?.full_name ?? "—" },
          { key: "status", header: "Status", sortable: true, cell: (r) => <StatusBadge status={r.status} /> },
        ]}
      />

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Ajukan Permintaan Barang</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handlePreview(); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Kategori Barang *</Label>
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
              <Label>Nama Merek *</Label>
              <Input value={form.merek} onChange={(e) => setForm({ ...form, merek: e.target.value })} placeholder="Cth: Bagus, Cap Jago…" />
            </div>

            <div className="space-y-1.5">
              <Label>Barang (opsional)</Label>
              <Select value={form.item_id || "__none"} onValueChange={(v) => setForm({ ...form, item_id: v === "__none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Pilih barang jika ada" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Tidak dipilih —</SelectItem>
                  {(items as any[]).map((it) => (
                    <SelectItem key={it.id} value={it.id}>{it.name} (stok: {it.stock} {it.unit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Ekspedisi *</Label>
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

            <div className="space-y-1.5">
              <Label>Jumlah</Label>
              <Input type="number" min={1} value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Catatan</Label>
              <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Tujuan / alasan permintaan…" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit"><Eye className="h-4 w-4 mr-1" />Lihat Draft</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Draft Preview Dialog */}
      <Dialog open={showDraft} onOpenChange={setShowDraft}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Draft Pesan ke Admin</DialogTitle>
          </DialogHeader>
          <Card className="p-4 bg-muted/30 whitespace-pre-wrap text-sm leading-relaxed border border-dashed">
            {buildMessage(form)}
          </Card>
          <p className="text-[11px] text-muted-foreground">Pesan ini akan dikirim ke Admin untuk persetujuan.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDraft(false)}>Kembali Edit</Button>
            <Button onClick={saveDraft}><Send className="h-4 w-4 mr-1" />Kirim ke Admin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function StatusBadge({ status }: { status: "menunggu" | "disetujui" | "ditolak" }) {
  const map = {
    menunggu: "bg-warning/15 text-warning border-warning/30",
    disetujui: "bg-success/15 text-success border-success/30",
    ditolak: "bg-destructive/15 text-destructive border-destructive/30",
  } as const;
  const label = { menunggu: "Menunggu", disetujui: "Disetujui", ditolak: "Ditolak" }[status];
  return (
    <Badge variant="outline" className={`gap-1.5 ${map[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}
