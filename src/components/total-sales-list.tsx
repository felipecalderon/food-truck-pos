"use client";

import type { Sale } from "@/types/sale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TotalSalesListProps {
  sales: Sale[];
}

export function TotalSalesList({ sales }: TotalSalesListProps) {
  if (sales.length === 0) {
    return (
      <div className="text-center text-gray-500 py-16">
        <p>No hay ventas registradas en Redis.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID Venta</TableHead>
          <TableHead>Nombre POS</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Productos</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((sale) => (
          <TooltipProvider key={sale.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <TableRow className="hover:bg-muted/50 cursor-pointer">
                  <TableCell className="font-mono text-xs">
                    {sale.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sale.posName}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(sale.date)}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {sale.items
                      .map((item) => `${item.nombre} (x${item.quantity})`)
                      .join(", ")}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(sale.total)}
                  </TableCell>
                </TableRow>
              </TooltipTrigger>
              {sale.comment && (
                <TooltipContent>
                  <p>{sale.comment}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ))}
      </TableBody>
    </Table>
  );
}
