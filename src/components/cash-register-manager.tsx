"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  closeCashRegister,
  createCashMovement,
  getCurrentSession,
  openCashRegister,
} from "@/actions/cash-register";
import { formatCurrency } from "@/lib/utils";
import type { CashRegisterSession } from "@/types/cash-register";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function CashRegisterManager() {
  const [session, setSession] = useState<CashRegisterSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [posName, setPosName] = useState<string | null>(null);

  // Estados para los diálogos
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [movementType, setMovementType] = useState<"WITHDRAWAL" | "DEPOSIT">(
    "WITHDRAWAL",
  );
  const [movementAmount, setMovementAmount] = useState("");
  const [movementReason, setMovementReason] = useState<
    "Retiro para comprar" | "Ingreso manual"
  >("Retiro para comprar");
  const [receiptAmount, setReceiptAmount] = useState("");

  useEffect(() => {
    const storedPosName = localStorage.getItem("pos_name");
    if (storedPosName) {
      setPosName(storedPosName);
    } else {
      // Manejar el caso donde no hay posName, quizás deshabilitar botones o mostrar un mensaje
      setIsLoading(false);
      return;
    }

    const fetchSession = async () => {
      setIsLoading(true);
      const currentSession = await getCurrentSession(storedPosName);
      setSession(currentSession);
      setIsLoading(false);
    };
    fetchSession();
  }, []);

  const handleOpenRegister = async () => {
    if (!posName) return;
    const balance = parseFloat(openingBalance);
    if (isNaN(balance)) return;
    const result = await openCashRegister(balance, posName);
    if (result) {
      window.dispatchEvent(new Event("refresh-session"));
      setIsOpening(false);
    }
  };

  const handlePrepareCloseRegister = async () => {
    if (!posName) return;
    setIsLoading(true);
    const currentSession = await getCurrentSession(posName);
    setSession(currentSession);
    setIsLoading(false);
    setIsClosing(true);
  };

  const handleCloseRegister = async () => {
    if (!posName || !session) return;
    const balance = parseFloat(closingBalance);
    if (isNaN(balance)) return;
    await closeCashRegister(balance, posName);
    window.dispatchEvent(new Event("refresh-session"));
    setIsClosing(false);
  };

  const handleMovementTypeChange = (type: "WITHDRAWAL" | "DEPOSIT") => {
    setMovementType(type);
    setMovementAmount("");
    setReceiptAmount("");
    setMovementReason(
      type === "WITHDRAWAL" ? "Retiro para comprar" : "Ingreso manual",
    );
  };

  const handleCreateMovement = async () => {
    if (!posName) return;

    const amount = parseFloat(movementAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Ingresa un monto válido para el movimiento.");
      return;
    }

    const payload: {
      posName: string;
      type: "WITHDRAWAL" | "DEPOSIT";
      amount: number;
      reason: "Retiro para comprar" | "Ingreso manual";
      receiptAmount?: number;
    } = {
      posName,
      type: movementType,
      amount,
      reason: movementReason,
    };

    if (movementType === "WITHDRAWAL") {
      const receipt = parseFloat(receiptAmount);
      if (Number.isNaN(receipt) || receipt < 0) {
        toast.error("Ingresa un monto de boleta válido.");
        return;
      }
      payload.receiptAmount = receipt;
    }

    const result = await createCashMovement(payload);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setIsMovementDialogOpen(false);
    setMovementAmount("");
    setReceiptAmount("");
    setMovementType("WITHDRAWAL");
    setMovementReason("Retiro para comprar");
    window.dispatchEvent(new Event("refresh-session"));
  };

  if (isLoading) {
    return (
      <Button size="sm" disabled>
        Cargando estado de caja...
      </Button>
    );
  }

  if (session && session.status === "OPEN") {
    const expectedInDrawer =
      session.openingBalance +
      session.calculatedSales +
      session.netCashMovements;
    const parsedMovementAmount = parseFloat(movementAmount);
    const parsedReceiptAmount = parseFloat(receiptAmount);
    const hasValidMovementAmount =
      !Number.isNaN(parsedMovementAmount) && parsedMovementAmount >= 0;
    const hasValidReceiptAmount =
      !Number.isNaN(parsedReceiptAmount) && parsedReceiptAmount >= 0;
    const calculatedReintegration =
      movementType === "WITHDRAWAL" &&
      hasValidMovementAmount &&
      hasValidReceiptAmount
        ? Math.max(parsedMovementAmount - parsedReceiptAmount, 0)
        : 0;
    const movementNetImpact =
      movementType === "WITHDRAWAL"
        ? hasValidReceiptAmount
          ? -parsedReceiptAmount
          : 0
        : hasValidMovementAmount
          ? parsedMovementAmount
          : 0;

    return (
      <div className="inline-flex items-center gap-2">
        <Dialog
          open={isMovementDialogOpen}
          onOpenChange={setIsMovementDialogOpen}
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsMovementDialogOpen(true)}
          >
            Movimiento de Caja
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Movimiento de Caja</DialogTitle>
              <DialogDescription>
                Registra retiros o ingresos de efectivo para mantener el balance
                actualizado.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="movement-type">Tipo de movimiento</Label>
                <select
                  id="movement-type"
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                  value={movementType}
                  onChange={(e) =>
                    handleMovementTypeChange(
                      e.target.value as "WITHDRAWAL" | "DEPOSIT",
                    )
                  }
                >
                  <option value="WITHDRAWAL">Retiro de efectivo</option>
                  <option value="DEPOSIT">Agregar efectivo</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="movement-amount">Monto del movimiento</Label>
                <Input
                  id="movement-amount"
                  type="number"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="movement-reason">Motivo</Label>
                {movementType === "WITHDRAWAL" ? (
                  <select
                    id="movement-reason"
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                    value={movementReason}
                    onChange={(e) =>
                      setMovementReason(e.target.value as "Retiro para comprar")
                    }
                  >
                    <option value="Retiro para comprar">
                      Retiro para comprar
                    </option>
                  </select>
                ) : (
                  <select
                    id="movement-reason"
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                    value={movementReason}
                    onChange={(e) =>
                      setMovementReason(e.target.value as "Ingreso manual")
                    }
                  >
                    <option value="Ingreso manual">Ingreso manual</option>
                  </select>
                )}
              </div>

              {movementType === "WITHDRAWAL" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="receipt-amount">
                      Monto boleta de compra
                    </Label>
                    <Input
                      id="receipt-amount"
                      type="number"
                      value={receiptAmount}
                      onChange={(e) => setReceiptAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Reintegro a caja</span>
                      <span className="font-semibold">
                        {formatCurrency(calculatedReintegration)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Impacto neto en caja</span>
                      <span className="font-semibold">
                        {formatCurrency(movementNetImpact)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleCreateMovement}>Guardar movimiento</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isClosing} onOpenChange={setIsClosing}>
          <Button
            size="sm"
            variant="destructive"
            onClick={handlePrepareCloseRegister}
            disabled={isLoading}
          >
            {isLoading ? "Cargando..." : "Cerrar Caja"}
          </Button>
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
              <div className="flex justify-between">
                <Label>Movimientos de Caja (Neto)</Label>
                <span>{formatCurrency(session.netCashMovements)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <Label>Dinero Esperado en Caja</Label>
                <span>{formatCurrency(expectedInDrawer)}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4 pt-4">
                <Label
                  htmlFor="closing-balance"
                  className="text-right col-span-2"
                >
                  Monto Final Contado
                </Label>
                <Input
                  id="closing-balance"
                  type="number"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                  className="col-span-2"
                  placeholder="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCloseRegister}>
                Confirmar y Cerrar Caja
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Dialog open={isOpening} onOpenChange={setIsOpening}>
      <DialogTrigger asChild>
        <Button size="sm">Abrir Caja</Button>
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
