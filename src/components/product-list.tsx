"use client";

import type { Product } from "@/types/product";
import { useCartStore } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  const { addToCart, isCashRegisterOpen } = useCartStore();

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
