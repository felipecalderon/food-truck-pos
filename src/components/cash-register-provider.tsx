"use client";

import { useEffect, useCallback } from "react";
import { useCashRegisterStore } from "@/stores/cash-register";
import { useCartStore } from "@/stores/cart";
import { getCurrentSession } from "@/actions/cash-register";

export function CashRegisterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setSession } = useCashRegisterStore();
  const { setCashRegisterOpen } = useCartStore();

  const fetchAndSetSession = useCallback(async () => {
    const posName = localStorage.getItem("pos_name");
    if (posName) {
      const session = await getCurrentSession(posName);
      setSession(session);
      setCashRegisterOpen(session?.status === "OPEN");
    } else {
      setSession(null);
      setCashRegisterOpen(false);
    }
  }, [setSession, setCashRegisterOpen]);

  useEffect(() => {
    fetchAndSetSession();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "pos_name") {
        fetchAndSetSession();
      }
    };

    const handleSaleCompleted = () => {
      fetchAndSetSession();
    };

    // Listen for storage changes to react when pos_name is set/changed
    window.addEventListener("storage", handleStorageChange);
    // Listen for custom event dispatched after a sale is completed
    window.addEventListener("sale-completed", handleSaleCompleted);
    // Listen for a generic refresh event
    window.addEventListener("refresh-session", fetchAndSetSession);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("sale-completed", handleSaleCompleted);
      window.removeEventListener("refresh-session", fetchAndSetSession);
    };
  }, [fetchAndSetSession]);

  return <>{children}</>;
}
