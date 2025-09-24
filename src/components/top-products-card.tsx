import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CartItem } from "@/types/cart";

interface TopProductsCardProps {
  products: CartItem[];
}

export function TopProductsCard({ products }: TopProductsCardProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <Card className="bg-sky-50">
      <CardHeader>
        <CardTitle>Lo más vendido en esta sesión</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {products.map((product) => (
            <li key={product.sku} className="flex justify-between items-center">
              <div className="flex flex-row gap-2 items-center">
                <p className="text-sm text-gray-500">{product.sku}</p>
                <p className="font-semibold">{product.nombre}</p>
              </div>
              <div className="text-right flex flex-row gap-2 items-center">
                <p className="font-bold text-lg">{product.quantity}</p>
                <p className="text-sm text-gray-500">unidades</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
