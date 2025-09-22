"use client";

import { useCartStore } from "@/stores/cart";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CartItemsTable } from "./cart/cart-items-table";
import { CartPayment } from "./cart/cart-payment";
import { CartSummary } from "./cart/cart-summary";
import { CartActions } from "./cart/cart-actions";

export function ShoppingCart() {
  const {
    items,
    paymentMethod,
    amountPaid,
    comment,
    isSaving,
    updateQuantity,
    setPaymentMethod,
    setAmountPaid,
    setComment,
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

  const handleSaveSale = async () => {
    const posName = localStorage.getItem("pos_name");
    if (!posName) {
      alert(
        "Error: No se ha configurado un nombre para este POS. Por favor, recargue la página."
      );
      return;
    }

    const result = await saveSale(posName);

    if (result.success) {
      window.dispatchEvent(new Event("sale-completed"));
      alert("Venta guardada con éxito");
    } else {
      alert(`Hubo un error al guardar la venta: ${result.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-0">
          <CartItemsTable items={items} updateQuantity={updateQuantity} />
        </CardContent>
        <CardFooter className="flex flex-col gap-4 mt-4 p-4">
          <CartSummary cartTotal={cartTotal} change={change} />

          {items.length > 0 && (
            <CartPayment
              paymentMethod={paymentMethod}
              amountPaid={amountPaid}
              comment={comment}
              cartTotal={cartTotal}
              setPaymentMethod={setPaymentMethod}
              setAmountPaid={setAmountPaid}
              setComment={setComment}
            />
          )}

          <CartActions
            isSaving={isSaving}
            isSaleDisabled={isSaleDisabled}
            handleSaveSale={handleSaveSale}
          />
        </CardFooter>
      </Card>
    </div>
  );
}