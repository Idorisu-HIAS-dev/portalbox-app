import { createFileRoute, Navigate } from "@tanstack/react-router";

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
  return <Navigate to="/dashboard" replace />;
}
