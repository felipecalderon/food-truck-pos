"use client";

import { useEffect } from "react";
import { useCashRegisterStore } from "@/stores/cash-register";
import { CashRegisterSession } from "@/types/cash-register";

interface CashRegisterStoreInitializerProps {
  session: CashRegisterSession | null;
}

export function CashRegisterStoreInitializer({
  session,
}: CashRegisterStoreInitializerProps) {
  const setSession = useCashRegisterStore((state) => state.setSession);

  useEffect(() => {
    setSession(session);
  }, [session, setSession]);

  return null;
}
