import { CartItem } from "./cart";

export type PaymentMethod = "Efectivo" | "Debito" | "Credito" | "Transferencia";

export interface Sale {
  id: string; // ID único de la venta
  sessionId: string; // ID de la sesión de caja a la que pertenece la venta
  posName: string; // Nombre del POS que generó la venta
  items: CartItem[];
  total: number;
  date: string;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  comment?: string; // Comentario opcional de la venta
}
