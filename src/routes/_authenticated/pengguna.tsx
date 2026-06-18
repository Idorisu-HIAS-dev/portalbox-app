import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAppSettings, formatDate, writeAuditLog } from "@/hooks/use-app-settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";

export const Route = createFileRoute("/_authenticated/pengguna")({
  head: () => ({ meta: [{ title: "Pengguna — Inventaris" }] }),
  component: UsersPage,
});

type Row = { id: string; full_name: string | null; avatar_url: string | null; role: "admin" | "petugas" | null; created_at: string };

function UsersPage() {
  const { role: myRole, user: me } = useAuth();
  const isAdmin = myRole === "admin";
  const { settings } = useAppSettings();
  const qc = useQueryClient();

  const { data: rows = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const map = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
      return (profiles ?? []).map((p) => ({ ...p, role: (map.get(p.id) as Row["role"]) ?? null })) as Row[];
    },
  });

  async function changeRole(userId: string, newRole: "admin" | "petugas") {
    // Replace existing roles
    const { error: dErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (dErr) return toast.error(dErr.message);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (error) return toast.error(error.message);

    // Audit log
    if (me) {
      await writeAuditLog(me.id, "role_change", `Role pengguna diubah menjadi ${newRole}`, settings.auditLog);
    }

    toast.success("Role diperbarui");
    qc.invalidateQueries({ queryKey: ["users"] });
  }

  if (!isAdmin) {
    return <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Halaman ini hanya untuk Admin.</div>;
  }

  return (
    <DataTable<Row>
      data={rows}
      searchKeys={["full_name"]}
      columns={[
        {
          key: "full_name", header: "Pengguna", cell: (r) => (
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-muted">
                {r.avatar_url ? <img src={r.avatar_url} className="h-9 w-9 rounded-full object-cover" /> : <UserIcon className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div>
                <p className="font-medium">{r.full_name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">Bergabung {formatDate(r.created_at, settings.dateFormat)}</p>
              </div>
            </div>
          ),
        },
        {
          key: "role", header: "Role",
          cell: (r) => r.role === "admin" ? (
            <Badge className="bg-primary text-primary-foreground"><ShieldCheck className="h-3 w-3 mr-1" />Admin</Badge>
          ) : <Badge variant="outline">Petugas</Badge>,
        },
        {
          key: "actions", header: "Ubah Role", className: "w-44",
          cell: (r) => r.id === me?.id ? <span className="text-xs text-muted-foreground">(Akun Anda)</span> : (
            <Select value={r.role ?? "petugas"} onValueChange={(v) => changeRole(r.id, v as any)}>
              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="petugas">Petugas</SelectItem>
              </SelectContent>
            </Select>
          ),
        },
      ]}
    />
  );
}
