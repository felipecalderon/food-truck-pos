"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { PAYMENT_METHODS, type PaymentMethodName } from "@/types/sale";

interface CartPaymentProps {
  paymentMethod: PaymentMethodName;
  amountPaid: number;
  comment: string;
  cartTotal: number;
  setPaymentMethod: (method: PaymentMethodName) => void;
  setAmountPaid: (amount: number) => void;
  setComment: (comment: string) => void;
}

const ENABLED_PAYMENT_METHODS = PAYMENT_METHODS.filter(
  (method) => method.enabled,
);

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
          onValueChange={(value) => {
            const selectedMethod = ENABLED_PAYMENT_METHODS.find(
              (method) => method.name === value,
            );
            if (selectedMethod) {
              setPaymentMethod(selectedMethod.name);
            }
          }}
          className="flex gap-4"
        >
          {ENABLED_PAYMENT_METHODS.map((method) => (
            <div key={method.id} className="flex items-center space-x-2">
              <RadioGroupItem
                value={method.name}
                id={`payment-method-${method.id}`}
              />
              <Label htmlFor={`payment-method-${method.id}`}>
                {method.name}
              </Label>
            </div>
          ))}
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
            <Button variant="outline" onClick={() => setAmountPaid(cartTotal)}>
              {formatCurrency(cartTotal)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
