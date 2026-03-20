"use client";

import { Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveProductRelation } from "@/actions/product-relations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface ProductRelationDialogProps {
  parentProduct: Product | null;
  allProducts: Product[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: (parentSku: string, associatedSkus: string[]) => void;
}

export function ProductRelationDialog({
  parentProduct,
  allProducts,
  isOpen,
  onClose,
  onSaved,
}: ProductRelationDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [associatedSkus, setAssociatedSkus] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  // Inicializar skus asociados cuando se abre el diálogo para un producto
  useEffect(() => {
    if (parentProduct && isOpen) {
      setAssociatedSkus(parentProduct.references?.map((r) => r.sku) || []);
      setSearchTerm("");
    }
  }, [parentProduct, isOpen]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return allProducts
      .filter(
        (p) =>
          p.sku !== parentProduct?.sku && // No auto-relación
          (p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      .slice(0, 10); // Limitar resultados para no saturar
  }, [searchTerm, allProducts, parentProduct]);

  const associatedProducts = useMemo(() => {
    return associatedSkus
      .map((sku) => allProducts.find((p) => p.sku === sku))
      .filter((p): p is Product => !!p);
  }, [associatedSkus, allProducts]);

  const toggleAssociation = (sku: string) => {
    setAssociatedSkus((prev) =>
      prev.includes(sku) ? prev.filter((s) => s !== sku) : [...prev, sku],
    );
  };

  const handleSave = () => {
    if (!parentProduct) return;

    const skuToUpdate = parentProduct.sku;

    startTransition(async () => {
      const result = await saveProductRelation(skuToUpdate, associatedSkus);
      if (result.success) {
        onSaved(skuToUpdate, associatedSkus);
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    });
  };

  if (!parentProduct) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Administrar Asociaciones: {parentProduct.nombre} (
            {parentProduct.sku})
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Los productos seleccionados se guardarán como referencias vinculadas
            a este producto.
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4 overflow-hidden">
          {/* Listado de actuales */}
          <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/30">
            {associatedProducts.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                Sin productos asociados.
              </p>
            )}
            {associatedProducts.map((p) => (
              <Badge
                key={p.sku}
                variant="secondary"
                className="pl-2 pr-1 py-1 gap-1"
              >
                {p.nombre}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 rounded-full hover:bg-destructive hover:text-white"
                  onClick={() => toggleAssociation(p.sku)}
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos por nombre o SKU para asociar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
              disabled={isPending}
            />
          </div>

          {/* Resultados de búsqueda */}
          <div className="flex-1 overflow-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 && searchTerm && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-4 text-muted-foreground"
                    >
                      No se encontraron productos.
                    </TableCell>
                  </TableRow>
                )}
                {!searchTerm && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-4 text-muted-foreground"
                    >
                      Escribe algo para buscar productos externos.
                    </TableCell>
                  </TableRow>
                )}
                {filteredProducts.map((p) => (
                  <TableRow key={p.sku}>
                    <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                    <TableCell>{p.nombre}</TableCell>
                    <TableCell className="text-right">
                      {associatedSkus.includes(p.sku) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAssociation(p.sku)}
                          className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                          disabled={isPending}
                        >
                          <X className="mr-1 h-3 w-3" /> Quitar
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAssociation(p.sku)}
                          disabled={isPending}
                        >
                          <Plus className="mr-1 h-3 w-3" /> Agregar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
