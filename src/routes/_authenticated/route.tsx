import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Bell, ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { useAppSettings } from "@/hooks/use-app-settings";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthLayout,
});

function AuthLayout() {
  const { settings } = useAppSettings();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sticky sidebar */}
      <aside className="hidden md:flex md:w-64 shrink-0 sticky top-0 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <AppSidebar role="admin" settings={settings} />
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav role="admin" />

      <Toaster richColors position="top-right" />
    </div>
  );
}

function TopBar() {
  const [unread, setUnread] = useState(0);
  const [unreadChat, setUnreadChat] = useState(0);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("read", false);
        if (alive) setUnread(count ?? 0);
      } catch {}
    }
    load();
    const ch = supabase.channel("notif-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, load)
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadChat() {
      try {
        const { count } = await supabase.from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("read", false);
        if (alive) setUnreadChat(count ?? 0);
      } catch {}
    }
    loadChat();
    const ch = supabase.channel("chat-badge")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, loadChat)
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, []);

  const totalUnread = unread + unreadChat;

  const title = titleFromPath(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 backdrop-blur px-4 md:px-6">
      <h1 className="text-base md:text-lg font-semibold truncate flex-1">{title}</h1>

      <Button asChild variant="ghost" size="icon" className="relative">
        <Link to="/notifikasi">
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground text-xs">AD</AvatarFallback></Avatar>
            <div className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-sm font-medium">Admin</span>
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px] uppercase">admin</Badge>
            </div>
            <ChevronDown className="hidden sm:block h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Admin</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link to="/pengaturan"><UserIcon className="mr-2 h-4 w-4" />Profil & pengaturan</Link></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

function titleFromPath(p: string) {
  if (p.startsWith("/dashboard")) return "Dashboard";
  if (p === "/data-barang" || p.startsWith("/data-barang")) return "Data Barang";
  if (p === "/kategori") return "Kategori Barang";
  if (p.startsWith("/barang-masuk")) return "Barang Masuk";
  if (p.startsWith("/barang-keluar")) return "Barang Keluar";
  if (p.startsWith("/permintaan")) return "Permintaan Barang";
  if (p.startsWith("/persetujuan")) return "Persetujuan";
  if (p.startsWith("/laporan")) return "Laporan";
  if (p.startsWith("/notifikasi")) return "Notifikasi";
  if (p.startsWith("/pengguna")) return "Pengguna";
  if (p.startsWith("/pengaturan")) return "Pengaturan";
  if (p.startsWith("/chat")) return "Chat";
  return "Inventaris";
}
