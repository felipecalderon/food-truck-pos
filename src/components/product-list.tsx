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

interface ProductListProps {
  products: Product[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(amount);
};

export function ProductList({ products }: ProductListProps) {
  const { addToCart } = useCartStore();

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[75vh] overflow-y-auto">
      {products.map((product) => (
        <Card key={product.sku} className="transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">{product.nombre}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {formatCurrency(product.precio)}
            </p>
            <Badge variant={product.stock > 0 ? "default" : "secondary"}>
              Stock: {product.stock}
            </Badge>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => addToCart(product)}
              className="w-full transition-transform hover:scale-105"
            >
              Agregar
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
