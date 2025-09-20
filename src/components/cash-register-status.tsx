"use client";

import { useEffect, useState } from "react";
import { getCurrentSession } from "@/actions/cash-register";
import { Badge } from "./ui/badge";
import { CashRegisterSession } from "@/types/cash-register";

export function CashRegisterStatus() {
  const [session, setSession] = useState<CashRegisterSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [posName, setPosName] = useState<string | null>(null);

  useEffect(() => {
    const storedPosName = localStorage.getItem("pos_name");
    if (storedPosName) {
      setPosName(storedPosName);
    } else {
      setIsLoading(false);
      return;
    }

    const fetchSession = async () => {
      setIsLoading(true);
      const currentSession = await getCurrentSession(storedPosName);
      setSession(currentSession);
      setIsLoading(false);
    };
    fetchSession();
  }, []);

  if (isLoading) {
    return <Badge variant="secondary">Cargando estado...</Badge>;
  }

  if (!posName) {
    return <Badge variant="destructive">POS no configurado</Badge>;
  }

  if (!session || session.status === "CLOSED") {
    return <Badge variant="destructive">Caja Cerrada</Badge>;
  }

  const formattedBalance = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(session.openingBalance);

  return (
    <Badge variant="secondary">
      Caja Abierta | Saldo Inicial: {formattedBalance}
    </Badge>
  );
}
