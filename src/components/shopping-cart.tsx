"use client";

import { useCartStore } from "@/stores/cart";
import { useOrderStore } from "@/stores/orders";
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
    loadedOrderId,
    updateQuantity,
    setPaymentMethod,
    setAmountPaid,
    setComment,
    clearCart,
    saveSale,
    getCartTotal,
    getChange,
  } = useCartStore();

  const { addOrder } = useOrderStore();

  const cartTotal = getCartTotal();
  const change = getChange();
  const isOrderLoaded = loadedOrderId !== null;

  const handleSaveOrder = () => {
    if (items.length === 0) return;

    const newOrder = addOrder(items, cartTotal);
    clearCart();
    alert(`Pedido ${newOrder.name} guardado.`);
    window.dispatchEvent(new Event("order-saved"));
  };

  const handleSaveSale = async () => {
    const posName = localStorage.getItem("pos_name");
    if (!posName) {
      alert("Error: No se ha configurado un nombre para este POS.");
      return;
    }
    const result = await saveSale(posName);
    if (result.success) {
      window.dispatchEvent(new Event("sale-completed"));
      alert("Venta finalizada con éxito.");
    } else {
      alert(`Hubo un error al finalizar la venta: ${result.message}`);
    }
  };

  const mainAction = isOrderLoaded ? handleSaveSale : handleSaveOrder;

  const isSaleDisabled =
    items.length === 0 ||
    isSaving ||
    (isOrderLoaded &&
      paymentMethod === "Efectivo" &&
      amountPaid < Math.floor(cartTotal));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-0">
          <CartItemsTable items={items} updateQuantity={updateQuantity} />
        </CardContent>
        <CardFooter className="flex flex-col gap-4 mt-4 p-4">
          <CartSummary cartTotal={cartTotal} change={change} />

          {isOrderLoaded && items.length > 0 && (
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
            handleSaveSale={mainAction}
            isOrderLoaded={isOrderLoaded}
          />
        </CardFooter>
      </Card>
    </div>
  );
}