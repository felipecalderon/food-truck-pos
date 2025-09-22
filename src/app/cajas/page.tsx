import React from "react";
import { getAllCashRegisterSessions } from "@/actions/cash-register";
import { CashRegisterList } from "@/components/cash-register-list";
import { TotalSalesFilter } from "@/components/total-sales-filter";

export default async function CajasPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const sessions = await getAllCashRegisterSessions(params);

  return (
    <div className="container mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Cajas</h1>
      <TotalSalesFilter />
      <CashRegisterList sessions={sessions} />
    </div>
  );
}
