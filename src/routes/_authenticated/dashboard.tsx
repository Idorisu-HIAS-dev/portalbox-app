import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Package, Boxes, ArrowDownToLine, ArrowUpFromLine, Users, Clock, List,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend,
} from "recharts";

import { db } from "@/lib/mock-db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard — Inventaris" }] }),
  component: Dashboard,
});

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const h = String(time.getHours()).padStart(2, "0");
  const m = String(time.getMinutes()).padStart(2, "0");
  const s = String(time.getSeconds()).padStart(2, "0");
  const date = time.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <Card className="p-5 col-span-2 sm:col-span-1 relative overflow-hidden">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 blur-2xl opacity-60" />
      <div className="relative flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
          <Clock className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Jam Sekarang</p>
          <p className="text-2xl font-bold tracking-tight tabular-nums">{h}:{m}:{s}</p>
          <p className="text-[11px] text-muted-foreground">{date}</p>
        </div>
      </div>
    </Card>
  );
}

function Dashboard() {
  const [showOverviewDetail, setShowOverviewDetail] = useState(false);
  const { data: stats } = useQuery({ queryKey: ["dashboard-stats"], queryFn: loadStats });
  const { data: chart } = useQuery({ queryKey: ["dashboard-chart"], queryFn: loadChart });
  const { data: top } = useQuery({ queryKey: ["dashboard-top"], queryFn: loadTopItems });
  const { data: weekly } = useQuery({ queryKey: ["dashboard-weekly"], queryFn: loadWeekly });
  const { data: overviewDetail } = useQuery({ queryKey: ["overview-detail"], queryFn: loadOverviewDetail });

  const summary = [
    { name: "Masuk", value: stats?.inMonth ?? 0, color: "#10b981" },
    { name: "Keluar", value: stats?.outMonth ?? 0, color: "#f59e0b" },
    { name: "Permintaan", value: stats?.totalReq ?? 0, color: "#8b5cf6" },
  ];
  const totalSummary = summary.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Top stat row */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <LiveClock />
        <StatCard label="Masuk Bulan Ini" value={stats?.inMonth ?? 0} icon={ArrowDownToLine} accent="success" />
        <StatCard label="Keluar Bulan Ini" value={stats?.outMonth ?? 0} icon={ArrowUpFromLine} accent="warning" />
        <StatCard label="Total Pengguna" value={stats?.totalUsers ?? 0} icon={Users} accent="primary" />
        <StatCard label="Total Barang" value={stats?.totalItems ?? 0} icon={Package} accent="primary" />
      </div>

      {/* Row 2: donut + line + top items */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Ringkasan Transaksi</h3>
            <Badge variant="outline" className="text-[10px]">Bulan ini</Badge>
          </div>
          <div className="h-44 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summary} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                  {summary.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} transaksi`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold">{totalSummary === 1 ? 0 : totalSummary}</span>
              <span className="text-[11px] text-muted-foreground">Transaksi</span>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {summary.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-medium tabular-nums">
                  {Math.round((s.value / totalSummary) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Overview 6 Bulan</h3>
            <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setShowOverviewDetail(true)}>
              <List className="h-3.5 w-3.5" />Lihat Rinci
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Pergerakan stok masuk vs keluar per bulan</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart ?? []}>
                <defs>
                  <linearGradient id="gradMasuk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradKeluar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis dataKey="month" fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v: number, name: string) => [`${v} unit`, name === "masuk" ? "Masuk" : "Keluar"]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey="masuk" name="masuk" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: "#10b981" }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="keluar" name="keluar" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: "#f59e0b" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Barang Teratas</h3>
            <Badge variant="outline" className="text-[10px]">30 hari</Badge>
          </div>
          <ul className="space-y-3">
            {(top ?? []).length === 0 && <p className="text-sm text-muted-foreground">Belum ada data.</p>}
            {(top ?? []).map((t, i) => (
              <li key={t.id} className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground">Keluar {t.qty} {t.unit}</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">Stok {t.stock}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Row 3: weekly bar + user stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Aktivitas Mingguan</h3>
            <Badge variant="outline" className="text-[10px]">7 hari terakhir</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly ?? []} barGap={4}>
                <defs>
                  <linearGradient id="barMasuk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="barKeluar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis dataKey="day" fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v: number, name: string) => [`${v} unit`, name === "masuk" ? "Masuk" : "Keluar"]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="masuk" name="masuk" fill="url(#barMasuk)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="keluar" name="keluar" fill="url(#barKeluar)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Stok per Kategori</h3>
            <Badge variant="outline" className="text-[10px]">Distribusi</Badge>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart ?? []}>
                <defs>
                  <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis dataKey="month" fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v: number) => [`${v} unit`, "Stok Masuk"]}
                />
                <Area type="monotone" dataKey="masuk" stroke="#10b981" strokeWidth={2} fill="url(#gradArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniCard label="Admin" value={stats?.adminCount ?? 0} icon={Users} tone="primary" />
        <MiniCard label="Petugas" value={stats?.petugasCount ?? 0} icon={Users} tone="success" />
        <MiniCard label="Permintaan Pending" value={stats?.pendingReq ?? 0} icon={Boxes} tone="warning" />
        <MiniCard label="Permintaan Disetujui" value={stats?.approvedReq ?? 0} icon={Package} tone="success" />
      </div>

      {/* Overview Detail Dialog */}
      <Dialog open={showOverviewDetail} onOpenChange={setShowOverviewDetail}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rincian Barang Masuk & Keluar (6 Bulan)</DialogTitle>
          </DialogHeader>
          {!overviewDetail || overviewDetail.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Belum ada data transaksi.</p>
          ) : (
            <div className="space-y-3">
              {overviewDetail.map((item) => (
                <Card key={item.name} className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-success">Masuk: {item.masuk}</span>
                      <span className="text-xs text-warning">Keluar: {item.keluar}</span>
                      <span className="text-xs text-muted-foreground">Sisa: {item.sisa}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent = "primary" }: {
  label: string; value: number; icon: React.ComponentType<{ className?: string }>;
  accent?: "primary" | "success" | "warning" | "danger";
}) {
  const tone: Record<string, string> = {
    primary: "from-primary/20 to-primary/5 text-primary",
    success: "from-success/20 to-success/5 text-success",
    warning: "from-warning/20 to-warning/5 text-warning",
    danger: "from-destructive/20 to-destructive/5 text-destructive",
  };
  return (
    <Card className="p-4 relative overflow-hidden">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${tone[accent]} blur-2xl opacity-60`} />
      <div className="relative flex items-start gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${tone[accent]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground truncate uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value.toLocaleString("id-ID")}</p>
        </div>
      </div>
    </Card>
  );
}

function MiniCard({ label, value, icon: Icon, tone }: {
  label: string; value: number; icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const map = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
  } as const;
  return (
    <Card className="p-4 flex items-center gap-3">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${map[tone]}`}><Icon className="h-5 w-5" /></span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value.toLocaleString("id-ID")}</p>
      </div>
    </Card>
  );
}

async function loadStats() {
  const items = db.items.getAll();
  const stockIn = db.stock_in.getAll();
  const stockOut = db.stock_out.getAll();
  const requests = db.requests.getAll();
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const inMonth = stockIn.filter((s) => s.trx_date.startsWith(thisMonth)).reduce((sum, s) => sum + s.qty, 0);
  const outMonth = stockOut.filter((s) => s.trx_date.startsWith(thisMonth)).reduce((sum, s) => sum + s.qty, 0);
  const pendingReq = requests.filter((r) => r.status === "menunggu").length;
  const approvedReq = requests.filter((r) => r.status === "disetujui").length;
  return {
    totalItems: items.length,
    totalStock: items.reduce((sum, i) => sum + i.stock, 0),
    lowStock: items.filter((i) => i.stock <= i.min_stock && i.stock > 0).length,
    outOfStock: items.filter((i) => i.stock === 0).length,
    inMonth,
    outMonth,
    pendingReq,
    approvedReq,
    totalReq: requests.length,
    totalUsers: 2,
    adminCount: 1,
    petugasCount: 1,
  };
}

async function loadChart() {
  const stockIn = db.stock_in.getAll();
  const stockOut = db.stock_out.getAll();
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const now = new Date();
  const result: { month: string; masuk: number; keluar: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const masuk = stockIn.filter((s) => s.trx_date.startsWith(key)).reduce((sum, s) => sum + s.qty, 0);
    const keluar = stockOut.filter((s) => s.trx_date.startsWith(key)).reduce((sum, s) => sum + s.qty, 0);
    result.push({ month: months[d.getMonth()], masuk, keluar });
  }
  return result;
}

async function loadTopItems() {
  const items = db.items.getAll();
  const stockOut = db.stock_out.getAll();
  const qtyMap: Record<string, number> = {};
  for (const so of stockOut) {
    qtyMap[so.item_id] = (qtyMap[so.item_id] || 0) + so.qty;
  }
  return items
    .map((item) => ({ id: item.id, name: item.name, unit: item.unit, stock: item.stock, qty: qtyMap[item.id] || 0 }))
    .filter((t) => t.qty > 0)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
}

async function loadWeekly() {
  const stockIn = db.stock_in.getAll();
  const stockOut = db.stock_out.getAll();
  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const result: { day: string; masuk: number; keluar: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayName = days[d.getDay()];
    const masuk = stockIn.filter((s) => s.trx_date === dateStr).reduce((sum, s) => sum + s.qty, 0);
    const keluar = stockOut.filter((s) => s.trx_date === dateStr).reduce((sum, s) => sum + s.qty, 0);
    result.push({ day: dayName, masuk, keluar });
  }
  return result;
}

async function loadOverviewDetail() {
  const items = db.items.getAll();
  const stockIn = db.stock_in.getAll();
  const stockOut = db.stock_out.getAll();
  return items.map((item) => {
    const masuk = stockIn.filter((s) => s.item_id === item.id).reduce((sum, s) => sum + s.qty, 0);
    const keluar = stockOut.filter((s) => s.item_id === item.id).reduce((sum, s) => sum + s.qty, 0);
    return { name: item.name, masuk, keluar, sisa: item.stock };
  });
}
