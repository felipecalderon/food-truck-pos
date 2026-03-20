"use server";

import connectDB from "@/lib/db";
import ProductRelationModel from "@/models/ProductRelation";
import { revalidatePath } from "next/cache";

/**
 * Guarda o actualiza las asociaciones de un producto.
 * @param parentSku SKU del producto al que se le asocian otros.
 * @param associatedSkus Lista de SKUs asociados.
 */
export async function saveProductRelation(
  parentSku: string,
  associatedSkus: string[],
) {
  try {
    await connectDB();

    const result = await ProductRelationModel.findOneAndUpdate(
      { parentSku },
      { associatedSkus },
      { upsert: true, new: true },
    );

    revalidatePath("/admin/products"); // Revalidar la ruta de administración si existe
    revalidatePath("/"); // Revalidar la página principal donde se listan productos

    return {
      success: true,
      message: "Relaciones de producto guardadas correctamente.",
      data: JSON.parse(JSON.stringify(result)),
    };
  } catch (error) {
    console.error("Error al guardar relación de producto:", error);
    return {
      success: false,
      message: "Error al guardar las relaciones en la base de datos.",
    };
  }
}

/**
 * Obtiene todas las relaciones de productos almacenadas en MongoDB.
 * Retorna un mapa para búsqueda eficiente: { [parentSku]: associatedSkus[] }
 */
export async function getAllProductRelationsMap(): Promise<
  Record<string, string[]>
> {
  try {
    await connectDB();
    const relations = await ProductRelationModel.find({}).lean();

    const relationsMap: Record<string, string[]> = {};
    relations.forEach((rel) => {
      relationsMap[rel.parentSku] = rel.associatedSkus;
    });

    return relationsMap;
  } catch (error) {
    console.error("Error al obtener mapa de relaciones:", error);
    return {};
  }
}

/**
 * Obtiene las relaciones de un producto específico.
 */
export async function getProductRelation(parentSku: string) {
  try {
    await connectDB();
    const relation = await ProductRelationModel.findOne({ parentSku }).lean();
    return relation ? JSON.parse(JSON.stringify(relation)) : null;
  } catch (error) {
    console.error(`Error al obtener relación para ${parentSku}:`, error);
    return null;
  }
}
