"use client";

import * as XLSX from "xlsx";
import type { Sale } from "@/types/sale";
import { Button } from "@/components/ui/button";
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

interface SalesListProps {
  sales: Sale[];
}

export function SalesList({ sales }: SalesListProps) {
  const handleExport = () => {
    const worksheetData = sales.map((sale) => ({
      Fecha: formatDate(sale.date),
      Productos: sale.items
        .map((item) => `${item.nombre} (x${item.quantity})`)
        .join(", "),
      Total: sale.total,
      "Método de Pago": sale.paymentMethod,
      "Monto Pagado": sale.amountPaid,
      Vuelto: sale.change,
      "ID Venta": sale.id,
      "Nombre POS": sale.posName,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");

    // Format columns
    worksheet["!cols"] = [
      { wch: 20 }, // Fecha
      { wch: 50 }, // Productos
      { wch: 15 }, // Total
      { wch: 15 }, // Método de Pago
      { wch: 15 }, // Monto Pagado
      { wch: 15 }, // Cambio
      { wch: 38 }, // ID Venta
      { wch: 15 }, // Nombre POS
    ];

    XLSX.writeFile(workbook, "historial_ventas.xlsx");
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={handleExport} disabled={sales.length === 0}>
          Descargar Excel
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Productos</TableHead>
            <TableHead>Método de Pago</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Pagado</TableHead>
            <TableHead className="text-right">Vuelto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                No hay ventas registradas para este POS.
              </TableCell>
            </TableRow>
          ) : (
            sales.map((sale) => (
              <TooltipProvider key={sale.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TableRow className="hover:bg-muted/50 cursor-pointer">
                      <TableCell>{formatDate(sale.date)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {sale.items.map((item) => (
                            <Badge key={item.sku} variant="secondary">
                              {item.nombre} (x{item.quantity})
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{sale.paymentMethod}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(sale.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(sale.amountPaid)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(sale.change)}
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
