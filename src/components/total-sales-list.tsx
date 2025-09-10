'use client';

import type { Sale } from '@/types/sale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

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
          <TableRow key={sale.id}>
            <TableCell className="font-mono text-xs">{sale.id.substring(0, 8)}...</TableCell>
            <TableCell>
              <Badge variant="outline">{sale.posName}</Badge>
            </TableCell>
            <TableCell>{formatDate(sale.date)}</TableCell>
            <TableCell className="max-w-xs truncate">
              {sale.items.map((item) => `${item.nombre} (x${item.quantity})`).join(', ')}
            </TableCell>
            <TableCell className="text-right font-semibold">{formatCurrency(sale.total)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
