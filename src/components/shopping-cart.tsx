"use client";

import { useCartStore } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
};

export function ShoppingCart() {
  const {
    items,
    paymentMethod,
    amountPaid,
    isSaving,
    updateQuantity,
    setPaymentMethod,
    setAmountPaid,
    saveSale,
    getCartTotal,
    getChange,
  } = useCartStore();

  const cartTotal = getCartTotal();
  const change = getChange();

  const isSaleDisabled =
    items.length === 0 ||
    isSaving ||
    (paymentMethod === "Efectivo" && amountPaid < Math.floor(cartTotal));

  return (
    <div className="flex flex-col gap-6">
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
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-gray-500 py-8"
                  >
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
                          onClick={() =>
                            updateQuantity(item.sku, item.quantity - 1)
                          }
                        >
                          -
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 transition-transform hover:scale-110"
                          onClick={() =>
                            updateQuantity(item.sku, item.quantity + 1)
                          }
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
        </CardContent>
        <CardFooter className="flex flex-col gap-4 mt-4 p-4">
          <div className="w-full flex justify-between text-xl font-bold">
            <span>Total:</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>

          {items.length > 0 && (
            <div className="w-full flex flex-col gap-4">
              <div>
                <Label className="mb-2 block">Método de Pago</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value: "Efectivo" | "Debito" | "Credito") =>
                    setPaymentMethod(value)
                  }
                  className="flex gap-4"
                >
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

              {paymentMethod === "Efectivo" && (
                <div className="grid gap-2">
                  <Label htmlFor="amount-paid">Monto Pagado</Label>
                  <Input
                    id="amount-paid"
                    type="number"
                    placeholder="Ingrese el monto"
                    value={amountPaid || ""}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                  />
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button
                      variant="outline"
                      onClick={() => setAmountPaid(amountPaid + 100)}
                    >
                      +$100
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setAmountPaid(amountPaid + 500)}
                    >
                      +$500
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setAmountPaid(amountPaid + 1000)}
                    >
                      +$1.000
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setAmountPaid(amountPaid + 5000)}
                    >
                      +$5.000
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setAmountPaid(amountPaid + 10000)}
                    >
                      +$10.000
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setAmountPaid(Math.floor(cartTotal))}
                    >
                      ${Math.floor(cartTotal)}
                    </Button>
                  </div>
                </div>
              )}

              <div className="w-full flex justify-between text-lg font-semibold">
                <span>Vuelto:</span>
                <span>{formatCurrency(change)}</span>
              </div>
            </div>
          )}

          <Button
            className="w-full transition-all hover:scale-105 hover:bg-primary/90"
            size="lg"
            disabled={isSaleDisabled}
            onClick={saveSale}
          >
            {isSaving ? "Guardando..." : "Finalizar Venta"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
