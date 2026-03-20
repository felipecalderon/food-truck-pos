import { getFinalProductsFromMongo } from "@/actions/mongo-products";
import { getInsumosFromGeo } from "@/actions/products";
import { ProductAdminList } from "@/components/admin/product-admin-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminProductsPage() {
  const [insumos, finalProducts] = await Promise.all([
    getInsumosFromGeo(),
    getFinalProductsFromMongo(),
  ]);

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Administración de Productos
        </h1>
        <p className="text-muted-foreground text-lg">
          Gestiona los insumos provenientes de Relbase con los productos creados
          en este sistema.
        </p>
      </div>

      <Card className="border-none shadow-sm bg-muted/20">
        <CardHeader>
          <CardTitle className="text-xl">Vínculos de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductAdminList
            products={insumos}
            initialFinalProducts={finalProducts}
          />
        </CardContent>
      </Card>
    </main>
  );
}
