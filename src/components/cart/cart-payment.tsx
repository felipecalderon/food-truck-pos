"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { PaymentMethod } from "@/types/sale";

interface CartPaymentProps {
  paymentMethod: PaymentMethod;
  amountPaid: number;
  comment: string;
  cartTotal: number;
  setPaymentMethod: (method: PaymentMethod) => void;
  setAmountPaid: (amount: number) => void;
  setComment: (comment: string) => void;
}

export function CartPayment({
  paymentMethod,
  amountPaid,
  comment,
  cartTotal,
  setPaymentMethod,
  setAmountPaid,
  setComment,
}: CartPaymentProps) {
  return (
    <div className="w-full flex flex-col gap-4">
      <div>
        <Label className="mb-2 block">Método de Pago</Label>
        <RadioGroup
          value={paymentMethod}
          onValueChange={(
            value: "Efectivo" | "Debito" | "Credito" | "Transferencia"
          ) => setPaymentMethod(value)}
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
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Transferencia" id="r4" />
            <Label htmlFor="r4">Transferencia</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="comment">Comentario (opcional)</Label>
        <Textarea
          id="comment"
          placeholder="Añade un comentario a la venta..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
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
    </div>
  );
}
