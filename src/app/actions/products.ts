"use server";

import { BACKEND_URL } from "@/app/common/enviroments";
import { Product } from "@/app/pos/types";

interface RawProduct {
  sku: number;
  nombre: string;
  categoria: string;
  precioNeto: string;
  precioIva: string;
  precioOferta: string;
  stock: string;
  activo: string;
}

export async function getProducts(): Promise<Product[]> {
  try {
    const url = `${BACKEND_URL}/productos`;
    const response = await fetch(url, {
      cache: "no-store", // Deshabilita el cache para obtener siempre datos frescos
    });

    if (!response.ok) {
      throw new Error("Failed to fetch products from backend");
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
