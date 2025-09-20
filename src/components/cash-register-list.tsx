import React from "react";
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

interface CashRegisterListProps {
  sessions: CashRegisterSession[];
}

export function CashRegisterList({ sessions }: CashRegisterListProps) {
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
          <TableHead>Saldo Inicial</TableHead>
          <TableHead>Ventas Calculadas</TableHead>
          <TableHead>Cierre</TableHead>
          <TableHead>Saldo Final</TableHead>
          <TableHead>Diferencia</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={session.id}>
            <TableCell className="font-medium">{session.posName}</TableCell>
            <TableCell>
              <Badge variant={session.status === "OPEN" ? "default" : "destructive"}>
                {session.status === "OPEN" ? "Abierta" : "Cerrada"}
              </Badge>
            </TableCell>
            <TableCell>
              {new Date(session.openedAt).toLocaleString("es-CL")}
            </TableCell>
            <TableCell>{formatCurrency(session.openingBalance)}</TableCell>
            <TableCell>{formatCurrency(session.calculatedSales)}</TableCell>
            <TableCell>
              {session.closedAt
                ? new Date(session.closedAt).toLocaleString("es-CL")
                : "N/A"}
            </TableCell>
            <TableCell>
              {session.closingBalance
                ? formatCurrency(session.closingBalance)
                : "N/A"}
            </TableCell>
            <TableCell>
              {session.difference !== undefined
                ? formatCurrency(session.difference)
                : "N/A"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
