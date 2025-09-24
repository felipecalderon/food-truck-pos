import { create } from "zustand";
import { CashRegisterSession } from "@/types/cash-register";

interface CashRegisterState {
  session: CashRegisterSession | null;
  setSession: (session: CashRegisterSession | null) => void;
}

export const useCashRegisterStore = create<CashRegisterState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
}));
