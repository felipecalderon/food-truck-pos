"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  openCashRegister,
  getCurrentSession,
  closeCashRegister,
} from "@/actions/cash-register";
import { CashRegisterSession } from "@/types/cash-register";
import { formatCurrency } from "@/lib/utils";

export function CashRegisterManager() {
  const [session, setSession] = useState<CashRegisterSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para los diálogos
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");
  const [closingBalance, setClosingBalance] = useState("");

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true);
      const currentSession = await getCurrentSession();
      setSession(currentSession);
      setIsLoading(false);
    };
    fetchSession();
  }, []);

  const handleOpenRegister = async () => {
    const balance = parseFloat(openingBalance);
    if (isNaN(balance)) return;
    await openCashRegister(balance);
    window.location.reload();
  };

  const handleCloseRegister = async () => {
    const balance = parseFloat(closingBalance);
    if (isNaN(balance) || !session) return;
    await closeCashRegister(balance);
    window.location.reload();
  };

  if (isLoading) {
    return <Button disabled>Cargando estado de caja...</Button>;
  }

  if (session && session.status === "OPEN") {
    const expectedInDrawer = session.openingBalance + session.calculatedSales;
    return (
      <Dialog open={isClosing} onOpenChange={setIsClosing}>
        <DialogTrigger asChild>
          <Button variant="destructive">Cerrar Caja</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resumen y Cierre de Caja</DialogTitle>
            <DialogDescription>
              Verifica los montos y cuenta el dinero físico antes de cerrar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex justify-between">
              <Label>Saldo Inicial</Label>
              <span>{formatCurrency(session.openingBalance)}</span>
            </div>
            <div className="flex justify-between">
              <Label>Ventas del Sistema</Label>
              <span>{formatCurrency(session.calculatedSales)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <Label>Dinero Esperado en Caja</Label>
              <span>{formatCurrency(expectedInDrawer)}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4 pt-4">
              <Label htmlFor="closing-balance" className="text-right col-span-2">
                Monto Final Contado
              </Label>
              <Input
                id="closing-balance"
                type="number"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                className="col-span-2"
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseRegister}>Confirmar y Cerrar Caja</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpening} onOpenChange={setIsOpening}>
      <DialogTrigger asChild>
        <Button>Abrir Caja</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir Caja</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="opening-balance" className="text-right">
              Saldo Inicial
            </Label>
            <Input
              id="opening-balance"
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="col-span-3"
              placeholder="0.00"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleOpenRegister}>Confirmar Apertura</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
