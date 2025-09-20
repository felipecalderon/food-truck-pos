"use client";

import { formatCurrency } from "@/lib/utils";

interface CartSummaryProps {
  cartTotal: number;
  change: number;
}

export function CartSummary({ cartTotal, change }: CartSummaryProps) {
  return (
    <>
      <div className="w-full flex justify-between text-xl font-bold">
        <span>Total:</span>
        <span>{formatCurrency(cartTotal)}</span>
      </div>
      <div className="w-full flex justify-between text-lg font-semibold">
        <span>Vuelto:</span>
        <span>{formatCurrency(change)}</span>
      </div>
    </>
  );
}
