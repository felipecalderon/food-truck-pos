"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/types/cart";

interface CartItemsTableProps {
  items: CartItem[];
  updateQuantity: (sku: string, quantity: number) => void;
}

export function CartItemsTable({ items, updateQuantity }: CartItemsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          <TableHead className="text-center">Cantidad</TableHead>
          <TableHead className="text-right">Subtotal</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="text-center text-gray-500 py-8">
              El carrito está vacío
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.sku}>
              <TableCell>{item.nombre}</TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 transition-transform hover:scale-110"
                    onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <span>{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 transition-transform hover:scale-110"
                    onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(Math.floor(item.precio) * item.quantity)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
