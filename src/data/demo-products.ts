export type DemoProductSeed = {
  nombre: string;
  sku: string;
  categoria: string;
  precio: number;
  associatedSkus: string[];
};

export const DEMO_PRODUCTS: DemoProductSeed[] = [
  {
    nombre: 'Super Sandwich "el Betonera" (5 Ingredientes)',
    sku: "512847",
    categoria: "Sandwiches",
    precio: 7500,
    associatedSkus: ["12002"],
  },
  {
    nombre: "Sandwich Milanesa Vacuno Italiano",
    sku: "304918",
    categoria: "Sandwiches",
    precio: 7300,
    associatedSkus: ["12002"],
  },
  {
    nombre: "Sandwich Mechada Italiano",
    sku: "882105",
    categoria: "Sandwiches",
    precio: 7000,
    associatedSkus: ["12002"],
  },
  {
    nombre: "Sandwich Mechada Chacarero",
    sku: "217643",
    categoria: "Sandwiches",
    precio: 7000,
    associatedSkus: ["12002"],
  },
  {
    nombre: "Sandwich Mechada Barros Luco",
    sku: "609312",
    categoria: "Sandwiches",
    precio: 5500,
    associatedSkus: ["12002"],
  },
  {
    nombre: "Sandwich Lomito Italiano",
    sku: "114092",
    categoria: "Sandwiches",
    precio: 6000,
    associatedSkus: ["12002"],
  },
  {
    nombre: "Sandwich Lomito Chacarero",
    sku: "775834",
    categoria: "Sandwiches",
    precio: 5500,
    associatedSkus: ["12002"],
  },
  {
    nombre: "Sandwich Lomito Barros Luco",
    sku: "430291",
    categoria: "Sandwiches",
    precio: 4500,
    associatedSkus: ["12002"],
  },
  {
    nombre: "Sandwich Churrasco Italiano",
    sku: "992183",
    categoria: "Sandwiches",
    precio: 6500,
    associatedSkus: ["12002"],
  },
  {
    nombre: "Sandwich Churrasco Chacarero",
    sku: "556701",
    categoria: "Sandwiches",
    precio: 6500,
    associatedSkus: ["12002"],
  },
  {
    nombre: "Sandwich Churrasco Barros Luco",
    sku: "228419",
    categoria: "Sandwiches",
    precio: 5000,
    associatedSkus: ["12002"],
  },
  {
    nombre: "Completo Chucrut Americana",
    sku: "876974",
    categoria: "Sandwiches",
    precio: 3500,
    associatedSkus: ["12002"],
  },
];
