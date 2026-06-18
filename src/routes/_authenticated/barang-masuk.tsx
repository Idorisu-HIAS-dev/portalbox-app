import { createFileRoute } from "@tanstack/react-router";
import { TransactionPage } from "@/components/transaction-page";

export const Route = createFileRoute("/_authenticated/barang-masuk")({
  head: () => ({ meta: [{ title: "Barang Masuk — Inventaris" }] }),
  component: () => <TransactionPage kind="in" />,
});
