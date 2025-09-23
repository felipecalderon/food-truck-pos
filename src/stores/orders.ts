import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order, OrderStatus } from "@/types/order";
import type { CartItem } from "@/types/cart";

interface OrderState {
  orders: Order[];
  addOrder: (items: CartItem[], total: number, name?: string) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  cancelOrder: (orderId: string) => void;
  clearOrders: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (items, total, name) => {
        const newOrder: Order = {
          id: new Date().toISOString(),
          name: name || `Pedido #${get().orders.length + 1}`,
          items,
          total,
          status: "PENDIENTE",
          createdAt: Date.now(),
        };
        set((state) => ({ orders: [...state.orders, newOrder] }));
        return newOrder;
      },
      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, status } : order
          ),
        }));
      },
      cancelOrder: (orderId: string) => {
        get().updateOrderStatus(orderId, "CANCELADO");
      },
      clearOrders: () => set({ orders: [] }),
    }),
    {
      name: "pos-orders-storage",
    }
  )
);
