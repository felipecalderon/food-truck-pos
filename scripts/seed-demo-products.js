require("ts-node/register/transpile-only");

const mongoose = require("mongoose");
const connectDB = require("../src/lib/db").default;
const MongoProductModel = require("../src/models/MongoProduct").default;
const { DEMO_PRODUCTS } = require("../src/data/demo-products");

function normalizeAssociatedInsumos(associatedSkus) {
  const quantityBySku = new Map();

  for (const rawSku of associatedSkus ?? []) {
    const sku = String(rawSku).trim();
    if (!sku) continue;
    quantityBySku.set(sku, (quantityBySku.get(sku) ?? 0) + 1);
  }

  return Array.from(quantityBySku.entries())
    .map(([sku, quantity]) => ({ sku, quantity }))
    .sort((a, b) => a.sku.localeCompare(b.sku));
}

function createNormalizedRecord(seed) {
  const associatedInsumos = normalizeAssociatedInsumos(seed.associatedSkus);

  return {
    sku: seed.sku.trim(),
    nombre: seed.nombre.trim(),
    categoria: seed.categoria.trim() || "Demo",
    precio: Number(seed.precio) || 0,
    stock: 0,
    associatedInsumos,
    associatedSkus: associatedInsumos.map((item) => item.sku),
  };
}

function isSameProduct(existing, incoming) {
  return JSON.stringify(existing) === JSON.stringify(incoming);
}

async function main() {
  await connectDB();

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const seed of DEMO_PRODUCTS) {
    const record = createNormalizedRecord(seed);
    const existing = await MongoProductModel.findOne({ sku: record.sku })
      .lean()
      .catch(() => null);

    if (!existing) {
      await MongoProductModel.create(record);
      created += 1;
      console.log(`Created: ${record.sku} - ${record.nombre}`);
      continue;
    }

    const comparableExisting = {
      sku: existing.sku,
      nombre: existing.nombre,
      categoria: existing.categoria,
      precio: existing.precio,
      stock: existing.stock ?? 0,
      associatedInsumos: existing.associatedInsumos ?? [],
      associatedSkus: existing.associatedSkus ?? [],
    };

    if (isSameProduct(comparableExisting, record)) {
      skipped += 1;
      console.log(`Skipped: ${record.sku} - already up to date`);
      continue;
    }

    await MongoProductModel.updateOne(
      { sku: record.sku },
      {
        $set: {
          nombre: record.nombre,
          categoria: record.categoria,
          precio: record.precio,
          stock: record.stock,
          associatedInsumos: record.associatedInsumos,
          associatedSkus: record.associatedSkus,
        },
      },
    );
    updated += 1;
    console.log(`Updated: ${record.sku} - ${record.nombre}`);
  }

  console.log(
    `Done. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`,
  );
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
