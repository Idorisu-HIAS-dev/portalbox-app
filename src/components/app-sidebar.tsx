import { Link, useRouterState } from "@tanstack/react-router";
import {
  Boxes, LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine,
  ClipboardList, ShieldCheck, FileBarChart2, Bell, Users, Settings,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppSettings } from "@/hooks/use-app-settings";

export type SidebarItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean };

export const sidebarGroups: { label: string; items: SidebarItem[] }[] = [
  { label: "Utama", items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Data Barang",
    items: [
      { to: "/data-barang", label: "Daftar Barang", icon: Package },
    ],
  },
  {
    label: "Transaksi",
    items: [
      { to: "/barang-masuk", label: "Barang Masuk", icon: ArrowDownToLine },
      { to: "/barang-keluar", label: "Barang Keluar", icon: ArrowUpFromLine },
      { to: "/permintaan", label: "Permintaan", icon: ClipboardList },
    ],
  },
  { label: "Komunikasi", items: [{ to: "/chat", label: "Chat", icon: MessageSquare }] },
  { label: "Manajemen", items: [{ to: "/persetujuan", label: "Persetujuan", icon: ShieldCheck, adminOnly: true }] },
  { label: "Lainnya", items: [
    { to: "/laporan", label: "Laporan", icon: FileBarChart2 },
    { to: "/notifikasi", label: "Notifikasi", icon: Bell },
    { to: "/pengguna", label: "Pengguna", icon: Users, adminOnly: true },
    { to: "/pengaturan", label: "Pengaturan", icon: Settings },
  ]},
];

export function AppSidebar({ role, onNavigate, settings }: { role: string | null; onNavigate?: () => void; settings?: AppSettings }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = role === "admin";
  const iconsOnly = settings?.iconsOnly ?? false;
  const collapsed = settings?.sidebarCollapsedDefault ?? false;

  return (
    <div className={cn("flex h-full flex-col transition-all", collapsed ? "w-16" : "w-full")}>
      <div className={cn("flex h-16 items-center gap-2 border-b border-sidebar-border px-5 shrink-0", collapsed && "justify-center px-0")}>
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shrink-0">
          <Boxes className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Inventaris</span>
            <span className="text-[11px] text-sidebar-foreground/60">Manajemen Barang</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sidebarGroups.map((g) => {
          const items = g.items.filter((i) => !i.adminOnly || isAdmin);
          if (!items.length) return null;
          return (
            <div key={g.label}>
              {!collapsed && <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">{g.label}</p>}
              <ul className="space-y-1">
                {items.map((i) => {
                  const active = pathname === i.to || (i.to !== "/dashboard" && pathname.startsWith(i.to));
                  const Icon = i.icon;
                  return (
                    <li key={i.to}>
                      <Link
                        to={i.to}
                        onClick={onNavigate}
                        title={collapsed ? i.label : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          collapsed && "justify-center px-2",
                          active
                            ? "bg-primary text-primary-foreground font-medium shadow-sm"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && !iconsOnly && <span className="truncate">{i.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="border-t border-sidebar-border p-4 text-[11px] text-sidebar-foreground/50 shrink-0">
          v1.0 · © {new Date().getFullYear()}
        </div>
      )}
    </div>
  );
}
