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
  product_id_parent?: number | null;
  sii_chile_tax_id?: number | null;
  type_code?: string;
  unit_item?: string;
  created_at?: string;
  updated_at?: string;
  uf_hoy?: string;
  traceability?: number;
  is_expiration_date?: boolean;
  is_traceability_print_dte?: boolean;
  tax_affected?: boolean;
  discount?: number | null;
  surcharge?: number;
  additional_tax_fee?: number;
  additional_tax_code?: number;
  expiration_date?: string;
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
    },
  ];
}

export interface Product {
  sku: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  references?: Product[];
}

export interface InsumoRequirement {
  sku: string;
  quantity: number;
}

export interface MongoProduct {
  sku: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  associatedInsumos: InsumoRequirement[];
  associatedSkus?: string[];
}
