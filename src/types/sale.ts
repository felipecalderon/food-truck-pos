import { CartItem } from "./cart";

export type PaymentMethod = "Efectivo" | "Debito" | "Credito";

export interface Sale {
  id: string; // ID único de la venta
  posName: string; // Nombre del POS que generó la venta
  items: CartItem[];
  total: number;
  date: string;
  paymentMethod: "Efectivo" | "Debito" | "Credito";
  amountPaid: number;
  change: number;
  comment?: string; // Comentario opcional de la venta
}
