import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAppSettings, formatDate } from "@/hooks/use-app-settings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/data-table";

export const Route = createFileRoute("/_authenticated/laporan")({
  head: () => ({ meta: [{ title: "Laporan — Inventaris" }] }),
  component: ReportsPage,
});

type Range = "harian" | "mingguan" | "bulanan";

function ReportsPage() {
  const [range, setRange] = useState<Range>("harian");
  const { settings } = useAppSettings();
  const since = useMemo(() => {
    const d = new Date();
    if (range === "harian") d.setHours(0, 0, 0, 0);
    else if (range === "mingguan") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  }, [range]);

  const { data: ins = [] } = useQuery({
    queryKey: ["report-in", since],
    queryFn: async () => (await supabase.from("stock_in").select("*, items(name, unit)").gte("trx_date", since).order("trx_date", { ascending: false })).data ?? [],
  });
  const { data: outs = [] } = useQuery({
    queryKey: ["report-out", since],
    queryFn: async () => (await supabase.from("stock_out").select("*, items(name, unit)").gte("trx_date", since).order("trx_date", { ascending: false })).data ?? [],
  });

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ins.map((r: any) => ({
      Tanggal: r.trx_date, Barang: r.items?.name, Jumlah: r.qty, Satuan: r.items?.unit, Asal: r.source, Keterangan: r.note,
    }))), "Masuk");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(outs.map((r: any) => ({
      Tanggal: r.trx_date, Barang: r.items?.name, Jumlah: r.qty, Satuan: r.items?.unit, Tujuan: r.destination, Keterangan: r.note,
    }))), "Keluar");
    XLSX.writeFile(wb, `laporan-${range}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();

    let yPos = 16;

    // Header with optional logo placeholder
    if (settings.showLogo) {
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("INVENTARIS BARANG", 14, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Sistem Manajemen Inventaris", 14, yPos);
      yPos += 8;
    } else {
      doc.setFontSize(16);
      doc.text(`Laporan Inventaris (${range})`, 14, yPos);
      yPos += 8;
    }

    doc.setFontSize(10);
    doc.text(`Periode: ${range.charAt(0).toUpperCase() + range.slice(1)} | Sejak: ${since}`, 14, yPos);
    yPos += 6;
    doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`, 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [["Tanggal", "Barang", "Qty", "Asal", "Ket."]],
      body: ins.map((r: any) => [r.trx_date, r.items?.name ?? "-", `${r.qty} ${r.items?.unit ?? ""}`, r.source ?? "-", r.note ?? "-"]),
      headStyles: { fillColor: [37, 99, 235] }, theme: "striped", styles: { fontSize: 9 },
    });

    const afterInY = (doc as any).lastAutoTable?.finalY ?? yPos + 20;

    autoTable(doc, {
      startY: afterInY + 8,
      head: [["Tanggal", "Barang", "Qty", "Tujuan", "Ket."]],
      body: outs.map((r: any) => [r.trx_date, r.items?.name ?? "-", `${r.qty} ${r.items?.unit ?? ""}`, r.destination ?? "-", r.note ?? "-"]),
      headStyles: { fillColor: [245, 158, 11] }, theme: "striped", styles: { fontSize: 9 },
    });

    // Footer
    if (settings.showFooter) {
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(150);
      const footerText = settings.showSignature
        ? "Dicetak oleh sistem Inventaris Barang"
        : "Laporan ini digenerate secara otomatis";
      doc.text(footerText, 14, pageHeight - 10);
    }

    // Page number
    if (settings.showPageNumber) {
      const pageWidth = doc.internal.pageSize.width;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Halaman 1`, pageWidth - 30, doc.internal.pageSize.height - 10);
    }

    doc.save(`laporan-${range}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  const totalIn = ins.reduce((s: number, x: any) => s + x.qty, 0);
  const totalOut = outs.reduce((s: number, x: any) => s + x.qty, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="harian">Harian</TabsTrigger>
            <TabsTrigger value="mingguan">Mingguan</TabsTrigger>
            <TabsTrigger value="bulanan">Bulanan</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportExcel}><FileSpreadsheet className="h-4 w-4 mr-2" />Excel</Button>
          <Button onClick={exportPdf}><FileText className="h-4 w-4 mr-2" />PDF</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total Barang Masuk</p>
          <p className="text-3xl font-bold text-success">{totalIn.toLocaleString("id-ID")}</p>
          <p className="text-xs text-muted-foreground mt-1">{ins.length} transaksi</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total Barang Keluar</p>
          <p className="text-3xl font-bold text-warning">{totalOut.toLocaleString("id-ID")}</p>
          <p className="text-xs text-muted-foreground mt-1">{outs.length} transaksi</p>
        </Card>
      </div>

      <Tabs defaultValue="masuk">
        <TabsList>
          <TabsTrigger value="masuk">Barang Masuk</TabsTrigger>
          <TabsTrigger value="keluar">Barang Keluar</TabsTrigger>
        </TabsList>
        <TabsContent value="masuk" className="mt-4">
          <DataTable
            data={ins as any[]}
            searchKeys={["source", "note"]}
            columns={[
              { key: "trx_date", header: "Tanggal", cell: (r) => formatDate(r.trx_date, settings.dateFormat) },
              { key: "items", header: "Barang", cell: (r) => r.items?.name ?? "—" },
              { key: "qty", header: "Jumlah", cell: (r) => `${r.qty} ${r.items?.unit ?? ""}` },
              { key: "source", header: "Asal", cell: (r) => r.source ?? "—" },
              { key: "note", header: "Keterangan", cell: (r) => r.note ?? "—" },
            ]}
          />
        </TabsContent>
        <TabsContent value="keluar" className="mt-4">
          <DataTable
            data={outs as any[]}
            searchKeys={["destination", "note"]}
            columns={[
              { key: "trx_date", header: "Tanggal", cell: (r) => formatDate(r.trx_date, settings.dateFormat) },
              { key: "items", header: "Barang", cell: (r) => r.items?.name ?? "—" },
              { key: "qty", header: "Jumlah", cell: (r) => `${r.qty} ${r.items?.unit ?? ""}` },
              { key: "destination", header: "Tujuan", cell: (r) => r.destination ?? "—" },
              { key: "note", header: "Keterangan", cell: (r) => r.note ?? "—" },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
