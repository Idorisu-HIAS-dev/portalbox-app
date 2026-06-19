import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";

import { useAppSettings, formatDate } from "@/hooks/use-app-settings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/data-table";

export const Route = createFileRoute("/_authenticated/laporan")({
  ssr: false,
  head: () => ({ meta: [{ title: "Laporan — Inventaris" }] }),
  component: ReportsPage,
});

type Range = "harian" | "mingguan" | "bulanan";

const MOCK_REPORT_IN = [
  { id: "1", item_id: "1", qty: 5, source: "PT Maju Jaya", note: "Pengadaan Q1 2026", trx_date: "2026-01-15", created_by: "admin", created_at: "2026-01-15", items: { name: "Laptop ASUS Vivobook 14", unit: "unit" } },
  { id: "2", item_id: "2", qty: 4, source: "PT Maju Jaya", note: "Pengadaan Q1 2026", trx_date: "2026-01-15", created_by: "admin", created_at: "2026-01-15", items: { name: "Monitor LG 24 inch", unit: "unit" } },
  { id: "3", item_id: "7", qty: 30, source: "Toko ATK Pusat", note: "Restock bulanan", trx_date: "2026-02-01", created_by: "admin", created_at: "2026-02-01", items: { name: "Pulpen Pilot G2", unit: "pcs" } },
  { id: "4", item_id: "8", qty: 10, source: "Toko ATK Pusat", note: "Restock bulanan", trx_date: "2026-02-01", created_by: "admin", created_at: "2026-02-01", items: { name: "Kertas A4 70g (rim)", unit: "rim" } },
  { id: "5", item_id: "3", qty: 8, source: "Distributor IT", note: "Keyboard wireless baru", trx_date: "2026-03-10", created_by: "admin", created_at: "2026-03-10", items: { name: "Keyboard Mechanical Logitech", unit: "pcs" } },
  { id: "6", item_id: "4", qty: 12, source: "Distributor IT", note: "Mouse gaming stok", trx_date: "2026-03-10", created_by: "admin", created_at: "2026-03-10", items: { name: "Mouse Logitech G102", unit: "pcs" } },
  { id: "7", item_id: "5", qty: 3, source: "Furniture Indo", note: "Meja kerja lipat", trx_date: "2026-04-05", created_by: "admin", created_at: "2026-04-05", items: { name: "Meja Kerja Lipat", unit: "unit" } },
  { id: "8", item_id: "6", qty: 5, source: "Furniture Indo", note: "Kursi ergonomis", trx_date: "2026-04-05", created_by: "admin", created_at: "2026-04-05", items: { name: "Kursi Ergonomis", unit: "unit" } },
  { id: "9", item_id: "9", qty: 2, source: "Toko Office", note: "Whiteboard rapat", trx_date: "2026-05-20", created_by: "admin", created_at: "2026-05-20", items: { name: "Whiteboard 120x90cm", unit: "unit" } },
  { id: "10", item_id: "11", qty: 3, source: "PT Maju Jaya", note: "Headset tim support", trx_date: "2026-06-01", created_by: "admin", created_at: "2026-06-01", items: { name: "Headset Jabra Evolve2", unit: "unit" } },
];

const MOCK_REPORT_OUT = [
  { id: "1", item_id: "1", qty: 2, destination: "Ruang Dev", note: "Tim dev", trx_date: "2026-01-20", created_by: "admin", created_at: "2026-01-20", items: { name: "Laptop ASUS Vivobook 14", unit: "unit" } },
  { id: "2", item_id: "2", qty: 2, destination: "Ruang Dev", note: "Monitor ganda", trx_date: "2026-01-20", created_by: "admin", created_at: "2026-01-20", items: { name: "Monitor LG 24 inch", unit: "unit" } },
  { id: "3", item_id: "7", qty: 15, destination: "Front Desk", note: "CS & admin", trx_date: "2026-02-10", created_by: "admin", created_at: "2026-02-10", items: { name: "Pulpen Pilot G2", unit: "pcs" } },
  { id: "4", item_id: "8", qty: 5, destination: "Ruang Rapat", note: "Meeting", trx_date: "2026-03-01", created_by: "admin", created_at: "2026-03-01", items: { name: "Kertas A4 70g (rim)", unit: "rim" } },
  { id: "5", item_id: "3", qty: 3, destination: "Ruang Kerja", note: "Tim QA", trx_date: "2026-03-15", created_by: "admin", created_at: "2026-03-15", items: { name: "Keyboard Mechanical Logitech", unit: "pcs" } },
  { id: "6", item_id: "6", qty: 3, destination: "Ruang Tamu", note: "Kursi tamu", trx_date: "2026-04-10", created_by: "admin", created_at: "2026-04-10", items: { name: "Kursi Ergonomis", unit: "unit" } },
  { id: "7", item_id: "10", qty: 8, destination: "Ruang Meeting", note: "Spidol rapat", trx_date: "2026-05-15", created_by: "admin", created_at: "2026-05-15", items: { name: "Spidol Whiteboard (set)", unit: "set" } },
  { id: "8", item_id: "11", qty: 2, destination: "Ruang Support", note: "Helpdesk", trx_date: "2026-06-05", created_by: "admin", created_at: "2026-06-05", items: { name: "Headset Jabra Evolve2", unit: "unit" } },
];

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
    queryFn: async () => MOCK_REPORT_IN as any[],
  });
  const { data: outs = [] } = useQuery({
    queryKey: ["report-out", since],
    queryFn: async () => MOCK_REPORT_OUT as any[],
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
