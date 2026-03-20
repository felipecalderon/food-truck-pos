"use server";

import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { format, isThisMonth, isThisWeek, isToday } from "date-fns";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/actions/cash-register";
import { getRawInsumosFromGeo } from "@/actions/products";
import {
  AUTHORIZATION,
  BACKEND_URL,
  COMPANY,
  EXTERNAL_SALES_PATH,
} from "@/common/enviroments";
import connectDB from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import CashRegisterSessionModel from "@/models/CashRegisterSession";
import MongoProductModel from "@/models/MongoProduct";
import SaleModel, { type ISale } from "@/models/Sale";
import type { CartItem } from "@/types/cart";
import type { RawProduct } from "@/types/product";
import type { PaymentMethodName, Sale } from "@/types/sale";

type ExternalSaleProductPayload = {
  price: number;
  price_sale: number;
  company_id: number;
  business_id: number;
  product_type: string;
  is_tax_affected: boolean;
  barcode: string;
  enabled: boolean;
  currency: string;
  product_id_parent: number | null;
  is_factor: boolean;
  is_inventory: boolean;
  unit_cost: number;
  sii_chile_tax_id: number | null;
  is_profit: boolean;
  type_code: string;
  unit_item: string;
  created_at: string;
  updated_at: string;
  uf_hoy: string;
  url_image: string | null;
  traceability: number;
  is_expiration_date: boolean;
  is_traceability_print_dte: boolean;
  product_id: number;
  quantity: number;
  tax_affected: boolean;
  discount: number | null;
  surcharge: number;
  additional_tax_fee: number;
  additional_tax_code: number;
  expiration_date: string;
};

type ExternalSalePayload = {
  type_document: number;
  start_date: string;
  end_date: string;
  customer_id: number;
  address: string;
  city_id: number;
  commune_id: number;
  is_str_city_and_comune: boolean;
  str_commune: string;
  str_city: string;
  type_payment_id: number;
  continuous: boolean;
  channel_id: number | null;
  ware_house_id: number;
  global_discount: number | null;
  global_discount_type: "$" | "%";
  comment: string;
  amount_paid: number;
  type_document_sii: number;
  products: ExternalSaleProductPayload[];
};

const EXTERNAL_SALE_DEFAULTS = {
  type_document: 1001,
  customer_id: 9867386,
  address: "prueba 23",
  city_id: 31,
  commune_id: 63,
  is_str_city_and_comune: false,
  str_commune: "Temuco",
  str_city: "Cautin",
  type_payment_id: 29413,
  continuous: false,
  channel_id: null,
  ware_house_id: 7618,
  global_discount: null,
  global_discount_type: "$" as const,
  type_document_sii: 39,
};

const GEO_TIMEZONE_OFFSET = "-03:00";
const IVA_FACTOR = 1.19;

function buildExternalSalesUrl() {
  if (EXTERNAL_SALES_PATH.startsWith("http://")) {
    return EXTERNAL_SALES_PATH.replace("http://", "https://");
  }
  if (EXTERNAL_SALES_PATH.startsWith("https://")) {
    return EXTERNAL_SALES_PATH;
  }
  return `${BACKEND_URL}${EXTERNAL_SALES_PATH}`;
}

function formatGeoDate(date: Date) {
  return format(date, "dd-MM-yyyy");
}

function buildGeoIsoDate(date: Date) {
  const local = format(date, "yyyy-MM-dd'T'HH:mm:ss.SSS");
  return `${local}${GEO_TIMEZONE_OFFSET}`;
}

function addInsumoQuantity(
  quantityBySku: Map<string, number>,
  sku: string,
  quantity: number,
) {
  if (!sku || !Number.isFinite(quantity) || quantity <= 0) {
    return;
  }

  quantityBySku.set(sku, (quantityBySku.get(sku) ?? 0) + quantity);
}

function addInsumoAmount(
  amountBySku: Map<string, number>,
  sku: string,
  amount: number,
) {
  if (!sku || !Number.isFinite(amount) || amount <= 0) {
    return;
  }

  amountBySku.set(sku, (amountBySku.get(sku) ?? 0) + amount);
}

