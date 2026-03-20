"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteCashRegister } from "@/actions/cash-register";
import { formatCurrency } from "@/lib/utils";
import type { CashRegisterSession } from "@/types/cash-register";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface CashRegisterListProps {
  sessions: CashRegisterSession[];
}

export function CashRegisterList({ sessions }: CashRegisterListProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const executeDelete = (sessionId: string) => {
    startTransition(async () => {
      const result = await deleteCashRegister(sessionId);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Evita que el evento de clic se propague a la fila

    toast.warning("Eliminar sesión de caja", {
      description: "Esta acción no se puede deshacer.",
      action: {
        label: "Eliminar",
        onClick: () => executeDelete(sessionId),
      },
    });
  };

  const handleRowClick = (sessionId: string) => {
    router.push(`/cajas/${encodeURIComponent(sessionId)}`);
  };

  if (sessions.length === 0) {
    return <p>No hay sesiones de caja registradas.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>POS</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Apertura</TableHead>
          <TableHead>Cierre</TableHead>
          <TableHead>Saldo Inicial</TableHead>
          <TableHead>Saldo Final</TableHead>
          <TableHead>Ventas Totales</TableHead>
          {/* <TableHead className="text-right">Acciones</TableHead> */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => {
          return (
            <TableRow
              key={session.id}
              onClick={() => handleRowClick(session.id)}
              className="cursor-pointer"
            >
              <TableCell className="font-medium">{session.posName}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    session.status === "OPEN" ? "default" : "destructive"
                  }
                >
                  {session.status === "OPEN" ? "Abierta" : "Cerrada"}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(session.openedAt).toLocaleString("es-CL")}
              </TableCell>
              <TableCell>
                {session.closedAt
                  ? new Date(session.closedAt).toLocaleString("es-CL")
                  : "N/A"}
              </TableCell>
              <TableCell>{formatCurrency(session.openingBalance)}</TableCell>
              <TableCell>
                {session.closingBalance
                  ? formatCurrency(session.closingBalance)
                  : "N/A"}
              </TableCell>
              <TableCell>{formatCurrency(session.calculatedSales)}</TableCell>
              {/* <TableCell className="text-right">
                <Button
                  variant="destructive"
                  size="sm"
                    onClick={(e) => handleDelete(e, session.id)}
                  disabled={isPending}
                >
                  {isPending ? "Eliminando..." : "Eliminar"}
                </Button>
              </TableCell> */}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
