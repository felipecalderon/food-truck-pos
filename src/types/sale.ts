import type { CartItem } from "./cart";

export interface PaymentMethod {
  id: number;
  name: string;
  fma_pago_sii: number;
  kind_payment: number;
  enabled: boolean;
}

export const PAYMENT_METHODS = [
  {
    id: 29550,
    name: "Gastos del Jefe",
    fma_pago_sii: 2,
    kind_payment: 4,
    enabled: true,
  },
  {
    id: 29413,
    name: "Efectivo",
    fma_pago_sii: 2,
    kind_payment: 1,
    enabled: true,
  },
  {
    id: 29415,
    name: "Crédito",
    fma_pago_sii: 2,
    kind_payment: 3,
    enabled: true,
  },
  {
    id: 29414,
    name: "Débito",
    fma_pago_sii: 2,
    kind_payment: 3,
    enabled: true,
  },
  {
    id: 29416,
    name: "Transferencia",
    fma_pago_sii: 2,
    kind_payment: 4,
    enabled: true,
  },
] as const satisfies readonly PaymentMethod[];

export type PaymentMethodName = (typeof PAYMENT_METHODS)[number]["name"];

export interface Sale {
  id: string; // ID único de la venta
  sessionId: string; // ID de la sesión de caja a la que pertenece la venta
  posName: string; // Nombre del POS que generó la venta
  items: CartItem[];
  total: number;
  date: string;
  paymentMethod: PaymentMethodName;
  amountPaid: number;
  change: number;
  comment?: string; // Comentario opcional de la venta
  externalSyncStatus?: "PENDING" | "SYNCED" | "FAILED";
  externalSyncError?: string | null;
  externalSyncedAt?: string | null;
}
