export interface RawProduct {
  sku: number;
  nombre: string;
  categoria: string;
  precioNeto: string;
  precioIva: string;
  precioOferta: string;
  stock: string;
  activo: string;
}

export interface Product {
  sku: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
}
