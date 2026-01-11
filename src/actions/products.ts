"use server";

import { AUTHORIZATION, BACKEND_URL, COMPANY } from "@/common/enviroments";
import { sleep } from "@/lib/utils";
import type { Product, RawProduct } from "@/types/product";

/**
 * Obtiene todos los productos de la API recorriendo todas las páginas disponibles.
 * El bucle comienza en page=1 y continúa mientras next_page > current_page.
 * Se detiene cuando next_page === -1, indicando que no hay más páginas.
 * @returns Promise<Product[]> - Array con todos los productos parseados
 */
export async function getProducts(): Promise<Product[]> {
  type ApiResponse = {
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

  const allRawProducts: RawProduct[] = [];
  let currentPage = 1;
  let hasMorePages = true;

  try {
    while (hasMorePages) {
      const url = `${BACKEND_URL}/api/v1/productos?category_id=159386&page=${currentPage}`;
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

      const apiResponse: ApiResponse = await response.json();
      const { data, meta } = apiResponse;

      // Acumular productos de esta página
      allRawProducts.push(...data.products);

      console.log(
        `Página ${meta.current_page}/${meta.total_pages} - Productos: ${data.products.length} - Total acumulado: ${allRawProducts.length}`
      );

      // Verificar si hay más páginas: next_page > current_page significa que hay más
      // next_page === -1 significa que no hay más páginas
      await sleep(500); // Esperar 500 ms antes de continuar para no sobrecargar API
      if (meta.next_page === -1 || meta.next_page <= meta.current_page) {
        hasMorePages = false;
      } else {
        currentPage = meta.next_page;
      }
    }

    return parseRawProducts(allRawProducts);
  } catch (error) {
    console.error("Error fetching or processing products:", error);
    return []; // Devuelve un array vacío en caso de error
  }
}

export const parseRawProducts = async (products: RawProduct[]) => {
  return await products.map((p) => ({
    sku: p.code,
    nombre: p.name,
    categoria: p.category.name,
    precio: p.price_sale,
    stock: p.inventories.reduce((acc, inventory) => acc + inventory.stock, 0),
  }));
};
