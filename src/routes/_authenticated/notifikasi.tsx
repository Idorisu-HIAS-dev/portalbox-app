import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAppSettings, formatDateTime } from "@/hooks/use-app-settings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/notifikasi")({
  ssr: false,
  head: () => ({ meta: [{ title: "Notifikasi — Inventaris" }] }),
  component: NotifPage,
});

const MOCK_NOTIFICATIONS = [
  { id: "1", title: "Stok Menipis", message: "Pembersih Lantai (galon) tersisa 3 unit, di bawah batas minimum.", type: "warning", read: false, created_at: "2026-06-18T08:30:00" },
  { id: "2", title: "Permintaan Baru", message: "Admin Utama mengajukan permintaan 10 pcs ATK umum.", type: "info", read: false, created_at: "2026-06-17T14:20:00" },
  { id: "3", title: "Barang Masuk", message: "3 unit Headset Jabra Evolve2 telah dicatat masuk dari PT Maju Jaya.", type: "success", read: true, created_at: "2026-06-15T10:00:00" },
  { id: "4", title: "Persetujuan Ditolak", message: "Permintaan Headset Jabra Evolve2 telah ditolak oleh admin.", type: "error", read: true, created_at: "2026-06-13T09:15:00" },
  { id: "5", title: "Barang Keluar", message: "8 set Spidol Whiteboard dicatat keluar ke Ruang Meeting.", type: "info", read: true, created_at: "2026-05-15T16:00:00" },
];

function NotifPage() {
  const qc = useQueryClient();
  const { settings } = useAppSettings();
  const { data: notifs = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => MOCK_NOTIFICATIONS as any[],
  });

  async function markAllRead() {
    const ids = notifs.filter((n: any) => !n.read).map((n: any) => n.id);
    if (!ids.length) return;
    const { error } = await supabase.from("notifications").update({ read: true }).in("id", ids);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function remove(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{notifs.filter((n: any) => !n.read).length} belum dibaca</p>
        <Button variant="outline" size="sm" onClick={markAllRead}><Check className="h-4 w-4 mr-1" />Tandai semua dibaca</Button>
      </div>
      <div className="space-y-2">
        {(notifs as any[]).map((n) => (
          <Card key={n.id} className={`p-4 flex items-start gap-3 ${n.read ? "" : "border-l-4 border-l-primary"}`}>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{n.title}</p>
                <Badge variant="outline" className="text-[10px]">{n.type}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatDateTime(n.created_at, settings.dateFormat, settings.timezone)}</p>
            </div>
            <div className="flex gap-1">
              {!n.read && <Button size="icon" variant="ghost" onClick={() => markRead(n.id)}><Check className="h-4 w-4" /></Button>}
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(n.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </Card>
        ))}
        {notifs.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground">Tidak ada notifikasi.</Card>
        )}
      </div>
    </div>
  );
}
