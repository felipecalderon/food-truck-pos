"use client";

import { Button } from "@/components/ui/button";

interface CartActionsProps {
  isSaving: boolean;
  isSaleDisabled: boolean;
  handleSaveSale: () => void;
}

export function CartActions({ isSaving, isSaleDisabled, handleSaveSale }: CartActionsProps) {
  return (
    <Button
      className="w-full transition-all hover:scale-105 hover:bg-primary/90"
      size="lg"
      disabled={isSaleDisabled}
      onClick={handleSaveSale}
    >
      {isSaving ? "Guardando..." : "Finalizar Venta"}
    </Button>
  );
}
