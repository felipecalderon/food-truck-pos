"use server";

import type { CartItem } from "@/types/cart";
import { PaymentMethod, Sale } from "@/types/sale";
import { getCurrentSession } from "@/actions/cash-register";
import { CashRegisterSession } from "@/types/cash-register";
import fs from "node:fs/promises";
import path from "node:path";
import redis from "@/lib/redis";
import { randomUUID } from "crypto";
import { formatCurrency } from "@/lib/utils";
import { isToday, isThisWeek, isThisMonth } from "date-fns";
import { revalidatePath } from "next/cache";

const POS_NAME_CONSTANT = "main-pos"; // TODO: Esto debería ser dinámico

export async function getAllSales(searchParams: {
  range?: string;
  from?: string;
  to?: string;
}): Promise<Sale[]> {
  try {
    const saleKeys = await redis.keys("sale:*");
    if (saleKeys.length === 0) {
      return [];
    }

    const salesJson = await redis.mget(saleKeys);
    let sales = salesJson
      .map((saleJson) => {
        try {
          return saleJson ? (JSON.parse(saleJson) as Sale) : null;
        } catch (e) {
          console.error("Failed to parse sale JSON:", e);
          return null;
        }
      })
      .filter((sale): sale is Sale => sale !== null);

    const { range, from, to } = searchParams;

    if (range) {
      const now = new Date();
      if (range === "today") {
        sales = sales.filter((sale) => isToday(new Date(sale.date)));
      } else if (range === "week") {
        sales = sales.filter((sale) => isThisWeek(new Date(sale.date)));
      } else if (range === "month") {
        sales = sales.filter((sale) => isThisMonth(new Date(sale.date)));
      }
    } else if (from && to) {
      const startDate = new Date(from);
      const endDate = new Date(to);
      sales = sales.filter((sale) => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate;
      });
    }

    return sales.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error("Error fetching sales from Redis:", error);
    return [];
  }
}

export async function createSaleInRedis(
  cart: CartItem[],
  total: number,
  paymentMethod: PaymentMethod,
  amountPaid: number,
  change: number,
  posName: string,
  comment?: string
): Promise<{ success: boolean; message: string; sale?: Sale }> {
  const session = await getCurrentSession(posName);
  if (!session) {
    return {
      success: false,
      message: "Error: La caja está cerrada. No se pueden registrar ventas.",
    };
  }

  if (session.status !== "OPEN") {
    return {
      success: false,
      message: `Error: La caja tiene un estado inválido (${session.status}).`,
    };
  }

  try {
    const saleTimestamp = new Date();
    const saleId = randomUUID();

    const sale: Sale = {
      id: saleId,
      sessionId: session.id,
      posName,
      items: cart,
      total,
      date: saleTimestamp.toISOString(),
      paymentMethod,
      amountPaid,
      change,
      comment,
    };

    const isCashSale = paymentMethod === "Efectivo";
    const newCalculatedSales = isCashSale
      ? session.calculatedSales + total
      : session.calculatedSales;

    const updatedSession: CashRegisterSession = {
      ...session,
      calculatedSales: newCalculatedSales,
    };
    const CURRENT_SESSION_KEY = `cash-register:${posName}:current`;
    await redis
      .multi()
      .set(`sale:${saleId}`, JSON.stringify(sale))
      .sadd(`pos:${posName}:sales`, saleId)
      .sadd(`session-sales:${session.id}`, saleId)
      .set(CURRENT_SESSION_KEY, JSON.stringify(updatedSession))
      .exec();

    revalidatePath("/");

    console.log(`Venta ${saleId} desde ${posName} guardada en Redis.`);
    return { success: true, message: "Venta guardada con éxito en Redis.", sale };
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

export async function updateSale(
  saleId: string,
  comment: string
): Promise<{ success: boolean; message: string }> {
  try {
    const saleKey = `sale:${saleId}`;
    const saleJSON = await redis.get(saleKey);
    if (!saleJSON) {
      return { success: false, message: "La venta no existe." };
    }
    const sale = JSON.parse(saleJSON) as Sale;

    const updatedSale: Sale = {
      ...sale,
      comment,
    };

    await redis.set(saleKey, JSON.stringify(updatedSale));

    return { success: true, message: "Venta actualizada con éxito." };
  } catch (error) {
    console.error("Error updating sale:", error);
    return { success: false, message: "Error al actualizar la venta." };
  }
}

export async function deleteSale(
  saleId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const saleKey = `sale:${saleId}`;
    const saleJSON = await redis.get(saleKey);
    if (!saleJSON) {
      return { success: false, message: "La venta no existe." };
    }
    const sale = JSON.parse(saleJSON) as Sale;

    const multi = redis.multi();
    multi.del(saleKey);
    multi.srem(`pos:${sale.posName}:sales`, saleId);
    if (sale.sessionId) {
      multi.srem(`session-sales:${sale.sessionId}`, saleId);
    }

    const CURRENT_SESSION_KEY = `cash-register:${sale.posName}:current`;
    const session = await getCurrentSession(sale.posName);
    if (session && session.id === sale.sessionId) {
      const updatedSession: CashRegisterSession = {
        ...session,
        calculatedSales: session.calculatedSales - sale.total,
      };
      multi.set(CURRENT_SESSION_KEY, JSON.stringify(updatedSession));
    }

    await multi.exec();

    return { success: true, message: "Venta eliminada con éxito." };
  } catch (error) {
    console.error("Error deleting sale:", error);
    return { success: false, message: "Error al eliminar la venta." };
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