function roundTo2Decimals(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function buildExternalCommentFromCart(cart: CartItem[]): string {
  return cart
    .map((item) => {
      const quantity = Math.max(0, Math.floor(item.quantity));
      return `${quantity}x ${item.nombre}`;
    })
    .filter((value) => !value.startsWith("0x "))
    .join(", ");
}

function mapExternalProduct(
  rawProduct: RawProduct,
  quantity: number,
  price: number,
  priceSale: number,
  saleDate: Date,
): ExternalSaleProductPayload {
  return {
    price,
    price_sale: priceSale,
    company_id: rawProduct.company_id,
    business_id: rawProduct.business_id,
    product_type: rawProduct.product_type,
    is_tax_affected: rawProduct.is_tax_affected,
    barcode: rawProduct.barcode,
    enabled: rawProduct.enabled,
    currency: rawProduct.currency,
    product_id_parent: rawProduct.product_id_parent ?? null,
    is_factor: rawProduct.is_factor,
    is_inventory: rawProduct.is_inventory,
    unit_cost: rawProduct.unit_cost,
    sii_chile_tax_id: rawProduct.sii_chile_tax_id ?? null,
    is_profit: rawProduct.is_profit,
    type_code: rawProduct.type_code ?? "",
    unit_item: rawProduct.unit_item ?? "UNID",
    created_at: rawProduct.created_at ?? buildGeoIsoDate(saleDate),
    updated_at: rawProduct.updated_at ?? buildGeoIsoDate(saleDate),
    uf_hoy: rawProduct.uf_hoy ?? "0",
    url_image: rawProduct.image?.url ?? null,
    traceability: rawProduct.traceability ?? 0,
    is_expiration_date: rawProduct.is_expiration_date ?? false,
    is_traceability_print_dte: rawProduct.is_traceability_print_dte ?? false,
    product_id: rawProduct.id,
    quantity,
    tax_affected: rawProduct.tax_affected ?? rawProduct.is_tax_affected,
    discount: rawProduct.discount ?? null,
    surcharge: rawProduct.surcharge ?? 0,
    additional_tax_fee: rawProduct.additional_tax_fee ?? 0,
    additional_tax_code: rawProduct.additional_tax_code ?? 0,
    expiration_date: rawProduct.expiration_date ?? "",
  };
}

async function buildExternalSalePayload(
  cart: CartItem[],
  amountPaid: number,
  _comment: string | undefined,
  saleDate: Date,
): Promise<ExternalSalePayload> {
  const uniqueFinalSkus = Array.from(new Set(cart.map((item) => item.sku)));

  const finalProducts = await MongoProductModel.find({
    sku: { $in: uniqueFinalSkus },
  })
    .select({ sku: 1, associatedInsumos: 1, _id: 0 })
    .lean<
      Array<{
        sku: string;
        associatedInsumos?: Array<{ sku: string; quantity: number }>;
      }>
    >();

  const finalProductsBySku = new Map(
    finalProducts.map((product) => [product.sku, product]),
  );
  const quantityBySku = new Map<string, number>();
  const grossAmountBySku = new Map<string, number>();

  for (const cartItem of cart) {
    const finalProduct = finalProductsBySku.get(cartItem.sku);
    const associatedInsumos = finalProduct?.associatedInsumos ?? [];
    const hasAssociatedInsumos = associatedInsumos.length > 0;
    const cartQuantity = Math.max(0, Math.floor(cartItem.quantity));

    if (cartQuantity <= 0) {
      continue;
    }

    if (hasAssociatedInsumos) {
      const totalInsumoUnitsPerFinal = associatedInsumos.reduce(
        (acc, insumo) => acc + insumo.quantity,
        0,
      );

      if (totalInsumoUnitsPerFinal <= 0) {
        continue;
      }

      const grossPerInsumoUnit = cartItem.precio / totalInsumoUnitsPerFinal;

      for (const associatedInsumo of associatedInsumos) {
        const insumoUnits = associatedInsumo.quantity * cartQuantity;

        addInsumoQuantity(quantityBySku, associatedInsumo.sku, insumoUnits);
        addInsumoAmount(
          grossAmountBySku,
          associatedInsumo.sku,
          grossPerInsumoUnit * insumoUnits,
        );
      }
      continue;
    }

    addInsumoQuantity(quantityBySku, cartItem.sku, cartQuantity);
    addInsumoAmount(
      grossAmountBySku,
      cartItem.sku,
      cartItem.precio * cartQuantity,
    );
  }

  const rawInsumos = await getRawInsumosFromGeo();
  const rawBySku = new Map(rawInsumos.map((insumo) => [insumo.code, insumo]));

  const missingSkus: string[] = [];
  const products: ExternalSaleProductPayload[] = [];

  for (const [sku, quantity] of quantityBySku) {
    const rawProduct = rawBySku.get(sku);
    if (!rawProduct) {
      missingSkus.push(sku);
      continue;
    }

    const totalGrossAmount = grossAmountBySku.get(sku) ?? 0;
    const grossUnitPrice =
      quantity > 0 ? roundTo2Decimals(totalGrossAmount / quantity) : 0;
    const netUnitPrice =
      grossUnitPrice > 0 ? roundTo2Decimals(grossUnitPrice / IVA_FACTOR) : 0;

    products.push(
      mapExternalProduct(
        rawProduct,
        quantity,
        netUnitPrice,
        grossUnitPrice,
        saleDate,
      ),
    );
  }

  if (missingSkus.length > 0) {
    throw new Error(
      `No se encontraron insumos en Geo para los SKU: ${missingSkus.join(", ")}`,
    );
  }

  const startDate = formatGeoDate(saleDate);
  const endDate = formatGeoDate(saleDate);
  const generatedComment = buildExternalCommentFromCart(cart);

  return {
    ...EXTERNAL_SALE_DEFAULTS,
    start_date: startDate,
    end_date: endDate,
    comment: generatedComment,
    amount_paid: amountPaid,
    products,
  };
}

async function syncSaleToExternalApi(
  cart: CartItem[],
  amountPaid: number,
  comment: string | undefined,
  saleDate: Date,
): Promise<{ success: true } | { success: false; message: string }> {
  const payload = await buildExternalSalePayload(
    cart,
    amountPaid,
    comment,
    saleDate,
  );
  const externalSalesUrl = buildExternalSalesUrl();

  const response = await fetch(externalSalesUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: AUTHORIZATION,
      Company: COMPANY,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (response.ok) {
    return { success: true };
  }

  let responseBody = "";
  try {
    responseBody = await response.text();
  } catch (_error) {
    responseBody = "";
  }

  const normalizedBody = responseBody.trim();
  const detail = normalizedBody
    ? ` | Detalle: ${normalizedBody.slice(0, 500)}`
    : "";

  return {
    success: false,
    message: `Geo respondió ${response.status} ${response.statusText}${detail}`,
  };
}

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
    externalSyncStatus: doc.externalSyncStatus,
    externalSyncError: doc.externalSyncError ?? null,
    externalSyncedAt: doc.externalSyncedAt
      ? doc.externalSyncedAt.toISOString()
      : null,
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
    const query: any = {};

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
          999,
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
    } else if (range === "month") {
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
  paymentMethod: PaymentMethodName,
  amountPaid: number,
  change: number,
  posName: string,
  comment?: string,
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
      externalSyncStatus: "PENDING",
      externalSyncError: null,
      externalSyncedAt: null,
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
      { new: true },
    );

    if (!updatedSession) {
      await SaleModel.deleteOne({ saleId });
      return {
        success: false,
        message:
          "Error: No se pudo actualizar la sesión de caja. La venta no fue registrada.",
      };
    }

    const externalSyncResult = await syncSaleToExternalApi(
      cart,
      amountPaid,
      comment,
      saleTimestamp,
    );

    if (externalSyncResult.success) {
      await SaleModel.updateOne(
        { saleId },
        {
          externalSyncStatus: "SYNCED",
          externalSyncError: null,
          externalSyncedAt: new Date(),
        },
      );
    } else {
      await SaleModel.updateOne(
        { saleId },
        {
          externalSyncStatus: "FAILED",
          externalSyncError: externalSyncResult.message,
          externalSyncedAt: null,
        },
      );
    }

    revalidatePath("/");

    const saleDocument = await SaleModel.findOne({ saleId });

    return {
      success: true,
      message: externalSyncResult.success
        ? "Venta guardada en MongoDB y sincronizada en Geo."
        : `Venta guardada en MongoDB, pero falló sincronización con Geo: ${externalSyncResult.message}`,
      sale: saleDocument
        ? mapSaleDocument(saleDocument.toObject())
        : mapSaleDocument(newSale.toObject()),
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
  comment: string,
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
  saleId: string,
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
        { new: true },
      );

      if (!updatedSession) {
        console.warn(
          `Advertencia: No se pudo actualizar calculatedSales al eliminar venta ${saleId}`,
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
  paymentMethod: PaymentMethodName,
  amountPaid: number,
  change: number,
): Promise<{ success: boolean; message: string }> {
  const saleTimestamp = new Date();
  const formattedDate = `${saleTimestamp.toLocaleDateString(
    "es-CL",
  )} ${saleTimestamp.toLocaleTimeString("es-CL")}`;

  // Formatear los items del carrito en una línea
  const itemsSummary = cart
    .map((item) => `${item.nombre} (x${item.quantity})`)
    .join(", ");

  // Línea a guardar en el log
  const saleRecord = `[${formattedDate}] Venta Total: ${formatCurrency(
    total,
  )} | Método de Pago: ${paymentMethod} | Pagado: ${formatCurrency(
    amountPaid,
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
