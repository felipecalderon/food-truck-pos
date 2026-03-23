"use server";

import { revalidatePath } from "next/cache";
import { getPosProductVisibilityMap } from "@/actions/pos-product-visibility";
import { getInsumosFromGeoStrict } from "@/actions/products";
import connectDB from "@/lib/db";
import MongoProductModel from "@/models/MongoProduct";
import ProductRelationModel from "@/models/ProductRelation";
import type { InsumoRequirement, MongoProduct, Product } from "@/types/product";

type CreateMongoProductInput = {
  nombre?: string;
  sku?: string;
  categoria?: string;
  precio?: number;
  associatedInsumos?: InsumoRequirement[];
  associatedSkus?: string[];
};

type UpdateMongoProductInput = {
  sku: string;
  nombre?: string;
  categoria?: string;
  precio?: number;
  associatedInsumos?: InsumoRequirement[];
  associatedSkus?: string[];
};

type MongoProductRecord = {
  sku: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  associatedInsumos?: InsumoRequirement[];
  associatedSkus?: string[];
};

function generateRandomSixDigitSku(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizeAssociatedInsumos(input: {
  associatedInsumos?: InsumoRequirement[];
  associatedSkus?: string[];
}): InsumoRequirement[] {
  const quantityBySku = new Map<string, number>();

  input.associatedInsumos?.forEach((insumo) => {
    const sku = insumo.sku.trim();
    const quantity = Math.floor(insumo.quantity);

    if (!sku || !Number.isFinite(quantity) || quantity <= 0) return;

    quantityBySku.set(sku, (quantityBySku.get(sku) ?? 0) + quantity);
  });

  input.associatedSkus?.forEach((rawSku) => {
    const sku = rawSku.trim();
    if (!sku) return;
    quantityBySku.set(sku, (quantityBySku.get(sku) ?? 0) + 1);
  });

  return Array.from(quantityBySku.entries())
    .map(([sku, quantity]) => ({ sku, quantity }))
    .sort((a, b) => a.sku.localeCompare(b.sku));
}

function mapLegacySkusToInsumos(
  associatedSkus?: string[],
): InsumoRequirement[] {
  return normalizeAssociatedInsumos({ associatedSkus });
}

function mapMongoProduct(doc: MongoProductRecord): MongoProduct {
  const associatedInsumos =
    doc.associatedInsumos && doc.associatedInsumos.length > 0
      ? normalizeAssociatedInsumos({ associatedInsumos: doc.associatedInsumos })
      : mapLegacySkusToInsumos(doc.associatedSkus);

  return {
    sku: doc.sku,
    nombre: doc.nombre,
    categoria: doc.categoria,
    precio: doc.precio,
    stock: doc.stock,
    associatedInsumos,
    associatedSkus: associatedInsumos.map((insumo) => insumo.sku),
  };
}

export async function getFinalProductsFromMongo(): Promise<MongoProduct[]> {
  try {
    const productsPromise = getFinalProductsFromMongoBase();
    const insumos = await getInsumosFromGeoStrict();
    const products = await productsPromise;

    return await syncFinalProductsWithGeoInsumos(products, insumos);
  } catch (error) {
    console.warn("No se pudo sincronizar productos finales con Geo:", error);
    return getFinalProductsFromMongoBase();
  }
}

export async function getPOSFinalProducts(): Promise<Product[]> {
  return getPOSProducts();
}

export async function getPOSProducts(): Promise<Product[]> {
  try {
    const [finalProducts, insumos, visibilityMap] = await Promise.all([
      getFinalProductsFromMongoBase(),
      getInsumosFromGeoStrict(),
      getPosProductVisibilityMap(),
    ]);

    const cleanedFinalProducts = await syncFinalProductsWithGeoInsumos(
      finalProducts,
      insumos,
    );

    const insumosBySku = new Map(insumos.map((insumo) => [insumo.sku, insumo]));

    const finalProductsForPos: Product[] = cleanedFinalProducts.map(
      (finalProduct) => {
        const references = finalProduct.associatedInsumos
          .map((insumo) => insumosBySku.get(insumo.sku))
          .filter((insumo): insumo is Product => !!insumo);

        return {
          sku: finalProduct.sku,
          nombre: finalProduct.nombre,
          categoria: finalProduct.categoria,
          precio: finalProduct.precio,
          stock: finalProduct.stock,
          source: "mongo",
          references,
        };
      },
    );

    const visibleExternalProducts: Product[] = insumos
      .filter((product) => visibilityMap[product.sku]?.showInPos)
      .map((product) => {
        const mapping = visibilityMap[product.sku];

        return {
          ...product,
          nombre: mapping?.posLabel?.trim() || product.nombre,
          source: "geo",
        };
      });

    const mergedProducts = [...finalProductsForPos, ...visibleExternalProducts];
    const productsBySku = new Map<string, Product>();

    mergedProducts.forEach((product) => {
      if (!productsBySku.has(product.sku)) {
        productsBySku.set(product.sku, product);
      }
    });

    return Array.from(productsBySku.values());
  } catch (error) {
    console.warn("No se pudo resolver Geo para productos POS:", error);
    const finalProducts = await getFinalProductsFromMongoBase();

    return finalProducts.map((finalProduct) => ({
      sku: finalProduct.sku,
      nombre: finalProduct.nombre,
      categoria: finalProduct.categoria,
      precio: finalProduct.precio,
      stock: finalProduct.stock,
      source: "mongo",
      references: [],
    }));
  }
}

async function getFinalProductsFromMongoBase(): Promise<MongoProduct[]> {
  await connectDB();
  const products = await MongoProductModel.find({})
    .sort({ createdAt: -1 })
    .lean<MongoProductRecord[]>();

  return products.map((product) => mapMongoProduct(product));
}

async function syncFinalProductsWithGeoInsumos(
  products: MongoProduct[],
  insumos: Product[],
): Promise<MongoProduct[]> {
  if (insumos.length === 0) {
    console.warn(
      "Geo devolvió 0 insumos; se omite la limpieza para evitar borrar asociaciones válidas.",
    );
    return products;
  }

  const validInsumoSkus = new Set(insumos.map((insumo) => insumo.sku));
  let changed = false;

  await connectDB();

  for (const product of products) {
    const removedSkus = product.associatedInsumos
      .filter((insumo) => !validInsumoSkus.has(insumo.sku))
      .map((insumo) => insumo.sku);

    if (removedSkus.length === 0) continue;

    const cleanedAssociatedInsumos = product.associatedInsumos.filter(
      (insumo) => validInsumoSkus.has(insumo.sku),
    );

    console.warn(
      "SKU de insumo eliminado en API externa, limpiando producto final",
      {
        parentSku: product.sku,
        removedSkus,
      },
    );

    changed = true;
    product.associatedInsumos = cleanedAssociatedInsumos;
    product.associatedSkus = cleanedAssociatedInsumos.map(
      (insumo) => insumo.sku,
    );

    await MongoProductModel.findOneAndUpdate(
      { sku: product.sku },
      {
        associatedInsumos: cleanedAssociatedInsumos,
        associatedSkus: product.associatedSkus,
      },
      { new: true },
    );
  }

  if (changed) {
    revalidatePath("/");
    revalidatePath("/admin/products");
  }

  return products;
}

export async function createMongoProduct(
  input: CreateMongoProductInput,
): Promise<{
  success: boolean;
  message: string;
  data?: MongoProduct;
}> {
  const associatedInsumos = normalizeAssociatedInsumos(input);
  const associatedSkus = associatedInsumos.map((insumo) => insumo.sku);

  if (associatedInsumos.length === 0) {
    return {
      success: false,
      message: "Debes asociar al menos un insumo para crear el producto.",
    };
  }

  try {
    await connectDB();

    const typedSku = input.sku?.trim();
    let finalSku = typedSku || generateRandomSixDigitSku();

    if (typedSku) {
      let suffix = 1;
      while (await MongoProductModel.exists({ sku: finalSku })) {
        finalSku = `${typedSku}-${suffix}`;
        suffix += 1;
      }
    } else {
      while (await MongoProductModel.exists({ sku: finalSku })) {
        finalSku = generateRandomSixDigitSku();
      }
    }

    const finalName = input.nombre?.trim() || `Producto ${finalSku}`;
    const finalCategory = input.categoria?.trim() || "Final";
    const finalPrice = Number.isFinite(input.precio) ? Number(input.precio) : 0;

    const created = await MongoProductModel.create({
      sku: finalSku,
      nombre: finalName,
      categoria: finalCategory,
      precio: finalPrice,
      stock: 0,
      associatedInsumos,
      associatedSkus,
    });

    await ProductRelationModel.findOneAndUpdate(
      { parentSku: finalSku },
      { associatedSkus },
      { upsert: true, new: true },
    );

    revalidatePath("/");
    revalidatePath("/admin/products");

    return {
      success: true,
      message: "Producto creado correctamente en MongoDB.",
      data: mapMongoProduct(created.toObject<MongoProductRecord>()),
    };
  } catch (error) {
    console.error("Error al crear producto en Mongo:", error);
    return {
      success: false,
      message: "No se pudo crear el producto en MongoDB.",
    };
  }
}

export async function updateMongoProduct(
  input: UpdateMongoProductInput,
): Promise<{
  success: boolean;
  message: string;
  data?: MongoProduct;
}> {
  const sku = input.sku.trim();
  const associatedInsumos = normalizeAssociatedInsumos(input);
  const associatedSkus = associatedInsumos.map((insumo) => insumo.sku);

  if (!sku) {
    return {
      success: false,
      message: "El SKU del producto final es obligatorio.",
    };
  }

  if (associatedInsumos.length === 0) {
    return {
      success: false,
      message: "Debes asociar al menos un insumo para actualizar el producto.",
    };
  }

  try {
    await connectDB();

    const product = await MongoProductModel.findOne({ sku });
    if (!product) {
      return {
        success: false,
        message: "No se encontró el producto final a editar.",
      };
    }

    const nextName = input.nombre?.trim() || product.nombre;
    const nextCategory = input.categoria?.trim() || product.categoria;
    const nextPrice = Number.isFinite(input.precio)
      ? Number(input.precio)
      : product.precio;

    product.nombre = nextName;
    product.categoria = nextCategory;
    product.precio = nextPrice;
    product.associatedInsumos = associatedInsumos;
    product.associatedSkus = associatedSkus;

    const updated = await product.save();

    await ProductRelationModel.findOneAndUpdate(
      { parentSku: sku },
      { associatedSkus },
      { upsert: true, new: true },
    );

    revalidatePath("/");
    revalidatePath("/admin/products");

    return {
      success: true,
      message: "Producto final actualizado correctamente.",
      data: mapMongoProduct(updated.toObject<MongoProductRecord>()),
    };
  } catch (error) {
    console.error("Error al actualizar producto en Mongo:", error);
    return {
      success: false,
      message: "No se pudo actualizar el producto en MongoDB.",
    };
  }
}

export async function deleteMongoProduct(
  sku: string,
): Promise<{ success: boolean; message: string }> {
  const finalSku = sku.trim();

  if (!finalSku) {
    return {
      success: false,
      message: "El SKU del producto final es obligatorio.",
    };
  }

  try {
    await connectDB();

    const deletion = await MongoProductModel.deleteOne({ sku: finalSku });

    if (deletion.deletedCount !== 1) {
      return {
        success: false,
        message: "No se encontró el producto final a eliminar.",
      };
    }

    await ProductRelationModel.deleteOne({ parentSku: finalSku });

    revalidatePath("/");
    revalidatePath("/admin/products");

    return {
      success: true,
      message: "Producto final eliminado correctamente.",
    };
  } catch (error) {
    console.error("Error al eliminar producto en Mongo:", error);
    return {
      success: false,
      message: "No se pudo eliminar el producto en MongoDB.",
    };
  }
}

export async function migrateMongoProductsToAssociatedInsumos(): Promise<{
  success: boolean;
  message: string;
  updatedCount: number;
}> {
  try {
    await connectDB();

    const products = await MongoProductModel.find({});
    let updatedCount = 0;

    for (const product of products) {
      const normalizedFromCurrent = normalizeAssociatedInsumos({
        associatedInsumos: product.associatedInsumos,
      });
      const normalized = normalizeAssociatedInsumos({
        associatedInsumos: product.associatedInsumos,
        associatedSkus: product.associatedSkus,
      });

      const shouldUpdate =
        !product.associatedInsumos ||
        product.associatedInsumos.length === 0 ||
        JSON.stringify(normalizedFromCurrent) !== JSON.stringify(normalized);

      if (!shouldUpdate) continue;

      product.associatedInsumos = normalized;
      product.associatedSkus = normalized.map((insumo) => insumo.sku);
      await product.save();
      updatedCount += 1;
    }

    revalidatePath("/");
    revalidatePath("/admin/products");

    return {
      success: true,
      message: "Migración completada correctamente.",
      updatedCount,
    };
  } catch (error) {
    console.error("Error en migración de productos finales:", error);
    return {
      success: false,
      message: "No se pudo completar la migración de productos finales.",
      updatedCount: 0,
    };
  }
}
