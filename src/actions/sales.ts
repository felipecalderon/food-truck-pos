"use server";

import type { CartItem } from "@/types/cart";
import { PaymentMethod, Sale } from "@/types/sale";
import fs from "node:fs/promises";
import path from "node:path";
import redis from "@/lib/redis";
import { randomUUID } from "crypto";
import { formatCurrency } from "@/lib/utils";

export async function createSaleInRedis(
  cart: CartItem[],
  total: number,
  paymentMethod: PaymentMethod,
  amountPaid: number,
  change: number,
  posName: string,
  comment?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const saleTimestamp = new Date();
    const saleId = randomUUID();

    const sale: Sale = {
      id: saleId,
      posName,
      items: cart,
      total,
      date: saleTimestamp.toISOString(),
      paymentMethod,
      amountPaid,
      change,
      comment,
    };

    // Guardar la venta en Redis
    // Usamos una transacción para asegurar que ambas operaciones (guardar venta y añadir al índice) se completen
    await redis
      .multi()
      .set(`sale:${saleId}`, JSON.stringify(sale))
      .sadd(`pos:${posName}:sales`, saleId)
      .exec();

    console.log(`Venta ${saleId} desde ${posName} guardada en Redis.`);
    return { success: true, message: "Venta guardada con éxito en Redis." };
  } catch (error) {
    console.error("Error al guardar la venta en Redis:", error);
    return {
      success: false,
      message: "Error al guardar la venta en Redis.",
    };
  }
}

export async function getSalesByPosName(posName: string): Promise<Sale[]> {
  try {
    const saleIds = await redis.smembers(`pos:${posName}:sales`);
    if (saleIds.length === 0) {
      return [];
    }

    const saleKeys = saleIds.map((id) => `sale:${id}`);
    const salesJson = await redis.mget(saleKeys);

    const sales = salesJson
      .map((saleJson) => {
        try {
          return saleJson ? (JSON.parse(saleJson) as Sale) : null;
        } catch (e) {
          return null; // Ignorar JSON corrupto
        }
      })
      .filter((sale): sale is Sale => sale !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return sales;
  } catch (error) {
    console.error(`Error fetching sales for ${posName}:`, error);
    return [];
  }
}

export async function saveSale(
  cart: CartItem[],
  total: number,
  paymentMethod: PaymentMethod,
  amountPaid: number,
  change: number
): Promise<{ success: boolean; message: string }> {
  const saleTimestamp = new Date();
  const formattedDate = `${saleTimestamp.toLocaleDateString(
    "es-CL"
  )} ${saleTimestamp.toLocaleTimeString("es-CL")}`;

  // Formatear los items del carrito en una línea
  const itemsSummary = cart
    .map((item) => `${item.nombre} (x${item.quantity})`)
    .join(", ");

  // Línea a guardar en el log
  const saleRecord = `[${formattedDate}] Venta Total: ${formatCurrency(
    total
  )} | Método de Pago: ${paymentMethod} | Pagado: ${formatCurrency(
    amountPaid
  )} | Cambio: ${formatCurrency(change)} | Productos: ${itemsSummary}
`;

  try {
    const logFilePath = path.join(process.cwd(), "sales.log");
    await fs.appendFile(logFilePath, saleRecord, "utf-8");

    console.log(`Venta guardada exitosamente en ${logFilePath}`);
    return { success: true, message: "Venta guardada con éxito." };
  } catch (error) {
    console.error("Error al guardar la venta:", error);
    return { success: false, message: "Error al guardar la venta." };
  }
}
