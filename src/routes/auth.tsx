import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Masuk — Inventaris" }] }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-soft via-background to-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Boxes className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Inventaris Barang</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola stok, transaksi & persetujuan dalam satu tempat.</p>
        </div>
        <Card className="p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Aplikasi ini dapat diakses langsung tanpa login.
          </p>
          <Button asChild className="w-full">
            <Link to="/dashboard">Masuk ke Dashboard</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
