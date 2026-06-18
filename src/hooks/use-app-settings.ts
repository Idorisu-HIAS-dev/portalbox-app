import { useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type AppSettings = {
  // Tampilan
  theme: "light" | "dark" | "system";
  accent: "blue" | "green" | "purple" | "orange";
  sidebarCollapsedDefault: boolean;
  iconsOnly: boolean;
  openOnHover: boolean;
  dateFormat: "dd/MM/yyyy" | "dd MMM yyyy" | "yyyy-MM-dd";
  // Sistem
  timezone: "WIB" | "WITA" | "WIT";
  autoLogout: "30m" | "1h" | "2h";
  autoQR: boolean;
  printQR: boolean;
  // Notifikasi
  notif: {
    masuk: boolean; keluar: boolean; permintaan: boolean;
    persetujuan: boolean; stokMenipis: boolean; stokHabis: boolean;
  };
  // Keamanan
  forcePwdChange: boolean;
  auditLog: boolean;
  // Backup
  backupFreq: "harian" | "mingguan" | "bulanan" | "nonaktif";
  // Laporan
  reportPDF: boolean;
  reportExcel: boolean;
  showLogo: boolean;
  showSignature: boolean;
  showFooter: boolean;
  showPageNumber: boolean;
};

export const defaultSettings: AppSettings = {
  theme: "light",
  accent: "blue",
  sidebarCollapsedDefault: false,
  iconsOnly: false,
  openOnHover: false,
  dateFormat: "dd/MM/yyyy",
  timezone: "WIB",
  autoLogout: "1h",
  autoQR: true,
  printQR: false,
  notif: { masuk: true, keluar: true, permintaan: true, persetujuan: true, stokMenipis: true, stokHabis: true },
  forcePwdChange: false,
  auditLog: true,
  backupFreq: "mingguan",
  reportPDF: true,
  reportExcel: true,
  showLogo: true,
  showSignature: false,
  showFooter: true,
  showPageNumber: true,
};

const ACCENT_OKLCH: Record<AppSettings["accent"], { primary: string; ring: string; soft: string }> = {
  blue: { primary: "oklch(0.55 0.22 263)", ring: "oklch(0.55 0.22 263)", soft: "oklch(0.95 0.04 263)" },
  green: { primary: "oklch(0.62 0.18 149)", ring: "oklch(0.62 0.18 149)", soft: "oklch(0.94 0.05 149)" },
  purple: { primary: "oklch(0.55 0.22 295)", ring: "oklch(0.55 0.22 295)", soft: "oklch(0.94 0.05 295)" },
  orange: { primary: "oklch(0.68 0.19 50)", ring: "oklch(0.68 0.19 50)", soft: "oklch(0.94 0.05 50)" },
};

/** Format a date string according to user's dateFormat setting */
export function formatDate(dateStr: string, format: AppSettings["dateFormat"] = "dd/MM/yyyy"): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const MMM = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][d.getMonth()];
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  switch (format) {
    case "dd MMM yyyy": return `${dd} ${MMM} ${yyyy}`;
    case "yyyy-MM-dd": return `${yyyy}-${MM}-${dd}`;
    default: return `${dd}/${MM}/${yyyy}`;
  }
}

/** Timezone offset mapping */
const TZ_OFFSETS: Record<AppSettings["timezone"], number> = {
  WIB: 7, WITA: 8, WIT: 9,
};

/** Get current time in user's timezone */
export function getTimezoneOffset(tz: AppSettings["timezone"]): number {
  return TZ_OFFSETS[tz];
}

/** Format datetime with timezone */
export function formatDateTime(dateStr: string, format: AppSettings["dateFormat"], tz: AppSettings["timezone"]): string {
  const d = new Date(dateStr);
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const local = new Date(utc + TZ_OFFSETS[tz] * 3600000);
  const date = formatDate(local.toISOString(), format);
  const time = `${String(local.getHours()).padStart(2, "0")}:${String(local.getMinutes()).padStart(2, "0")}`;
  return `${date} ${time}`;
}

/** Write an audit log entry */
export async function writeAuditLog(
  userId: string,
  action: string,
  detail: string,
  enabled: boolean,
) {
  if (!enabled) return;
  await supabase.from("audit_log").insert({
    user_id: userId,
    action,
    detail,
  });
}

/** Check if a notification type is enabled for the user */
export function isNotifEnabled(settings: AppSettings, type: string): boolean {
  const map: Record<string, keyof AppSettings["notif"]> = {
    stock_in: "masuk",
    stock_out: "keluar",
    permintaan_baru: "permintaan",
    permintaan_disetujui: "persetujuan",
    permintaan_ditolak: "persetujuan",
    stok_menipis: "stokMenipis",
    stok_habis: "stokHabis",
    info: "persetujuan",
  };
  const key = map[type];
  return key ? settings.notif[key] : true;
}

export function useAppSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["app-settings", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AppSettings> => {
      const { data } = await supabase.from("app_settings").select("settings").eq("user_id", user!.id).maybeSingle();
      const merged = { ...defaultSettings, ...((data?.settings as Partial<AppSettings>) ?? {}) };
      return merged;
    },
  });

  useEffect(() => {
    const s = settings ?? defaultSettings;
    const root = document.documentElement;
    // Theme
    const apply = (mode: "light" | "dark") => {
      root.classList.toggle("dark", mode === "dark");
    };
    if (s.theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches ? "dark" : "light");
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      apply(s.theme);
    }
  }, [settings?.theme]);

  useEffect(() => {
    const s = settings ?? defaultSettings;
    const root = document.documentElement;
    const a = ACCENT_OKLCH[s.accent];
    root.style.setProperty("--primary", a.primary);
    root.style.setProperty("--ring", a.ring);
    root.style.setProperty("--primary-soft", a.soft);
    root.style.setProperty("--sidebar-primary", a.primary);
    root.style.setProperty("--sidebar-ring", a.ring);
    root.style.setProperty("--chart-1", a.primary);
  }, [settings?.accent]);

  async function save(next: AppSettings) {
    if (!user) return;
    await supabase.from("app_settings").upsert({ user_id: user.id, settings: next as any });
    qc.invalidateQueries({ queryKey: ["app-settings", user.id] });
  }

  return { settings: settings ?? defaultSettings, save };
}

/** Hook: auto-logout based on user settings */
export function useAutoLogout() {
  const { settings } = useAppSettings();
  const { user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!user || !settings) return;
    const mins = settings.autoLogout === "30m" ? 30 : settings.autoLogout === "1h" ? 60 : 120;
    timerRef.current = setTimeout(async () => {
      await supabase.auth.signOut();
      window.location.href = "/auth";
    }, mins * 60 * 1000);
  }, [settings.autoLogout, user]);

  useEffect(() => {
    if (!user) return;
    resetTimer();
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => document.addEventListener(e, resetTimer, { passive: true }));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => document.removeEventListener(e, resetTimer));
    };
  }, [user, resetTimer]);
}
