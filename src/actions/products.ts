"use server";

import { cache } from "react";
import { getAllProductRelationsMap } from "@/actions/product-relations";
import { AUTHORIZATION, BACKEND_URL, COMPANY } from "@/common/enviroments";
import { sleep } from "@/lib/utils";
import type { Product, RawProduct } from "@/types/product";

const GEO_RAW_PRODUCTS_CATEGORY_ID = 159386;

type GeoProductsApiResponse = {
  data: {
    products: RawProduct[];
  };
  meta: {
    code: number;
    message: string;
    current_page: number;
    next_page: number;
    prev_page: number;
    total_pages: number;
    total_count: number;
  };
};

async function fetchAllRawInsumosFromGeo(): Promise<RawProduct[]> {
  const allRawProducts: RawProduct[] = [];
  let currentPage = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    const url = `${BACKEND_URL}/api/v1/productos?category_id=${GEO_RAW_PRODUCTS_CATEGORY_ID}&page=${currentPage}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        authorization: AUTHORIZATION,
        Company: COMPANY,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`Error en página ${currentPage}:`, response.status);
      throw new Error("Falló la API del server Geo");
    }

    const apiResponse: GeoProductsApiResponse = await response.json();
    const { data, meta } = apiResponse;

    allRawProducts.push(...data.products);

    console.log(
      `Página ${meta.current_page}/${meta.total_pages} - Productos: ${data.products.length} - Total acumulado: ${allRawProducts.length}`,
    );

    await sleep(500);
    if (meta.next_page === -1 || meta.next_page <= meta.current_page) {
      hasMorePages = false;
    } else {
      currentPage = meta.next_page;
    }
  }

  return allRawProducts;
}

/**
 * Obtiene todos los insumos de la API externa recorriendo todas las páginas disponibles.
 * El bucle comienza en page=1 y continúa mientras next_page > current_page.
 * Se detiene cuando next_page === -1, indicando que no hay más páginas.
 * @returns Promise<Product[]> - Array con todos los insumos parseados y con relaciones inyectadas
 */
export async function getInsumosFromGeo(): Promise<Product[]> {
  try {
    return await getInsumosFromGeoStrictCached();
  } catch (error) {
    console.error("Error fetching or processing insumos:", error);
    return [];
  }
}

export async function getInsumosFromGeoStrict(): Promise<Product[]> {
  return getInsumosFromGeoStrictCached();
}

const getInsumosFromGeoStrictCached = cache(async (): Promise<Product[]> => {
  const allRawProducts = await fetchAllRawInsumosFromGeo();

  // 2. Obtener las relaciones desde MongoDB
  const relationsMap = await getAllProductRelationsMap();

  // 3. Parsear y mezclar
  return parseRawWithRelations(allRawProducts, relationsMap);
});

export async function getRawInsumosFromGeo(): Promise<RawProduct[]> {
  try {
    return await fetchAllRawInsumosFromGeo();
  } catch (error) {
    console.error("Error fetching raw insumos from Geo:", error);
    return [];
  }
}

/**
 * Parsea los productos raw e inyecta las referencias basadas en el mapa de relaciones.
 */
function parseRawWithRelations(
  rawProducts: RawProduct[],
  relationsMap: Record<string, string[]>,
): Product[] {
  // Primero creamos el mapa de productos base para búsquedas rápidas por SKU
  const baseProducts: Product[] = rawProducts.map((p) => ({
    sku: p.code,
    nombre: p.name,
    categoria: p.category.name,
    precio: p.price_sale,
    stock: p.inventories.reduce(
      (acc: number, inventory: { stock: number }) => acc + inventory.stock,
      0,
    ),
    source: "geo",
  }));

  const productsDict: Record<string, Product> = {};
  baseProducts.forEach((p) => {
    productsDict[p.sku] = p;
  });

  // Ahora inyectamos las referencias
  return baseProducts.map((p) => {
    const associatedSkus = relationsMap[p.sku];
    if (associatedSkus && associatedSkus.length > 0) {
      // Resolvemos los SKUs a objetos Product reales (sin recursión profunda para evitar ciclos infinitos si existieran)
      const references = associatedSkus
        .map((sku) => productsDict[sku])
        .filter((ref): ref is Product => !!ref);

      return { ...p, references };
    }
    return p;
  });
}

export const parseRawProducts = async (products: RawProduct[]) => {
  // Mantener compatibilidad con llamadas directas si existieran, aunque ahora usamos el flujo integrado
  return parseRawWithRelations(products, {});
};
