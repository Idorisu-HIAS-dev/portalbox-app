import { createFileRoute } from "@tanstack/react-router";
import { TransactionPage } from "@/components/transaction-page";

export const Route = createFileRoute("/_authenticated/barang-keluar")({
  head: () => ({ meta: [{ title: "Barang Keluar — Inventaris" }] }),
  component: () => <TransactionPage kind="out" />,
});
