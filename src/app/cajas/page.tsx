import React from "react";
import { getAllCashRegisterSessions } from "@/actions/cash-register";
import { CashRegisterList } from "@/components/cash-register-list";

export default async function CajasPage() {
  const sessions = await getAllCashRegisterSessions();

  return (
    <div className="container mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Cajas</h1>
      <CashRegisterList sessions={sessions} />
    </div>
  );
}
