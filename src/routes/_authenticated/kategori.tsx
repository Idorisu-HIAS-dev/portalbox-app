import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAppSettings, writeAuditLog } from "@/hooks/use-app-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/data-table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/kategori")({
  head: () => ({ meta: [{ title: "Kategori — Inventaris" }] }),
  component: CategoriesPage,
});

type Cat = { id: string; name: string; description: string | null };

function CategoriesPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const { data: cats = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data as Cat[],
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Nama wajib");
    const payload = { name: form.name.trim(), description: form.description.trim() || null };
    const op = editing
      ? supabase.from("categories").update(payload).eq("id", editing.id)
      : supabase.from("categories").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success(editing ? "Kategori diperbarui" : "Kategori ditambahkan");
    setOpen(false); setEditing(null); setForm({ name: "", description: "" });
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Kategori dihapus"); qc.invalidateQueries({ queryKey: ["categories"] }); setDelId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <DataTable<Cat>
        data={cats}
        searchKeys={["name"]}
        toolbar={isAdmin && (
          <Button onClick={() => { setEditing(null); setForm({ name: "", description: "" }); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />Tambah Kategori
          </Button>
        )}
        columns={[
          { key: "name", header: "Nama", sortable: true, cell: (r) => <span className="font-medium">{r.name}</span> },
          { key: "description", header: "Deskripsi", cell: (r) => r.description ?? "—" },
          ...(isAdmin ? [{
            key: "actions", header: "", className: "text-right w-28",
            cell: (r: Cat) => (
              <div className="flex justify-end gap-1">
                <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setForm({ name: r.name, description: r.description ?? "" }); setOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDelId(r.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          }] : []),
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5"><Label>Nama</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label>Deskripsi</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
            <AlertDialogTitle>Hapus kategori?</AlertDialogTitle>
            <AlertDialogDescription>Barang yang menggunakan kategori ini akan menjadi tanpa kategori.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => delId && delMut.mutate(delId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
