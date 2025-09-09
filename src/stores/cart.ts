import { create } from "zustand";
import type { CartItem } from "@/types/cart";
import type { Sale } from "@/types/sale";
import { saveSale as saveSaleAction } from "@/actions/sales";
import { Product } from "@/types/product";

type PaymentMethod = "Efectivo" | "Debito" | "Credito";

interface CartState {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  amountPaid: number;
  isSaving: boolean;
  addToCart: (product: Product) => void;
  updateQuantity: (sku: number, quantity: number) => void;
  clearCart: () => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setAmountPaid: (amount: number) => void;
  saveSale: () => Promise<void>;
  getCartTotal: () => number;
  getChange: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  paymentMethod: "Efectivo",
  amountPaid: 0,
  isSaving: false,

  addToCart: (product) => {
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

  clearCart: () => set({ items: [], amountPaid: 0 }),

  setPaymentMethod: (method) => {
    set({ paymentMethod: method });
    if (method !== "Efectivo") {
      set({ amountPaid: get().getCartTotal() });
    }
  },

  setAmountPaid: (amount) => set({ amountPaid: amount }),

  saveSale: async () => {
    set({ isSaving: true });
    const {
      items,
      paymentMethod,
      amountPaid,
      getCartTotal,
      getChange,
      clearCart,
    } = get();
    const total = getCartTotal();
    const change = getChange();

    try {
      await saveSaleAction(items, total, paymentMethod, amountPaid, change);

      // Save to localStorage
      const sale: Omit<Sale, "date"> = {
        items,
        total,
        paymentMethod,
        amountPaid,
        change,
      };
      const sales = JSON.parse(localStorage.getItem("sales") || "[]");
      sales.push({ ...sale, date: new Date().toISOString() });
      localStorage.setItem("sales", JSON.stringify(sales));

      clearCart();
      alert("Venta guardada con éxito");
    } catch (error) {
      console.error("Error saving sale:", error);
      alert("Hubo un error al guardar la venta.");
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
