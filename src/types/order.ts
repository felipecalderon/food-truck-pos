import type { CartItem } from "./cart";

export type OrderStatus = "PENDIENTE" | "PAGADO" | "CANCELADO";

export interface Order {
  id: string;
  name: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: number;
}
