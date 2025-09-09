import { CartItem } from "./cart";

export interface Sale {
  items: CartItem[];
  total: number;
  date: string;
  paymentMethod: "Efectivo" | "Debito" | "Credito";
  amountPaid: number;
  change: number;
}
