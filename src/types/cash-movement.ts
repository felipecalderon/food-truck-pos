export type CashMovementType = "WITHDRAWAL" | "DEPOSIT";

export type CashMovementReason = "Retiro para comprar" | "Ingreso manual";

export interface CashMovement {
  id: string;
  sessionId: string;
  posName: string;
  type: CashMovementType;
  reason: CashMovementReason;
  amount: number;
  receiptAmount?: number;
  reintegratedAmount?: number;
  netImpact: number;
  createdAt: string;
}

export interface SessionCashMovementTotals {
  withdrawals: number;
  deposits: number;
  reintegrations: number;
  receipts: number;
  netImpact: number;
}
