"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteSale } from "@/actions/sales";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Sale } from "@/types/sale";
import { EditSaleDialog } from "./edit-sale-dialog";
import { Button } from "./ui/button";

interface TotalSalesListProps {
  sales: Sale[];
}

export function TotalSalesList({ sales }: TotalSalesListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (sales.length === 0) {
    return (
      <div className="text-center text-gray-500 py-16">
        <p>No hay ventas registradas en esta fecha.</p>
      </div>
    );
  }

  const executeDelete = async (saleId: string) => {
    setDeletingId(saleId);
    const result = await deleteSale(saleId);
    setDeletingId(null);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    router.refresh();
  };

  const handleDelete = (saleId: string) => {
    if (deletingId) return;

    toast.warning("Eliminar venta", {
      description: "Esta acción no se puede deshacer.",
      action: {
        label: "Eliminar",
        onClick: () => {
          void executeDelete(saleId);
        },
      },
    });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID Venta</TableHead>
          <TableHead>Nombre POS</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Productos</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Acciones</TableHead>
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
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <EditSaleDialog sale={sale} />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(sale.id)}
                        disabled={deletingId === sale.id}
                      >
                        {deletingId === sale.id ? "Eliminando..." : "Eliminar"}
                      </Button>
                    </div>
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
