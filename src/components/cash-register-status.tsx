"use client";

import { useEffect, useState, useCallback } from "react";
import { getCurrentSession } from "@/actions/cash-register";
import { Badge } from "./ui/badge";
import { CashRegisterSession } from "@/types/cash-register";

export function CashRegisterStatus() {
  const [session, setSession] = useState<CashRegisterSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [posName, setPosName] = useState<string | null>(null);

  const fetchSession = useCallback(async (name: string) => {
    setIsLoading(true);
    const currentSession = await getCurrentSession(name);
    setSession(currentSession);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const storedPosName = localStorage.getItem("pos_name");
    if (storedPosName) {
      setPosName(storedPosName);
      fetchSession(storedPosName);
    } else {
      setIsLoading(false);
    }

    const handleSaleCompleted = () => {
      if (storedPosName) {
        fetchSession(storedPosName);
      }
    };

    window.addEventListener("sale-completed", handleSaleCompleted);

    return () => {
      window.removeEventListener("sale-completed", handleSaleCompleted);
    };
  }, [fetchSession]);

  if (isLoading) {
    return <Badge variant="secondary">Cargando estado...</Badge>;
  }

  if (!posName) {
    return <Badge variant="destructive">POS no configurado</Badge>;
  }

  if (!session || session.status === "CLOSED") {
    return <Badge variant="destructive">Caja Cerrada</Badge>;
  }

  const currentBalance = session.openingBalance + session.calculatedSales;
  const formattedBalance = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(currentBalance);

  return (
    <Badge variant="secondary">
      Caja Abierta | Saldo en caja: {formattedBalance}
    </Badge>
  );
}