"use client";

import { useRef } from "react";
import { useCartStore } from "@/stores/cart";
import { Button } from "./ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./ui/card";

export function SaleReceipt() {
  const { completedSale, closeReceipt } = useCartStore();

  const handlePrint = () => {
    if (!completedSale) return;

    const {
      id,
      date,
      items,
      total,
      paymentMethod,
      amountPaid,
      change,
      posName,
    } = completedSale;

    const printWindow = window.open("", "Print", "width=450,height=700");
    if (!printWindow) {
      alert("La ventana emergente fue bloqueada por el navegador.");
      return;
    }

    // Build HTML directly from the completedSale object
    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo - ${id.slice(0, 8)}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              padding: 1rem;
              color: #111;
            }
            .receipt-header {
              text-align: center;
              border-bottom: 1px dashed #999;
              padding-bottom: 1rem;
              margin-bottom: 1rem;
            }
            
            h1 { font-size: 1.2rem; margin: 0; }
            h2 { margin: 0 0 0.75rem 0; font-size: 0.8rem; }
            p { margin: 0.2rem 0 0 0; color: #555; }
            
            .meta-info, .item, .total-row {
              display: flex;
              justify-content: space-between;
            }

            .meta-info { margin-bottom: 1rem; font-family: monospace; }
            
            .items-section {
              border-top: 1px dashed #999;
              border-bottom: 1px dashed #999;
              padding: 1rem 0;
              margin: 1rem 0;
            }
            .item { margin-bottom: 0.5rem; }

            .totals-section { padding-top: 0.5rem; }
            .total-row { margin-bottom: 0.25rem; }
            .grand-total { font-weight: bold; font-size: 1rem; margin-top: 0.5rem; }
          </style>
        </head>
        <body>
          <div class="receipt-header">
            <h1>Dato del Maestro - FoodTruck</h1>
            <p>POS: ${posName}</p>
          </div>

          <div class="meta-info">
            <p>ID: ${id.slice(0, 8)}</p>
            <p>${formatDate(date)}</p>
          </div>

          <div class="items-section">
            <h2>Artículos</h2>
            ${items
              .map(
                (item) => `
              <div class="item">
                <span>${item.nombre} (x${item.quantity})</span>
                <span>${formatCurrency(item.precio * item.quantity)}</span>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="totals-section">
            ${
              paymentMethod === "Efectivo"
                ? `
              <div class="total-row">
                <span>Monto Pagado:</span>
                <span>${formatCurrency(amountPaid)}</span>
              </div>
              <div class="total-row">
                <span>Vuelto:</span>
                <span>${formatCurrency(change)}</span>
              </div>
                        `
                : ""
            }
            <div class="total-row grand-total">
              <span>Total:</span>
              <span>${formatCurrency(total)}</span>
            </div>
            <div class="total-row">
              <span>Pagado con:</span>
              <span>${paymentMethod}</span>
            </div>
            </div>
            <div class="meta-info">
              <p>Queremos que disfrutes una rica comida en el Dato del Maestro, te esperamos nuevamente!</p>
            </div>
          </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!completedSale) {
    return null;
  }

  const { id, date, items, total, paymentMethod, amountPaid, change, posName } =
    completedSale;

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
      {/* The Card is now only for display. The ref is no longer needed. */}
      <Card className="w-full max-w-md bg-white rounded-lg shadow-lg">
        <CardHeader className="text-center border-b">
          <CardTitle className="text-2xl font-bold">
            Dato del Maestro - FoodTruck
          </CardTitle>
          <p className="text-sm text-gray-500">POS: {posName}</p>
        </CardHeader>
        <CardContent className="p-2">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-mono">ID: {id.slice(0, 8)}</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span>Fecha:</span>
            <span>{formatDate(date)}</span>
          </div>

          <div className="border-t border-b py-4 my-4">
            <h3 className="font-semibold mb-2">Artículos</h3>
            {items.map((item) => (
              <div key={item.sku} className="flex justify-between text-sm">
                <span>
                  {item.nombre} (x{item.quantity})
                </span>
                <span>{formatCurrency(item.precio * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Método de Pago:</span>
              <span>{paymentMethod}</span>
            </div>
            {paymentMethod === "Efectivo" && (
              <>
                <div className="flex justify-between text-sm">
                  <span>Monto Pagado:</span>
                  <span>{formatCurrency(amountPaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Vuelto:</span>
                  <span>{formatCurrency(change)}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="no-print flex justify-end gap-2 p-4 bg-gray-50 border-t">
          <Button variant="outline" onClick={handlePrint}>
            Imprimir
          </Button>
          <Button onClick={closeReceipt}>Cerrar</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
