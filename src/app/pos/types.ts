export interface Product {
  sku: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  items: CartItem[];
  total: number;
  date: string;
  paymentMethod: 'Efectivo' | 'Debito' | 'Credito';
  amountPaid: number;
  change: number;
}
