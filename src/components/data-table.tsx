import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
};

export function DataTable<T extends Record<string, any>>({
  data, columns, searchKeys, pageSize = 10, toolbar, emptyMessage = "Tidak ada data.",
}: {
  data: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T | string)[];
  pageSize?: number;
  toolbar?: React.ReactNode;
  emptyMessage?: string;
}) {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const filtered = React.useMemo(() => {
    let rows = data;
    if (search.trim() && searchKeys?.length) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => searchKeys.some((k) => String((r as any)[k] ?? "").toLowerCase().includes(q)));
    }
    if (sort) {
      rows = [...rows].sort((a, b) => {
        const av = (a as any)[sort.key];
        const bv = (b as any)[sort.key];
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === "number" && typeof bv === "number") return sort.dir === "asc" ? av - bv : bv - av;
        return sort.dir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return rows;
  }, [data, search, sort, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  React.useEffect(() => { setPage(1); }, [search]);

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-border/60">
        {searchKeys && searchKeys.length > 0 && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full bg-muted/50 border-transparent focus-visible:bg-card"
            />
          </div>
        )}
        {toolbar}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
              {columns.map((c) => (
                <TableHead
                  key={String(c.key)}
                  className={cn("text-[11px] uppercase tracking-wider font-semibold text-muted-foreground py-3", c.className)}
                  onClick={() => {
                    if (!c.sortable) return;
                    const key = String(c.key);
                    setSort((s) => s?.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" });
                  }}
                  style={{ cursor: c.sortable ? "pointer" : undefined, userSelect: c.sortable ? "none" : undefined }}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {sort?.key === String(c.key) && <span className="text-xs">{sort.dir === "asc" ? "▲" : "▼"}</span>}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">{emptyMessage}</TableCell>
              </TableRow>
            ) : (
              pageRows.map((row, i) => (
                <TableRow key={(row as any).id ?? i} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                  {columns.map((c) => (
                    <TableCell key={String(c.key)} className={cn("py-3.5 text-sm", c.className)}>
                      {c.cell ? c.cell(row) : String((row as any)[c.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 border-t border-border/60 text-sm">
        <p className="text-muted-foreground">
          Menampilkan {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} dari {filtered.length}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={safePage === 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</Button>
          <span className="px-2">Hal. {safePage} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={safePage === totalPages} onClick={() => setPage((p) => p + 1)}>Selanjutnya</Button>
        </div>
      </div>
    </Card>
  );
}

/** Avatar with initials used by table cells */
export function NameCell({ name, subtitle }: { name: string; subtitle?: string | null }) {
  const initials = (name || "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="font-medium truncate">{name}</p>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
    </div>
  );
}
