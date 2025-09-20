"use server";

import { BACKEND_URL } from "@/common/enviroments";
import type { Product, RawProduct } from "@/types/product";

export async function getProducts(): Promise<Product[]> {
  try {
    const url = `${BACKEND_URL}/productos`;
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Falló la API del server Geo");
    }

    const rawProducts: RawProduct[] = await response.json();

    const filteredAndMappedProducts = rawProducts
      .filter((p) => p.categoria === "A FOOD TRUCK" && p.activo === "publish")
      .map((p) => ({
        sku: p.sku,
        nombre: p.nombre,
        categoria: p.categoria,
        precio: parseFloat(p.precioIva) || 0, // Usa el precio con IVA y lo convierte a número
        stock: parseInt(p.stock, 10) || 0, // Convierte el stock a número
      }));

    return filteredAndMappedProducts;
  } catch (error) {
    console.error("Error fetching or processing products:", error);
    return []; // Devuelve un array vacío en caso de error
  }
}
