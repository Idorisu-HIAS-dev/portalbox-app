import { createFileRoute } from "@tanstack/react-router";
import { TransactionPage } from "@/components/transaction-page";

export const Route = createFileRoute("/_authenticated/barang-masuk")({
  ssr: false,
  head: () => ({ meta: [{ title: "Barang Masuk — Inventaris" }] }),
  component: () => <TransactionPage kind="in" />,
});
