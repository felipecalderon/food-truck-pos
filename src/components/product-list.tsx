"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";
import { useCashRegisterStore } from "@/stores/cash-register";
import type { Product } from "@/types/product";

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  const { addToCart } = useCartStore();
  const { session } = useCashRegisterStore();
  const isCashRegisterOpen = session?.status === "OPEN";

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[75vh] p-2 overflow-x-hidden">
      {products.map((product) => (
        <Card
          key={product.sku}
          className={`transition-all ${
            isCashRegisterOpen
              ? "cursor-pointer hover:scale-105"
              : "opacity-50 cursor-not-allowed"
          }`}
          onClick={() => {
            if (isCashRegisterOpen) {
              addToCart(product);
            }
          }}
        >
          <CardHeader>
            <CardTitle className="text-base">{product.nombre}</CardTitle>
            {product.source && (
              <Badge variant="outline" className="w-fit text-[10px] uppercase">
                {product.source === "mongo"
                  ? "Producto Final"
                  : "Producto de Relbase"}
              </Badge>
            )}
            {product.references && product.references.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {product.references
                  .map((reference) => reference.nombre)
                  .join(", ")}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {formatCurrency(product.precio)}
            </p>
            <Badge variant={product.stock > 0 ? "secondary" : "default"}>
              Stock: {product.stock}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
