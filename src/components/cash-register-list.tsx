"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CashRegisterSession } from "@/types/cash-register";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { deleteCashRegister } from "@/actions/cash-register";

interface CashRegisterListProps {
  sessions: CashRegisterSession[];
}

export function CashRegisterList({ sessions }: CashRegisterListProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = (
    e: React.MouseEvent,
    sessionId: string,
    posName: string
  ) => {
    e.stopPropagation(); // Evita que el evento de clic se propague a la fila
    if (
      window.confirm(
        "¿Estás seguro de que quieres eliminar esta sesión de caja? Esta acción no se puede deshacer."
      )
    ) {
      startTransition(async () => {
        const result = await deleteCashRegister(sessionId);
        if (result.success) {
          router.refresh();
        } else {
          alert(result.message);
        }
      });
    }
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
                  onClick={(e) => handleDelete(e, session.id, session.posName)}
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
