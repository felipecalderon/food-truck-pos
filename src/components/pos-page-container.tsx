"use client";

import { useState, useMemo, useEffect } from "react";
import type { Product } from "@/types/product";
import { ProductList } from "./product-list";
import { ShoppingCart } from "./shopping-cart";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/stores/cart";
import { useProductStore } from "@/stores/products";
import { getCurrentSession } from "@/actions/cash-register";

interface POSPageContainerProps {
  initialProducts: Product[];
}

export function POSPageContainer({ initialProducts }: POSPageContainerProps) {
  const { products, setProducts } = useProductStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [posName, setPosName] = useState<string | null>(null);
  const { setCashRegisterOpen } = useCartStore();

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts, setProducts]);

  useEffect(() => {
    const name = localStorage.getItem("pos_name");
    setPosName(name);
  }, []);

  useEffect(() => {
    if (posName) {
      getCurrentSession(posName).then((session) => {
        setCashRegisterOpen(session?.status === "OPEN");
      });
    }
  }, [posName, setCashRegisterOpen]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;

    const normalizeText = (text: string) =>
      text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const searchKeywords = normalizeText(searchTerm).split(" ").filter(Boolean);

    if (!searchKeywords.length) return products;

    return products.filter((p) => {
      const normalizedName = normalizeText(p.nombre);
      const normalizedSku = p.sku.toString().toLowerCase();

      const nameMatches = searchKeywords.every((kw) =>
        normalizedName.includes(kw)
      );
      const skuMatches = searchKeywords.every((kw) =>
        normalizedSku.includes(kw)
      );

      return nameMatches || skuMatches;
    });
  }, [products, searchTerm]);

  return (
    <main className="grid md:grid-cols-2 gap-8 p-6">
      <ShoppingCart />
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="w-64">
            <Input
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ProductList products={filteredProducts} />
      </div>
    </main>
  );
}
