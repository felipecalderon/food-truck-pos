export type DemoProductSeed = {
  nombre: string;
  sku: string;
  categoria: string;
  precio: number;
  associatedSkus: string[];
};

export const DEMO_PRODUCTS: DemoProductSeed[] = [
  {
    nombre: "Demo Completo Italiano",
    sku: "DEMO-COMP-001",
    categoria: "Demo",
    precio: 3500,
    associatedSkus: ["INS-LECH-001", "INS-TOM-001", "INS-PAN-001"],
  },
  {
    nombre: "Demo Burger Simple",
    sku: "DEMO-BURG-001",
    categoria: "Demo",
    precio: 4500,
    associatedSkus: ["INS-HAMB-001", "INS-PAN-001", "INS-SALS-001"],
  },
  {
    nombre: "Demo Bebida + Snack",
    sku: "DEMO-MENU-001",
    categoria: "Demo",
    precio: 2990,
    associatedSkus: ["INS-BEBI-001", "INS-SNAC-001"],
  },
  {
    nombre: "Demo Papas Fritas",
    sku: "DEMO-PAPS-001",
    categoria: "Demo",
    precio: 2500,
    associatedSkus: ["INS-PAPA-001", "INS-ACEI-001"],
  },
];
