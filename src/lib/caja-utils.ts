import { CartItem } from "@/types/cart";
import { Sale } from "@/types/sale";

export const calculateSalesByPaymentMethod = (sales: Sale[]) => {
  return sales.reduce(
    (acc, sale) => {
      if (sale.paymentMethod === "Efectivo") {
        acc.cash += sale.total;
      } else if (sale.paymentMethod === "Debito") {
        acc.debit += sale.total;
      } else if (sale.paymentMethod === "Credito") {
        acc.credit += sale.total;
      }
      return acc;
    },
    { cash: 0, debit: 0, credit: 0 }
  );
};

export const getTopSoldProducts = (sales: Sale[]) => {
  const productQuantities: { [key: string]: CartItem } = {};

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (productQuantities[item.sku]) {
        productQuantities[item.sku].quantity += item.quantity;
      } else {
        productQuantities[item.sku] = {
          ...item,
          quantity: item.quantity,
        };
      }
    });
  });

  return Object.values(productQuantities)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
};
