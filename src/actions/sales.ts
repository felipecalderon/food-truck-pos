"use server";

import type { CartItem } from "@/types/cart";
import { PaymentMethod, Sale } from "@/types/sale";
import { getCurrentSession } from "@/actions/cash-register";
import { CashRegisterSession } from "@/types/cash-register";
import fs from "node:fs/promises";
import path from "node:path";

import { randomUUID } from "crypto";
import { formatCurrency } from "@/lib/utils";
import { isToday, isThisWeek, isThisMonth } from "date-fns";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import SaleModel, { ISale } from "@/models/Sale";
import CashRegisterSessionModel from "@/models/CashRegisterSession";

function mapSaleDocument(doc: ISale): Sale {
  return {
    id: doc.saleId,
    sessionId: doc.sessionId,
    posName: doc.posName,
    items: doc.items,
    total: doc.total,
    date: doc.date.toISOString(),
    paymentMethod: doc.paymentMethod,
    amountPaid: doc.amountPaid,
    change: doc.change,
    comment: doc.comment,
  };
}

export async function getAllSales(searchParams: {
  range?: string;
  from?: string;
  to?: string;
}): Promise<Sale[]> {
  try {
    await connectDB();
    const { range, from, to } = searchParams;
    let query: any = {};

    if (range) {
      const now = new Date();
      if (range === "today") {
        const start = new Date(now.setHours(0, 0, 0, 0));
        const end = new Date(now.setHours(23, 59, 59, 999));
        query.date = { $gte: start, $lte: end };
      } else if (range === "week") {
        const start = new Date(now.setDate(now.getDate() - now.getDay()));
        start.setHours(0, 0, 0, 0);
        const end = new Date(now.setDate(start.getDate() + 6));
        end.setHours(23, 59, 59, 999);
      } else if (range === "month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        query.date = { $gte: start, $lte: end };
      }
    } else if (from && to) {
      query.date = { $gte: new Date(from), $lte: new Date(to) };
    }

    const salesDocs = await SaleModel.find(query).sort({ date: -1 }).lean();

    let sales = salesDocs.map((doc: any) => mapSaleDocument(doc));

    if (range === "week") {
      sales = sales.filter((sale: Sale) => isThisWeek(new Date(sale.date)));
    } else if (range === "today") {
      sales = sales.filter((sale: Sale) => isToday(new Date(sale.date)));
    } else if (range == "month") {
      sales = sales.filter((sale: Sale) => isThisMonth(new Date(sale.date)));
    }

    return sales;
  } catch (error) {
    console.error("Error fetching sales from MongoDB:", error);
    return [];
  }
}

export async function createSale(
  cart: CartItem[],
  total: number,
  paymentMethod: PaymentMethod,
  amountPaid: number,
  change: number,
  posName: string,
  comment?: string
): Promise<{ success: boolean; message: string; sale?: Sale }> {
  await connectDB();
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

    const saleData = {
      saleId,
      sessionId: session.id,
      posName,
      items: cart,
      total,
      date: saleTimestamp,
      paymentMethod,
      amountPaid,
      change,
      comment,
    };

    const newSale = await SaleModel.create(saleData);

    if (!newSale) {
      return {
        success: false,
        message: "Error: No se pudo crear la venta en la base de datos.",
      };
    }

    const updatedSession = await CashRegisterSessionModel.findOneAndUpdate(
      { sessionId: session.id, status: "OPEN" },
      { $inc: { calculatedSales: total } },
      { new: true }
    );

    if (!updatedSession) {
      await SaleModel.deleteOne({ saleId });
      return {
        success: false,
        message:
          "Error: No se pudo actualizar la sesión de caja. La venta no fue registrada.",
      };
    }

    revalidatePath("/");

    return {
      success: true,
      message: "Venta guardada con éxito en MongoDB.",
      sale: mapSaleDocument(newSale.toObject()),
    };
  } catch (error) {
    console.error("Error al guardar la venta en MongoDB:", error);
    return {
      success: false,
      message: `Error al guardar la venta: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
    };
  }
}

export async function getSalesByPosName(posName: string): Promise<Sale[]> {
  try {
    await connectDB();
    const salesDocs = await SaleModel.find({ posName })
      .sort({ date: -1 })
      .lean();
    return salesDocs.map((doc: any) => mapSaleDocument(doc));
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
    await connectDB();
    const result = await SaleModel.findOneAndUpdate({ saleId }, { comment });

    if (!result) {
      return { success: false, message: "La venta no existe." };
    }

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
    await connectDB();
    const sale = await SaleModel.findOne({ saleId });
    if (!sale) {
      return { success: false, message: "La venta no existe." };
    }

    // Delete sale
    await SaleModel.deleteOne({ saleId });

    // Update Session if current - Validar la actualización
    const session = await getCurrentSession(sale.posName);
    if (session && session.id === sale.sessionId) {
      const updatedSession = await CashRegisterSessionModel.findOneAndUpdate(
        { sessionId: session.id },
        { $inc: { calculatedSales: -sale.total } },
        { new: true }
      );

      if (!updatedSession) {
        console.warn(
          `Advertencia: No se pudo actualizar calculatedSales al eliminar venta ${saleId}`
        );
      }
    }

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
