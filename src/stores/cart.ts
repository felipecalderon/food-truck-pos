import { create } from "zustand";
import type { CartItem } from "@/types/cart";
import type { Product } from "@/types/product";
import type { Order } from "@/types/order";
import { createSaleInRedis } from "@/actions/sales";
import { useOrderStore } from "./orders";

type PaymentMethod = "Efectivo" | "Debito" | "Credito";

interface CartState {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  amountPaid: number;
  comment: string;
  isSaving: boolean;
  isCashRegisterOpen: boolean;
  loadedOrderId: string | null;
  setCashRegisterOpen: (isOpen: boolean) => void;
  addToCart: (product: Product) => void;
  updateQuantity: (sku: number, quantity: number) => void;
  clearCart: () => void;
  loadOrder: (order: Order) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setAmountPaid: (amount: number) => void;
  setComment: (comment: string) => void;
  saveSale: (
    posName: string
  ) => Promise<{ success: boolean; message: string }>;
  getCartTotal: () => number;
  getChange: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  paymentMethod: "Efectivo",
  amountPaid: 0,
  comment: "",
  isSaving: false,
  isCashRegisterOpen: false,
  loadedOrderId: null,

  setCashRegisterOpen: (isOpen) => set({ isCashRegisterOpen: isOpen }),

  addToCart: (product) => {
    if (!get().isCashRegisterOpen) {
      alert("La caja está cerrada. No se pueden añadir productos.");
      return;
    }
    set((state) => {
      const existingItem = state.items.find((item) => item.sku === product.sku);
      if (existingItem) {
        const updatedItems = state.items.map((item) =>
          item.sku === product.sku
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return { items: updatedItems };
      }
      return { items: [...state.items, { ...product, quantity: 1 }] };
    });
  },

  updateQuantity: (sku, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        const updatedItems = state.items.filter((item) => item.sku !== sku);
        return { items: updatedItems };
      }
      const updatedItems = state.items.map((item) =>
        item.sku === sku ? { ...item, quantity } : item
      );
      return { items: updatedItems };
    });
  },

  clearCart: () =>
    set({ items: [], amountPaid: 0, comment: "", loadedOrderId: null }),

  loadOrder: (order) => {
    if (get().items.length > 0) {
      if (
        !confirm(
          "El carrito actual no está vacío. ¿Desea reemplazarlo con el pedido seleccionado?"
        )
      ) {
        return;
      }
    }
    set({
      items: order.items,
      loadedOrderId: order.id,
      paymentMethod: "Efectivo",
      amountPaid: 0,
      comment: "",
    });
  },

  setPaymentMethod: (method) => {
    set({ paymentMethod: method });
    if (method !== "Efectivo") {
      set({ amountPaid: get().getCartTotal() });
    }
  },

  setAmountPaid: (amount) => set({ amountPaid: amount }),
  setComment: (comment) => set({ comment }),

  saveSale: async (posName: string) => {
    set({ isSaving: true });
    const {
      items,
      paymentMethod,
      amountPaid,
      comment,
      getCartTotal,
      getChange,
      clearCart,
      loadedOrderId,
    } = get();
    const total = getCartTotal();
    const change = getChange();

    try {
      const result = await createSaleInRedis(
        items,
        total,
        paymentMethod,
        amountPaid,
        change,
        posName,
        comment
      );

      if (result.success) {
        if (loadedOrderId) {
          useOrderStore.getState().updateOrderStatus(loadedOrderId, "PAGADO");
        }
        clearCart();
      }
      return result;
    } catch (error) {
      console.error("Error saving sale:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Error desconocido",
      };
    } finally {
      set({ isSaving: false });
    }
  },

  getCartTotal: () => {
    return get().items.reduce(
      (total, item) => total + item.precio * item.quantity,
      0
    );
  },

  getChange: () => {
    const { paymentMethod, amountPaid, getCartTotal } = get();
    const total = getCartTotal();
    if (paymentMethod === "Efectivo") {
      return amountPaid > total ? amountPaid - total : 0;
    }
    return 0;
  },
}));
