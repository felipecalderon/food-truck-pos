"use client";

import { useCashRegisterStore } from "@/stores/cash-register";
import { Badge } from "./ui/badge";

export function CashRegisterStatus() {
  const { session } = useCashRegisterStore();

  const isOpen = session?.status === "OPEN";
  const statusText = isOpen ? "Abierta" : "Cerrada";
  const variant = isOpen ? "default" : "destructive";

  if (!session) {
    return <Badge variant="destructive">Caja cerrada</Badge>;
  }

  const currentBalance = session.openingBalance + session.calculatedSales;
  const formattedBalance = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(currentBalance);

  return (
    <Badge variant={variant}>
      {statusText} {isOpen && `| Saldo: ${formattedBalance}`}
    </Badge>
  );
}
