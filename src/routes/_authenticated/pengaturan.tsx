import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, Download, Upload, Palette, Bell, Shield, Database, FileText, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAppSettings, type AppSettings, defaultSettings, writeAuditLog } from "@/hooks/use-app-settings";

export const Route = createFileRoute("/_authenticated/pengaturan")({
  ssr: false,
  head: () => ({ meta: [{ title: "Pengaturan — Inventaris" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, role } = useAuth();
  const { settings, save: saveSettings } = useAppSettings();
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState<AppSettings>(settings);

  useEffect(() => { setFullName(profile?.full_name ?? ""); }, [profile]);
  useEffect(() => { setLocal(settings); }, [settings]);

  async function saveProfile() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() || null }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    await writeAuditLog(user.id, "profil_diperbarui", "Profil berhasil diperbarui", local.auditLog);
    toast.success("Profil diperbarui");
  }

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setLocal((l) => ({ ...l, [key]: value }));
  }

  async function persist() {
    await saveSettings(local);
    if (user) {
      await writeAuditLog(user.id, "pengaturan_disimpan", "Pengaturan aplikasi diperbarui", local.auditLog);
    }
    toast.success("Pengaturan disimpan");
  }

  const initials = (fullName || user?.email || "U").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Profile */}
      <Card className="p-6 space-y-5">
        <div>
          <h3 className="text-lg font-semibold">Profil</h3>
          <p className="text-sm text-muted-foreground">Perbarui informasi akun Anda.</p>
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16"><AvatarFallback className="bg-primary text-primary-foreground text-lg">{initials}</AvatarFallback></Avatar>
          <div>
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nama lengkap</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
        </div>
        <Button onClick={saveProfile} disabled={busy}><Save className="h-4 w-4 mr-2" />Simpan Profil</Button>
      </Card>

      {/* Tabbed app settings */}
      <Card className="p-0 overflow-hidden">
        <Tabs defaultValue="tampilan" className="w-full">
          <div className="border-b border-border/60 overflow-x-auto">
            <TabsList className="h-12 bg-transparent rounded-none px-2 gap-1 w-max">
              <TabTrigger value="tampilan" icon={Palette}>Tampilan</TabTrigger>
              <TabTrigger value="sistem" icon={SettingsIcon}>Sistem</TabTrigger>
              <TabTrigger value="notifikasi" icon={Bell}>Notifikasi</TabTrigger>
              <TabTrigger value="keamanan" icon={Shield}>Keamanan</TabTrigger>
              <TabTrigger value="backup" icon={Database}>Backup</TabTrigger>
              <TabTrigger value="laporan" icon={FileText}>Laporan</TabTrigger>
            </TabsList>
          </div>

          {/* TAMPILAN */}
          <TabsContent value="tampilan" className="p-6 space-y-6 m-0">
            <Section title="Tema">
              <RadioGroup value={local.theme} onValueChange={(v) => update("theme", v as any)} className="grid grid-cols-3 gap-3">
                {[
                  { v: "light", label: "Light" },
                  { v: "dark", label: "Dark" },
                  { v: "system", label: "Ikuti Sistem" },
                ].map((o) => (
                  <Label key={o.v} className="flex items-center gap-2 border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/40">
                    <RadioGroupItem value={o.v} />
                    <span>{o.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </Section>

            <Section title="Warna Aksen">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  { v: "blue", label: "🔵 Biru", color: "#2563EB" },
                  { v: "green", label: "🟢 Hijau", color: "#16A34A" },
                  { v: "purple", label: "🟣 Ungu", color: "#7C3AED" },
                  { v: "orange", label: "🟠 Orange", color: "#EA580C" },
                ] as const).map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => update("accent", o.v)}
                    className={`flex items-center gap-2 border rounded-lg p-3 text-sm transition ${
                      local.accent === o.v ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <span className="h-5 w-5 rounded-full" style={{ background: o.color }} />
                    {o.label}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Sidebar">
              <ToggleRow label="Sidebar diperkecil secara default" checked={local.sidebarCollapsedDefault} onChange={(v) => update("sidebarCollapsedDefault", v)} />
              <ToggleRow label="Tampilkan ikon saja" checked={local.iconsOnly} onChange={(v) => update("iconsOnly", v)} />
              <ToggleRow label="Buka menu saat hover" checked={local.openOnHover} onChange={(v) => update("openOnHover", v)} />
            </Section>

            <Section title="Format Tanggal">
              <RadioGroup value={local.dateFormat} onValueChange={(v) => update("dateFormat", v as any)} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { v: "dd/MM/yyyy", label: "16/06/2026" },
                  { v: "dd MMM yyyy", label: "16 Jun 2026" },
                  { v: "yyyy-MM-dd", label: "2026-06-16" },
                ].map((o) => (
                  <Label key={o.v} className="flex items-center gap-2 border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/40">
                    <RadioGroupItem value={o.v} />
                    <span>{o.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </Section>
          </TabsContent>

          {/* SISTEM */}
          <TabsContent value="sistem" className="p-6 space-y-6 m-0">
            <Section title="Zona Waktu">
              <RadioGroup value={local.timezone} onValueChange={(v) => update("timezone", v as any)} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { v: "WIB", label: "WIB (GMT+7)" },
                  { v: "WITA", label: "WITA (GMT+8)" },
                  { v: "WIT", label: "WIT (GMT+9)" },
                ].map((o) => (
                  <Label key={o.v} className="flex items-center gap-2 border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/40">
                    <RadioGroupItem value={o.v} />
                    <span>{o.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </Section>

            <Section title="Logout Otomatis">
              <RadioGroup value={local.autoLogout} onValueChange={(v) => update("autoLogout", v as any)} className="grid grid-cols-3 gap-3">
                {[
                  { v: "30m", label: "30 Menit" },
                  { v: "1h", label: "1 Jam" },
                  { v: "2h", label: "2 Jam" },
                ].map((o) => (
                  <Label key={o.v} className="flex items-center gap-2 border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/40">
                    <RadioGroupItem value={o.v} />
                    <span>{o.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </Section>

            <Section title="QR Code">
              <ToggleRow label="Generate QR otomatis saat menambah barang" checked={local.autoQR} onChange={(v) => update("autoQR", v)} />
              <ToggleRow label="Cetak QR setelah simpan" checked={local.printQR} onChange={(v) => update("printQR", v)} />
            </Section>
          </TabsContent>

          {/* NOTIFIKASI */}
          <TabsContent value="notifikasi" className="p-6 space-y-3 m-0">
            <Section title="Aktivitas yang akan dinotifikasi">
              <ToggleRow label="Barang Masuk Baru" checked={local.notif.masuk} onChange={(v) => update("notif", { ...local.notif, masuk: v })} />
              <ToggleRow label="Barang Keluar Baru" checked={local.notif.keluar} onChange={(v) => update("notif", { ...local.notif, keluar: v })} />
              <ToggleRow label="Permintaan Barang Baru" checked={local.notif.permintaan} onChange={(v) => update("notif", { ...local.notif, permintaan: v })} />
              <ToggleRow label="Persetujuan Baru" checked={local.notif.persetujuan} onChange={(v) => update("notif", { ...local.notif, persetujuan: v })} />
              <ToggleRow label="Stok Menipis" checked={local.notif.stokMenipis} onChange={(v) => update("notif", { ...local.notif, stokMenipis: v })} />
              <ToggleRow label="Barang Habis" checked={local.notif.stokHabis} onChange={(v) => update("notif", { ...local.notif, stokHabis: v })} />
            </Section>
          </TabsContent>

          {/* KEAMANAN */}
          <TabsContent value="keamanan" className="p-6 space-y-3 m-0">
            <Section title="Kebijakan Akses">
              <ToggleRow label="Wajib ganti password pertama kali login" checked={local.forcePwdChange} onChange={(v) => update("forcePwdChange", v)} />
              <ToggleRow label="Catat aktivitas pengguna (audit log)" checked={local.auditLog} onChange={(v) => update("auditLog", v)} />
            </Section>
          </TabsContent>

          {/* BACKUP */}
          <TabsContent value="backup" className="p-6 space-y-6 m-0">
            <Section title="Cadangan Manual">
              <div className="flex flex-wrap gap-3">
                <Button onClick={async () => {
                  toast.info("Mengambil data backup...");
                  try {
                    const [items, categories, stockIn, stockOut, requests] = await Promise.all([
                      supabase.from("items").select("*"),
                      supabase.from("categories").select("*"),
                      supabase.from("stock_in").select("*"),
                      supabase.from("stock_out").select("*"),
                      supabase.from("requests").select("*"),
                    ]);
                    const backup = {
                      version: "1.0",
                      created_at: new Date().toISOString(),
                      data: {
                        items: items.data ?? [],
                        categories: categories.data ?? [],
                        stock_in: stockIn.data ?? [],
                        stock_out: stockOut.data ?? [],
                        requests: requests.data ?? [],
                      },
                    };
                    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `inventaris-backup-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Backup berhasil diunduh!");
                  } catch (err: any) {
                    toast.error("Gagal backup: " + err.message);
                  }
                }} variant="outline">
                  <Download className="h-4 w-4 mr-2" />Backup Sekarang
                </Button>
                <Button onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".json";
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    try {
                      const text = await file.text();
                      const backup = JSON.parse(text);
                      if (!backup.data) throw new Error("Format backup tidak valid");
                      toast.info("Memulihkan data...");
                      // Restore items
                      if (backup.data.items?.length) {
                        await supabase.from("items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
                        await supabase.from("items").insert(backup.data.items);
                      }
                      if (backup.data.categories?.length) {
                        await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
                        await supabase.from("categories").insert(backup.data.categories);
                      }
                      toast.success("Data berhasil dipulihkan!");
                    } catch (err: any) {
                      toast.error("Gagal restore: " + err.message);
                    }
                  };
                  input.click();
                }} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />Restore Backup
                </Button>
              </div>
            </Section>
            <Section title="Backup Otomatis">
              <RadioGroup value={local.backupFreq} onValueChange={(v) => update("backupFreq", v as any)} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { v: "harian", label: "Harian" },
                  { v: "mingguan", label: "Mingguan" },
                  { v: "bulanan", label: "Bulanan" },
                  { v: "nonaktif", label: "Nonaktif" },
                ].map((o) => (
                  <Label key={o.v} className="flex items-center gap-2 border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/40">
                    <RadioGroupItem value={o.v} />
                    <span>{o.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </Section>
          </TabsContent>

          {/* LAPORAN */}
          <TabsContent value="laporan" className="p-6 space-y-3 m-0">
            <Section title="Format Ekspor">
              <ToggleRow label="PDF" checked={local.reportPDF} onChange={(v) => update("reportPDF", v)} />
              <ToggleRow label="Excel" checked={local.reportExcel} onChange={(v) => update("reportExcel", v)} />
            </Section>
            <Section title="Konten Laporan">
              <ToggleRow label="Tampilkan logo perusahaan" checked={local.showLogo} onChange={(v) => update("showLogo", v)} />
              <ToggleRow label="Tampilkan tanda tangan" checked={local.showSignature} onChange={(v) => update("showSignature", v)} />
              <ToggleRow label="Tampilkan footer" checked={local.showFooter} onChange={(v) => update("showFooter", v)} />
              <ToggleRow label="Tampilkan nomor halaman" checked={local.showPageNumber} onChange={(v) => update("showPageNumber", v)} />
            </Section>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between gap-3 p-4 border-t border-border/60 bg-muted/30">
          <Button variant="ghost" onClick={() => setLocal(defaultSettings)}>Reset Default</Button>
          <Button onClick={persist}><Save className="h-4 w-4 mr-2" />Simpan Pengaturan</Button>
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <h3 className="text-lg font-semibold">Tentang aplikasi</h3>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li>• Versi: <span className="text-foreground font-medium">1.0.0</span></li>
          <li>• Backend: Lovable Cloud</li>
          <li>• Backup data otomatis dilakukan oleh penyedia infrastruktur.</li>
        </ul>
      </Card>
    </div>
  );
}

function TabTrigger({ value, icon: Icon, children }: { value: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <TabsTrigger value={value} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-3 gap-2">
      <Icon className="h-4 w-4" />
      <span className="text-sm">{children}</span>
    </TabsTrigger>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/30">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
