export interface RawProduct {
  id: number;
  name: string;
  code: string;
  description: string;
  price: number;
  price_sale: number;
  company_id: number;
  business_id: number;
  product_type: "product";
  is_tax_affected: boolean;
  barcode: string;
  enabled: boolean;
  currency: "pesos";
  is_factor: boolean;
  is_inventory: boolean;
  unit_cost: number;
  is_profit: boolean;
  image: {
    url: string | null;
  };
  category: {
    id: number;
    name: string;
  };
  inventories: [
    {
      id: number;
      stock: number;
      ware_house_id: number;
      average_cost: number;
      location: string;
    }
  ];
}

export interface Product {
  sku: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
}
