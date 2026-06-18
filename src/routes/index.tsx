import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Inventaris Barang" },
      { name: "description", content: "Aplikasi inventaris barang modern dengan dashboard, manajemen stok, dan pelaporan." },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Memuat…</div>;
  }
  return <Navigate to={user ? "/dashboard" : "/auth"} replace />;
}
