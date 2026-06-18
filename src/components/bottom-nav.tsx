import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, ClipboardList, MessageSquare, MoreHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from "@/components/app-sidebar";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/data-barang", label: "Barang", icon: Package },
  { to: "/permintaan", label: "Permintaan", icon: ClipboardList },
  { to: "/chat", label: "Chat", icon: MessageSquare },
];

export function BottomNav({ role }: { role: string | null }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar text-sidebar-foreground border-t border-sidebar-border shadow-lg">
      <ul className="grid grid-cols-5 h-16">
        {items.map((i) => {
          const active = pathname === i.to || (i.to !== "/dashboard" && pathname.startsWith(i.to));
          const Icon = i.icon;
          return (
            <li key={i.to}>
              <Link
                to={i.to}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-[10px] transition-colors",
                  active ? "text-primary" : "text-sidebar-foreground/70"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "scale-110")} />
                <span className="truncate max-w-full px-1">{i.label}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="flex w-full h-full flex-col items-center justify-center gap-0.5 text-[10px] text-sidebar-foreground/70">
                <MoreHorizontal className="h-5 w-5" />
                <span>Lainnya</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <AppSidebar role={role} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
