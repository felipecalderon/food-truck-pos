"use client";

import { useState, useTransition, useEffect } from 'react';
import type { CartItem, Sale } from "@/app/pos/types";
import { saveSale } from "@/app/actions/sales";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ShoppingCartProps {
    cart: CartItem[];
    handleUpdateQuantity: (sku: number, quantity: number) => void;
    clearCart: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
};

export function ShoppingCart({ cart, handleUpdateQuantity, clearCart }: ShoppingCartProps) {
    const [isPending, startTransition] = useTransition();
    const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Debito' | 'Credito'>('Efectivo');
    const [amountPaid, setAmountPaid] = useState(0);
    const [change, setChange] = useState(0);

    const cartTotal = cart.reduce(
        (total, item) => total + item.precio * item.quantity,
        0
    );

    useEffect(() => {
        if (paymentMethod === 'Efectivo') {
            const paid = amountPaid || 0;
            const newChange = paid > cartTotal ? paid - cartTotal : 0;
            setChange(newChange);
        } else {
            setAmountPaid(cartTotal);
            setChange(0);
        }
    }, [amountPaid, cartTotal, paymentMethod]);

    useEffect(() => {
      if (cart.length === 0) {
        setAmountPaid(0);
      }
    }, [cart]);

    const handleSaveSale = () => {
        startTransition(async () => {
            const sale: Omit<Sale, 'date'> = {
                items: cart,
                total: cartTotal,
                paymentMethod,
                amountPaid,
                change,
            };

            await saveSale(cart, cartTotal, paymentMethod, amountPaid, change);

            // Save to localStorage
            const sales = JSON.parse(localStorage.getItem('sales') || '[]');
            sales.push({ ...sale, date: new Date().toISOString() });
            localStorage.setItem('sales', JSON.stringify(sales));

            clearCart();
            setAmountPaid(0);
            alert('Venta guardada con éxito');
        });
    };
    
    const isSaleDisabled = cart.length === 0 || isPending || (paymentMethod === 'Efectivo' && amountPaid < cartTotal);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Carrito de Compras</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-gray-500 py-8"
                  >
                    El carrito está vacío
                  </TableCell>
                </TableRow>
              ) : (
                cart.map((item) => (
                  <TableRow key={item.sku}>
                    <TableCell>{item.nombre}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 transition-transform hover:scale-110"
                          onClick={() =>
                            handleUpdateQuantity(item.sku, item.quantity - 1)
                          }
                        >
                          -
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 transition-transform hover:scale-110"
                          onClick={() =>
                            handleUpdateQuantity(item.sku, item.quantity + 1)
                          }
                        >
                          +
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.precio * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 mt-4 p-4">
          <div className="w-full flex justify-between text-xl font-bold">
            <span>Total:</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>

          {cart.length > 0 && (
            <div className="w-full flex flex-col gap-4">
                <div>
                    <Label className="mb-2 block">Método de Pago</Label>
                    <RadioGroup defaultValue="Efectivo" onValueChange={(value: 'Efectivo' | 'Debito' | 'Credito') => setPaymentMethod(value)} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Efectivo" id="r1" />
                            <Label htmlFor="r1">Efectivo</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Debito" id="r2" />
                            <Label htmlFor="r2">Débito</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Credito" id="r3" />
                            <Label htmlFor="r3">Crédito</Label>
                        </div>
                    </RadioGroup>
                </div>

                {paymentMethod === 'Efectivo' && (
                    <div className="grid gap-2">
                        <Label htmlFor="amount-paid">Monto Pagado</Label>
                        <Input 
                            id="amount-paid"
                            type="number"
                            placeholder="Ingrese el monto"
                            value={amountPaid || ''}
                            onChange={(e) => setAmountPaid(Number(e.target.value))}
                        />
                    </div>
                )}

                <div className="w-full flex justify-between text-lg font-semibold">
                    <span>Cambio:</span>
                    <span>{formatCurrency(change)}</span>
                </div>
            </div>
          )}

          <Button
            className="w-full transition-all hover:scale-105 hover:bg-primary/90"
            size="lg"
            disabled={isSaleDisabled}
            onClick={handleSaveSale}
          >
            {isPending ? 'Guardando...' : 'Finalizar Compra'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
