import React from "react";
import { getAllCashRegisterSessions } from "@/actions/cash-register";
import { CashRegisterList } from "@/components/cash-register-list";
import { TotalSalesFilter } from "@/components/total-sales-filter";

function getDefaultMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default async function CajasPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const hasParams = params.range || params.from || params.to;
  const sessions = await getAllCashRegisterSessions(
    hasParams ? params : getDefaultMonthRange(),
  );

  return (
    <div className="container mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Cajas</h1>
      <TotalSalesFilter />
      <CashRegisterList sessions={sessions} />
    </div>
  );
}
