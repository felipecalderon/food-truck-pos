"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { savePosProductVisibility } from "@/actions/pos-product-visibility";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Product } from "@/types/product";

type PosVisibilityMap = Record<
  string,
  {
    externalSku: string;
    showInPos: boolean;
    posLabel?: string | null;
  }
>;

interface PosProductVisibilityTableProps {
  products: Product[];
  initialVisibilityMap: PosVisibilityMap;
}

export function PosProductVisibilityTable({
  products,
  initialVisibilityMap,
}: PosProductVisibilityTableProps) {
  const [visibilityMap, setVisibilityMap] =
    useState<PosVisibilityMap>(initialVisibilityMap);
  const [labelDrafts, setLabelDrafts] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setVisibilityMap(initialVisibilityMap);

    const nextDrafts: Record<string, string> = {};
    products.forEach((product) => {
      nextDrafts[product.sku] =
        initialVisibilityMap[product.sku]?.posLabel?.trim() || product.nombre;
    });
    setLabelDrafts(nextDrafts);
  }, [initialVisibilityMap, products]);

  const visibleCount = useMemo(
    () => Object.values(visibilityMap).filter((item) => item.showInPos).length,
    [visibilityMap],
  );

  const toggleVisibility = (product: Product) => {
    const current = visibilityMap[product.sku];
    const nextShowInPos = !current?.showInPos;
    const nextLabel = labelDrafts[product.sku]?.trim() || product.nombre;

    startTransition(async () => {
      const result = await savePosProductVisibility({
        externalSku: product.sku,
        showInPos: nextShowInPos,
        posLabel: nextLabel,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setVisibilityMap((prev) => ({
        ...prev,
        [product.sku]: {
          externalSku: product.sku,
          showInPos: nextShowInPos,
          posLabel: nextLabel,
        },
      }));
      toast.success(result.message);
    });
  };

  const saveLabel = (product: Product) => {
    const current = visibilityMap[product.sku];
    const nextLabel = labelDrafts[product.sku]?.trim() || null;

    startTransition(async () => {
      const result = await savePosProductVisibility({
        externalSku: product.sku,
        showInPos: current?.showInPos ?? false,
        posLabel: nextLabel,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setVisibilityMap((prev) => ({
        ...prev,
        [product.sku]: {
          externalSku: product.sku,
          showInPos: current?.showInPos ?? false,
          posLabel: nextLabel,
        },
      }));
      toast.success("Etiqueta POS guardada correctamente.");
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Marca qué productos externos deben verse en el POS.
        </p>
        <Badge variant="outline">{visibleCount} visibles</Badge>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">SKU</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Etiqueta POS</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>POS</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay productos externos disponibles.
                </TableCell>
              </TableRow>
            )}
            {products.map((product) => {
              const current = visibilityMap[product.sku];
              const isVisible = Boolean(current?.showInPos);

              return (
                <TableRow key={product.sku}>
                  <TableCell className="font-mono text-xs">
                    {product.sku}
                  </TableCell>
                  <TableCell className="font-medium">
                    {product.nombre}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={labelDrafts[product.sku] ?? product.nombre}
                      onChange={(e) =>
                        setLabelDrafts((prev) => ({
                          ...prev,
                          [product.sku]: e.target.value,
                        }))
                      }
                      placeholder="Nombre en POS"
                      disabled={isPending}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.categoria}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isVisible ? "secondary" : "outline"}>
                      {isVisible ? "Visible" : "Oculto"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveLabel(product)}
                        disabled={isPending}
                      >
                        Guardar etiqueta
                      </Button>
                      <Button
                        variant={isVisible ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleVisibility(product)}
                        disabled={isPending}
                      >
                        {isVisible ? "Ocultar" : "Mostrar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
