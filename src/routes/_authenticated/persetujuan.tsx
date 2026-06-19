import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { db, genId, now } from "@/lib/mock-db";
import { useAuth } from "@/hooks/use-auth";
import { useAppSettings, formatDate, writeAuditLog } from "@/hooks/use-app-settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/data-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "./permintaan";

export const Route = createFileRoute("/_authenticated/persetujuan")({
  ssr: false,
  head: () => ({ meta: [{ title: "Persetujuan — Inventaris" }] }),
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const { role, user } = useAuth();
  const isAdmin = role === "admin";
  const { settings } = useAppSettings();
  const qc = useQueryClient();
  const [decide, setDecide] = useState<{ req: Req; status: "disetujui" | "ditolak" } | null>(null);
  const [approvalNote, setApprovalNote] = useState("");

  const { data: reqs = [] } = useQuery({
    queryKey: ["requests-all"],
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

  async function submitDecision() {
    if (!decide) return;
    const { req, status } = decide;
    if (status === "disetujui" && req.item_id) {
      if (req.items && req.qty > req.items.stock) {
        toast.error(`Stok tidak cukup. Stok tersedia: ${req.items.stock} ${req.items.unit}`);
        return;
      }
      db.stock_out.insert({
        id: genId(),
        item_id: req.item_id, qty: req.qty, destination: req.requester?.full_name ?? "Pemohon",
        note: `Permintaan #${req.id.slice(0, 8)}`,
        trx_date: new Date().toISOString().slice(0, 10),
        created_at: now(),
      });
      const item = db.items.getAll().find((i) => i.id === req.item_id);
      if (item) db.items.update(req.item_id, { stock: Math.max(0, item.stock - req.qty) });
    }
    db.requests.update(req.id, {
      status, approval_note: approvalNote || null, approved_at: now(),
    } as any);

    if (user) {
      const itemDesc = req.items?.name ?? req.merek ?? "barang";
      await writeAuditLog(
        user.id,
        status === "disetujui" ? "persetujuan_disetujui" : "persetujuan_ditolak",
        `Permintaan ${itemDesc} x${req.qty} ${status === "disetujui" ? "disetujui" : "ditolak"}`,
        settings.auditLog,
      );
    }

    toast.success(status === "disetujui" ? "Permintaan disetujui" : "Permintaan ditolak");
    setDecide(null); setApprovalNote("");
    qc.invalidateQueries({ queryKey: ["requests-all"] });
    qc.invalidateQueries({ queryKey: ["items"] });
  }

  if (!isAdmin) {
    return <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Halaman ini hanya untuk Admin.</div>;
  }

  const filt = (s: string) => reqs.filter((r) => r.status === s);

  return (
    <Tabs defaultValue="menunggu">
      <TabsList>
        <TabsTrigger value="menunggu">Menunggu ({filt("menunggu").length})</TabsTrigger>
        <TabsTrigger value="disetujui">Disetujui ({filt("disetujui").length})</TabsTrigger>
        <TabsTrigger value="ditolak">Ditolak ({filt("ditolak").length})</TabsTrigger>
      </TabsList>
      {(["menunggu", "disetujui", "ditolak"] as const).map((s) => (
        <TabsContent key={s} value={s} className="mt-4">
          <DataTable<Req>
            data={filt(s)}
            searchKeys={["note"]}
            columns={[
              { key: "created_at", header: "Tanggal", sortable: true, cell: (r) => formatDate(r.created_at, settings.dateFormat) },
              { key: "merek", header: "Merek", cell: (r) => <span className="font-medium">{r.merek ?? "—"}</span> },
              { key: "items", header: "Barang", cell: (r) => r.items?.name ?? "—" },
              { key: "qty", header: "Jumlah", cell: (r) => `${r.qty} unit` },
              { key: "requester", header: "Pemohon", cell: (r) => r.requester?.full_name ?? "—" },
              { key: "ekspedisi", header: "Ekspedisi", cell: (r) => r.ekspedisi ?? "—" },
              { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
              ...(s === "menunggu" ? [{
                key: "actions", header: "", className: "text-right w-44",
                cell: (r: Req) => (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="outline" className="text-success border-success/40" onClick={() => { setDecide({ req: r, status: "disetujui" }); setApprovalNote(""); }}>
                      <Check className="h-4 w-4 mr-1" />Setujui
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/40" onClick={() => { setDecide({ req: r, status: "ditolak" }); setApprovalNote(""); }}>
                      <X className="h-4 w-4 mr-1" />Tolak
                    </Button>
                  </div>
                ),
              }] : []),
            ]}
          />
        </TabsContent>
      ))}

      <Dialog open={!!decide} onOpenChange={(o) => !o && setDecide(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decide?.status === "disetujui" ? "Setujui Permintaan" : "Tolak Permintaan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {decide?.req.items && (
              <p><span className="text-muted-foreground">Barang:</span> <span className="font-medium">{decide.req.items.name}</span></p>
            )}
            {decide?.req.merek && (
              <p><span className="text-muted-foreground">Merek:</span> <span className="font-medium">{decide.req.merek}</span></p>
            )}
            {decide?.req.kategori && (
              <p><span className="text-muted-foreground">Kategori:</span> {decide.req.kategori}</p>
            )}
            {decide?.req.ekspedisi && (
              <p><span className="text-muted-foreground">Ekspedisi:</span> {decide.req.ekspedisi}</p>
            )}
            <p><span className="text-muted-foreground">Jumlah:</span> {decide?.req.qty} unit {decide?.req.items && <span className="text-xs text-muted-foreground">(stok: {decide.req.items.stock} {decide.req.items.unit})</span>}</p>
            {decide?.status === "disetujui" && decide?.req.items && decide.req.qty > decide.req.items.stock && (
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-lg p-2 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Stok tidak mencukupi! Stok tersedia: {decide.req.items.stock} {decide.req.items.unit}
              </div>
            )}
            <div className="space-y-1.5 pt-2">
              <Label>Catatan (opsional)</Label>
              <Textarea value={approvalNote} onChange={(e) => setApprovalNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecide(null)}>Batal</Button>
            <Button onClick={submitDecision} className={decide?.status === "disetujui" ? "bg-success text-success-foreground hover:bg-success/90" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}>
              {decide?.status === "disetujui" ? "Setujui" : "Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
